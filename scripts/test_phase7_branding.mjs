// Phase 7 Branding Migration Audit Test Suite
// Verifies that no active source, UI, component, API, metadata, or test file contains obsolete branding:
// "TerraAsk", "TerraMind", or "CycloneSense".

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const FORBIDDEN_TERMS = ['terraask', 'terramind', 'cyclonesense'];
const EXCLUDE_DIRS = new Set(['node_modules', '.next', '.git']);
const EXCLUDE_EXTS = new Set(['.lock', '.csv', '.tsbuildinfo']);

function scanDirectory(dir) {
  let fileList = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fileList = fileList.concat(scanDirectory(fullPath));
    } else {
      const ext = path.extname(entry.name);
      if (!EXCLUDE_EXTS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

async function runBrandingAudit() {
  console.log("=== PHASE 7 STEP 2: COMPLETE BRANDING MIGRATION AUDIT ===\n");

  const files = scanDirectory(ROOT_DIR);
  console.log(`Scanning ${files.length} active repository files for obsolete branding...`);

  const violations = [];

  for (const file of files) {
    // Skip this test script itself for term checking
    if (path.resolve(file) === path.resolve(__filename)) continue;

    const relPath = path.relative(ROOT_DIR, file);
    const content = fs.readFileSync(file, 'utf8');
    const lower = content.toLowerCase();

    for (const term of FORBIDDEN_TERMS) {
      if (lower.includes(term)) {
        // Find line numbers for precise reporting
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(term)) {
            violations.push({
              file: relPath,
              line: idx + 1,
              term,
              snippet: line.trim().slice(0, 100),
            });
          }
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(`\nFAILED: Found ${violations.length} obsolete branding occurrences in active files:`);
    for (const v of violations) {
      console.error(`  - [${v.file}:${v.line}] Found "${v.term}": "${v.snippet}"`);
    }
    throw new Error(`Obsolete branding audit failed with ${violations.length} violations.`);
  }

  console.log("PASS: Zero obsolete branding occurrences found across active files.");
  console.log("PASS: The product name is universally 'TerraTask' everywhere!\n");
  console.log(">>> PHASE 7 BRANDING AUDIT PASSED!\n");
}

runBrandingAudit().catch(err => {
  console.error("BRANDING AUDIT ERROR:", err);
  process.exit(1);
});
