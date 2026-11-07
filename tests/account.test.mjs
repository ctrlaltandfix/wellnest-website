import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(readFileSync(new URL('../netlify/functions/account.mts', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '')
  .replace('export default', 'return')
  .replace(/export const config[\s\S]*$/, '');

function setup(identity, rows = [], inserted = [], fail = false) {
  const calls = [];
  let released = false;
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT *')) return { rows };
      if (sql.includes('INSERT INTO')) {
        if (fail) throw Error('database unavailable');
        return { rows: inserted };
      }
      return { rows: [] };
    },
    release() { released = true; },
  };
  const handler = new Function('getUser', 'getDatabase', source)(
    async () => identity,
    () => ({ pool: { connect: async () => client } }),
  );
  return { handler, calls, released: () => released };
}
const verified = { id: 'identity-1', email: 'member@example.test', confirmedAt: '2026-01-01', name: 'Member' };
const account = { id: 'original-id', email: verified.email, role: 'user', full_name: 'Member', data: { subscription_tier: 'premium', id: 'spoofed', role: 'admin' } };
const request = () => new Request('https://wellnest.services/api/auth/me');

test('unauthenticated sessions are rejected before database access', async () => {
  const { handler, calls } = setup(null);
  const response = await handler(request());
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
  assert.match(response.headers.get('cache-control'), /no-store/);
});
test('existing account keeps its ID, privileges, and subscription', async () => {
  const mock = setup(verified, [account]);
  const response = await mock.handler(request());
  const body = await response.json();
  assert.equal(body.id, 'original-id');
  assert.equal(body.role, 'user');
  assert.equal(body.subscription_tier, 'premium');
  assert.ok(mock.calls.some(c => c.sql === 'SET LOCAL ROLE wellnest_runtime'));
  assert.ok(mock.calls.some(c => c.sql === 'COMMIT'));
  assert.equal(mock.released(), true);
});
test('verified provider account can link an imported profile', async () => {
  const mock = setup(verified, [], [account]);
  assert.equal((await mock.handler(request())).status, 200);
  const insert = mock.calls.find(c => c.sql.includes('INSERT INTO'));
  assert.deepEqual(insert.params, [verified.id, verified.email, verified.name]);
  assert.match(insert.sql, /auth_id IS NULL OR/);
});
test('unconfirmed identity cannot claim an imported account', async () => {
  const mock = setup({ ...verified, confirmedAt: undefined });
  assert.equal((await mock.handler(request())).status, 403);
  assert.ok(!mock.calls.some(c => c.sql.includes('INSERT INTO')));
  assert.ok(mock.calls.some(c => c.sql === 'ROLLBACK'));
});
test('conflicting identity is rejected', async () => {
  const mock = setup(verified);
  assert.equal((await mock.handler(request())).status, 409);
  assert.equal(mock.released(), true);
});
test('database failures roll back and return a safe error', async () => {
  const mock = setup(verified, [], [], true);
  const response = await mock.handler(request());
  assert.equal(response.status, 503);
  assert.ok(mock.calls.some(c => c.sql === 'ROLLBACK'));
  assert.equal(mock.released(), true);
});
test('unsupported methods cannot mutate profiles', async () => {
  const mock = setup(verified);
  assert.equal((await mock.handler(new Request(request(), { method: 'PATCH' }))).status, 405);
  assert.equal(mock.calls.length, 0);
});
