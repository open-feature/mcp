# OpenFeature iOS SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature iOS (Swift) client SDK.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: provide alternatives when standard approaches fail
- Conservative: do not create feature flags unless explicitly requested by the user
</role>

<context>
You are helping to install and configure the OpenFeature iOS SDK in a client-side Swift application. If no provider is specified, default to a simple placeholder provider to demonstrate wiring. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature iOS SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Server-side apps (use a server SDK such as Node.js, Go, Java, .NET)
- Android apps (use the Kotlin SDK)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Apple platform targets: iOS 14+, macOS 11+, watchOS 7+, tvOS 14+
- [ ] Swift 5.5+ and Xcode with SPM or CocoaPods
- [ ] Initialization location (`AppDelegate`, `SceneDelegate`, or app bootstrap)
- [ ] Desired provider (if none, use placeholder provider in this guide)
</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature iOS SDK

Swift Package Manager (SPM): in `Package.swift` add the latest version of the `open-feature/swift-sdk` dependency and product.

```swift
// Package.swift
dependencies: [
  .package(url: "https://github.com/open-feature/swift-sdk.git", from: "0.4.0")
]

// target
.product(name: "OpenFeature", package: "swift-sdk"),
```

Or add via Xcode: File > Add Packages... and use `https://github.com/open-feature/swift-sdk.git`.

<verification_checkpoint>
**Verify before continuing:**

- [ ] Package added via SPM or Pod installed successfully
- [ ] Project builds after dependency resolution
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Initialize OpenFeature with a provider

Initialize OpenFeature early in app startup and set a provider. Replace `CustomProvider()` with a real provider from the OpenFeature ecosystem when ready. Prefer awaiting readiness before evaluating any flags.

```swift
import OpenFeature

@main
struct MyApp: App {
  init() {
    Task {
      let provider = CustomProvider() // replace with a real provider
      await OpenFeatureAPI.shared.setProviderAndWait(provider: provider)

      // Create a client for evaluations
      let client = OpenFeatureAPI.shared.getClient("my-app")

      // Example evaluation without additional context
      _ = client.getBooleanValue(key: "new-message", defaultValue: false)
    }
  }

  var body: some Scene {
    WindowGroup { ContentView() }
  }
}
```
<!-- PROVIDERS:END -->

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider created and set via `setProviderAndWait(...)`
- [ ] App compiles without OpenFeature import errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting of your feature flags.

```swift
import OpenFeature

// Set global (API) context (e.g., environment/region)
let ctx = ImmutableContext(
  targetingKey: nil,
  structure: ImmutableStructure(attributes: [
    "region": Value.string("us-east-1")
  ])
)
OpenFeatureAPI.shared.setEvaluationContext(evaluationContext: ctx)
```

### Step 4: Evaluate flags with the client

Get the client and evaluate feature flag values.

```swift
import OpenFeature

let client = OpenFeatureAPI.shared.getClient("my-app")

let enabled = client.getBooleanValue(key: "new-message", defaultValue: false)
let text = client.getStringValue(key: "welcome-text", defaultValue: "Hello")
let number = client.getNumberValue(key: "api-limit", defaultValue: 100)
let obj = client.getObjectValue(key: "ui-config", defaultValue: Value.string("{\"theme\":\"light\"}"))
```

<success_criteria>

## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature iOS SDK installed
- ✅ Provider set (placeholder or real) and readiness awaited
- ✅ App builds and runs without errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Hooks

Attach hooks globally or per client to run code before/after evaluations.

```swift
import OpenFeature

OpenFeatureAPI.shared.addHooks(hooks: ExampleHook())

let client = OpenFeatureAPI.shared.getClient()
client.addHooks(ExampleHook())
```

Reference: [Hooks (OpenFeature iOS SDK)](https://openfeature.dev/docs/reference/technologies/client/swift#hooks)

### Eventing

Observe provider events (e.g., readiness or configuration changes).

```swift
import OpenFeature
import Combine

var cancellables = Set<AnyCancellable>()

OpenFeatureAPI.shared.observe().sink { event in
  switch event {
  case .ready:
    // provider ready
    break
  default:
    break
  }
}.store(in: &cancellables)
```

Reference: [Eventing (OpenFeature iOS SDK)](https://openfeature.dev/docs/reference/technologies/client/swift#eventing)

<troubleshooting>
## Troubleshooting

- **Apple platform versions**: Ensure minimum targets (iOS 14+/macOS 11+/watchOS 7+/tvOS 14+).
- **Provider not ready / values are defaults**: Use `await setProviderAndWait(...)` and evaluate flags after readiness.
- **Context not applied**: Set a global evaluation context via `setEvaluationContext(...)` before evaluations relying on targeting.
- **SPM/Pods issues**: Verify package URL/version, or run `pod repo update` and `pod install`.
</troubleshooting>

<next_steps>

## Next steps

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the placeholder provider and swap later.
- Add flags with `client.get*Value` methods and wire app logic to feature decisions.
- Consider using hooks and event observation for extensibility and reactivity.
</next_steps>

## Helpful resources

- OpenFeature iOS (Swift) SDK docs: [OpenFeature iOS SDK](https://openfeature.dev/docs/reference/technologies/client/swift)
