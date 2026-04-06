#!/usr/bin/env node

/**
 * Script to generate Agent Skills (SKILL.md files) from prompts/*.md and provider data.
 *
 * For each technology prompt, this script:
 * 1. Reads the prompt markdown
 * 2. Fetches provider documentation URLs (reusing logic from build-providers.js)
 * 3. Generates a SKILL.md with:
 *    - YAML frontmatter (name, description, license, metadata)
 *    - Updated prerequisites with vendor selection prompt
 *    - The InMemoryProvider default (PROVIDERS block stripped to its content)
 *    - A Provider Documentation Reference table at the end
 * 4. Writes to skills/openfeature-<technology>/SKILL.md
 *
 * The generated skills are committed to Git (not git-ignored).
 *
 * Usage:
 *   node scripts/build-skills.js                    # build all technologies
 *   node scripts/build-skills.js nodejs react        # build specific technologies only
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const SKILLS_DIR = path.join(__dirname, '..', 'skills');

// Technology display names and SDK references for descriptions
const TECHNOLOGY_META = {
  dotnet: { displayName: '.NET', sdkName: '.NET SDK' },
  go: { displayName: 'Go', sdkName: 'Go SDK' },
  java: { displayName: 'Java', sdkName: 'Java SDK' },
  javascript: { displayName: 'Web (JavaScript/TypeScript)', sdkName: 'Web SDK' },
  kotlin: { displayName: 'Kotlin', sdkName: 'Kotlin SDK' },
  nestjs: { displayName: 'NestJS', sdkName: 'NestJS SDK' },
  nodejs: { displayName: 'Node.js', sdkName: 'Node.js SDK' },
  php: { displayName: 'PHP', sdkName: 'PHP SDK' },
  python: { displayName: 'Python', sdkName: 'Python SDK' },
  react: { displayName: 'React', sdkName: 'React SDK' },
  ruby: { displayName: 'Ruby', sdkName: 'Ruby SDK' },
  swift: { displayName: 'Swift', sdkName: 'Swift SDK' },
};

// ---- Provider data fetching (reused from build-providers.js) ----

import ts from 'typescript';

const ALLOWED_TECHNOLOGIES = [
  'kotlin',
  'dotnet',
  'go',
  'swift',
  'java',
  'javascript',
  'nestjs',
  'nodejs',
  'php',
  'python',
  'react',
  'ruby',
];

const techToTechnologyMap = { '.net': 'dotnet' };

function getJavaScriptTechnologyByCategory(category) {
  if (Array.isArray(category)) {
    if (category.includes('Server')) return 'nodejs';
    if (category.includes('Client')) return 'javascript';
  }
  return 'javascript';
}

function getGithubHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'openfeature-mcp-build-script',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchProviderDirectoryListing() {
  const apiUrl = 'https://api.github.com/repos/open-feature/openfeature.dev/contents/src/datasets/providers?ref=main';
  const res = await fetch(apiUrl, { headers: getGithubHeaders() });
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.filter((entry) => entry.type === 'file' && entry.name.endsWith('.ts'));
}

async function fetchRemoteProviderFile(downloadUrl) {
  const res = await fetch(downloadUrl, { headers: { 'User-Agent': 'openfeature-mcp-build-script' } });
  if (!res.ok) {
    console.warn(`  Could not fetch provider file from ${downloadUrl}: ${res.status}`);
    return null;
  }
  return await res.text();
}

function extractDocsUrlByTech(fileContent) {
  const byTech = {};
  const sf = ts.createSourceFile('provider.ts', fileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  function getStringLiteralValue(node) {
    return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : null;
  }

  function asObjectLiteral(node) {
    return ts.isParenthesizedExpression(node) && ts.isObjectLiteralExpression(node.expression)
      ? node.expression
      : ts.isObjectLiteralExpression(node)
        ? node
        : null;
  }

  function findTechnologiesArray(obj) {
    if (!obj) return null;
    for (const prop of obj.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const nameText =
          ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text.toLowerCase() : '';
        if (nameText === 'technologies' && ts.isArrayLiteralExpression(prop.initializer)) {
          return prop.initializer;
        }
      }
    }
    return null;
  }

  function visit(node) {
    if (
      ts.isVariableStatement(node) &&
      node.modifiers &&
      node.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      for (const decl of node.declarationList.declarations) {
        const obj = asObjectLiteral(decl.initializer);
        if (!obj) continue;
        const techArr = findTechnologiesArray(obj);
        if (!techArr) continue;

        for (const el of techArr.elements) {
          if (!ts.isObjectLiteralExpression(el)) continue;
          let techName = null;
          let href = null;
          let category = null;

          for (const p of el.properties) {
            if (!ts.isPropertyAssignment(p)) continue;
            const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text.toLowerCase() : '';
            if (key === 'technology') {
              techName = getStringLiteralValue(p.initializer)?.toLowerCase();
            } else if (key === 'href') {
              href = getStringLiteralValue(p.initializer);
            } else if (key === 'category' && ts.isArrayLiteralExpression(p.initializer)) {
              category = [];
              for (const catEl of p.initializer.elements) {
                const catValue = getStringLiteralValue(catEl);
                if (catValue) category.push(catValue);
              }
            }
          }

          if (techName && href) {
            let technology;
            if (techName === 'javascript') {
              technology = getJavaScriptTechnologyByCategory(category);
            } else {
              technology = techToTechnologyMap[techName] || (ALLOWED_TECHNOLOGIES.includes(techName) ? techName : null);
            }
            if (technology && !byTech[technology]) {
              byTech[technology] = href;
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return byTech;
}

async function fetchAllProviderDocs() {
  console.log('Fetching provider data from GitHub...');
  const result = {};

  try {
    const listing = await fetchProviderDirectoryListing();
    for (const entry of listing) {
      if (!entry.download_url) continue;
      const content = await fetchRemoteProviderFile(entry.download_url);
      if (!content) continue;

      const base = path.basename(entry.name, '.ts');
      if (base === 'index') continue;

      const docsUrlByTechnology = extractDocsUrlByTech(content);
      if (Object.keys(docsUrlByTechnology).length === 0) continue;

      result[base] = docsUrlByTechnology;
    }
  } catch (err) {
    console.warn('Failed to fetch providers from GitHub:', err?.message || err);
  }

  console.log(`Fetched documentation URLs for ${Object.keys(result).length} providers.\n`);
  return result;
}

// ---- Skill generation ----

/**
 * Get the list of provider names that support a given technology,
 * along with their documentation URLs.
 */
