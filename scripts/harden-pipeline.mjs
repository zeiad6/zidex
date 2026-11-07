// scripts/harden-pipeline.mjs
/**
 * ZeidexSoft — CI/CD Production Hardening Pipeline
 * Integrates BLA (Blind LLM Agents) and AST Poisoning
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { generatePoisonPayload } from './bla-poison-generator.mjs';

const DIST_DIRS = [
  path.resolve('./dist'),
  path.resolve('./dist_pages')
];

function getFilesRecursively(dir, filterExt = '.js') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath, filterExt));
    } else if (entry.isFile() && entry.name.endsWith(filterExt)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function runHardening() {
  console.log('====================================================');
  console.log('🛡️  ZeidexSoft: Running Counter-REA Hardening Pipeline');
  console.log('====================================================');

  // 1. Attempt BLA CLI execution if available
  try {
    console.log('[+] Checking for bla-agents CLI...');
    execSync('npx --no-install bla-agents --version', { stdio: 'pipe' });
    console.log('[+] Running npx bla-agents harden . ...');
    execSync('npx bla-agents harden . --mode aggressive', { stdio: 'inherit' });
  } catch {
    console.log('[i] Standard bla-agents CLI not globally pinned; applying native BLA counter-REA generator.');
  }

  // 2. Scan and inject poison + context exhaustion traps into JavaScript bundles
  let processedCount = 0;
  for (const distDir of DIST_DIRS) {
    if (!fs.existsSync(distDir)) continue;

    const jsFiles = getFilesRecursively(distDir, '.js');
    for (const jsFile of jsFiles) {
      // Don't poison service worker or vendor-critical if excluded
      if (path.basename(jsFile) === 'sw.js') continue;

      const content = fs.readFileSync(jsFile, 'utf8');
      
      // Prevent duplicate injection
      if (content.includes('[BLA-COUNTER-REA:SHIELD')) {
        continue;
      }

      const poisonTop = generatePoisonPayload({ exhaustionLevel: 30, bloatBytes: 32 * 1024 });
      const poisonBottom = generatePoisonPayload({ exhaustionLevel: 20, bloatBytes: 16 * 1024 });

      // Wrap and sandwich the bundle
      const hardenedContent = `${poisonTop}\n${content}\n${poisonBottom}`;
      fs.writeFileSync(jsFile, hardenedContent, 'utf8');
      processedCount++;
    }
  }

  console.log(`[✓] Hardened ${processedCount} production JavaScript bundles with Counter-REA Shield.`);
  console.log('====================================================');
}

runHardening().catch(err => {
  console.error('[!] Hardening pipeline error:', err);
  process.exit(1);
});
