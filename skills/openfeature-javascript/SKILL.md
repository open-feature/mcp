---
name: openfeature-javascript
description: >-
  Install and configure the OpenFeature Web SDK in a Web (JavaScript/TypeScript) application. Use when adding feature flags or setting up a feature flag provider.
license: Apache-2.0
metadata:
  author: openfeature
  version: "1.0"
---
# OpenFeature Web SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Web SDK for a browser-based JavaScript/TypeScript application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: offer alternatives when standard approaches fail
- Conservative: do not create feature flags unless explicitly requested by the user

</role>

<context>
You are helping to install and configure the OpenFeature Web SDK in a browser app. If no provider is specified, default to the simple `InMemoryProvider` to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Web SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- React applications (use the `openfeature-react` skill instead)
- Node.js/server-side apps (use the Server JavaScript SDK guide)
- React Native or other non-browser runtimes
</restrictions>

<prerequisites>

## Required Information

Before proceeding, confirm:

- [ ] Your package manager (npm, yarn, pnpm)
- [ ] Which file is your entry point (e.g., `src/main.ts`, `src/index.js`)?

Reference: OpenFeature Web SDK docs [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web).

### Provider Selection

Before installing, ask the user which feature flag vendor they would like to use. Present the following list of vendors that have OpenFeature provider support for Web (JavaScript/TypeScript):

**Available providers:**
abtasty, bucketeer, confidence, configbee, configcat, datadog, devcycle, featbit,
flagd, flagsmith, flipt, goff, growthbook, hypertune, hyphen, kameleoon,
launchdarkly, multi-provider, ofrep, reflag, split, tggl, unleash

Ask the user to pick one (or more) from this list, or confirm they want to start with the built-in **InMemoryProvider** for testing and prototyping.

- If the user selects a vendor, look up the vendor's documentation URL in the **Provider Documentation Reference** section at the end of this document, fetch and read the documentation, and use it to configure the provider in Step 2 instead of InMemoryProvider.
- If the user wants to proceed without a vendor or is unsure, use the example InMemoryProvider shown in Step 2.
- If the user names a vendor not in the list, search the web for "<vendor-name> OpenFeature Web (JavaScript/TypeScript) provider" to find installation documentation.

</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature Web SDK

Install the core Web SDK package into your browser app.

```bash
# npm
npm install --save @openfeature/web-sdk

# yarn
yarn add @openfeature/web-sdk

# pnpm
pnpm add @openfeature/web-sdk
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Packages installed successfully
- [ ] `package.json` updated with dependencies
</verification_checkpoint>

### Step 2: Set up OpenFeature with the example InMemoryProvider

Initialize OpenFeature early in app startup and set the example in-memory provider. Optionally await readiness with `OpenFeature.setProviderAndWait(...)` if your app evaluates flags immediately at startup.

```javascript
import { OpenFeature, InMemoryProvider } from '@openfeature/web-sdk';

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
OpenFeature.setProvider(inMemoryProvider);
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider created and set via `OpenFeature.setProvider(...)`
- [ ] Application compiles without OpenFeature import errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user attributes via the evaluation context to enable user targeting of your feature flags.

```javascript
import { OpenFeature } from '@openfeature/web-sdk';

async function onLogin(userId, email) {
  await OpenFeature.setContext({ targetingKey: userId, email, authenticated: true });
}

async function onLogout() {
  await OpenFeature.setContext({ targetingKey: `anon-${Date.now()}`, anonymous: true });
}
```

### Step 4: Evaluate flags with the client

Get the OpenFeature client and evaluate feature flag values.

```javascript
import { OpenFeature } from '@openfeature/web-sdk';

async function run() {
  const client = OpenFeature.getClient();

  const showNewMessage = await client.getBooleanValue('new-message', false);
  const text = await client.getStringValue('welcome-text', 'Hello');
  const limit = await client.getNumberValue('api-limit', 100);
  const config = await client.getObjectValue('ui-config', { theme: 'light' });

  if (showNewMessage) {
    console.log('Welcome to the new experience!');
  }
  console.log({ text, limit, config });
}

run();
```

<success_criteria>

## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature Web SDK installed
- ✅ Provider set (using `InMemoryProvider` or a specified provider)
- ✅ App runs without OpenFeature-related errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Multi-Provider (combine multiple providers)

If you want a single OpenFeature client that aggregates multiple providers, use the Multi-Provider. Compose providers in precedence order and pick a strategy (e.g., FirstMatch) to decide which provider's result is used.

