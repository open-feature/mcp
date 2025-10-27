# Changelog

## [0.0.14](https://github.com/open-feature/mcp/compare/v0.0.13...v0.0.14) (2025-10-06)


### ✨ New Features

* add MCP registry publishing via DNS authentication ([#29](https://github.com/open-feature/mcp/issues/29)) ([784e8cb](https://github.com/open-feature/mcp/commit/784e8cb5254c7e47da385b853f813fe36a858c79))

## [0.0.13](https://github.com/open-feature/mcp/compare/v0.0.12...v0.0.13) (2025-09-30)


### 🧹 Chore

* add repository metadata ([644c7be](https://github.com/open-feature/mcp/commit/644c7be046a1a7b005a4f8bb80c5be9022046343))
* restore repository metadata ([72446d4](https://github.com/open-feature/mcp/commit/72446d4ba2936c40e4ea899ad1199679f998e91a))

## [0.0.12](https://github.com/open-feature/mcp/compare/v0.0.11...v0.0.12) (2025-09-30)


### 🧹 Chore

* clear npm tokens for oidc ([1808839](https://github.com/open-feature/mcp/commit/18088397d0b59bf64cb8fb68bf0bf85e33caf1b0))

## [0.0.11](https://github.com/open-feature/mcp/compare/v0.0.10...v0.0.11) (2025-09-29)


### 🐛 Bug Fixes

* add id-token permission to npm-release job ([a7ce285](https://github.com/open-feature/mcp/commit/a7ce285dc8d343af0ba0fac0109c166fb01a89f9))

## [0.0.10](https://github.com/open-feature/mcp/compare/v0.0.9...v0.0.10) (2025-09-29)


### 🐛 Bug Fixes

* move id-token permission to root level for OIDC ([4e9ccd3](https://github.com/open-feature/mcp/commit/4e9ccd390e1e3c40c8f183a893c6a8bcba0de93e))

## [0.0.9](https://github.com/open-feature/mcp/compare/v0.0.8...v0.0.9) (2025-09-29)


### 🐛 Bug Fixes

* add --provenance flag to trigger OIDC authentication ([3df639b](https://github.com/open-feature/mcp/commit/3df639bd81fb3271d928719038641bcf2b132a21))

## [0.0.8](https://github.com/open-feature/mcp/compare/v0.0.7...v0.0.8) (2025-09-29)


### 🐛 Bug Fixes

* clear NODE_AUTH_TOKEN env var to enable pure OIDC authentication ([3579953](https://github.com/open-feature/mcp/commit/35799539171cc9cd88d313823e14c2508d685a4e))

## [0.0.7](https://github.com/open-feature/mcp/compare/v0.0.6...v0.0.7) (2025-09-29)


### 🐛 Bug Fixes

* remove .npmrc before publish to enable OIDC authentication ([1fa1d56](https://github.com/open-feature/mcp/commit/1fa1d560aef70adfaf224eb73d15c5a69a72a199))

## [0.0.6](https://github.com/open-feature/mcp/compare/v0.0.5...v0.0.6) (2025-09-29)


### 🐛 Bug Fixes

* add registry-url back for npm OIDC authentication ([ef846d7](https://github.com/open-feature/mcp/commit/ef846d7be2973851e91761a31b1c12d7914e0545))

## [0.0.5](https://github.com/open-feature/mcp/compare/v0.0.4...v0.0.5) (2025-09-29)


### 🐛 Bug Fixes

* remove registry-url from setup-node to enable pure OIDC auth ([04e7a0c](https://github.com/open-feature/mcp/commit/04e7a0c186ce1c5d776d5e4e6ed8d44f1fd3b3eb))

## [0.0.4](https://github.com/open-feature/mcp/compare/v0.0.3...v0.0.4) (2025-09-29)


### 🧹 Chore

* cleanup README title ([9a11a0e](https://github.com/open-feature/mcp/commit/9a11a0e22cef58c9d08d18d4983818fb42a54dc3))

## [0.0.3](https://github.com/open-feature/mcp/compare/v0.0.2...v0.0.3) (2025-09-29)


### 🧹 Chore

* remove private from package.json ([#17](https://github.com/open-feature/mcp/issues/17)) ([5493cf3](https://github.com/open-feature/mcp/commit/5493cf3010e2e54198b5f14f4274883b32e94caf))

## [0.0.2](https://github.com/open-feature/mcp/compare/v0.0.1...v0.0.2) (2025-09-29)


### ✨ New Features

* initial commit! copying over from DevCycleHQ-Sandbox/openfeature-mcp ([bbfb45d](https://github.com/open-feature/mcp/commit/bbfb45d3d8ea000b1c2b7b1d79c9eb3f1a39d19f))


### 🧹 Chore

* add NPM release action, copy from js-sdk repo ([#10](https://github.com/open-feature/mcp/issues/10)) ([b7befb0](https://github.com/open-feature/mcp/commit/b7befb03cce6fa18c6621a4af62a639cdee2fc81))
* change over to standard Apache 2.0 License ([#2](https://github.com/open-feature/mcp/issues/2)) ([6218617](https://github.com/open-feature/mcp/commit/621861700d6f54a066922880578cee3acc571a66))
* copy GH templates from js-sdk repo ([#3](https://github.com/open-feature/mcp/issues/3)) ([cd3e6ce](https://github.com/open-feature/mcp/commit/cd3e6cef2db6c2cad3040bbb7dba237f6b105f8f))
* **deps:** update actions/checkout action to v5 ([#9](https://github.com/open-feature/mcp/issues/9)) ([47f6d9a](https://github.com/open-feature/mcp/commit/47f6d9aa1e24612de9755017295b4ff698cd00c0))
* **deps:** update actions/setup-node action to v5 ([#12](https://github.com/open-feature/mcp/issues/12)) ([d04f433](https://github.com/open-feature/mcp/commit/d04f433567c1818f35d890ec1f75c679774f7fff))
* **deps:** update amannn/action-semantic-pull-request action to v6 ([#13](https://github.com/open-feature/mcp/issues/13)) ([832cc50](https://github.com/open-feature/mcp/commit/832cc50ef523df5d28e33e0a00353366cf7fdb35))
* **deps:** update dependency @modelcontextprotocol/sdk to v1.18.2 ([#4](https://github.com/open-feature/mcp/issues/4)) ([2d42565](https://github.com/open-feature/mcp/commit/2d42565190ee8998288acf0783216ab26037bd96))
* **deps:** update dependency @types/node to v22.18.6 ([#5](https://github.com/open-feature/mcp/issues/5)) ([480bbde](https://github.com/open-feature/mcp/commit/480bbdeb8dd87d48228ba79efeabb94ac480c48e))
* setup eslint, copied config from js-sdk repo ([#7](https://github.com/open-feature/mcp/issues/7)) ([c70a6fe](https://github.com/open-feature/mcp/commit/c70a6fe6c6c8ca466a993e8e44133804f57815c0))
* update package.json with license + public ([#15](https://github.com/open-feature/mcp/issues/15)) ([740405d](https://github.com/open-feature/mcp/commit/740405dfca0e468fc38b37fa776c213772f573df))
