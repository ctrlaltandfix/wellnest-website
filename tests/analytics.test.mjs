// Site statistics: collecting page views and the admin-only stats endpoint,
// run against an in-memory SQLite database that behaves like D1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handleCollect, handleStats, cleanPath, sourceOf, deviceOf, isAnalyticsAdmin } from '../cloudflare/analytics.js';
import { ensureSchema } from '../cloudflare/lib.js';

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

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
function beacon(body, { ip = '1.2.3.4', ua = UA, country = 'AU' } = {}) {
  const r = new Request('https://wellnest.services/api/analytics/collect', {
    method: 'POST', body: JSON.stringify(body),
    headers: { 'User-Agent': ua, 'CF-Connecting-IP': ip, 'Content-Type': 'text/plain' },
  });
  Object.defineProperty(r, 'cf', { value: { country } });
  return r;
}

test('helpers', () => {
  assert.equal(cleanPath('/about.html?x=1#y'), '/about');
  assert.equal(cleanPath('/guides/'), '/guides');
  assert.equal(cleanPath('/index.html'), '/');
  assert.equal(cleanPath('https://evil.example/'), null);
  assert.equal(sourceOf('https://www.google.com.au/', '', 'wellnest.services'), 'google');
  assert.equal(sourceOf('https://wellnest.services/about', '', 'wellnest.services'), null);
  assert.equal(sourceOf('', '', 'wellnest.services'), 'Direct');
  assert.equal(sourceOf('', 'Newsletter', 'wellnest.services'), 'newsletter');
  assert.equal(deviceOf(UA), 'Mobile');
  assert.equal(isAnalyticsAdmin({ ADMIN_EMAILS: 'Me@Example.com, x@y.z' }, { email: 'me@example.com', role: 'user' }), true);
  assert.equal(isAnalyticsAdmin({}, { email: 'me@example.com', role: 'user' }), false);
});

test('collects views and time on page, then reports them to an admin only', async () => {
  const env = { DB: d1(), ADMIN_EMAILS: 'owner@example.com' };
  await ensureSchema(env);

  // Visitor A (Australia): home from Google, then /pricing for 95s. Visitor B (US): one bounce.
  assert.equal((await handleCollect(beacon({ t: 'v', id: 'view-a1-xxxx', s: 'sess-a-xxxx', p: '/', r: 'https://www.google.com/' }), env)).status, 204);
  await handleCollect(beacon({ t: 'l', id: 'view-a1-xxxx', d: 20 }), env);
  await handleCollect(beacon({ t: 'v', id: 'view-a2-xxxx', s: 'sess-a-xxxx', p: '/pricing.html', r: 'https://wellnest.services/' }), env);
  await handleCollect(beacon({ t: 'l', id: 'view-a2-xxxx', d: 95 }), env);
  await handleCollect(beacon({ t: 'l', id: 'view-a2-xxxx', d: 40 }), env); // a smaller, late report never lowers it
  await handleCollect(beacon({ t: 'v', id: 'view-b1-xxxx', s: 'sess-b-xxxx', p: '/', r: '', u: 'facebook', c: 'Spring' }, { ip: '9.9.9.9', country: 'US' }), env);
  // Bots are ignored.
  await handleCollect(beacon({ t: 'v', id: 'view-bot-xxx', s: 'sess-bot-xx', p: '/' }, { ua: 'Googlebot/2.1' }), env);

  const rows = env.DB.raw.prepare('SELECT * FROM page_views ORDER BY id').all();
  assert.equal(rows.length, 3);
  assert.ok(rows.every(r => !JSON.stringify(r).includes('1.2.3.4')), 'no IP address stored');

  const ask = () => new Request('https://wellnest.services/api/analytics/stats?days=7&tz=660');
  assert.equal((await handleStats(ask(), env, { email: 'someone@else.com', role: 'user' })).status, 403);

  const res = await handleStats(ask(), env, { email: 'owner@example.com', role: 'user' });
  assert.equal(res.status, 200);
  const s = await res.json();
  assert.equal(s.totals.views, 3);
  assert.equal(s.totals.visitors, 2);
  assert.equal(s.totals.sessions, 2);
  assert.equal(s.totals.avg_session_seconds, 57.5); // (20 + 95 + 0) / 2 sessions
  assert.equal(s.totals.bounce_rate, 50);
  assert.equal(s.live, 2);
  assert.deepEqual(s.countries.map(c => c.name).sort(), ['AU', 'US']);
  assert.deepEqual(s.pages.map(p => p.name), ['/', '/pricing']);
  assert.equal(s.pages[1].avg_seconds, 95);
  assert.deepEqual(s.sources.map(x => x.name).sort(), ['facebook', 'google']);
  assert.deepEqual(s.campaigns.map(x => x.name), ['spring']);
  assert.equal(s.series.length, 1);
  assert.equal(s.series[0].t % 3600000, 0); // daily buckets line up with Sydney midnight (UTC+11 is a whole hour)
});
