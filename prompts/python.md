# OpenFeature Python SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Python SDK for a server-side Python application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm Python version and package manager before proceeding
- Adaptive: provide pip and poetry alternatives
- Conservative: do not create feature flags or install third‑party providers unless explicitly requested
</role>

<context>
You are helping to install and configure the OpenFeature Python SDK in a server application. If no provider is specified, default to the example in-memory provider to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Python SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Browser-based apps (use client SDKs instead)
- Mobile apps (Android/iOS)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Python 3.9+ is installed
- [ ] Your package manager (pip or poetry)
- [ ] Which file is your application entry point (e.g., `app.py`, `main.py`, framework bootstrap)?
- [ ] Whether to install a provider now; use the example in-memory provider if unspecified
</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature Python SDK

Install the SDK with pip (or poetry).

```bash
# pip
pip install openfeature-sdk

# poetry
poetry add openfeature-sdk
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Package installed successfully
- [ ] Virtual environment active (if used)
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Initialize OpenFeature with the example in-memory provider

Initialize OpenFeature early in application startup and set the example in-memory provider. Replace with a real provider from the OpenFeature ecosystem when ready.

```python
from openfeature import api
from openfeature.provider.in_memory_provider import InMemoryFlag, InMemoryProvider

# Example in-memory flag configuration
my_flags = {
  "new-message": InMemoryFlag("on", {"on": True, "off": False})
}

# Replace with a real provider from: https://openfeature.dev/ecosystem/
api.set_provider(InMemoryProvider(my_flags))

# Create a client for evaluations
client = api.get_client("my-app")

# Example evaluation without additional context
enabled = client.get_boolean_value("new-message", False)
```
<!-- PROVIDERS:END -->

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider is set without errors
- [ ] Application starts without OpenFeature import errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting of your feature flags.

```python
from openfeature import api
from openfeature.evaluation_context import EvaluationContext

# Set global context (e.g., environment/region)
api.set_evaluation_context(
  EvaluationContext(targeting_key="system", attributes={"region": "us-east-1"})
)

# Create a per-invocation/request context (recommended)
request_ctx = EvaluationContext(
  targeting_key="user-123",
  attributes={
    "email": "user@example.com",
    "ip": "203.0.113.1",
  },
)
```

### Step 4: Evaluate flags with the client

Create a client and evaluate feature flag values.

```python
from openfeature import api

client = api.get_client("my-app")

# Without additional context
enabled = client.get_boolean_value("new-message", False)

# With per-request context (recommended)
text = client.get_string_value("welcome-text", "Hello", request_ctx)
limit = client.get_integer_value("api-limit", 100, request_ctx)
config = client.get_object_value("ui-config", {"theme": "light"}, request_ctx)
```

<success_criteria>
## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature Python SDK installed
- ✅ Provider set and usable for evaluations
- ✅ Application starts without OpenFeature-related errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Logging

The SDK logs via the standard `logging` package using the `openfeature` logger.

```python
import logging

logging.getLogger("openfeature").setLevel(logging.DEBUG)
```

Reference: [Logging (OpenFeature Python SDK)](https://openfeature.dev/docs/reference/technologies/server/python#logging)

### Transaction Context Propagation

Set and propagate transaction-specific evaluation context so it is automatically applied during evaluations.

```python
from openfeature import api
from openfeature.evaluation_context import EvaluationContext
from openfeature.transaction_context import ContextVarsTransactionContextPropagator

api.set_transaction_context_propagator(ContextVarsTransactionContextPropagator())

api.set_transaction_context(
  EvaluationContext(targeting_key="user-123", attributes={"ipAddress": "203.0.113.1"})
)
```

Reference: [Transaction Context Propagation (OpenFeature Python SDK)](https://openfeature.dev/docs/reference/technologies/server/python#transaction-context-propagation)

### Asynchronous feature retrieval

If your provider supports async, you can evaluate flags asynchronously.

```python
import asyncio
from openfeature import api
from openfeature.provider.in_memory_provider import InMemoryFlag, InMemoryProvider

async def main():
  my_flags = {"v2_enabled": InMemoryFlag("on", {"on": True, "off": False})}
  api.set_provider(InMemoryProvider(my_flags))
  client = api.get_client()
  value = await client.get_boolean_value_async("v2_enabled", False)
  print(value)

asyncio.run(main())
```

Reference: [Asynchronous Feature Retrieval (OpenFeature Python SDK)](https://openfeature.dev/docs/reference/technologies/server/python#asynchronous-feature-retrieval)

### Shutdown

Gracefully clean up registered providers on application shutdown.

```python
from openfeature import api

api.shutdown()
```

Reference: [Shutdown (OpenFeature Python SDK)](https://openfeature.dev/docs/reference/technologies/server/python#shutdown)

<troubleshooting>
## Troubleshooting

- **Python version**: Ensure Python 3.9+ is used per the SDK requirements.
- **Provider not set / values are defaults**: Call `api.set_provider(...)` before evaluations.
- **Context not applied**: Pass an `EvaluationContext` with a `targeting_key` for per-request evaluations; set global context for shared values.
- **Environment issues**: Verify your virtual environment, imports, and package installation (`pip list | grep openfeature`).
</troubleshooting>

<next_steps>
## Next steps

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example in-memory provider.
- Add flags with `client.get_<type>_value` methods and wire business logic to feature decisions.
</next_steps>

## Helpful resources

- OpenFeature Python SDK docs: [OpenFeature Python SDK](https://openfeature.dev/docs/reference/technologies/server/python)