function getProvidersForTechnology(allProviderDocs, technology) {
  const providers = [];
  for (const [providerName, techDocs] of Object.entries(allProviderDocs)) {
    if (techDocs[technology]) {
      providers.push({ name: providerName, url: techDocs[technology] });
    }
  }
  providers.sort((a, b) => a.name.localeCompare(b.name));
  return providers;
}

/**
 * Transform the prompt markdown into a SKILL.md.
 *
 * - Strips the PROVIDERS markers and keeps the InMemoryProvider content as the default
 * - Rewrites the prerequisites section to include active vendor selection
 * - Appends the provider documentation reference table
 */
function transformPromptToSkill(promptContent, technology, providers) {
  const meta = TECHNOLOGY_META[technology] || { displayName: technology, sdkName: `${technology} SDK` };

  // 1. Keep the InMemoryProvider block content, strip the markers
  const providersMarkerPattern = /<!--\s*PROVIDERS:START\s*-->\n?([\s\S]*?)<!--\s*PROVIDERS:END\s*-->\n?/;
  let content = promptContent.replace(providersMarkerPattern, '$1');

  // 2. Rewrite the prerequisites section to add vendor selection
  const providerNames = providers.map((p) => p.name);
  const vendorSelectionBlock = buildVendorSelectionBlock(meta.displayName, providerNames);
  content = injectVendorSelection(content, vendorSelectionBlock);

  // 3. Fix cross-references from prompt filenames to skill names
  content = fixCrossReferences(content);

  // 4. Collapse runs of 3+ blank lines into 2
  content = content.replace(/\n{3,}/g, '\n\n');

  // 5. Build the provider documentation reference table
  const providerTable = buildProviderReferenceTable(meta.displayName, providers);

  // 6. Assemble the full SKILL.md
  const frontmatter = buildFrontmatter(technology, meta);
  const trimmedContent = content.replace(/\n+$/, '');
  const trimmedTable = providerTable.replace(/^\n+/, '').replace(/\n+$/, '');
  return `${frontmatter}\n${trimmedContent}\n\n${trimmedTable}\n`;
}

/**
 * Replace prompt-file cross-references (e.g. "use `javascript.md` instead")
 * with skill name references.
 */
function fixCrossReferences(content) {
  const fileToSkill = {};
  for (const tech of Object.keys(TECHNOLOGY_META)) {
    fileToSkill[`${tech}.md`] = `openfeature-${tech}`;
  }

  // Match patterns like `javascript.md` or `react.md` in backticks
  return content.replace(/`(\w+)\.md`/g, (match, name) => {
    const skillName = fileToSkill[`${name}.md`];
    return skillName ? `the \`${skillName}\` skill` : match;
  });
}

function buildFrontmatter(technology, meta) {
  // Description should be specific enough for agents to match, under 250 chars for Claude Code
  const description =
    `Install and configure the OpenFeature ${meta.sdkName} in a ${meta.displayName} application. ` +
    `Use when adding feature flags or setting up a feature flag provider.`;

  return `---
name: openfeature-${technology}
description: >-
  ${description}
license: Apache-2.0
metadata:
  author: openfeature
  version: "1.0"
---`;
}

