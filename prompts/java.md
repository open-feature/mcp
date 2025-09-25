# OpenFeature Java SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Java SDK for a server-side Java application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm Java version and build system before proceeding
- Adaptive: offer Maven and Gradle alternatives
- Conservative: do not create feature flags or install third‑party providers unless explicitly requested
</role>

<context>
You are helping to install and configure the OpenFeature Java SDK in a server application. If no provider is specified, default to the example in-memory provider to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Java SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Browser-based apps (use client SDKs instead)
- Android/mobile apps (use the Android/Kotlin SDK)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Java 11+ is installed
- [ ] Build tool (Maven or Gradle)
- [ ] Application entry point (e.g., `src/main/java/.../Main.java` or Spring Boot)
- [ ] Whether to install a provider now; use the example in-memory provider if unspecified

Reference: OpenFeature Java SDK docs [OpenFeature Java SDK](https://openfeature.dev/docs/reference/technologies/server/java)
</prerequisites>

## Installation Steps

### Step 1: Add the OpenFeature Java SDK dependency

Add the SDK dependency to your project.

Maven:

```xml
<dependency>
  <groupId>dev.openfeature</groupId>
  <artifactId>sdk</artifactId>
  <version>1.17.0</version>
  </dependency>
```

Gradle:

```groovy
dependencies {
  implementation 'dev.openfeature:sdk:1.17.0'
}
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Dependency added successfully
- [ ] Build system synced (Maven/Gradle)
- [ ] No dependency conflicts
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Initialize OpenFeature with the example in-memory provider

Initialize OpenFeature early in application startup and set the example in-memory provider. Replace with a real provider from the OpenFeature ecosystem when ready.

```java
import dev.openfeature.sdk.Client;
import dev.openfeature.sdk.Flag;
import dev.openfeature.sdk.OpenFeatureAPI;
import dev.openfeature.sdk.providers.memory.InMemoryProvider;

import java.util.HashMap;
import java.util.Map;

public class Main {
  public static void main(String[] args) {
    Map<String, Flag<?>> flags = new HashMap<>();
    flags.put("new-message", Flag.builder()
        .variant("on", true)
        .variant("off", false)
        .defaultVariant("on")
        .build());
    InMemoryProvider provider = new InMemoryProvider(flags);

    OpenFeatureAPI api = OpenFeatureAPI.getInstance();
    try {
      api.setProviderAndWait(provider);
    } catch (Exception e) {
      throw new RuntimeException(e);
    }

    Client client = api.getClient("my-app");
    boolean enabled = client.getBooleanValue("new-message", false);
  }
}
```
<!-- PROVIDERS:END -->

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider is initialized without errors
- [ ] SDK compiles and application starts
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting of your feature flags.

```java
import dev.openfeature.sdk.Client;
import dev.openfeature.sdk.EvaluationContext;
import dev.openfeature.sdk.ImmutableContext;
import dev.openfeature.sdk.OpenFeatureAPI;
import dev.openfeature.sdk.Value;

import java.util.HashMap;
import java.util.Map;

OpenFeatureAPI api = OpenFeatureAPI.getInstance();

Map<String, Value> apiAttrs = new HashMap<>();
apiAttrs.put("region", new Value("us-east-1"));
api.setEvaluationContext(new ImmutableContext(apiAttrs));

Map<String, Value> clientAttrs = new HashMap<>();
clientAttrs.put("version", new Value("1.4.6"));
Client client = api.getClient("my-app");
client.setEvaluationContext(new ImmutableContext(clientAttrs));

Map<String, Value> reqAttrs = new HashMap<>();
reqAttrs.put("email", new Value("user@example.com"));
reqAttrs.put("ip", new Value("203.0.113.1"));
String targetingKey = "user-123";
EvaluationContext requestCtx = new ImmutableContext(targetingKey, reqAttrs);
boolean flagValue = client.getBooleanValue("some-flag", false, requestCtx);
```

### Step 4: Evaluate flags with the client

Create a client and evaluate feature flag values.

```java
import dev.openfeature.sdk.Client;
import dev.openfeature.sdk.OpenFeatureAPI;
import dev.openfeature.sdk.Structure;
import dev.openfeature.sdk.Value;

Client client = OpenFeatureAPI.getInstance().getClient("my-app");

boolean enabled = client.getBooleanValue("new-message", false);

String userId = "user-123";
Map<String, Value> attrs = new HashMap<>();
attrs.put("email", new Value("user@example.com"));
EvaluationContext ctx = new ImmutableContext(userId, attrs);

String text = client.getStringValue("welcome-text", "Hello", ctx);
int limit = client.getIntegerValue("api-limit", 100, ctx);

Map<String, Value> defaultMap = new HashMap<>();
defaultMap.put("theme", new Value("light"));
Structure defaultValue = new Structure(defaultMap);
Value obj = client.getObjectValue("ui-config", defaultValue, ctx);
```

<success_criteria>

## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ Dependency is added (Maven/Gradle)
- ✅ Provider is initialized via `setProviderAndWait`
- ✅ App builds and runs without OpenFeature errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Logging

```java
import dev.openfeature.sdk.OpenFeatureAPI;
import dev.openfeature.contrib.hooks.logging.LoggingHook;

OpenFeatureAPI api = OpenFeatureAPI.getInstance();
api.addHooks(new LoggingHook());
```

Reference: [Logging (OpenFeature Java SDK)](https://openfeature.dev/docs/reference/technologies/server/java#logging)

### Tracking

```java
import dev.openfeature.sdk.MutableTrackingEventDetails;
import dev.openfeature.sdk.OpenFeatureAPI;

OpenFeatureAPI api = OpenFeatureAPI.getInstance();
api.getClient().track("visited-promo-page", new MutableTrackingEventDetails(99.77).add("currency", "USD"));
```

Reference: [Tracking (OpenFeature Java SDK)](https://openfeature.dev/docs/reference/technologies/server/java#tracking)

### Shutdown

```java
import dev.openfeature.sdk.OpenFeatureAPI;

OpenFeatureAPI.getInstance().shutdown();
```

Reference: [Shutdown (OpenFeature Java SDK)](https://openfeature.dev/docs/reference/technologies/server/java#shutdown)

### Transaction Context Propagation

```java
import dev.openfeature.sdk.*;
import dev.openfeature.sdk.contrib.transaction.ThreadLocalTransactionContextPropagator;

OpenFeatureAPI.getInstance().setTransactionContextPropagator(new ThreadLocalTransactionContextPropagator());

Map<String, Value> txAttrs = new HashMap<>();
txAttrs.put("userId", new Value("user-123"));
EvaluationContext txCtx = new ImmutableContext(txAttrs);
OpenFeatureAPI.getInstance().setTransactionContext(txCtx);
```

Reference: [Transaction Context Propagation (OpenFeature Java SDK)](https://openfeature.dev/docs/reference/technologies/server/java#transaction-context-propagation)

<troubleshooting>
## Troubleshooting

- **Java version**: Ensure Java 11+ is used per the SDK requirements.
- **Provider not ready / values are defaults**: Call `setProviderAndWait(...)` at startup and evaluate flags after initialization.
- **Context not applied**: Pass an `EvaluationContext` with a targeting key for per-request evaluations; use global/client context setters for shared values.
- **Build/dependency issues**: Verify repository access, sync dependencies, and ensure versions are compatible (Maven/Gradle refresh).
</troubleshooting>

<next_steps>

## Next steps

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example in-memory provider.
- Add flags with `client.get<Type>Value` methods and wire business logic to feature decisions.
</next_steps>

## Helpful Resources

- OpenFeature Java SDK docs: [OpenFeature Java SDK](https://openfeature.dev/docs/reference/technologies/server/java)
- OpenFeature ecosystem providers: [Ecosystem](https://openfeature.dev/ecosystem/)