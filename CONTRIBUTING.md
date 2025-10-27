# Contributing to OpenFeature MCP

Thank you for your interest in contributing to the OpenFeature MCP Server! This guide will help you get started with development.

## Prerequisites

- Node.js 18+

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add or edit install guides in the `prompts/` folder (Markdown). These are bundled at build time.

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

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request, please open an issue on [GitHub](https://github.com/open-feature/mcp/issues).

### Submitting Pull Requests

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes and ensure tests pass
4. Submit a pull request with a clear description of your changes

### Code Style

Please follow the existing code style and conventions used in the project.

## Community

- **CNCF Slack**: Join the [#openfeature](https://cloud-native.slack.com/archives/C0344AANLA1) channel
- **Community Invite**: [CNCF Slack Invite](https://communityinviter.com/apps/cloud-native/cncf)

We look forward to your contributions!