function buildVendorSelectionBlock(displayName, providerNames) {
  if (providerNames.length === 0) {
    return `
### Provider Selection

No pre-built providers are currently listed for ${displayName}. Use the example InMemoryProvider in Step 2, or search the web for "<vendor-name> OpenFeature ${displayName} provider" if the user has a specific vendor in mind.
`;
  }

  // Format names into wrapped lines for readability
  const namesWrapped = wrapNames(providerNames, 80);

  return `
### Provider Selection

Before installing, ask the user which feature flag vendor they would like to use. Present the following list of vendors that have OpenFeature provider support for ${displayName}:

**Available providers:**
${namesWrapped}

Ask the user to pick one (or more) from this list, or confirm they want to start with the built-in **InMemoryProvider** for testing and prototyping.

- If the user selects a vendor, look up the vendor's documentation URL in the **Provider Documentation Reference** section at the end of this document, fetch and read the documentation, and use it to configure the provider in Step 2 instead of InMemoryProvider.
- If the user wants to proceed without a vendor or is unsure, use the example InMemoryProvider shown in Step 2.
- If the user names a vendor not in the list, search the web for "<vendor-name> OpenFeature ${displayName} provider" to find installation documentation.
`;
}

/**
 * Wrap a list of names into lines of roughly maxWidth characters.
 */
function wrapNames(names, maxWidth) {
  const lines = [];
  let currentLine = '';
  for (const name of names) {
    const separator = currentLine ? ', ' : '';
    if (currentLine && (currentLine + separator + name).length > maxWidth) {
      lines.push(currentLine + ',');
      currentLine = name;
    } else {
      currentLine += separator + name;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

/**
 * Inject the vendor selection block into the prerequisites section.
 *
 * Strategy: find the </prerequisites> closing tag and insert just before it.
 * If no </prerequisites> tag exists, find the "## Installation Steps" heading
 * and insert before it.
 */
function injectVendorSelection(content, vendorSelectionBlock) {
  // Remove the existing passive provider checkbox lines from prerequisites
  const providerCheckboxPatterns = [
    /- \[ \] Do you want to install any provider\(s\).*?\n/g,
    /- \[ \] Whether to install a provider now;.*?\n/g,
    /- \[ \] Do you want to combine multiple providers.*?\n/g,
  ];
  let cleaned = content;
  for (const pattern of providerCheckboxPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Insert before </prerequisites> if it exists
  if (cleaned.includes('</prerequisites>')) {
    return cleaned.replace('</prerequisites>', `${vendorSelectionBlock}\n</prerequisites>`);
  }

  // Fallback: insert before "## Installation Steps"
  const installStepsPattern = /^## Installation Steps/m;
  if (installStepsPattern.test(cleaned)) {
    return cleaned.replace(installStepsPattern, `${vendorSelectionBlock}\n## Installation Steps`);
  }

  // Last resort: append before the first ## heading after prerequisites
  return cleaned + '\n' + vendorSelectionBlock;
}

function buildProviderReferenceTable(displayName, providers) {
  if (providers.length === 0) {
    return '';
  }

  const rows = providers.map((p) => `| ${p.name} | ${p.url} |`).join('\n');

  return `
## Provider Documentation Reference

When the user selects a vendor from the list above, find the vendor in this table, then fetch and read the linked documentation. Follow the vendor's instructions to install and configure their OpenFeature provider in place of InMemoryProvider in Step 2.

Browse all providers: https://openfeature.dev/ecosystem

| Provider | Documentation |
|----------|---------------|
${rows}
`;
}

// ---- Main ----

async function main() {
  // Parse CLI arguments for optional technology filter
  const filterTechnologies = process.argv.slice(2);

  // Fetch provider data
  const allProviderDocs = await fetchAllProviderDocs();

  // Read available prompt files
  const promptFiles = await fs.readdir(PROMPTS_DIR);
  const technologies = promptFiles
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => f.replace('.md', ''))
    .filter((t) => filterTechnologies.length === 0 || filterTechnologies.includes(t))
    .sort();

  if (technologies.length === 0) {
    console.log('No matching technologies found.');
    process.exit(0);
  }

  console.log(`Building skills for: ${technologies.join(', ')}\n`);

  for (const technology of technologies) {
    const promptPath = path.join(PROMPTS_DIR, `${technology}.md`);
    const promptContent = await fs.readFile(promptPath, 'utf-8');

    const providers = getProvidersForTechnology(allProviderDocs, technology);
    const skillContent = transformPromptToSkill(promptContent, technology, providers);

    const skillDir = path.join(SKILLS_DIR, `openfeature-${technology}`);
    await fs.mkdir(skillDir, { recursive: true });

    const skillPath = path.join(skillDir, 'SKILL.md');
    await fs.writeFile(skillPath, skillContent, 'utf-8');

    console.log(`  openfeature-${technology}/SKILL.md (${providers.length} providers)`);
  }

  console.log(`\nGenerated ${technologies.length} skill(s) in ${path.relative(process.cwd(), SKILLS_DIR)}/`);
}

main().catch((err) => {
  console.error('Error building skills:', err);
  process.exit(1);
});