- Spec: [Multi-Provider](https://openfeature.dev/specification/appendix-a/#multi-provider)
- Web package: `@openfeature/multi-provider-web` (see repo for examples)

Install:

```bash
# npm
npm install --save @openfeature/multi-provider-web

# yarn
yarn add @openfeature/multi-provider-web

# pnpm
pnpm add @openfeature/multi-provider-web
```

Example:

```javascript
import { OpenFeature, InMemoryProvider } from '@openfeature/web-sdk';
import { MultiProvider, FirstMatchStrategy } from '@openfeature/multi-provider-web';

const flagConfig = {
  'new-message': {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: 'on',
  },
};

const multiProvider = new MultiProvider(
  [
    { provider: new InMemoryProvider(flagConfig), name: 'in-memory' },
  ],
  new FirstMatchStrategy()
);

OpenFeature.setProvider(multiProvider);
```

### Logging

```javascript
import { OpenFeature } from '@openfeature/web-sdk';

const logger = console;
OpenFeature.setLogger(logger);

const client = OpenFeature.getClient();
client.setLogger(logger);
```

Reference: [Logging (OpenFeature Web SDK)](https://openfeature.dev/docs/reference/technologies/client/web/#logging)

### Tracking

```javascript
import { OpenFeature } from '@openfeature/web-sdk';

const client = OpenFeature.getClient();
const enabled = await client.getBooleanValue('new-feature', false);
if (enabled) {
  client.track('new-feature-used');
}
client.track('cta-clicked', { cta: 'signup' });
```

Reference: [Tracking (OpenFeature Web SDK)](https://openfeature.dev/docs/reference/technologies/client/web/#tracking)

### Shutdown

Call `OpenFeature.close()` during your app’s shutdown sequence to gracefully clean up providers.

Reference: [Shutdown (OpenFeature Web SDK)](https://openfeature.dev/docs/reference/technologies/client/web/#shutdown)

<troubleshooting>

## Troubleshooting

- **Provider not ready / values are defaults**: Ensure you set the provider early in app startup and, if needed, `await OpenFeature.setProviderAndWait(...)` before evaluations.
- **Context not applied**: Ensure you call `OpenFeature.setContext(...)` with a `targetingKey` before evaluations that rely on targeting.
- **Imports**: Import from `@openfeature/web-sdk` for web/browser apps.
- **Bundling issues**: Ensure your bundler supports ESM.
</troubleshooting>

## Helpful resources

- OpenFeature Web SDK docs: [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web)

<next_steps>

## Next steps

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example `InMemoryProvider`.
- Add more flags and wire UI to feature decisions.
- Consider using the Multi-Provider to aggregate multiple sources.
</next_steps>

## Provider Documentation Reference

When the user selects a vendor from the list above, find the vendor in this table, then fetch and read the linked documentation. Follow the vendor's instructions to install and configure their OpenFeature provider in place of InMemoryProvider in Step 2.

Browse all providers: https://openfeature.dev/ecosystem

| Provider | Documentation |
|----------|---------------|
| abtasty | https://github.com/flagship-io/openfeature-provider-js-client |
| bucketeer | https://www.npmjs.com/package/@bucketeer/openfeature-js-client-sdk |
| confidence | https://github.com/spotify/confidence-sdk-js |
| configbee | https://github.com/configbee/cb-openfeature-provider-web |
| configcat | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/config-cat-web |
| datadog | https://docs.datadoghq.com/feature_flags/client/javascript?tab=npm |
| devcycle | https://docs.devcycle.com/sdk/client-side-sdks/javascript/javascript-openfeature |
| featbit | https://github.com/featbit/openfeature-provider-js-client |
| flagd | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/flagd-web |
| flagsmith | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/flagsmith-client |
| flipt | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/flipt-web |
| goff | https://gofeatureflag.org/docs/sdk/client_providers/openfeature_javascript |
| growthbook | https://docs.growthbook.io/lib/js#openfeature-provider |
| hypertune | https://www.npmjs.com/package/@hypertune/openfeature-web-provider |
| hyphen | https://github.com/Hyphen/openfeature-provider-javascript-web |
| kameleoon | https://github.com/Kameleoon/openfeature-js |
| launchdarkly | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/launchdarkly-client |
| multi-provider | https://github.com/open-feature/js-sdk/tree/main/packages/web#multi-provider |
| ofrep | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/ofrep-web |
| reflag | https://github.com/reflagcom/javascript/tree/main/packages/openfeature-browser-provider |
| split | https://github.com/splitio/split-openfeature-provider-web-js |
| tggl | https://tggl.io/developers/sdks/open-feature/web |
| unleash | https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/unleash-web |
