import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleOutreach } from '../cloudflare/outreach.js';
function d1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    _exec: () => (/^\s*(SELECT|WITH)/i.test(sql) || /RETURNING/i.test(sql)
      ? { results: db.prepare(sql).all(...args) } : (db.prepare(sql).run(...args), { results: [] })),
  });
  return { raw: db, prepare: sql => stmt(sql), batch: async list => list.map(s => s._exec()) };
}


const admin = { email: 'owner@example.com' };
const lead = { member: 'example-member', community: 'Example community', source: 'https://example.com/request', request: 'Looking for a symptom tracker', stage: 'New', contacted: '', followup: '', notes: '' };
function req(method, body, origin = 'https://wellnest.services') { return new Request('https://wellnest.services/api/outreach/leads', { method, headers: { Origin: origin, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
test('admin-only persistent leads, updates, conflict protection and deletion', async () => {
 const env = { DB: d1(), ADMIN_EMAILS: admin.email };
 assert.equal((await handleOutreach(req('GET'), env, null)).status, 401);
 assert.equal((await handleOutreach(req('GET'), env, { email: 'other@example.com' })).status, 403);
 assert.equal((await handleOutreach(req('POST', lead, 'https://evil.example'), env, admin)).status, 403);
 const response = await handleOutreach(req('POST', lead), env, admin); assert.equal(response.status, 201);
 const saved = await response.json();
 assert.equal((await (await handleOutreach(req('GET'), env, admin)).json()).items[0].member, lead.member);
 const update = { ...saved, stage: 'Contacted', contacted: '2026-11-16' };
 const updated = await (await handleOutreach(req('PUT', update), env, admin)).json(); assert.equal(updated.version, 2);
 assert.equal((await handleOutreach(req('PUT', update), env, admin)).status, 409);
 assert.equal((await handleOutreach(req('DELETE', saved), env, admin)).status, 409);
 assert.equal((await handleOutreach(req('DELETE', updated), env, admin)).status, 200);
 assert.equal((await (await handleOutreach(req('GET'), env, admin)).json()).items.length, 0);
});
test('rejects unsafe links, invalid stages, dates and malformed input', async () => {
 const env = { DB: d1(), ADMIN_EMAILS: admin.email };
 for (const input of [null, [], { ...lead, source: 'javascript:alert(1)' }, { ...lead, stage: 'bad' }, { ...lead, contacted: '2026-02-30' }, { ...lead, member: '' }]) {
  assert.equal((await handleOutreach(req('POST', input), env, admin)).status, 400);
 }
});
