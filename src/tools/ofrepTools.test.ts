import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerOFREPTools } from './ofrepTools.js';
import type { RegisterToolWithErrorHandling } from '../server.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a mock tool registration function
function createMockRegisterTool() {
  const tools = new Map<string, { handler: (args: unknown) => Promise<CallToolResult> }>();

  const registerTool: RegisterToolWithErrorHandling = (name, config, handler) => {
    tools.set(name, { handler });
  };

  return { registerTool, tools };
}

describe('ofrepTools', () => {
  let mockRegisterTool: RegisterToolWithErrorHandling;
  let tools: Map<string, { handler: (args: unknown) => Promise<CallToolResult> }>;
  let toolHandler: (args: unknown) => Promise<CallToolResult>;

  beforeEach(() => {
    const mock = createMockRegisterTool();
    mockRegisterTool = mock.registerTool;
    tools = mock.tools;

    // Register the tools
    registerOFREPTools(mockRegisterTool);
    const toolEntry = tools.get('ofrep_flag_eval');
    if (!toolEntry) {
      throw new Error('ofrep_flag_eval tool was not registered');
    }
    toolHandler = toolEntry.handler;

    // Clear fetch mock
    mockFetch.mockClear();

    // Clear environment variables
    delete process.env.OPENFEATURE_OFREP_BASE_URL;
    delete process.env.OFREP_BASE_URL;
    delete process.env.OFREP_ENDPOINT;
    delete process.env.OPENFEATURE_OFREP_BEARER_TOKEN;
    delete process.env.OFREP_BEARER_TOKEN;
    delete process.env.OPENFEATURE_OFREP_API_KEY;
    delete process.env.OFREP_API_KEY;
    delete process.env.OFREP_HEADERS;
    delete process.env.OFREP_TIMEOUT_MS;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Schema Validation', () => {
    beforeEach(() => {
      process.env.OPENFEATURE_OFREP_BASE_URL = 'https://api.example.com';
      process.env.OPENFEATURE_OFREP_BEARER_TOKEN = 'test-token';
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ value: true, reason: 'STATIC' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    it('should accept valid args', async () => {
      const result = await toolHandler({
        flag_key: 'my-feature',
        context: { targetingKey: 'user-123' },
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });

    it('should reject invalid URL', async () => {
      await expect(
        toolHandler({
          base_url: 'not-a-valid-url',
          flag_key: 'test-flag',
        }),
      ).rejects.toThrow();
    });
  });

  describe('OFREP API Compliance', () => {
    beforeEach(() => {
      process.env.OPENFEATURE_OFREP_BASE_URL = 'https://flags.example.com';
      process.env.OPENFEATURE_OFREP_BEARER_TOKEN = 'test-token';
    });

    it('should make correct single flag evaluation request', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ key: 'my-feature', value: true, reason: 'STATIC' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      await toolHandler({
        flag_key: 'my-feature',
        context: { targetingKey: 'user-123' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://flags.example.com/ofrep/v1/evaluate/flags/my-feature',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ context: { targetingKey: 'user-123' } }),
        }),
      );
    });

    it('should make correct bulk evaluation request', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ flags: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json', etag: 'v1.0.0' },
        }),
      );

      await toolHandler({
        context: { targetingKey: 'user-123' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://flags.example.com/ofrep/v1/evaluate/flags',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/json',
            authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should include If-None-Match header with etag', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ flags: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

      await toolHandler({
        context: { targetingKey: 'user-123' },
        etag: '"abc123"',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': '"abc123"',
          }),
        }),
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.OPENFEATURE_OFREP_BASE_URL = 'https://flags.example.com';
      process.env.OPENFEATURE_OFREP_BEARER_TOKEN = 'test-token';
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ errorCode: 'FLAG_NOT_FOUND' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      );

      const result = await toolHandler({ flag_key: 'nonexistent-flag' });
      const contentItem = result.content[0];
      if (contentItem.type !== 'text') {
        throw new Error('Expected text content');
      }
      const response = JSON.parse(contentItem.text);

      expect(response.status).toBe(404);
      expect(response.error.errorCode).toBe('FLAG_NOT_FOUND');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));

      const result = await toolHandler({ flag_key: 'test-flag' });
      const contentItem = result.content[0];
      if (contentItem.type !== 'text') {
        throw new Error('Expected text content');
      }
      const response = JSON.parse(contentItem.text);

      expect(response.error).toBe('Connection refused');
    });

    it('should handle 401 errors with detailed JSON response', async () => {
      mockFetch.mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: 'Invalid authentication credentials',
            code: 'INVALID_TOKEN',
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
      );

      const result = await toolHandler({ flag_key: 'test-flag' });
      const contentItem = result.content[0];
      if (contentItem.type !== 'text') {
        throw new Error('Expected text content');
      }
      const response = JSON.parse(contentItem.text);

      expect(response.status).toBe(401);
      expect(response.error.error).toBe('Unauthorized');
      expect(response.error.message).toBe('Invalid authentication credentials');
      expect(response.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Configuration', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ value: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    });

    it('should prioritize args over env vars', async () => {
      process.env.OPENFEATURE_OFREP_BASE_URL = 'https://env.example.com';
      process.env.OPENFEATURE_OFREP_BEARER_TOKEN = 'env-token';

      await toolHandler({
        base_url: 'https://args.example.com',
        flag_key: 'test-flag',
        auth: { bearer_token: 'args-token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://args.example.com/ofrep/v1/evaluate/flags/test-flag',
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer args-token',
          }),
        }),
      );
    });

    it('should prioritize OFREP_ENDPOINT over legacy base URL env vars', async () => {
      process.env.OPENFEATURE_OFREP_BASE_URL = 'https://legacy-openfeature.example.com';
      process.env.OFREP_BASE_URL = 'https://legacy-ofrep.example.com';
      process.env.OFREP_ENDPOINT = 'https://endpoint.example.com';

      await toolHandler({ flag_key: 'test-flag' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://endpoint.example.com/ofrep/v1/evaluate/flags/test-flag',
        expect.any(Object),
      );
    });

    it('should parse OFREP_HEADERS and let env headers override auth/protocol headers', async () => {
      process.env.OFREP_ENDPOINT = 'https://flags.example.com';
      process.env.OPENFEATURE_OFREP_BEARER_TOKEN = 'token-from-env-auth';
      process.env.OFREP_HEADERS =
        'Authorization=Bearer%20token-from-header,accept=text/plain,X-Custom=value%3Dwith%3Dequals';

      await toolHandler({ flag_key: 'test-flag' });

      const [, fetchOptions] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
      const normalizedHeaders = Object.fromEntries(
        Object.entries(fetchOptions.headers).map(([key, value]) => [key.toLowerCase(), value]),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        'https://flags.example.com/ofrep/v1/evaluate/flags/test-flag',
        expect.any(Object),
      );
      expect(normalizedHeaders['authorization']).toBe('Bearer token-from-header');
      expect(normalizedHeaders['accept']).toBe('text/plain');
      expect(fetchOptions.headers['X-Custom']).toBe('value=with=equals');
    });

    it('should skip malformed OFREP_HEADERS entries', async () => {
      process.env.OFREP_ENDPOINT = 'https://flags.example.com';
      process.env.OFREP_HEADERS = 'X-Good=ok,missing-separator,=empty-key,empty-value=';

      await toolHandler({ flag_key: 'test-flag' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://flags.example.com/ofrep/v1/evaluate/flags/test-flag',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Good': 'ok',
          }),
        }),
      );

      const [, fetchOptions] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }];
      expect(fetchOptions.headers['missing-separator']).toBeUndefined();
      expect(fetchOptions.headers['']).toBeUndefined();
      expect(fetchOptions.headers['empty-value']).toBeUndefined();
    });

    it('should let OFREP_HEADERS override If-None-Match on collisions', async () => {
      process.env.OFREP_ENDPOINT = 'https://flags.example.com';
      process.env.OFREP_HEADERS = 'If-None-Match=override-etag';

      await toolHandler({
        context: { targetingKey: 'user-123' },
        etag: 'request-etag',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://flags.example.com/ofrep/v1/evaluate/flags',
        expect.objectContaining({
          headers: expect.objectContaining({
            'If-None-Match': 'override-etag',
          }),
        }),
      );
    });

    it('should use OFREP_TIMEOUT_MS when valid', async () => {
      process.env.OFREP_ENDPOINT = 'https://flags.example.com';
      process.env.OFREP_TIMEOUT_MS = '1234';

      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      try {
        await toolHandler({ flag_key: 'test-flag' });
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1234);
      } finally {
        setTimeoutSpy.mockRestore();
      }
    });

    it('should fall back to default timeout when OFREP_TIMEOUT_MS is invalid', async () => {
      process.env.OFREP_ENDPOINT = 'https://flags.example.com';
      process.env.OFREP_TIMEOUT_MS = 'invalid-timeout';

      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      try {
        await toolHandler({ flag_key: 'test-flag' });
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);
      } finally {
        setTimeoutSpy.mockRestore();
      }
    });

    it('should return error when no base URL configured', async () => {
      await expect(toolHandler({ flag_key: 'test-flag' })).rejects.toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should allow unauthenticated providers', async () => {
      process.env.OPENFEATURE_OFREP_BASE_URL = 'https://public.example.com';
      // No auth environment variables set

      await toolHandler({ flag_key: 'public-flag' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://public.example.com/ofrep/v1/evaluate/flags/public-flag',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify({ context: {} }),
        }),
      );
    });
  });
});
