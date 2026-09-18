---
name: openfeature-go
description: >-
  Install and configure the OpenFeature Go SDK in a Go application. Use when adding feature flags or setting up a feature flag provider.
license: Apache-2.0
metadata:
  author: openfeature
  version: "1.0"
---
# OpenFeature Go SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Go SDK for a server-side Go application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: offer alternatives when standard approaches fail
- Conservative: do not create feature flags unless explicitly requested by the user
</role>

<context>
You are helping to install and configure the OpenFeature Go SDK in a server-side app. If no provider is specified, default to the simple example in-memory provider to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Go SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Browser-based apps (use client SDKs instead)
- Mobile apps (Android/iOS)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Go 1.23+ is installed
- [ ] Go modules are enabled
- [ ] Which file is your application entry point (e.g., `cmd/server/main.go`)?

### Provider Selection

Before installing, ask the user which feature flag vendor they would like to use. Present the following list of vendors that have OpenFeature provider support for Go:

**Available providers:**
awsssm, bucketeer, cloudbees, confidence, configcat, devcycle, env-var, flagd,
flagsmith, flipswitch, flipt, goff, growthbook, harness, hyphen, kameleoon,
launchdarkly, mdb-rules, ofrep, posthog, prefab, split, statsig, unleash, vwo

Ask the user to pick one (or more) from this list, or confirm they want to start with the built-in **InMemoryProvider** for testing and prototyping.

- If the user selects a vendor, look up the vendor's documentation URL in the **Provider Documentation Reference** section at the end of this document, fetch and read the documentation, and use it to configure the provider in Step 2 instead of InMemoryProvider.
- If the user wants to proceed without a vendor or is unsure, use the example InMemoryProvider shown in Step 2.
- If the user names a vendor not in the list, search the web for "<vendor-name> OpenFeature Go provider" to find installation documentation.

</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature Go SDK

Install the Go SDK module.

```bash
go get github.com/open-feature/go-sdk
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Dependency fetched successfully
- [ ] `go.mod` updated with `github.com/open-feature/go-sdk`
</verification_checkpoint>

### Step 2: Set up OpenFeature with the example in-memory provider

Initialize OpenFeature early in application startup and set the example in-memory provider.

```go
package main

import (
    "context"

    "github.com/open-feature/go-sdk/openfeature"
    "github.com/open-feature/go-sdk/openfeature/memprovider"
)

func main() {
    flagConfig := map[string]memprovider.InMemoryFlag{
        "new-message": {
            State:          memprovider.Enabled,
            Variants:       map[string]any{"on": true, "off": false},
            DefaultVariant: "on",
        },
    }

    // Replace with a real provider from: https://openfeature.dev/ecosystem/
    provider := memprovider.NewInMemoryProvider(flagConfig)

    // Prefer waiting for readiness at startup
    if err := openfeature.SetProviderAndWait(provider); err != nil {
        panic(err)
    }

    // Create a client for evaluations
    client := openfeature.NewClient("my-app")

    // Example evaluation without additional context
    _, _ = client.BooleanValue(context.Background(), "new-message", false, openfeature.EvaluationContext{})
}
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider created and set via `openfeature.SetProviderAndWait(...)`
- [ ] Application builds without OpenFeature import errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting of your feature flags.

```go
import (
    "github.com/open-feature/go-sdk/openfeature"
)

// Set global context (e.g., environment/region)
openfeature.SetEvaluationContext(openfeature.NewTargetlessEvaluationContext(map[string]any{
    "region": "us-east-1",
}))

// Set client-level context
client := openfeature.NewClient("my-app")
client.SetEvaluationContext(openfeature.NewTargetlessEvaluationContext(map[string]any{
    "version": "1.4.6",
}))

// Create a per-invocation context (recommended)
evalCtx := openfeature.NewEvaluationContext(
    "user-123", // targetingKey
    map[string]any{
        "email": "user@example.com",
        "ip":    "203.0.113.1",
    },
)
```

### Step 4: Evaluate flags with the client

Create a client and evaluate feature flag values.

```go
import (
    "context"
    "github.com/open-feature/go-sdk/openfeature"
)

client := openfeature.NewClient("my-app")

// Without additional context
enabled, err := client.BooleanValue(
    context.Background(),
    "new-message",
    false,
    openfeature.EvaluationContext{},
)

// With per-request context (recommended)
requestCtx := openfeature.NewEvaluationContext(
    "user-123",
    map[string]any{
        "email": "user@example.com",
    },
)

text, _ := client.StringValue(context.Background(), "welcome-text", "Hello", requestCtx)
limit, _ := client.FloatValue(context.Background(), "api-limit", 100.0, requestCtx)
config, _ := client.ObjectValue(context.Background(), "ui-config", map[string]any{"theme": "light"}, requestCtx)
```

<success_criteria>
## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature Go SDK installed
- ✅ Provider set and ready
- ✅ Application builds and runs without OpenFeature-related errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Logging

Attach a logging hook to emit detailed evaluation logs using slog.

