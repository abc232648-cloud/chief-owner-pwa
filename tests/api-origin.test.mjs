import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync('src/api/client.ts', 'utf8');
const farm = fs.readFileSync('src/api/contracts/farm.ts', 'utf8');
const auth = fs.readFileSync('src/api/auth.ts', 'utf8');
const authContext = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
const login = fs.readFileSync('src/components/auth/LoginScreen.tsx', 'utf8');
const home = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');
const panel = fs.readFileSync('src/components/FarmOperationsPanel.tsx', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');

test('HTTP error responses from configured Chief endpoint are marked Chief-origin', () => {
  const httpErrorBlock = client.slice(client.indexOf('if (!response.ok)'), client.indexOf('let data: T'));
  assert.match(httpErrorBlock, /origin:\s*['"]chief['"]/);
});

test('transport timeout and network failures are not marked as Chief rejection', () => {
  const timeoutBlock = client.slice(client.indexOf('if (timeoutTriggered)'), client.indexOf('if (err instanceof ChiefApiError)'));
  assert.doesNotMatch(timeoutBlock, /origin:\s*['"]chief['"]/);
  const networkBlock = client.slice(client.indexOf('const networkError'), client.indexOf('public get<T>'));
  assert.doesNotMatch(networkBlock, /origin:\s*['"]chief['"]/);
});

test('current Chief same-origin routes bypass the retired api/v1 prefix and use cookie/CSRF authority', () => {
  assert.match(client, /endpoint\.startsWith\('\/api\/'\)/);
  assert.match(client, /credentials:\s*directChiefRoute \? 'include'/);
  assert.match(client, /X-Chief-CSRF/);
  assert.match(client, /CSRF_REQUIRED/);
  assert.match(auth, /'\/api\/auth\/login'/);
  assert.match(auth, /'\/api\/auth\/session'/);
  assert.match(auth, /credentials:\s*'include'/);
  assert.doesNotMatch(auth + login, /\/api\/v1\/auth/);
});

test('production Owner identity is granted only from Chief Owner or Administrator authority', () => {
  assert.match(authContext, /\['Owner', 'Administrator'\]\.includes\(principal\.role\)/);
  assert.match(authContext, /OWNER_ROLE_REQUIRED/);
  assert.match(authContext, /isSimulated:\s*false/);
  assert.match(login, /Chief username/);
  assert.match(app, /status === 'unauthorized'/);
});

test('Owner Farm adapter consumes authoritative task incident and worker-report ledgers', () => {
  assert.match(farm, /'\/api\/farm\/tasks'/);
  assert.match(farm, /'\/api\/farm\/incidents'/);
  assert.match(farm, /'\/api\/farm\/worker-reports'/);
  assert.match(panel, /chiefApi\.farm\.getTasks/);
  assert.match(panel, /chiefApi\.farm\.getIncidents/);
  assert.match(panel, /chiefApi\.farm\.getWorkerReports/);
  assert.match(panel, /Requires Owner awareness/);
  assert.match(home, /<FarmOperationsPanel \/>/);
});

test('legacy Owner worker-report transport fails closed instead of fabricating current Chief evidence', () => {
  assert.match(farm, /OWNER_FIELD_REPORT_BLOCKED/);
  assert.match(farm, /origin:\s*['"]client['"]/);
  assert.doesNotMatch(farm, /client\.post\(['"]\/farm\/worker-reports/);
  assert.match(home, /onWorkerReport=\{isDevMode \?/);
});
