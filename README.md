# OpenFeature MCP Local Server (stdio)

## Warning

**This project is in active development.**

## Features

A local Model Context Protocol (MCP) server that provides OpenFeature SDK
installation guidance and Open Feature Remote Evaluation Protocol (OFREP) over stdio.

- **OpenFeature SDK Installation Guides**: Fetch installation prompts for various
  OpenFeature SDKs
- **MCP stdio Transport**: Intended for local usage by MCP-compatible clients

## Configure your AI client (local)

### Cursor

Add to `~/.cursor/mcp_settings.json`:

```json
{
  "mcpServers": {
    "OpenFeature": {
      "command": "npx",
      "args": ["-y", "@openfeature/mcp"]
    }
  }
}
```

### VS Code (Continue)

Add to `.continue/config.json`:

```json
{
  "mcpServers": {
    "OpenFeature": {
      "command": "npx",
      "args": ["-y", "@openfeature/mcp"]
    }
  }
}
```

### Claude Code (CLI)

Add the server via CLI:

```bash
claude mcp add --transport stdio openfeature npx -y @openfeature/mcp
```

Then manage the connection in the CLI with `/mcp`.

### Windsurf

In the "Manage MCP servers" raw config, add:

```json
{
  "mcpServers": {
    "OpenFeature": {
      "command": "npx",
      "args": ["-y", "@openfeature/mcp"]
    }
  }
}
```

### Claude Desktop

Edit your Claude Desktop config and add:

```json
{
  "mcpServers": {
    "openfeature": {
      "command": "npx",
      "args": ["-y", "@openfeature/mcp"]
    }
  }
}
```

Restart Claude Desktop after saving.

## NPM Global install (optional)

If you prefer a global install instead of NPX:

```bash
npm install -g @openfeature/mcp
```

Now in your MCP config use `openfeature-mcp` as the command:

```json
{
  "mcpServers": {
    "openfeature": {
      "command": "openfeature-mcp"
    }
  }
}
```

All logs are written to stderr. The MCP protocol messages use stdout.

## Available Tools

### `install_openfeature_sdk`

Fetches Markdown instructions for installing the OpenFeature SDK for a given
technology. Optionally augments the prompt with installation guidance for one
or more feature flag providers.

**Parameters:**

- `technology` (string enum): One of the supported technologies listed below
- `providers` (string array, optional): Zero or more provider identifiers. If
  present, adds provider-specific installation notes to the prompt (or removes
  placeholder sections when empty).

**Supported Technologies**:

The technologies list is build from the avaliable `prompts/*.md`, updated automatically using `scripts/build-prompts.js`

- android
- dotnet
- go
- ios
- java
- javascript
- nestjs
- nodejs
- php
- python
- react
- ruby

**Supported Providers**:

The provider list is sourced automatically from the OpenFeature `open-feature/openfeature.dev`
repo; newly added providers there become available here without manual edits.
See `scripts/build-providers.js` for details.

### `ofrep_flag_eval`

Evaluate feature flags via OpenFeature Remote Evaluation Protocol (OFREP).
If `flag_key` is omitted, performs bulk evaluation.

References:
[`open-feature/protocol` repo](https://github.com/open-feature/protocol),
[OFREP OpenAPI spec](https://raw.githubusercontent.com/open-feature/protocol/refs/heads/main/service/openapi.yaml)

Parameters (all optional unless noted):

- `base_url` (string, optional): Base URL of your OFREP-compatible flag
  service. If omitted, the server uses env/config (see below).
- `flag_key` (string, optional): If provided, calls single flag evaluation:
  `/ofrep/v1/evaluate/flags/{key}`. If omitted, calls bulk:
  `/ofrep/v1/evaluate/flags`.
- `context` (object, optional): Evaluation context, e.g. `{ "targetingKey":
  "user-123", ... }`.
- `etag` (string, optional): For bulk requests, sent as `If-None-Match` to
  enable 304 caching semantics.
- `auth` (object, optional): Inline auth for this call only.
  - `bearer_token` (string, optional): Sets `Authorization: Bearer <token>`.
  - `api_key` (string, optional): Sets `X-API-Key: <key>`.

Auth and base URL resolution (priority):

1. Tool call args: `base_url`, `auth.bearer_token`, `auth.api_key`
2. Environment variables: `OPENFEATURE_OFREP_BASE_URL` (or `OFREP_BASE_URL`),
   `OPENFEATURE_OFREP_BEARER_TOKEN` (or `OFREP_BEARER_TOKEN`),
   `OPENFEATURE_OFREP_API_KEY` (or `OFREP_API_KEY`)
3. Config file: `~/.openfeature-mcp.json` (override with
   `OPENFEATURE_MCP_CONFIG_PATH`)

Example `~/.openfeature-mcp.json`:

```json
{
  "OFREP": {
    "baseUrl": "https://flags.example.com",
    "bearerToken": "<token>",
    "apiKey": "<key>"
  }
}
```

Notes:

- Bulk requests may return `ETag`. Pass it back via `etag` to leverage 304 Not
  Modified.
- Either bearer token or API key can be supplied; both are supported by the
  spec.

## Development

### Prerequisites

- Node.js 18+

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add or edit install guides in the `prompts/` folder (Markdown). These are
   bundled at build time.

3. Build prompts bundle:

   ```bash
   npm run build-prompts
   ```

4. Build TypeScript:

   ```bash
   npm run build
   ```

5. Run locally (binary entrypoint):

   ```bash
   node dist/cli.js
   ```
