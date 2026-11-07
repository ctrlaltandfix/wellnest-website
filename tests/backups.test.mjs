import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(readFileSync(new URL('../netlify/functions/backups.mts', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replace('export default', 'return').replace(/export const config[\s\S]*$/, '');
const row = { id: 'backup-1', owner_id: 'imported-account', data: { backup_key: 'wellnest-local-data', data: { local_data: { pain: [{ id: 'pain-1' }] } } } };
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
const request = (suffix = '', method = 'GET', body) => new Request('https://wellnest.services/api/entities/CloudDataBackup' + suffix, { method, ...(body ? { body: JSON.stringify(body) } : {}) });

test('backup listing returns the JSON contract expected by sync', async () => {
  const mock = setup();
  const response = await mock.handler(request('?filter=' + encodeURIComponent(JSON.stringify({ backup_key: 'wellnest-local-data', created_by_id: 'imported-account' }))));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.items[0].created_by_id, 'imported-account');
  assert.deepEqual(body.items[0].data.local_data.pain, [{ id: 'pain-1' }]);
  const query = mock.calls.find(c => c.sql.includes('FROM wellnest_records'));
  assert.deepEqual(query.params.slice(0, 3), ['imported-account', 'wellnest-local-data', 'imported-account']);
  assert.ok(mock.calls.some(c => c.sql === 'SET LOCAL ROLE wellnest_runtime'));
  assert.ok(mock.calls.some(c => c.sql.includes("'wellnest.user_id'") && c.params[0] === 'imported-account'));
  assert.equal(mock.released(), true);
});
test('unauthenticated sync never queries the database', async () => {
  const mock = setup({ identity: null });
  assert.equal((await mock.handler(request())).status, 401);
  assert.equal(mock.calls.length, 0);
});
test('creation uses server ownership and preserves nested backup data', async () => {
  const mock = setup();
  const response = await mock.handler(request('', 'POST', { ...row.data, id: 'forged', owner_id: 'other', created_by_id: 'other' }));
  assert.equal(response.status, 201);
  const insert = mock.calls.find(c => c.sql.startsWith('INSERT'));
  assert.deepEqual(insert.params, ['generated-id', 'imported-account', JSON.stringify(row.data)]);
});
test('updates are scoped to the authenticated owner and merge existing fields', async () => {
  const mock = setup();
  assert.equal((await mock.handler(request('/backup-1', 'PATCH', row.data))).status, 200);
  const update = mock.calls.find(c => c.sql.startsWith('UPDATE'));
  assert.match(update.sql, /owner_id = \$2/);
  assert.match(update.sql, /data = data \|\|/);
  assert.equal(update.params[1], 'imported-account');
});
test('inaccessible backup cannot be read, updated, or deleted', async () => {
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
