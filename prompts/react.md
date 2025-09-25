# OpenFeature React SDK Installation Prompt

<role>
You are an expert OpenFeature and React integration specialist helping a developer install the OpenFeature React SDK for a browser-based React application.

Your approach should be:
- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: offer alternatives when standard approaches fail
- Conservative: do not create feature flags unless explicitly requested by the user
</role>

<context>
You are helping to install and configure the OpenFeature React SDK in a React web app. If no provider is specified, default to the simple `InMemoryProvider` to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature React SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Next.js applications (use a Next.js-specific guide)
- React Native apps (use the React Native SDK instead)
- Non-React JavaScript applications (use `javascript.md` instead)
- Server-side React rendering without a browser context
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] React 16.8+ is installed
- [ ] Your package manager (npm, yarn, pnpm)
- [ ] Which file is your entry point (`src/main.tsx`, `src/index.tsx`, or `src/App.tsx`)?
- [ ] Do you want to install any provider(s) alongside the OpenFeature React SDK? If yes, list the provider package names now. If not provided, this guide will use `InMemoryProvider`.
- [ ] Do you want to combine multiple providers into a single client? If yes, plan to use the Multi-Provider (see Advanced section) and install `@openfeature/multi-provider-web`.

Reference: OpenFeature React SDK docs [OpenFeature React SDK](https://openfeature.dev/docs/reference/technologies/client/web/react).
</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature React SDK

Install the React SDK and required peer dependencies.

```bash
# npm
npm install --save @openfeature/react-sdk

# yarn (install peer deps explicitly)
yarn add @openfeature/react-sdk @openfeature/web-sdk @openfeature/core

# pnpm (install peer deps explicitly)
pnpm add @openfeature/react-sdk @openfeature/web-sdk @openfeature/core
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Packages installed successfully
- [ ] No peer dependency conflicts
- [ ] `package.json` updated with dependencies
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Set up OpenFeature with the example InMemoryProvider

Initialize OpenFeature early and set the example in-memory provider.

Add this to your entry point or `App` component file.

```javascript
import React from 'react';
import { OpenFeatureProvider, OpenFeature, InMemoryProvider } from '@openfeature/react-sdk';

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

// Replace with provider from: https://openfeature.dev/ecosystem/?instant_search%5BrefinementList%5D%5BallTechnologies%5D%5B0%5D=React
const inMemoryProvider = new InMemoryProvider(flagConfig);

// Optionally await readiness: await OpenFeature.setProviderAndWait(inMemoryProvider);
OpenFeature.setProvider(inMemoryProvider);

function App() {
  return (
    <OpenFeatureProvider>
      <div className="App">
        <h1>My React App with OpenFeature</h1>
      </div>
    </OpenFeatureProvider>
  );
}

export default App;
```
<!-- PROVIDERS:END -->

Note: You do not need to await provider initialization; the React SDK will handle re-rendering and suspense when the provider is ready [OpenFeature React SDK](https://openfeature.dev/docs/reference/technologies/client/web/react).

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider created and set via `OpenFeature.setProvider(...)`
- [ ] `OpenFeatureProvider` wraps your app
- [ ] Application compiles without OpenFeature import errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user attributes via the evaluation context to enable user targeting of your feature flags.

```javascript
import { OpenFeature } from '@openfeature/react-sdk';

async function onLogin(userId, email) {
  await OpenFeature.setContext({ targetingKey: userId, email, authenticated: true });
}

async function onLogout() {
  await OpenFeature.setContext({ targetingKey: `anon-${Date.now()}`, anonymous: true });
}
```

### Step 4: Evaluate flags with hooks

Optionally, if requested by the user: use React hooks to read feature flags and react to changes.

```javascript
import { useFlag, useBooleanFlagValue } from '@openfeature/react-sdk';

function Page() {
  const { value: showNewMessage } = useFlag('new-message', false);
  const isOn = useBooleanFlagValue('new-message', false);

  return <>{showNewMessage && isOn ? <p>Welcome!</p> : <p>Hello</p>}</>;
}
```

<success_criteria>
## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature React SDK installed (and peer deps when needed)
- ✅ Provider set (using `InMemoryProvider` or a specified provider)
- ✅ `OpenFeatureProvider` wraps the application
- ✅ App runs without OpenFeature-related errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Multi-Provider (combine multiple providers)

If you want a single OpenFeature client that aggregates multiple providers, use the Multi-Provider. Compose providers in precedence order and pick a strategy (e.g., FirstMatch) to decide which provider's result is used.

- Spec: [Multi-Provider](https://openfeature.dev/specification/appendix-a/#multi-provider)
- Web package: `@openfeature/multi-provider-web` ([reference](https://github.com/open-feature/js-sdk-contrib/tree/main/libs/providers/multi-provider-web))

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
import { OpenFeature, InMemoryProvider } from '@openfeature/react-sdk';
import { MultiProvider, FirstMatchStrategy } from '@openfeature/multi-provider-web';

// Compose providers in precedence order (first match wins)
const multiProvider = new MultiProvider(
  [
    { provider: new InMemoryProvider(flagConfig), name: 'in-memory' },
    // { provider: new SomeOtherProvider({ ... }), name: 'vendor' }
  ],
  new FirstMatchStrategy()
);

// Optionally await readiness: await OpenFeature.setProviderAndWait(multiProvider);
OpenFeature.setProvider(multiProvider);
```

### Re-rendering with context changes

Control whether components re-render when the evaluation context changes (e.g., on login or user attribute updates).

```javascript
import { useFlag } from '@openfeature/react-sdk';

function Page() {
  const { value } = useFlag('new-message', false, { updateOnContextChanged: true });
  return <>{value ? 'New' : 'Old'}</>;
}
```

### Re-rendering with flag configuration changes

Control whether components re-render when the underlying provider reports configuration changes (e.g., flags updated remotely).

```javascript
import { useFlag } from '@openfeature/react-sdk';

function Page() {
  const { value } = useFlag('new-message', false, { updateOnConfigurationChanged: true });
  return <>{value ? 'New' : 'Old'}</>;
}
```

### Suspense support

Optionally suspend rendering until the provider is ready or during context reconciliation; useful for showing loading states around flag-dependent UI.

```javascript
import { Suspense } from 'react';
import { useSuspenseFlag } from '@openfeature/react-sdk';

function Content() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Message />
    </Suspense>
  );
}

function Message() {
  const { value } = useSuspenseFlag('new-message', false);
  return <>{value ? <p>Welcome!</p> : <p>Hello</p>}</>;
}
```

### Tracking

Associate user actions with flag evaluations using a provider-agnostic tracking API via `useTrack`.

```javascript
import { useTrack } from '@openfeature/react-sdk';

function MyComponent() {
  const { track } = useTrack();
  track('clicked-cta', { cta: 'signup' });
  return null;
}
```

### Testing

Use `OpenFeatureTestProvider` to supply default or explicit flag values and simulate readiness delays in component tests.

```javascript
import { OpenFeatureTestProvider } from '@openfeature/react-sdk';

// default values only
<OpenFeatureTestProvider>
  <MyComponent />
</OpenFeatureTestProvider>

// control values
<OpenFeatureTestProvider flagValueMap={{ 'my-boolean-flag': true }}>
  <MyComponent />
</OpenFeatureTestProvider>
```

<troubleshooting>
- **Suspense boundary error**: Add a `<Suspense>` boundary around components using flags, or disable suspend options in hooks/provider [OpenFeature React SDK](https://openfeature.dev/docs/reference/technologies/client/web/react).
- **Unexpected mount/hide behavior with React 16/17**: Prefer React 18 for Concurrent Suspense, or gate siblings with `useWhenProviderReady`.
- **Multiple providers share state**: Set a distinct `domain` on each `OpenFeatureProvider`.
- **Imports**: Import from `@openfeature/react-sdk` (it re-exports web/core).
</troubleshooting>

<next_steps>
- If you want a real provider, specify which provider(s) to install now; otherwise continue with `InMemoryProvider`.
- Add flags and wire UI with `useFlag`/typed hooks.
- Consider using the Multi-Provider to aggregate multiple providers.
- Consider tracking events with `useTrack`.
</next_steps>

## Helpful resources

- OpenFeature React SDK docs: [OpenFeature React SDK](https://openfeature.dev/docs/reference/technologies/client/web/react)
