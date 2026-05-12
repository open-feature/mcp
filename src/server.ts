import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ZodRawShape } from 'zod';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { registerInstallTools } from './tools/installTools.js';
import packageJson from '../package.json' with { type: 'json' };
import { registerProviderResources } from './resources.js';
import { registerOFREPTools } from './tools/ofrepTools.js';

export type RegisterToolWithErrorHandling = (
  name: string,
  config: {
    description: string;
    annotations?: ToolAnnotations;
    inputSchema?: ZodRawShape;
    outputSchema?: ZodRawShape;
  },
  handler: (args: unknown) => Promise<CallToolResult>,
) => void;

function handleToolError(error: unknown, toolName: string): CallToolResult {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error(`Tool ${toolName} error:`, errorMessage);
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error in ${toolName}: ${errorMessage}`,
      },
    ],
  };
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'OpenFeature MCP Server',
    version: packageJson.version,
  });

  const registerToolWithErrorHandling = (
    name: string,
    config: {
      description: string;
      annotations?: ToolAnnotations;
      inputSchema?: ZodRawShape;
      outputSchema?: ZodRawShape;
    },
    handler: (args: unknown) => Promise<CallToolResult>,
  ): void => {
    const toolHandler = async (args: Record<string, unknown>, _extra: unknown): Promise<CallToolResult> => {
      try {
        console.error('MCP tool invoke', { tool: name, args });
        const result = await handler(args);
        console.error('MCP tool success', { tool: name });
        return result;
      } catch (error) {
        return handleToolError(error, name);
      }
    };

    server.registerTool(
      name,
      config as Parameters<typeof server.registerTool>[1],
      toolHandler as Parameters<typeof server.registerTool>[2],
    );
  };

  registerInstallTools(registerToolWithErrorHandling);

  registerProviderResources(server);
  registerOFREPTools(registerToolWithErrorHandling);

  return server;
}

export async function startServer(): Promise<void> {
  // Error logs must be used here as stdout is used for MCP protocol messages
  console.error('Initializing OpenFeature MCP local server', {
    version: packageJson.version,
  });

  const server = createServer();
  const transport = new StdioServerTransport();

  process.on('SIGINT', () => {
    console.error('Received SIGINT, shutting down.');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    console.error('Received SIGTERM, shutting down.');
    process.exit(0);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Always exit after an uncaught exception — process state is undefined and
    // continuing causes a tight CPU-spinning loop when stdio peers are gone
    // (e.g. the MCP host restarted and closed the socket).
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    process.exit(1);
  });

  // Exit cleanly when the MCP host closes the stdin pipe.  Without this the
  // process keeps running (and spinning) after the host disconnects.
  process.stdin.on('close', () => {
    console.error('stdin closed. Exiting server.');
    process.exit(0);
  });

  transport.onclose = () => {
    console.error('Stdio transport closed. Exiting server.');
    process.exit(0);
  };

  // Exit on stdout errors (e.g. EPIPE when the host closes its read end).
  // StdioServerTransport only guards stdin; stdout errors become uncaught
  // exceptions without this listener, triggering the CPU-spin loop.
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') {
      process.exit(0);
    }
    console.error('stdout error:', err);
    process.exit(1);
  });

  await server.connect(transport);
  console.error('✅ OpenFeature MCP Server (stdio) started');
}

export default startServer;
