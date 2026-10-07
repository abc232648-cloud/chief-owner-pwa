#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const failures = [];
const required = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icon.svg',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-512x512-maskable.png',
  'apple-touch-icon.png'
];

function fail(condition, message) {
  if (condition) failures.push(message);
}

fail(!fs.existsSync(dist), 'dist/ does not exist. Run the production build first.');

if (fs.existsSync(dist)) {
  for (const relative of required) {
    const target = path.join(dist, relative);
    fail(!fs.existsSync(target) || fs.statSync(target).size === 0, `Missing or empty release asset: dist/${relative}`);
  }

  const indexPath = path.join(dist, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    fail(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(html), 'Built index disables user zoom.');
    fail(/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(html), 'Built index references external Google Fonts.');
    fail(!/Content-Security-Policy/i.test(html), 'Built index is missing the baseline CSP meta policy.');
  }

  const manifestPath = path.join(dist, 'manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      fail(!manifest.name || !manifest.short_name, 'PWA manifest is missing name/short_name.');
      fail(manifest.display !== 'standalone', 'PWA manifest display must be standalone.');
      fail(!Array.isArray(manifest.icons) || manifest.icons.length < 2, 'PWA manifest must declare install icons.');
      for (const icon of manifest.icons || []) {
        const iconPath = path.join(dist, String(icon.src || '').replace(/^\//, ''));
        fail(!icon.src || !fs.existsSync(iconPath), `Manifest icon does not exist in dist: ${icon.src || '<missing src>'}`);
      }
    } catch (error) {
      failures.push(`PWA manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const assetDir = path.join(dist, 'assets');
  fail(!fs.existsSync(assetDir), 'Production build has no dist/assets directory.');
  if (fs.existsSync(assetDir)) {
    const bundles = fs.readdirSync(assetDir).filter(name => /\.(js|css)$/.test(name));
    fail(bundles.length === 0, 'Production build emitted no JS/CSS assets.');
    const bundleText = bundles
      .filter(name => name.endsWith('.js'))
      .map(name => fs.readFileSync(path.join(assetDir, name), 'utf8'))
      .join('\n');
    for (const forbidden of ['@google/genai', 'VITE_GEMINI_API_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']) {
      fail(bundleText.includes(forbidden), `Built JS contains forbidden model/secret marker: ${forbidden}`);
    }
  }

  const swPath = path.join(dist, 'sw.js');
  if (fs.existsSync(swPath)) {
    const sw = fs.readFileSync(swPath, 'utf8');
    fail(!/url\.pathname\.startsWith\(['"]\/api\//.test(sw), 'Release service worker lacks explicit API network-only bypass.');
    fail(!/request\.method\s*!==\s*['"]GET['"]/.test(sw), 'Release service worker lacks mutation network-only bypass.');
  }
}

if (failures.length) {
  console.error('CHIEF release smoke check failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('CHIEF release smoke check passed. Static shell, manifest, service worker and release assets are internally consistent.');