```go
import (
    "log/slog"
    "os"

    "github.com/open-feature/go-sdk/openfeature"
    "github.com/open-feature/go-sdk/openfeature/hooks"
    "github.com/open-feature/go-sdk/openfeature/memprovider"
)

// Register an in-memory provider (empty flags are fine)
_ = openfeature.SetProviderAndWait(memprovider.NewInMemoryProvider(map[string]memprovider.InMemoryFlag{}))

handler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug})
logger := slog.New(handler)

loggingHook := hooks.NewLoggingHook(false, logger)
openfeature.AddHooks(loggingHook)
```

Reference: [Logging (OpenFeature Go SDK)](https://openfeature.dev/docs/reference/technologies/server/go#logging)

### Tracking

Associate user actions with feature flag evaluations to support experimentation and analytics.

```go
import (
    "context"
    "github.com/open-feature/go-sdk/openfeature"
)

client := openfeature.NewClient("my-app")

// Evaluate a flag, then track an event related to its usage
enabled, _ := client.BooleanValue(context.Background(), "new-feature", false, openfeature.EvaluationContext{})
if enabled {
    client.Track(
        context.Background(),
        "new-feature-used",
        openfeature.EvaluationContext{},
        openfeature.NewTrackingEventDetails(1).Add("source", "example"),
    )
}
```

Reference: [Tracking (OpenFeature Go SDK)](https://openfeature.dev/docs/reference/technologies/server/go#tracking)

### Shutdown

Gracefully clean up all registered providers on application shutdown.

```go
import "github.com/open-feature/go-sdk/openfeature"

openfeature.Shutdown()
```

Reference: [Shutdown (OpenFeature Go SDK)](https://openfeature.dev/docs/reference/technologies/server/go#shutdown)

### Transaction Context Propagation

Set and propagate transaction-specific evaluation context (e.g., within an HTTP request) so it is applied automatically during evaluations.

```go
import (
    "context"
    "github.com/open-feature/go-sdk/openfeature"
)

// Set the transaction context
ctx := openfeature.WithTransactionContext(context.Background(), openfeature.EvaluationContext{})

// Retrieve or merge as needed
_ = openfeature.TransactionContext(ctx)
tCtx := openfeature.MergeTransactionContext(ctx, openfeature.EvaluationContext{})

// Use the transaction context in an evaluation
_, _ = openfeature.NewClient("my-app").BooleanValue(tCtx, "new-message", false, openfeature.EvaluationContext{})
```

Reference: [Transaction Context Propagation (OpenFeature Go SDK)](https://openfeature.dev/docs/reference/technologies/server/go#transaction-context-propagation)

<troubleshooting>
## Troubleshooting

- **Go version**: Ensure Go 1.23+ is used per the SDK requirements.
- **Provider not ready / values are defaults**: Call `openfeature.SetProviderAndWait(...)` at startup and evaluate flags after initialization.
- **Context not applied**: Pass an evaluation context with a `targetingKey` for per-request evaluations; use `openfeature.SetEvaluationContext(...)` for global values.
- **Module issues**: Run `go mod tidy` to resolve dependency metadata and imports.
</troubleshooting>

<next_steps>

## Next steps

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example in-memory provider.
- Add flags with `client.<Type>` methods and wire business logic to feature decisions.
</next_steps>

## Helpful resources

- OpenFeature Go SDK docs: [OpenFeature Go SDK](https://openfeature.dev/docs/reference/technologies/server/go)

## Provider Documentation Reference

When the user selects a vendor from the list above, find the vendor in this table, then fetch and read the linked documentation. Follow the vendor's instructions to install and configure their OpenFeature provider in place of InMemoryProvider in Step 2.

Browse all providers: https://openfeature.dev/ecosystem

| Provider | Documentation |
|----------|---------------|
| awsssm | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/aws-ssm |
| bucketeer | https://github.com/bucketeer-io/openfeature-go-server-sdk |
| cloudbees | https://github.com/rollout/cloudbees-openfeature-provider-go |
| confidence | https://github.com/spotify/confidence-sdk-go |
| configcat | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/configcat |
| devcycle | https://docs.devcycle.com/sdk/server-side-sdks/go/go-openfeature |
| env-var | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/from-env |
| flagd | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/flagd |
| flagsmith | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/flagsmith |
| flipswitch | https://github.com/flipswitch-io/go-sdk |
| flipt | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/flipt |
| goff | https://gofeatureflag.org/docs/sdk/server_providers/openfeature_go |
| growthbook | https://github.com/growthbook/growthbook-openfeature-provider-go |
| harness | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/harness |
| hyphen | https://github.com/Hyphen/openfeature-provider-go |
| kameleoon | https://github.com/Kameleoon/openfeature-go |
| launchdarkly | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/launchdarkly |
| mdb-rules | https://github.com/ZackarySantana/mongo-openfeature-go |
| ofrep | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/ofrep |
| posthog | https://github.com/dhaus67/openfeature-posthog-go |
| prefab | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/prefab |
| split | https://github.com/splitio/split-openfeature-provider-go |
| statsig | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/statsig |
| unleash | https://github.com/open-feature/go-sdk-contrib/tree/main/providers/unleash |
| vwo | https://github.com/wingify/vwo-openfeature-provider-go |
