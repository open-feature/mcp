import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { RegisterToolWithErrorHandling } from '../server.js';
import { DISABLE_RESOURCES } from '../resources.js';
import { BUNDLED_PROMPTS, InstallTechnologySchema } from '../generated/promptsBundle.generated.js';
import { PROVIDER_DOCS, providersSchema, type ProviderName } from '../generated/providersBundle.generated.js';
import { buildProviderResourceLinks } from '../resources.js';

const InstallTechnologyArgsSchema = z.object({
  technology: InstallTechnologySchema,
  providers: providersSchema.optional().default([]),
});

function buildProviderPrompts(
  providers: ProviderName[],
  technology: z.infer<typeof InstallTechnologySchema>,
): string[] {
  const providerPrompts: string[] = [];

  for (const providerName of providers) {
    const providerDocLinks = PROVIDER_DOCS[providerName];
    if (!providerDocLinks) {
      throw new Error(
        `Provider '${providerName}' is not recognized. Available providers: ${Object.keys(PROVIDER_DOCS).join(', ')}`,
      );
    }

    console.error(`providerDocLinks: ${providerDocLinks}`);
    console.error(`technology: ${technology}`);
    const perTechnologyUrl = providerDocLinks[technology] || '';
    if (perTechnologyUrl) {
      if (!DISABLE_RESOURCES) {
        const resourceName = `of-provider-doc:${providerName}:${technology}`;
        providerPrompts.push(
          `- **${providerName}**: If your AI Agent supports MCP resources, fetch the MCP resource named \`${resourceName}\` ` +
            `(otherwise read the documentation from this link: ${perTechnologyUrl}) ` +
            `and evaluate the best way to install and configure this provider alongside the OpenFeature ${technology} SDK.`,
        );
      } else {
        providerPrompts.push(
          `- **${providerName}**: Read the provider documentation from this link: ${perTechnologyUrl} ` +
            `and evaluate the best way to install and configure this provider alongside the OpenFeature ${technology} SDK.`,
        );
      }
    } else {
      providerPrompts.push(
        `- **${providerName}**: No specific ${technology} documentation URL found. Search for "${providerName} OpenFeature ${technology}" ` +
          'installation documentation and provide installation instructions if available.',
      );
    }
  }

  return providerPrompts;
}

function processPromptWithProviders(
  prompt: string,
  providers: ProviderName[],
  technology: z.infer<typeof InstallTechnologySchema>,
  providerPrompts: string[],
): string {
  // Marker-based injection: replace the block between markers when providers are specified
  const providersMarkerPattern = /<!--\s*PROVIDERS:START\s*-->[\s\S]*?<!--\s*PROVIDERS:END\s*-->/;

  const providerBlock = providerPrompts.length
    ? ['### Step 2: Provider installation', '', ...providerPrompts].join('\n')
    : '';

  const providersAppendix = providerPrompts.length
    ? `\n\n---\n\nProvider installation instructions for ${technology}:\n\n${providerPrompts.join('\n')}`
    : '';

  let finalText = prompt;

  if (providers.length > 0) {
    if (providersMarkerPattern.test(prompt)) {
      // Replace the marker block with provider content (without the markers)
      finalText = prompt.replace(providersMarkerPattern, providerBlock);
    } else {
      // Fallback: append to the end if no marker exists in the prompt
      finalText = `${prompt}${providersAppendix}`;
    }
  } else {
    // No providers specified: strip the marker block entirely
    finalText = prompt.replace(providersMarkerPattern, '');
  }

  return finalText;
}

export function registerInstallTools(registerToolWithErrorHandling: RegisterToolWithErrorHandling): void {
  registerToolWithErrorHandling(
    'install_openfeature_sdk',
    {
      description: [
        'Fetch OpenFeature SDK installation instructions, and follow the instructions to install the OpenFeature SDK.',
        'If you are installing a provider, also fetches the provider installation instructions.',
        'Also includes documentation and examples for using OpenFeature SDK in your application.',
        "Choose the technology that matches the application's language/framework.",
      ].join(' '),
      annotations: {
        title: 'Install OpenFeature SDK',
        readOnlyHint: true,
      },
      inputSchema: InstallTechnologyArgsSchema.shape,
    },
    async (args: unknown): Promise<CallToolResult> => {
      const { technology, providers } = InstallTechnologyArgsSchema.parse(args);
      const prompt: string = BUNDLED_PROMPTS[technology];

      const providerPrompts = buildProviderPrompts(providers, technology);
      const finalText = processPromptWithProviders(prompt, providers, technology, providerPrompts);
      console.error(`install_openfeature_sdk prompt text: \n${finalText}`);

      return {
        content: [
          {
            type: 'text' as const,
            text: finalText,
          },
          // Include resource links for any available provider docs so clients can read them directly
          ...buildProviderResourceLinks(providers, technology),
        ],
      };
    },
  );
}
