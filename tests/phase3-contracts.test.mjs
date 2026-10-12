import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const system = read('src/api/contracts/system.ts');
const agents = read('src/api/contracts/agents.ts');
const attention = read('src/api/contracts/attention.ts');
const activity = read('src/api/contracts/activity.ts');

test('Owner production adapters use current Chief presentation contracts', () => {
  assert.match(system, /\/api\/ui\/overview/);
  assert.match(agents, /\/api\/ui\/overview/);
  assert.match(attention, /\/api\/device-notifications\/owner\/feed/);
  assert.match(activity, /\/api\/ui\/activity/);

  const combined = [system, agents, attention, activity].join('\n');
  for (const retired of ['/system/status', '/system/health', "'/agents'", "'/attention'", '`/activity']) {
    assert.equal(combined.includes(retired), false, `retired Owner route remains: ${retired}`);
  }
});

test('generic attention contract cannot manufacture action authority', () => {
  assert.doesNotMatch(attention, /client\.post\(/);
  assert.match(attention, /presentation-only/i);
  assert.match(attention, /domain-owned action surface/i);
});

test('unknown system values remain explicit rather than fabricated', () => {
  assert.match(system, /platform_state:\s*'Unknown'/);
  assert.match(system, /policy_engine:\s*'Unknown'/);
  assert.match(system, /uptime:\s*'Not reported'/);
  assert.match(system, /healthScore:\s*null/);
});
