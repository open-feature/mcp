# OpenFeature .NET SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature .NET SDK for a server-side .NET application.

Your approach should be:
- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: offer alternatives when standard approaches fail
- Conservative: do not create feature flags unless explicitly requested by the user
</role>

<context>
You are helping to install and configure the OpenFeature .NET SDK in a server application. If no provider is specified, use an example in-memory provider to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature .NET SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Browser-based apps (use client SDKs instead)
- Mobile apps (Android/iOS)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] .NET 8+ is installed (or .NET Framework 4.6.2+)
- [ ] Your project type (Console, ASP.NET Core, etc.) and entry point
- [ ] Do you want to install any provider(s) alongside the OpenFeature .NET SDK? If not provided, this guide will use an example in-memory provider.
</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature .NET SDK

Initialize a project and add the package:

```bash
dotnet new console
dotnet add package OpenFeature
```

<verification_checkpoint>
**Verify before continuing:**
- [ ] Package added successfully
- [ ] Project builds after restore
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Set up OpenFeature with the example in-memory provider

Initialize early and set the example in-memory provider. Replace with a real provider from the OpenFeature ecosystem when ready.

```csharp
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using OpenFeature;
using OpenFeature.Model;

public class Program
{
  public static async Task Main()
  {
    try
    {
      // Example in-memory flag configuration
      var variants = new Dictionary<string, bool> {
        { "on", true },
        { "off", false }
      };

      var flags = new Dictionary<string, Flag<bool>> {
        { "new-message", new Flag<bool>(variants, "on") }
      };

      var provider = new InMemoryProvider(flags);

      // Replace with a real provider from: https://openfeature.dev/ecosystem/
      await Api.Instance.SetProviderAsync(provider);
    }
    catch (Exception ex)
    {
      Console.Error.WriteLine(ex);
      return;
    }

    // Create a client for evaluations
    var client = Api.Instance.GetClient("my-app");

    // Example evaluation without additional context
    bool enabled = await client.GetBooleanValueAsync("new-message", false);
  }
}
```
<!-- PROVIDERS:END -->

<verification_checkpoint>
**Verify before continuing:**
- [ ] Provider set via `await Api.Instance.SetProviderAsync(...)`
- [ ] App builds and starts without OpenFeature errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting.

```csharp
using OpenFeature;
using OpenFeature.Model;

// Set global context (e.g., environment/region)
var apiCtx = EvaluationContext.Builder()
  .Set("region", "us-east-1")
  .Build();
Api.Instance.SetContext(apiCtx);

// Set client-level context
var client = Api.Instance.GetClient("my-app");
var clientCtx = EvaluationContext.Builder()
  .Set("version", "1.4.6")
  .Build();
client.SetContext(clientCtx);

// Per-invocation/request context (recommended)
var requestCtx = EvaluationContext.Builder()
  .Set("targetingKey", "user-123")
  .Set("email", "user@example.com")
  .Set("ip", "203.0.113.1")
  .Build();
bool flagValue = await client.GetBooleanValueAsync("some-flag", false, requestCtx);
```

### Step 4: Evaluate flags with the client

```csharp
using OpenFeature;
using OpenFeature.Model;
using System.Collections.Generic;

var client = Api.Instance.GetClient("my-app");

// Without additional context
bool enabled = await client.GetBooleanValueAsync("new-message", false);

// With per-request context (recommended)
string userId = "user-123";
var ctx = EvaluationContext.Builder()
  .Set("targetingKey", userId)
  .Set("email", "user@example.com")
  .Build();

string text = await client.GetStringValueAsync("welcome-text", "Hello", ctx);
int limit = await client.GetIntegerValueAsync("api-limit", 100, ctx);

// Object value (Structure)
var defaultStructure = new Structure(new Dictionary<string, Value>
{
  { "theme", new Value("light") }
});
Structure config = await client.GetObjectValueAsync("ui-config", defaultStructure, ctx);
```

<success_criteria>
## Installation Success Criteria
- ✅ OpenFeature .NET SDK installed
- ✅ Provider initialized via `SetProviderAsync(...)`
- ✅ Application builds and runs without errors
- ✅ Evaluation context can be set and used in evaluations
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Dependency Injection (ASP.NET Core)

```csharp
// Program.cs (.NET 8)
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenFeature(options =>
{
  options.AddInMemoryProvider();
});

var app = builder.Build();
app.Run();
```

Reference: [Dependency Injection (OpenFeature .NET SDK)](https://openfeature.dev/docs/reference/technologies/server/dotnet#dependency-injection)

### Multi-Provider

The Multi-Provider enables the use of multiple underlying feature flag providers simultaneously, allowing different providers to be used for different flag keys or based on specific evaluation strategies.

```csharp
using OpenFeature.Providers.MultiProvider;
using OpenFeature.Providers.MultiProvider.Models;
using OpenFeature.Providers.MultiProvider.Strategies;

// Create provider entries
var providerEntries = new List<ProviderEntry>
{
    new(new InMemoryProvider(provider1Flags), "Provider1"),
    new(new InMemoryProvider(provider2Flags), "Provider2")
};

// Create multi-provider with FirstMatchStrategy (default)
var multiProvider = new MultiProvider(providerEntries, new FirstMatchStrategy());

// Set as the default provider
await Api.Instance.SetProviderAsync(multiProvider);

// Use normally - the multi-provider will handle delegation
var client = Api.Instance.GetClient();
var flagValue = await client.GetBooleanValueAsync("my-flag", false);
```

Reference: [Multi-Provider (OpenFeature .NET SDK)](https://openfeature.dev/docs/reference/technologies/server/dotnet#multi-provider)

### Logging

```csharp
using Microsoft.Extensions.Logging;
using OpenFeature;
using OpenFeature.Hooks;

using var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
var logger = loggerFactory.CreateLogger("Program");

var client = Api.Instance.GetClient();
client.AddHooks(new LoggingHook(logger));
```

Reference: [Logging (OpenFeature .NET SDK)](https://openfeature.dev/docs/reference/technologies/server/dotnet#logging)

### Shutdown

```csharp
using OpenFeature;

Api.Instance.Shutdown();
```

Reference: [Shutdown (OpenFeature .NET SDK)](https://openfeature.dev/docs/reference/technologies/server/dotnet#shutdown)

<troubleshooting>
## Troubleshooting
- **.NET version**: Ensure .NET 8+ (or .NET Framework 4.6.2+).
- **Provider not ready / values are defaults**: Await `SetProviderAsync(...)` and evaluate after initialization.
- **Context not applied**: Pass an `EvaluationContext` with a `targetingKey`; set global/client contexts for shared values.
- **NuGet issues**: Clear cache (`dotnet nuget locals all --clear`) and check package sources/versions.
</troubleshooting>

<next_steps>
## Next steps
- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example in-memory provider.
- Add flags with `client.Get<Type>ValueAsync` methods and wire business logic to feature decisions.
- Consider using dependency injection and multi-provider for advanced scenarios.
</next_steps>

## Helpful resources

- OpenFeature .NET SDK docs: [OpenFeature .NET SDK](https://openfeature.dev/docs/reference/technologies/server/dotnet)
