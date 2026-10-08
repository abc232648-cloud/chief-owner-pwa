import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const app = read('src/App.tsx');
const screen = read('src/screens/JobAgentScreen.tsx');
const api = read('src/job/api.ts');
const push = read('src/job/push.ts');
const sw = read('public/sw.js');
const manifest = JSON.parse(read('public/manifest.webmanifest'));

test('Job PWA shell does not carry broad Chief operational providers or screens', () => {
  for (const forbidden of ['ChiefProvider', 'WorkerReportProvider', 'OfflineQueueProvider', 'AgentsScreen', 'FarmAgentModal', 'MoreScreen']) {
    assert.equal(app.includes(forbidden), false, `${forbidden} must not be mounted by Job PWA`);
  }
  assert.match(app, /JobAgentScreen/);
  assert.match(app, /AuthProvider/);
});

test('Job PWA reads only its dedicated sanitized feed and push endpoints', () => {
  assert.match(api, /\/api\/ui\/job-feed/);
  assert.match(api, /\/api\/job-pwa\/push-config/);
  assert.match(api, /\/api\/job-pwa\/push-subscriptions/);
  assert.match(api, /\/api\/job-pwa\/push-unsubscribe/);
  assert.doesNotMatch(api, /\/api\/applications\/.*retry|\/api\/actions\//);
});

test('foreground refresh is bounded and hidden tabs do not poll', () => {
  assert.match(screen, /30_000/);
  assert.match(screen, /document\.visibilityState === 'visible'/);
  assert.match(screen, /recent activity|Recent logs/i);
});

test('notification permission is requested only from explicit enable flow', () => {
  assert.match(push, /export async function enableJobPush/);
  const enableBody = push.slice(push.indexOf('export async function enableJobPush'), push.indexOf('export async function disableJobPush'));
  assert.match(enableBody, /Notification\.requestPermission\(\)/);
  assert.match(enableBody, /pushManager\.subscribe/);
  assert.match(enableBody, /userVisibleOnly:\s*true/);
});

test('service worker displays push but never trusts a payload navigation URL', () => {
  assert.match(sw, /addEventListener\('push'/);
  assert.match(sw, /showNotification/);
  assert.match(sw, /addEventListener\('notificationclick'/);
  assert.match(sw, /new URL\('\/#\/', self\.location\.origin\)/);
  assert.doesNotMatch(sw, /payload\.url/);
});

test('service worker still keeps all Chief API traffic network-only', () => {
  assert.match(sw, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw, /event\.respondWith\(fetch\(request\)\)/);
});

test('manifest has a distinct install identity for Job Agent', () => {
  assert.equal(manifest.id, '/job-agent');
  assert.equal(manifest.name, 'CHIEF Job Agent');
  assert.equal(manifest.short_name, 'Job Agent');
  assert.equal(manifest.display, 'standalone');
});
