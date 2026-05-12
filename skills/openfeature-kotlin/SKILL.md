---
name: openfeature-kotlin
description: >-
  Install and configure the OpenFeature Kotlin SDK in a Kotlin application. Use when adding feature flags or setting up a feature flag provider.
license: Apache-2.0
metadata:
  author: openfeature
  version: "1.0"
---
# OpenFeature Android (Kotlin) SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Android (Kotlin) client SDK.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: detect environment and build system before proceeding
- Adaptive: provide alternatives when standard approaches fail
- Conservative: do not add providers or create feature flags unless explicitly requested

</role>

<context>
You are helping to install and configure the OpenFeature SDK for client-side Android/Kotlin applications. Keep the scope strictly limited to OpenFeature SDK installation and minimal wiring. If a provider is not specified, demonstrate wiring with a placeholder provider only. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Android/Kotlin SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
Do not use this for:

- Server-side apps (use a server SDK such as Node.js, Go, Java, .NET)
- iOS apps (use the Swift SDK)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Android SDK 21+ and JDK 11+
- [ ] Build system (Gradle Kotlin DSL or Groovy)
- [ ] Initialization location (`Application`, `MainActivity`, or DI setup)
- [ ] Desired OpenFeature provider (if none, use placeholder `MyProvider`)

### Provider Selection

Before installing, ask the user which feature flag vendor they would like to use. Present the following list of vendors that have OpenFeature provider support for Kotlin:

**Available providers:**
bucketeer, confidence, configcat, datadog, devcycle, goff, kameleoon, split

Ask the user to pick one (or more) from this list, or confirm they want to start with the built-in **InMemoryProvider** for testing and prototyping.

- If the user selects a vendor, look up the vendor's documentation URL in the **Provider Documentation Reference** section at the end of this document, fetch and read the documentation, and use it to configure the provider in Step 2 instead of InMemoryProvider.
- If the user wants to proceed without a vendor or is unsure, use the example InMemoryProvider shown in Step 2.
- If the user names a vendor not in the list, search the web for "<vendor-name> OpenFeature Kotlin provider" to find installation documentation.

</prerequisites>

## Installation Steps

### Step 1: Add the OpenFeature Kotlin SDK dependency

Gradle (Groovy):

```groovy
dependencies {
    api 'dev.openfeature:kotlin-sdk:0.6.2'
}
```

Gradle (Kotlin DSL):

```kotlin
dependencies {
    api("dev.openfeature:kotlin-sdk:0.6.2")
}
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Dependency added successfully
- [ ] Project sync or build succeeds without OpenFeature import errors
</verification_checkpoint>

### Step 2: Initialize OpenFeature with a provider

Initialize OpenFeature early in app startup and set a provider. Replace `MyProvider()` with a real provider later.

```kotlin
import dev.openfeature.kotlin.sdk.OpenFeatureAPI
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MyProvider : dev.openfeature.kotlin.sdk.providers.FeatureProvider {
  override val hooks = emptyList<dev.openfeature.kotlin.sdk.hooks.Hook<*>>()
  override val metadata = dev.openfeature.kotlin.sdk.Metadata("my-provider")
}

fun initializeOpenFeature(scope: CoroutineScope) {
  scope.launch(Dispatchers.Default) {
    OpenFeatureAPI.setProviderAndWait(MyProvider())
    val client = OpenFeatureAPI.getClient("my-app")
    val enabled = client.getBooleanValue("new-message", default = false)
  }
}
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider initialized via `OpenFeatureAPI.setProviderAndWait(...)`
- [ ] Client created after readiness
- [ ] App compiles without OpenFeature initialization errors
</verification_checkpoint>

### Step 3: Update the evaluation context

```kotlin
import dev.openfeature.kotlin.sdk.OpenFeatureAPI
import dev.openfeature.kotlin.sdk.EvaluationContext
import dev.openfeature.kotlin.sdk.ImmutableContext
import dev.openfeature.kotlin.sdk.Value

val apiCtx: EvaluationContext = ImmutableContext(
  targetingKey = null,
  attributes = mutableMapOf(
    "region" to Value.String("us-east-1")
  )
)
OpenFeatureAPI.setEvaluationContext(apiCtx)

val requestCtx: EvaluationContext = ImmutableContext(
  targetingKey = "user-123",
  attributes = mutableMapOf(
    "email" to Value.String("user@example.com"),
    "ip" to Value.String("203.0.113.1")
  )
)
```

