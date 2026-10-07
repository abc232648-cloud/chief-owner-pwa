import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync('src/api/client.ts', 'utf8');
const farm = fs.readFileSync('src/api/contracts/farm.ts', 'utf8');

test('HTTP error responses from configured Chief endpoint are marked Chief-origin', () => {
  const httpErrorBlock = client.slice(client.indexOf('if (!response.ok)'), client.indexOf('// Safe JSON decoding') > -1 ? client.indexOf('// Safe JSON decoding') : client.indexOf('let data: T'));
  assert.match(httpErrorBlock, /origin:\s*['"]chief['"]/);
});

test('transport timeout and network failures are not marked as Chief rejection', () => {
  const timeoutBlock = client.slice(client.indexOf('if (timeoutTriggered)'), client.indexOf('if (err instanceof ChiefApiError)'));
  assert.doesNotMatch(timeoutBlock, /origin:\s*['"]chief['"]/);
  const networkBlock = client.slice(client.indexOf('const networkError'), client.indexOf('public get<T>'));
  assert.doesNotMatch(networkBlock, /origin:\s*['"]chief['"]/);
});

test('farm client validation explicitly remains non-authoritative', () => {
  assert.match(farm, /origin:\s*['"]client['"]/);
  assert.match(farm, /No STOP decision was made by this client/);
});
