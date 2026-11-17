---
name: openfeature-nodejs
description: >-
  Install and configure the OpenFeature Node.js SDK in a Node.js application. Use when adding feature flags or setting up a feature flag provider.
license: Apache-2.0
metadata:
  author: openfeature
  version: "1.0"
---
# OpenFeature Node.js SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Node.js SDK for a Node.js server application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: offer alternatives when standard approaches fail
- Conservative: do not create feature flags or install third-party providers unless explicitly requested

</role>

<context>
You are helping to install and configure the OpenFeature Node.js SDK in a server-side JavaScript/TypeScript application. If no provider is specified, default to the example `InMemoryProvider` to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Node.js SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
Do not use this for:

- Browser-based apps (use the `openfeature-javascript` skill instead)
- React applications (use the `openfeature-react` skill instead)
- React Native apps
- Non-Node runtimes (Bun / Deno / Cloudflare Workers / etc)

</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Node.js 18+ is installed
- [ ] Your package manager (npm, yarn, pnpm)
- [ ] Which file is your server entry point (e.g., `src/server.ts`, `src/index.js`)?

Reference: OpenFeature Node.js SDK docs [OpenFeature Node.js SDK](https://openfeature.dev/docs/reference/technologies/server/javascript/)

### Provider Selection

Before installing, ask the user which feature flag vendor they would like to use. Present the following list of vendors that have OpenFeature provider support for Node.js:

**Available providers:**
abtasty, awsssm, bucketeer, cloudbees, confidence, configcat, datadog, devcycle,
env-var, featbit, flagd, flagsmith, flipt, goff, growthbook, hypertune, hyphen,
kameleoon, launchdarkly, multi-provider, ofrep, posthog, reflag, split, tggl,
vercel, vwo

Ask the user to pick one (or more) from this list, or confirm they want to start with the built-in **InMemoryProvider** for testing and prototyping.

- If the user selects a vendor, look up the vendor's documentation URL in the **Provider Documentation Reference** section at the end of this document, fetch and read the documentation, and use it to configure the provider in Step 2 instead of InMemoryProvider.
- If the user wants to proceed without a vendor or is unsure, use the example InMemoryProvider shown in Step 2.
- If the user names a vendor not in the list, search the web for "<vendor-name> OpenFeature Node.js provider" to find installation documentation.

</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature Node.js SDK

Install the server SDK package for Node.js.

```bash
# npm
npm install --save @openfeature/server-sdk

# yarn (install peer dep explicitly)
yarn add @openfeature/server-sdk @openfeature/core

# pnpm (install peer dep explicitly)
pnpm add @openfeature/server-sdk @openfeature/core
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Packages installed successfully
- [ ] No peer dependency conflicts
- [ ] `package.json` updated with dependencies
</verification_checkpoint>

### Step 2: Initialize OpenFeature

Initialize OpenFeature early in server startup and set the example in-memory provider.

```javascript
import { OpenFeature, InMemoryProvider } from '@openfeature/server-sdk';

const flagConfig = {
  'new-message': {
    disabled: false,
    variants: {
      on: true,
      off: false,
    },
    defaultVariant: 'on',
  },
};

const inMemoryProvider = new InMemoryProvider(flagConfig);

// Prefer awaiting readiness at startup
await OpenFeature.setProviderAndWait(inMemoryProvider);
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider created and initialized via `await OpenFeature.setProviderAndWait(...)`
- [ ] Initialization occurs before the server starts handling requests
- [ ] No OpenFeature initialization errors logged
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable user targeting of your feature flags.

```javascript
import { OpenFeature, AsyncLocalStorageTransactionContextPropagator } from '@openfeature/server-sdk';

// Set global context (e.g., environment/region)
OpenFeature.setContext({ region: process.env.REGION || 'us-east-1' });

// Optional: Enable transaction context propagation (Express-style)
OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContextPropagator());

app.use((req, res, next) => {
  const context = {
    targetingKey: req.user?.id || 'anonymous',
    email: req.user?.email,
    ipAddress: req.get?.('x-forwarded-for') || req.ip,
  };

  // Apply request-scoped context to subsequent flag evaluations
  OpenFeature.setTransactionContext(context, () => {
    next();
  });
});
```

### Step 4: Evaluate flags with the client

Create a client and evaluate feature flag values.

```javascript
import { OpenFeature } from '@openfeature/server-sdk';

const client = OpenFeature.getClient();

// Without context
const enabled = await client.getBooleanValue('new-message', false);

// With per-request context (recommended)
const requestContext = {
  targetingKey: req.user?.id || 'anonymous',
  email: req.user?.email,
};

const text = await client.getStringValue('welcome-text', 'Hello', requestContext);
const limit = await client.getNumberValue('api-limit', 100, requestContext);
const config = await client.getObjectValue('ui-config', { theme: 'light' }, requestContext);
```

<success_criteria>

## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature Node.js SDK package installed (and `@openfeature/core` with yarn/pnpm)
- ✅ Provider is configured and initialized via `await OpenFeature.setProviderAndWait(...)`
- ✅ Server starts without OpenFeature errors
- ✅ Flag evaluations return expected values after initialization
</success_criteria>

## Common Installation Scenarios

Scenario: Express.js API, Node.js 18, npm

Actions taken:

1. ✅ Installed `@openfeature/server-sdk`
2. ✅ Initialized `InMemoryProvider` before server startup
3. ✅ Set global context and request context
4. ✅ Evaluated flags in routes

Result: Installation successful

Scenario: Fastify microservice, TypeScript

Actions taken:

1. ✅ Installed packages with TypeScript support
2. ✅ Created an initialization plugin for OpenFeature
3. ✅ Registered plugin before routes
4. ✅ Evaluated flags with proper context

Result: Installation successful with TypeScript

## Optional advanced usage

Only implement the following optional sections if requested.

### Multi-Provider (combine multiple providers)

If you want a single OpenFeature client that aggregates multiple providers, use the Multi-Provider. Compose providers in precedence order and pick a strategy (e.g., FirstMatch) to decide which provider's result is used.

- Spec: [Multi-Provider](https://openfeature.dev/specification/appendix-a/#multi-provider)
- Server package: `@openfeature/multi-provider` ([reference](https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/multi-provider))

Install:

```bash
# npm
npm install --save @openfeature/multi-provider

# yarn
yarn add @openfeature/multi-provider

# pnpm
pnpm add @openfeature/multi-provider
```

Example:

```javascript
import { OpenFeature, InMemoryProvider } from '@openfeature/server-sdk';
import { MultiProvider, FirstMatchStrategy } from '@openfeature/multi-provider';

const multiProvider = new MultiProvider(
  [
    { provider: new InMemoryProvider({ /*...flags...*/ }), name: 'in-memory' },
    // { provider: new SomeOtherProvider({ ... }), name: 'vendor' },
  ],
  new FirstMatchStrategy()
);

await OpenFeature.setProviderAndWait(multiProvider);
```

### Logging

Override default console logging by providing a custom logger globally or per client.

```javascript
import { OpenFeature } from '@openfeature/server-sdk';
// If using TypeScript, you can type the logger: import type { Logger } from '@openfeature/server-sdk'

const logger = console;

// Set a global logger (applies to all clients unless overridden)
OpenFeature.setLogger(logger);

// Or set a client-specific logger
const client = OpenFeature.getClient();
client.setLogger(logger);
```

Reference: [Logging (OpenFeature Node.js SDK)](https://openfeature.dev/docs/reference/technologies/server/javascript/#logging)

### Tracking

Associate user actions with feature flag evaluations to support experimentation and analytics. Evaluate a flag, then record relevant events using `client.track`.

```javascript
import { OpenFeature } from '@openfeature/server-sdk';

const client = OpenFeature.getClient();

const enabled = await client.getBooleanValue('new-feature', false);

if (enabled) {
  useNewFeature();
  client.track('new-feature-used');
}

client.track('checkout-started', { cartValue: 123.45, currency: 'USD' });
```

Reference: [Tracking (OpenFeature Node.js SDK)](https://openfeature.dev/docs/reference/technologies/server/javascript/#tracking)

### Shutdown

Gracefully clean up all registered providers on application shutdown. Call `OpenFeature.close()` during your shutdown sequence (e.g., on process signals or server close).

Reference: [Shutdown (OpenFeature Node.js SDK)](https://openfeature.dev/docs/reference/technologies/server/javascript/#shutdown)

<troubleshooting>

- **Node.js version**: Ensure Node.js 18+ is used per the SDK requirements.
- **Provider not ready / values are defaults**: Call `await OpenFeature.setProviderAndWait(...)` at startup and evaluate flags after initialization.
- **Context not applied**: Pass an evaluation context with a `targetingKey` for per-request evaluations; use `OpenFeature.setContext(...)` for global values.
- **Peer dependency with yarn/pnpm**: Install `@openfeature/core` alongside `@openfeature/server-sdk` when using yarn or pnpm.

</troubleshooting>

<next_steps>

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example `InMemoryProvider`.
- Add flags with `client.get<type>Value` methods and wire business logic to feature decisions.
- Consider using the Multi-Provider to aggregate multiple providers.
- Consider tracking events with `client.track`.

</next_steps>

## Helpful resources

- OpenFeature Node.js SDK docs: [OpenFeature Node.js SDK](https://openfeature.dev/docs/reference/technologies/server/javascript/)
- Multi-Provider spec: [Multi-Provider](https://openfeature.dev/specification/appendix-a/#multi-provider)
- Multi-Provider (server) contrib: [js-sdk-contrib multi-provider](https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/multi-provider)

## Provider Documentation Reference

When the user selects a vendor from the list above, find the vendor in this table, then fetch and read the linked documentation. Follow the vendor's instructions to install and configure their OpenFeature provider in place of InMemoryProvider in Step 2.

Browse all providers: https://openfeature.dev/ecosystem

| Provider | Documentation |
|----------|---------------|
| abtasty | https://github.com/flagship-io/openfeature-provider-js |
| awsssm | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/aws-ssm |
| bucketeer | https://www.npmjs.com/package/@bucketeer/openfeature-node-server-sdk |
| cloudbees | https://github.com/rollout/cloudbees-openfeature-provider-node |
| confidence | https://github.com/spotify/confidence-sdk-js |
| configcat | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/config-cat |
| datadog | https://docs.datadoghq.com/feature_flags/server/nodejs |
| devcycle | https://docs.devcycle.com/sdk/server-side-sdks/node/node-openfeature |
| env-var | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/env-var |
| featbit | https://github.com/featbit/openfeature-provider-node-server |
| flagd | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/flagd |
| flagsmith | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/flagsmith |
| flipt | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/flipt |
| goff | https://gofeatureflag.org/docs/sdk/server_providers/openfeature_javascript |
| growthbook | https://github.com/open-feature/js-sdk-contrib/blob/main/libs/providers/growthbook/README.md |
| hypertune | https://www.npmjs.com/package/@hypertune/openfeature-server-provider |
| hyphen | https://github.com/Hyphen/openfeature-provider-javascript-server |
| kameleoon | https://github.com/Kameleoon/openfeature-nodejs |
| launchdarkly | https://github.com/launchdarkly/openfeature-node-server |
| multi-provider | https://github.com/open-feature/js-sdk/tree/main/packages/server#multi-provider |
| ofrep | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/ofrep |
| posthog | https://www.npmjs.com/package/@tapico/node-openfeature-posthog |
| reflag | https://github.com/reflagcom/javascript/tree/main/packages/openfeature-node-provider |
| split | https://github.com/splitio/split-openfeature-provider-js |
| tggl | https://tggl.io/developers/sdks/open-feature/node |
| vercel | https://vercel.com/docs/flags/vercel-flags/sdks/openfeature |
| vwo | https://github.com/wingify/vwo-openfeature-provider-node |
