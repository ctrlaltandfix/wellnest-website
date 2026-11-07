import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(readFileSync(new URL('../netlify/functions/expenses.mts', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replace('export default', 'return').replace(/export const config[\s\S]*$/, '');
const row = { id: 'expense-1', owner_id: 'imported-account', data: { legacy_id: 'local-1', description: 'Consultation', amount: 85 } };
function setup({ identity = { id: 'identity-1' }, found = true, fail = false } = {}) {
  const calls = [];
  let released = false;
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT id FROM')) return { rows: [{ id: 'imported-account' }] };
      if (sql.includes('wellnest_records')) {
        if (fail) throw Error('unavailable');
        return { rows: found ? [row] : [] };
      }
      return { rows: [] };
    },
    release() { released = true; },
  };
  return { calls, released: () => released, handler: new Function('getUser', 'getDatabase', 'randomUUID', source)(async () => identity, () => ({ pool: { connect: async () => client } }), () => 'generated-id') };
}
const request = (suffix = '', method = 'GET', body) => new Request('https://wellnest.services/api/entities/Expense' + suffix, { method, ...(body ? { body: JSON.stringify(body) } : {}) });

test('expense listing returns the browser contract and account scope', async () => {
  const mock = setup();
  const response = await mock.handler(request('?filter=' + encodeURIComponent(JSON.stringify({ legacy_id: 'local-1', created_by_id: 'imported-account' }))));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.items[0].created_by_id, 'imported-account');
  assert.equal(body.items[0].description, 'Consultation');
  const query = mock.calls.find(c => c.sql.includes('FROM wellnest_records'));
  assert.deepEqual(query.params, ['Expense', 'imported-account', 'imported-account', JSON.stringify({ legacy_id: 'local-1' }), 100, 0]);
  assert.ok(mock.calls.some(c => c.sql === 'SET LOCAL ROLE wellnest_runtime'));
  assert.ok(mock.calls.some(c => c.sql.includes("'wellnest.user_id'") && c.params[0] === 'imported-account'));
  assert.equal(mock.released(), true);
});
test('unauthenticated requests never queries the database', async () => {
  const mock = setup({ identity: null });
  assert.equal((await mock.handler(request())).status, 401);
  assert.equal(mock.calls.length, 0);
});
test('creation uses server ownership and preserves expense data', async () => {
  const mock = setup();
  const response = await mock.handler(request('', 'POST', { ...row.data, id: 'forged', owner_id: 'other', created_by_id: 'other' }));
  assert.equal(response.status, 201);
  const insert = mock.calls.find(c => c.sql.startsWith('INSERT'));
  assert.deepEqual(insert.params, ['generated-id', 'imported-account', JSON.stringify(row.data)]);
});
test('updates are scoped to the authenticated owner and merge existing fields', async () => {
  const mock = setup();
  assert.equal((await mock.handler(request('/expense-1', 'PATCH', row.data))).status, 200);
  const update = mock.calls.find(c => c.sql.startsWith('UPDATE'));
  assert.match(update.sql, /owner_id = \$2/);
  assert.match(update.sql, /data = data \|\|/);
  assert.equal(update.params[1], 'imported-account');
});
test('inaccessible expense cannot be read, updated, or deleted', async () => {
  for (const method of ['GET', 'PATCH', 'DELETE']) {
    const mock = setup({ found: false });
    assert.equal((await mock.handler(request('/another-users-backup', method, method === 'PATCH' ? {} : undefined))).status, 404);
    assert.ok(mock.calls.some(c => c.sql === 'ROLLBACK'));
  }
});
test('database failures retain retryable error and release the connection', async () => {
  const mock = setup({ fail: true });
  assert.equal((await mock.handler(request())).status, 503);
  assert.ok(mock.calls.some(c => c.sql === 'ROLLBACK'));
  assert.equal(mock.released(), true);
});
test('malformed filters and bodies are rejected', async () => {
  const mock = setup();
  assert.equal((await mock.handler(request('?filter=null'))).status, 400);
  assert.equal((await mock.handler(request('', 'POST', []))).status, 400);
  assert.equal(mock.calls.length, 0);
});

test('work documents load with the page limit and requested ordering', async () => {
  const mock = setup();
  const response = await mock.handler(new Request('https://wellnest.services/api/entities/WorkDocument?sort=-updated_date&limit=2000'));
  assert.equal(response.status, 200);
  const query = mock.calls.find(c => c.sql.includes('FROM wellnest_records'));
  assert.equal(query.params[0], 'WorkDocument');
  assert.equal(query.params[4], 2000);
  assert.match(query.sql, /ORDER BY updated_date DESC, id/);
});
test('unsupported entities and unsafe sorting cannot reach record queries', async () => {
  const mock = setup();
  assert.equal((await mock.handler(new Request('https://wellnest.services/api/entities/User'))).status, 404);
  assert.equal((await mock.handler(request('?sort=invalid'))).status, 400);
  assert.equal(mock.calls.filter(c => c.sql.includes('wellnest_records')).length, 0);
});
test('empty accounts return a successful empty list', async () => {
  const mock = setup({ found: false });
  const response = await mock.handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { items: [], next_cursor: null });
});
