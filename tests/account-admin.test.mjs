import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { handleAccountAdmin } from '../cloudflare/account-admin.js';

const origin = 'https://wellnest.services';
const endpoint = origin + '/api/admin/accounts';
const admin = { id: 'site-admin', role: 'admin' };

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, full_name TEXT, provider TEXT, role TEXT,
      created_date TEXT, confirmed_at TEXT, data TEXT, updated_date TEXT);
    CREATE TABLE subscriptions (user_id TEXT, customer_id TEXT, subscription_id TEXT, status TEXT,
      plan TEXT, current_period_end INTEGER, cancel_at_period_end INTEGER);
  `);
  const date = '2026-11-16';
  const insert = db.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  for (let i = 0; i <= 25; i++) {
    const id = String(i).padStart(2, '0');
    insert.run(id, `person${id}@example.test`, i === 25 ? 'Sam Example' : '', 'email', 'user', date, i ? date : null, '{"subscription_tier":"free"}', date);
  }
  insert.run(admin.id, 'admin@example.test', '', 'google', 'admin', date, date, '{}', date);
  db.prepare('INSERT INTO subscriptions VALUES (?, ?, ?, ?, ?, ?, ?)').run('25', 'cus_ABC', 'sub_ABC', 'active', 'yearly', 1790000000000, 1);
  const env = {
    STRIPE_SECRET_KEY: 'sk_test_fixture',
    DB: {
      prepare(sql) {
        return { bind: (...args) => ({ all: async () => ({ results: db.prepare(sql).all(...args) }), first: async () => db.prepare(sql).get(...args), run: () => db.prepare(sql).run(...args) }), run: async () => db.prepare(sql).run() };
      },
      async batch(statements) {
        db.exec('BEGIN');
        try {
          statements.forEach(statement => statement.run());
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    },
  };
  const services = { isAdmin: async (_, user) => user?.role === 'admin', ensureBilling: async () => {}, stripe: () => { throw Error('Unexpected Stripe call'); } };
  return { db, env, services, request: (search = '', options, user = admin) => handleAccountAdmin(new Request(endpoint + search, options), env, user, services) };
}

test('account list enforces admin access, projects allowed fields and uses stable pagination', async () => {
  const { request } = fixture();
  assert.equal((await request('', {}, { role: 'user' })).status, 403);
  const response = await request();
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const first = await response.json();
  assert.equal(first.accounts.length, 25);
  assert.ok(first.next);
  const rest = await (await request('?after=' + encodeURIComponent(first.next))).json();
  assert.deepEqual(rest.accounts.map(account => account.id), ['01', '00']);
  const { accounts: [account] } = await (await request('?q=cus_ABC')).json();
  assert.equal(account.email, 'person25@example.test');
  assert.equal(account.billing.subscriptionUrl, 'https://dashboard.stripe.com/test/subscriptions/sub_ABC');
  assert.equal(account.billing.ending, true);
  assert.equal(Object.hasOwn(account, 'data'), false);
  assert.equal((await request('?after=invalid')).status, 400);
});

test('checkout detail verifies ownership and limits billing information to selected fields', async () => {
  const { request, services } = fixture();
  services.stripe = async (_, method, path, params) => {
    assert.equal(method, 'GET');
    assert.equal(path, 'checkout/sessions');
    assert.equal(params.customer, 'cus_ABC');
    assert.equal(params.subscription, 'sub_ABC');
    assert.equal(params.status, 'complete');
    return { data: [
      { mode: 'subscription', client_reference_id: '25', metadata: { user_id: 'other' }, payment_status: 'unpaid' },
      { mode: 'subscription', subscription: 'sub_ABC', payment_link: 'plink_test', payment_status: 'paid', created: 1790000000, url: 'do not return' },
    ] };
  };
  assert.deepEqual(await (await request('?id=25')).json(), {
    linked: true, checkout: { source: 'Stripe Payment Link', startedAt: 1790000000, paymentStatus: 'paid' },
  });
  assert.deepEqual(await (await request('?id=00')).json(), { linked: false, checkout: null });
});

test('complimentary access requires confirmation and same origin and audits only actual changes', async () => {
  const { request, db } = fixture();
  const update = (id, complimentary, source = origin) => request('?id=' + id, {
    method: 'POST', headers: { Origin: source, 'Content-Type': 'application/json' }, body: JSON.stringify({ complimentary }),
  });
  assert.equal((await update('25', true, 'https://other.example')).status, 403);
  assert.equal((await update('00', true)).status, 409);
  assert.equal((await update(admin.id, true)).status, 403);
  assert.equal((await (await update('25', true)).json()).account.complimentary, true);
  assert.equal((await (await update('25', true)).json()).account.complimentary, true);
  assert.equal((await (await update('25', false)).json()).account.complimentary, false);
  assert.deepEqual(db.prepare('SELECT action FROM account_admin_audit ORDER BY rowid').all().map(row => row.action), ['grant_complimentary', 'revoke_complimentary']);
  assert.deepEqual(JSON.parse(db.prepare("SELECT data FROM users WHERE id='25'").get().data), {
    subscription_tier: 'free', complimentary_full_access: false,
  });
  assert.equal(db.prepare("SELECT status FROM subscriptions WHERE user_id='25'").get().status, 'active');
});
