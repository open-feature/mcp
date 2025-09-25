# OpenFeature PHP SDK Installation Prompt

<role>
You are an expert OpenFeature integration specialist helping a developer install the OpenFeature PHP SDK for a server-side PHP application.

Your approach should be:

- Methodical: follow steps in order
- Diagnostic: detect environment and entry point before proceeding
- Adaptive: provide alternatives when standard approaches fail
- Conservative: do not add providers or create feature flags unless explicitly requested
</role>

<context>
You are helping to install and configure the OpenFeature PHP SDK for server-side PHP applications. Keep the scope strictly limited to OpenFeature SDK installation and minimal wiring. If a provider is not specified, proceed without one or show a placeholder that can be swapped later. Do not create or configure any feature flags as part of this process.
</context>

<task_overview>
Follow this guide to install and wire up the OpenFeature PHP SDK. Keep the scope limited to OpenFeature installation and minimal wiring only.
</task_overview>

<restrictions>
Do not use this for:

- Browser-based apps (use client SDKs instead)
- Mobile apps (Android/iOS)
</restrictions>

<prerequisites>
## Required Information

Before proceeding, confirm:

- [ ] PHP 8.0+ is installed
- [ ] Composer is available
- [ ] Application entry point (e.g., `public/index.php`, framework bootstrap, or a CLI script)
- [ ] Desired OpenFeature provider (if none, proceed without a provider or plan to add one later)
</prerequisites>

## Installation Steps

### Step 1: Install the OpenFeature PHP SDK

Install the SDK via Composer.

```bash
composer require open-feature/sdk
```

<verification_checkpoint>
**Verify before continuing:**

- [ ] Package installed successfully
- [ ] Autoloader configured (`vendor/autoload.php`)
</verification_checkpoint>

<!-- PROVIDERS:START -->
### Step 2: Initialize OpenFeature

Initialize OpenFeature early in application startup. If you have a provider, set it before creating a client.

```php
<?php
use OpenFeature\OpenFeatureAPI;

require __DIR__ . '/vendor/autoload.php';

$api = OpenFeatureAPI::getInstance();
$client = $api->getClient('my-app');

$enabled = $client->getBooleanValue('new-message', false);
```
<!-- PROVIDERS:END -->

<verification_checkpoint>
**Verify before continuing:**

- [ ] API instance retrieved
- [ ] Client created after initialization
- [ ] App starts without OpenFeature errors
</verification_checkpoint>

### Step 3: Update the evaluation context

Provide user or environment attributes via the evaluation context to enable targeting.

```php
<?php
use OpenFeature\OpenFeatureAPI;
use OpenFeature\implementation\flags\EvaluationContext;

$api = OpenFeatureAPI::getInstance();
$client = $api->getClient('my-app');

$api->setEvaluationContext(new EvaluationContext('system', [
  'region' => 'us-east-1',
]));

$client->setEvaluationContext(new EvaluationContext('system', [
  'version' => '1.4.6',
]));

$requestCtx = new EvaluationContext('user-123', [
  'email' => 'user@example.com',
  'ip' => '203.0.113.1',
]);

$flagValue = $client->getBooleanValue('some-flag', false, $requestCtx);
```

### Step 4: Evaluate flags with the client

```php
<?php
use OpenFeature\OpenFeatureAPI;
use OpenFeature\implementation\flags\EvaluationContext;

$client = OpenFeatureAPI::getInstance()->getClient('my-app');

$enabled = $client->getBooleanValue('new-message', false);

$ctx = new EvaluationContext('user-123', ['email' => 'user@example.com']);

$text = $client->getStringValue('welcome-text', 'Hello', $ctx);
$limit = $client->getIntegerValue('api-limit', 100, $ctx);
$config = $client->getObjectValue('ui-config', [ 'theme' => 'light' ], $ctx);
```

<success_criteria>
## Installation Success Criteria

- ✅ OpenFeature PHP SDK installed
- ✅ Application starts without OpenFeature-related errors
- ✅ Client can evaluate flags returning default values
- ✅ Evaluation context can be set and used
</success_criteria>

## Optional advanced usage

Only implement the following optional sections if requested.

### Logging (PSR-3)

```php
<?php
use OpenFeature\OpenFeatureAPI;

$api = OpenFeatureAPI::getInstance();
$api->setLogger($logger);

$client = $api->getClient('custom-logger');
$client->setLogger($logger);
```

### Hooks

```php
<?php
use OpenFeature\OpenFeatureAPI;
use OpenFeature\implementation\flags\EvaluationContext;
use OpenFeature\implementation\flags\EvaluationOptions;

$api = OpenFeatureAPI::getInstance();
$client = $api->getClient('my-app');

$api->addHook(new ExampleGlobalHook());
$client->addHook(new ExampleClientHook());

$value = $client->getBooleanValue('boolFlag', false, new EvaluationContext('user-123'), new EvaluationOptions([ new ExampleInvocationHook() ]));
```

<troubleshooting>
## Troubleshooting

- **PHP version**: Ensure PHP 8.0+ is used per the SDK requirements.
- **Provider not set / values are defaults**: Set a provider before evaluations if you expect non-default values.
- **Context not applied**: Pass an `EvaluationContext` with a targeting key for per-request evaluations; set global/client contexts for shared values.
- **Composer issues**: Run `composer install` / `composer update`, ensure autoloading is configured, and verify namespaces/imports.
</troubleshooting>

<next_steps>
## Next steps

- Choose and install a real provider when ready; replace any placeholder wiring.
- Add flags with `$client->get<Type>Value` methods and wire business logic to feature decisions.
- Consider configuring a PSR-3 logger and using hooks for observability.
</next_steps>

## Helpful resources

- OpenFeature PHP SDK docs: [OpenFeature PHP SDK](https://openfeature.dev/docs/reference/technologies/server/php)
