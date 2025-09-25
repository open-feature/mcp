# OpenFeature Ruby SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature Ruby SDK for a server-side Ruby application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: confirm environment and entry point before proceeding
- Adaptive: provide alternatives when standard approaches fail
- Conservative: do not create feature flags or install third‑party providers unless explicitly requested
</role>

<context>
You are helping to install and configure the OpenFeature Ruby SDK in a server application. If no provider is specified, default to the example in-memory provider to get started. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature Ruby SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
**Do not use this for:**
- Browser-based apps (use client SDKs instead)
- Mobile apps (Android/iOS)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] Ruby 3.1+ is installed (3.1.4/3.2.3/3.3.0 supported)
- [ ] Your dependency manager (bundler or RubyGems)
- [ ] Which file is your application entry point (e.g., `config/application.rb`, `app.rb`)?
- [ ] Do you want to install any provider(s) alongside the OpenFeature Ruby SDK? If not provided, this guide will use an example in-memory provider.
</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature Ruby SDK

Install the gem and add it to your Gemfile.

```bash
bundle add openfeature-sdk
```

Or, if not using bundler:

```bash
gem install openfeature-sdk
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Gem installed and available in your environment
- [ ] `Gemfile`/lockfile updated (if using bundler)
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Initialize OpenFeature with the example in-memory provider

Initialize OpenFeature early in application startup and set the example in-memory provider. Replace with a real provider from the OpenFeature ecosystem when ready.

```ruby
require 'open_feature/sdk'

OpenFeature::SDK.configure do |config|
  # Replace with a real provider from: https://openfeature.dev/ecosystem/
  config.set_provider(
    OpenFeature::SDK::Provider::InMemoryProvider.new({
      'new-message' => true,
    })
  )
end

client = OpenFeature::SDK.build_client('my-app')

# Example evaluation without additional context
enabled = client.fetch_boolean_value(flag_key: 'new-message', default_value: false)
```
<!-- PROVIDERS:END -->

<verification_checkpoint>
**Verify before continuing:**

- [ ] Provider is initialized without errors
- [ ] SDK loads and application starts
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting of your feature flags.

```ruby
require 'open_feature/sdk'

# Set global (API) context
OpenFeature::SDK.configure do |config|
  config.evaluation_context = OpenFeature::SDK::EvaluationContext.new(
    'region' => 'us-east-1'
  )
end

# Set client-level context
client = OpenFeature::SDK.build_client(
  'my-app',
  evaluation_context: OpenFeature::SDK::EvaluationContext.new(
    'version' => '1.4.6'
  )
)

# Create a per-invocation/request context (recommended)
request_context = OpenFeature::SDK::EvaluationContext.new(
  'email' => 'user@example.com',
  'ip' => '203.0.113.1'
)

# Use the request context in an evaluation
flag_value = client.fetch_boolean_value(
  flag_key: 'some-flag',
  default_value: false,
  evaluation_context: request_context
)
```

### Step 4: Evaluate flags with the client

Create a client and evaluate feature flag values.

```ruby
require 'open_feature/sdk'

client = OpenFeature::SDK.build_client('my-app')

# Without additional context
enabled = client.fetch_boolean_value(flag_key: 'new-message', default_value: false)

# With per-request context (recommended)
ctx = OpenFeature::SDK::EvaluationContext.new('email' => 'user@example.com')

text = client.fetch_string_value(flag_key: 'welcome-text', default_value: 'Hello', evaluation_context: ctx)
limit = client.fetch_number_value(flag_key: 'api-limit', default_value: 100, evaluation_context: ctx)

# Object/JSON value (pass serialized JSON or a hash depending on provider)
require 'json'
config = client.fetch_object_value(
  flag_key: 'ui-config',
  default_value: JSON.dump({ theme: 'light' }),
  evaluation_context: ctx
)
```

<success_criteria>
## Installation Success Criteria

Installation is complete when ALL of the following are true:

- ✅ OpenFeature Ruby SDK installed
- ✅ Example in-memory provider configured
- ✅ Application starts without OpenFeature errors
- ✅ Evaluation context can be set and read without errors
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Domains

Bind clients to providers by domain.

```ruby
OpenFeature::SDK.configure do |config|
  config.set_provider(OpenFeature::SDK::Provider::InMemoryProvider.new({}), domain: 'legacy_flags')
end

legacy_client = OpenFeature::SDK.build_client('legacy-app', domain: 'legacy_flags')
```

Reference: [Domains (OpenFeature Ruby SDK)](https://openfeature.dev/docs/reference/technologies/server/ruby#domains)

<troubleshooting>
## Troubleshooting

- **Ruby version**: Ensure a supported Ruby version (3.1.4/3.2.3/3.3.0) per SDK requirements.
- **Provider not set / values are defaults**: Configure a provider in `OpenFeature::SDK.configure` before evaluations.
- **Context not applied**: Pass an `EvaluationContext` to `fetch_*_value` or configure client/global context as shown.
- **Bundler/RubyGems issues**: Run `bundle install`, verify your `Gemfile`, or `gem list | grep openfeature-sdk` to confirm installation.
</troubleshooting>

<next_steps>
## Next steps

- If you want a real provider, specify which provider(s) to install now; otherwise continue with the example in-memory provider.
- Add flags with `client.fetch_<type>_value` methods and wire business logic to feature decisions.
</next_steps>

## Helpful resources

- OpenFeature Ruby SDK docs: [OpenFeature Ruby SDK](https://openfeature.dev/docs/reference/technologies/server/ruby)
