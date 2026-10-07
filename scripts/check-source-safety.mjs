#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

function fail(condition, message) {
  if (condition) failures.push(message);
}

function collectFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.(ts|tsx|js|jsx|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sourceFiles = collectFiles(path.join(root, 'src'));
const sourceText = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const index = read('index.html');
const packageJson = JSON.parse(read('package.json'));

fail(/dangerouslySetInnerHTML/.test(sourceText), 'dangerouslySetInnerHTML is prohibited in the mobile client.');
fail(/\beval\s*\(/.test(sourceText), 'eval() is prohibited in the mobile client.');
fail(/new\s+Function\s*\(/.test(sourceText), 'new Function() is prohibited in the mobile client.');
fail(/javascript\s*:/i.test(sourceText), 'javascript: URLs are prohibited.');
fail(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(index), 'Viewport must not disable pinch zoom.');
fail(/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(index), 'External Google Fonts are prohibited.');

const manifestDeps = { ...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {}) };
for (const dependency of ['@google/genai', 'openai', '@anthropic-ai/sdk', 'dotenv', 'express', 'tsx']) {
  fail(Object.hasOwn(manifestDeps, dependency), `Forbidden/unused runtime dependency present: ${dependency}`);
}

const statusSurfaceFiles = [
  'src/components/ChiefStatusCard.tsx',
  'src/components/SystemDetailsModal.tsx',
  'src/components/SecurityComplianceBadge.tsx',
  'src/components/JobAgentModal.tsx',
  'src/components/FarmAgentModal.tsx',
  'src/components/queue/OfflineQueueModal.tsx',
  'src/components/ui/PWAInstallBanner.tsx',
  'src/screens/AgentsScreen.tsx',
  'src/screens/MoreScreen.tsx'
];
const statusText = statusSurfaceFiles.map(read).join('\n');
for (const wording of [
  '99.98%',
  'Verified Live Telemetry',
  'Authoritative state verified',
  'Handshake Verified',
  'Policy-Enforced',
  'Direct signed telemetry',
  'Authoritative Pipeline Telemetry',
  'Chief policy authority verified',
  'Authoritative local cache',
  'Direct synchronization loop to Chief Central Policy Engine active',
  'full offline snapshot support'
]) {
  fail(statusText.includes(wording), `Retired authority overclaim remains: ${wording}`);
}

if (failures.length) {
  console.error('CHIEF source-safety lint failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`CHIEF source-safety lint passed (${sourceFiles.length} source files scanned).`);
