#!/usr/bin/env node

/**
 * Script to bundle providers metadata into a TypeScript file
 * Similar to build-prompts.js, this allows us to include provider
 * information at build time for environments without file system access.
 *
 * Usage:
 *   node scripts/build-providers.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'generated', 'providersBundle.generated.ts');

const ALLOWED_TECHNOLOGIES = [
  'kotlin', 'dotnet', 'go', 'swift', 'java', 'javascript', 'nestjs', 'nodejs', 'php', 'python', 'react', 'ruby',
];
const techToTechnologyMap = {
  '.net': 'dotnet'
};

// Special mapping for JavaScript based on category
function getJavaScriptTechnologyByCategory(category) {
  if (Array.isArray(category)) {
    if (category.includes('Server')) return 'nodejs';
    if (category.includes('Client')) return 'javascript';
  }
  return 'javascript'; // default to client-side
}

function getGithubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'openfeature-mcp-build-script'
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
  /** @type {Array<{name:string,type:string,download_url?:string}>} */
  const data = await res.json();
  return data.filter(entry => entry.type === 'file' && entry.name.endsWith('.ts'));
}

async function fetchRemoteProviderFile(downloadUrl) {
  const res = await fetch(downloadUrl, { headers: { 'User-Agent': 'openfeature-mcp-build-script' } });
  if (!res.ok) {
    console.warn(`⚠️  Could not fetch provider file from ${downloadUrl}: ${res.status}`);
    return null;
  }
  return await res.text();
}

// No local directory fallback; always fetch from GitHub

// Extract per-technology docs strictly from technologies[].href using TypeScript AST
function extractDocsUrlByTech(fileContent) {
  /** @type {Record<string, string>} */
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
        const nameText = ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text.toLowerCase() : '';
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
      node.modifiers && node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
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
              // Extract category array
              category = [];
              for (const catEl of p.initializer.elements) {
                const catValue = getStringLiteralValue(catEl);
                if (catValue) {
                  category.push(catValue);
                }
              }
            }
          }

          if (techName && href) {
            let technology;
            // Special handling for JavaScript based on category
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

async function buildProvidersBundle() {
  console.log('🔨 Building providers bundle...');
  const result = [];

  try {
    console.log('🌐 Fetching providers from GitHub repository open-feature/openfeature.dev ...');
    const listing = await fetchProviderDirectoryListing();
    
    for (const entry of listing) {
      if (!entry.download_url) continue;

      const content = await fetchRemoteProviderFile(entry.download_url);
      if (!content) continue;

      const base = path.basename(entry.name, '.ts');
      if (base === 'index') continue; // skip barrel files
      
      // Build per-technology docs from href entries only
      const docsUrlByTechnology = extractDocsUrlByTech(content);
      if (Object.keys(docsUrlByTechnology).length === 0) {
        console.log(`⏭️  ${base}: Skipped (no docs URLs detected)`);
        continue;
      }
      result.push({ name: base, docsUrlByTechnology });
      console.log(`✅ ${base}: Parsed (remote)`);
    }
  } catch (err) {
    console.warn('⚠️  Failed to fetch providers from GitHub:', err?.message || err);
  }

  // Generate TypeScript file
  const providerNames = result.map(r => r.name);
  const hasProviders = providerNames.length > 0;
  const providersArray = providerNames.map(p => `  '${p}',`).join('\n');
  const supportEntries = result
    .map(r => `  '${r.name}': ${JSON.stringify(r.docsUrlByTechnology)} ,`)
    .join('\n');

  const tsContent = `// AUTO-GENERATED FILE - Do not edit manually
// Generated by scripts/build-providers.js

import { z } from 'zod';
import { type InstallTechnology } from './promptsBundle.generated.js';

export const PROVIDERS = [
${providersArray}
] as const;

export type ProviderName = ${hasProviders ? 'typeof PROVIDERS[number]' : 'string'};

export const providerSchema = ${hasProviders ? 'z.enum(PROVIDERS)' : 'z.string()'};
export const providersSchema = z.array(providerSchema).default([]);

export const PROVIDER_DOCS: Record<ProviderName${hasProviders ? '' : ' | string'}, Partial<Record<InstallTechnology, string>>> = {
${supportEntries}
};
`;

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, tsContent, 'utf-8');
  console.log(`\n📄 Output: ${path.relative(process.cwd(), OUTPUT_FILE)}`);
  console.log(`🎉 Providers bundle created with ${result.length} provider(s).`);
}

async function main() {
  try {
    await buildProvidersBundle();
  } catch (error) {
    console.error('❌ Error building providers bundle:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { buildProvidersBundle };

