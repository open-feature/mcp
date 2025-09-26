import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { providerSchema, PROVIDERS, PROVIDER_DOCS, type ProviderName } from './generated/providersBundle.generated.js';
import {
  InstallTechnologySchema,
  INSTALL_TECHNOLOGIES,
  type InstallTechnology,
} from './generated/promptsBundle.generated.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export const DISABLE_RESOURCES =
  process.env.DISABLE_RESOURCES && (process.env.DISABLE_RESOURCES === 'true' || process.env.DISABLE_RESOURCES === '1');

const TemplateVarsSchema = z.object({
  provider: providerSchema,
  language: InstallTechnologySchema,
});

function resourceName(providerName: string, technology: string): string {
  return `${providerName} ${technology} OpenFeature Provider Documentation`;
}

/**
 * Registers a resource template with the MCP server for OpenFeature provider documentation.
 * Creates a template that can fetch documentation for different providers and languages from external URLs.
 * The template uses the URI pattern: openfeature+doc://{provider}/{language}
 * Runs a simple fetch for the documentation and returns the HTML content.
 */
export function registerProviderResources(server: McpServer): void {
  if (DISABLE_RESOURCES) {
    return;
  }

  // Register a single Resource Template for provider docs: openfeature+doc://{provider}/{language}
  const template = new ResourceTemplate('openfeature+doc://{provider}/{language}', {
    list: undefined,
    complete: {
      provider: async (value: string) => PROVIDERS.filter((p) => p.toLowerCase().includes((value || '').toLowerCase())),
      language: async (value: string) =>
        INSTALL_TECHNOLOGIES.filter((l) => l.toLowerCase().includes((value || '').toLowerCase())),
    },
  });

  server.registerResource(
    'openfeature_provider_doc',
    template,
    {
      title: 'OpenFeature Provider Docs',
      description: 'Template for OpenFeature provider docs by provider and language.',
    },
    async (_uri, variables) => {
      const { provider, language } = TemplateVarsSchema.parse({
        provider: variables.provider,
        language: variables.language,
      });

      const href = PROVIDER_DOCS[provider]?.[language];
      if (!href) {
        return {
          contents: [
            {
              uri: `openfeature+doc://${provider}/${language}`,
              mimeType: 'text/plain',
              text: `No documentation mapping found for provider='${provider}' language='${language}'.`,
            },
          ],
        };
      }

      try {
        const response = await fetch(href);
        if (!response.ok) {
          return {
            contents: [
              {
                uri: href,
                name: resourceName(provider, language),
                mimeType: 'text/plain',
                text: `Failed to fetch documentation (${response.status} ${response.statusText}) from ${href}.`,
              },
            ],
          };
        }
        const body = await response.text();
        const contentType = response.headers.get('content-type') || 'text/html';
        return {
          contents: [
            {
              uri: href,
              mimeType: contentType,
              text: body,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: href,
              mimeType: 'text/plain',
              text: `Error fetching documentation from ${href}: ${message}`,
            },
          ],
        };
      }
    },
  );
}

/**
 * Builds an array of resource links for the specified providers and install technology.
 * Filters out providers that don't have documentation available for the given technology.
 * Returns resource link objects that can be used in tool call results.
 */
export function buildProviderResourceLinks(
  providers: readonly ProviderName[],
  technology: InstallTechnology,
): CallToolResult['content'] {
  if (DISABLE_RESOURCES) {
    return [];
  }

  return providers
    .filter((providerName) => !!PROVIDER_DOCS[providerName]?.[technology])
    .map((providerName) => ({
      type: 'resource_link',
      uri: `openfeature+doc://${providerName}/${technology}`,
      name: resourceName(providerName, technology),
    }));
}