### Step 4: Evaluate flags with the client

```kotlin
import dev.openfeature.kotlin.sdk.OpenFeatureAPI

val client = OpenFeatureAPI.getClient("my-app")
val enabled = client.getBooleanValue("new-message", default = false)
val text = client.getStringValue("welcome-text", default = "Hello", context = requestCtx)
val limit = client.getIntegerValue("api-limit", default = 100, context = requestCtx)
val config = client.getObjectValue("ui-config", default = Value.String("{\"theme\":\"light\"}"), context = requestCtx)
```

<success_criteria>
## Installation Success Criteria

- ✅ Dependency added to Gradle
- ✅ Provider (placeholder or real) initialized with readiness awaited
- ✅ Global and per-request evaluation contexts configured
- ✅ Application builds and runs without errors
- ✅ Sample evaluations return expected default values

</success_criteria>

## Optional advanced usage (implement when requested)

### Tracking

```kotlin
import dev.openfeature.kotlin.sdk.OpenFeatureAPI
import dev.openfeature.kotlin.sdk.TrackingEventDetails
import dev.openfeature.kotlin.sdk.ImmutableStructure
import dev.openfeature.kotlin.sdk.Value

val client = OpenFeatureAPI.getClient()
client.track(
  "checkout",
  TrackingEventDetails(
    499.99,
    ImmutableStructure(
      mapOf(
        "numberOfItems" to Value.Integer(4),
        "timeInCheckout" to Value.String("PT3M20S")
      )
    )
  )
)
```

### Eventing

```kotlin
import dev.openfeature.kotlin.sdk.OpenFeatureAPI
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers

fun observeProviderEvents(scope: CoroutineScope) {
  scope.launch(Dispatchers.Default) {
    OpenFeatureAPI.observe().collect {
      // handle provider events
    }
  }
}
```

### Shutdown

```kotlin
import dev.openfeature.kotlin.sdk.OpenFeatureAPI
OpenFeatureAPI.shutdown()
```

<troubleshooting>
## Troubleshooting

- Provider not ready / default values only: use `OpenFeatureAPI.setProviderAndWait(...)` and evaluate after readiness
- Context not applied: include a `targetingKey` and attributes in an `EvaluationContext`
- Coroutines: initialize on a background dispatcher and avoid evaluations before readiness
- Android/KMP versions: ensure Android SDK 21+ and JDK 11+

</troubleshooting>

<next_steps>
## Next Steps

- Choose and install a real provider when ready; replace `MyProvider`
- Wire feature decisions into UI/logic via `client.get<Type>Value` methods
- Keep this prompt focused on OpenFeature installation; provider-specific steps can be added later on request
</next_steps>

## Helpful resources

- OpenFeature Android/Kotlin SDK docs: [OpenFeature Android SDK](https://openfeature.dev/docs/reference/technologies/client/kotlin)
- OpenFeature Specification: [OpenFeature Spec](https://openfeature.dev/specification/)

## Provider Documentation Reference

When the user selects a vendor from the list above, find the vendor in this table, then fetch and read the linked documentation. Follow the vendor's instructions to install and configure their OpenFeature provider in place of InMemoryProvider in Step 2.

Browse all providers: https://openfeature.dev/ecosystem

| Provider | Documentation |
|----------|---------------|
| bucketeer | https://github.com/bucketeer-io/openfeature-kotlin-client-sdk |
| confidence | https://github.com/spotify/confidence-sdk-android |
| configcat | https://github.com/configcat/openfeature-kotlin |
| datadog | https://docs.datadoghq.com/feature_flags/client/android/ |
| devcycle | https://docs.devcycle.com/sdk/client-side-sdks/android/android-openfeature |
| goff | https://gofeatureflag.org/docs/sdk/client_providers/openfeature_android |
| kameleoon | https://github.com/Kameleoon/openfeature-android |
| split | https://github.com/splitio/split-openfeature-provider-android |
