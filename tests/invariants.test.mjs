import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const files = {
  index: read('index.html'),
  devMode: read('src/config/devMode.ts'),
  sw: read('public/sw.js'),
  swRegistration: read('src/serviceWorkerRegistration.ts'),
  schema: read('src/storage/schema.ts'),
  idb: read('src/storage/idb.ts'),
  storage: read('src/storage/index.ts'),
  migrations: read('src/storage/migrations.ts'),
  readCache: read('src/api/cache/readCache.ts'),
  apiClient: read('src/api/client.ts'),
  workerReports: read('src/context/WorkerReportContext.tsx'),
  offlineQueue: read('src/context/OfflineQueueContext.tsx'),
  chiefStatus: read('src/components/ChiefStatusCard.tsx'),
  systemDetails: read('src/components/SystemDetailsModal.tsx'),
  moreScreen: read('src/screens/MoreScreen.tsx'),
  agentsScreen: read('src/screens/AgentsScreen.tsx'),
  jobModal: read('src/components/JobAgentModal.tsx'),
  farmModal: read('src/components/FarmAgentModal.tsx'),
  queueModal: read('src/components/queue/OfflineQueueModal.tsx'),
  pwaBanner: read('src/components/ui/PWAInstallBanner.tsx'),
  packageJson: read('package.json')
};

test('DEV mode is build-environment controlled only', () => {
  assert.match(files.devMode, /VITE_CHIEF_DEV_MODE\s*===\s*['"]true['"]/);
  assert.doesNotMatch(files.devMode, /location\.search|URLSearchParams|localStorage\.getItem|sessionStorage\.getItem/);
});

test('mobile viewport permits user zoom and has no external Google Fonts', () => {
  assert.doesNotMatch(files.index, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.doesNotMatch(files.index, /fonts\.googleapis\.com|fonts\.gstatic\.com/i);
  assert.match(files.index, /Content-Security-Policy/i);
  assert.match(files.index, /name="referrer" content="no-referrer"/i);
});

test('service worker never treats Chief API or mutations as cacheable shell traffic', () => {
  assert.match(files.sw, /url\.pathname\.startsWith\(['"]\/api\//);
  assert.match(files.sw, /request\.method\s*!==\s*['"]GET['"]/);
  assert.match(files.sw, /event\.respondWith\(fetch\(request\)\)/);
  const installHandler = files.sw.slice(files.sw.indexOf("addEventListener('install'"), files.sw.indexOf("addEventListener('activate'"));
  assert.doesNotMatch(installHandler, /skipWaiting/);
});

test('DEV does not register the production service worker', () => {
  assert.match(files.swRegistration, /if\s*\(isChiefDevMode\(\)\)/);
  assert.match(files.swRegistration, /unregister\(\)/);
  assert.match(files.swRegistration, /chief-static-/);
});

test('storage uses stable physical DB names and user-scoped compound keys', () => {
  assert.match(files.schema, /STORAGE_SCHEMA_VERSION\s*=\s*4/);
  assert.match(files.schema, /chief_storage_\$\{environment\.toLowerCase\(\)\}/);
  assert.doesNotMatch(files.schema, /chief_storage_\$\{environment\.toLowerCase\(\)\}_v\$\{/);
  assert.match(files.idb, /keyPath:\s*\['userNamespace',\s*'id'\]/);
  assert.match(files.storage, /loadedQueueNamespaces/);
  assert.match(files.storage, /loadedReportNamespaces/);
  assert.match(files.storage, /Queue ownership mismatch/);
  assert.match(files.storage, /Report ownership mismatch/);
});

test('legacy migration is two-phase, collision-safe and fail-closed', () => {
  assert.match(files.migrations, /legacyQuarantineNamespace/);
  assert.match(files.migrations, /unauthenticated-legacy:\$\{source\}/);
  assert.match(files.migrations, /Malformed legacy queue record has no stable ID|stable ID/i);
  assert.match(files.migrations, /Migration failed/i);
  assert.match(files.migrations, /deleteDatabase/);
});

test('Chief read cache is user namespaced and session-scoped', () => {
  assert.match(files.readCache, /activeUserNamespace/);
  assert.match(files.readCache, /clearLiveCache\(\)/);
  assert.match(files.readCache, /sessionStorage/);
  assert.doesNotMatch(files.readCache, /localStorage/);
});

test('API mutations are non-idempotent and cannot be automatically retried', () => {
  assert.match(files.apiClient, /post<[\s\S]*?isIdempotent:\s*false/);
  assert.match(files.apiClient, /put<[\s\S]*?isIdempotent:\s*false/);
  assert.match(files.apiClient, /delete<[\s\S]*?isIdempotent:\s*false/);
});

test('worker reports strip inferred authority fields before persistence or submission', () => {
  assert.match(files.workerReports, /delete data\.flockId/);
  assert.match(files.workerReports, /delete data\.immediateInterlockNeeded/);
  assert.match(files.workerReports, /delete data\.physicalInterlockTripped/);
  assert.match(files.workerReports, /delete data\.requiresSupervisorDispatch/);
  assert.match(files.workerReports, /LOCAL-\$\{now\.toISOString/);
  assert.match(files.workerReports, /err\.origin !== 'chief'/);
});

test('queued worker reports use sanitized report data and positive acceptance proof', () => {
  assert.match(files.offlineQueue, /payload:\s*options\.reportPayload\?\.data\s*\?\?\s*options\.payload/);
  assert.match(files.offlineQueue, /err\.origin !== 'chief'/);
  assert.match(files.offlineQueue, /response\.data\.status !== 'accepted'/);
  assert.match(files.offlineQueue, /!response\.data\.verificationHash/);
  assert.match(files.offlineQueue, /Conflict remains unresolved; no Chief reconciliation occurred/);
});

test('production-facing status surfaces do not contain retired authority overclaims', () => {
  const combined = [
    files.chiefStatus,
    files.systemDetails,
    files.moreScreen,
    files.agentsScreen,
    files.jobModal,
    files.farmModal,
    files.queueModal,
    files.pwaBanner
  ].join('\n');
  for (const forbidden of [
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
    assert.equal(combined.includes(forbidden), false, `retired overclaim remains: ${forbidden}`);
  }
});

test('Job and Farm fixtures remain explicitly DEV-only in their domain modals', () => {
  assert.match(files.jobModal, /const opportunities = isDevMode \? JOB_OPPORTUNITIES : \[\]/);
  assert.match(files.jobModal, /Development fixtures — not user data/);
  assert.match(files.farmModal, /DEVELOPMENT FIXTURES/);
  assert.match(files.farmModal, /Synthetic fixtures are not substituted/);
});

test('Gemini/model runtime SDKs are absent from the application package manifest', () => {
  const pkg = JSON.parse(files.packageJson);
  const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  for (const dependency of ['@google/genai', 'openai', '@anthropic-ai/sdk', 'dotenv', 'express', 'tsx']) {
    assert.equal(Object.hasOwn(all, dependency), false, `${dependency} must not be a mobile runtime dependency`);
  }
});
