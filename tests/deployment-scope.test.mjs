import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const vite = read('vite.config.ts');
const register = read('src/serviceWorkerRegistration.ts');
const sw = read('public/sw.js');
const html = read('index.html');

test('Owner build and install surface are rooted at /owner/', () => {
  assert.match(vite, /base:\s*['"]\/owner\/['"]/);
  assert.equal(manifest.id, '/owner/');
  assert.equal(manifest.start_url, '/owner/');
  assert.equal(manifest.scope, '/owner/');
  assert.ok(manifest.icons.every(icon => String(icon.src).startsWith('/owner/')));
  assert.match(html, /%BASE_URL%manifest\.webmanifest/);
  assert.match(html, /%BASE_URL%apple-touch-icon\.png/);
});

test('Owner worker is registered from the Vite base and cannot claim root', () => {
  assert.match(register, /import\.meta\.env\.BASE_URL/);
  assert.match(register, /base !== ['"]\/owner\/['"]/);
  assert.match(register, /register\(`\$\{base\}sw\.js`, \{ scope: base \}\)/);
  assert.doesNotMatch(register, /register\(['"]\/sw\.js['"]/);
  assert.match(register, /scopePath === ['"]\/['"]/);
  assert.match(register, /script\.endsWith\(['"]\/sw\.js['"]\)/);
});

test('Owner worker refuses API and non-Owner paths', () => {
  assert.match(sw, /url\.pathname\.startsWith\(['"]\/api\//);
  assert.match(sw, /request\.method\s*!==\s*['"]GET['"]/);
  assert.match(sw, /SCOPE_PATH/);
  assert.match(sw, /url\.pathname\.startsWith\(`\$\{SCOPE_PATH\}\/`\)/);
});
