// Billing with Stripe: checkout, access, webhooks, admin status. Stripe is simulated.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { ensureSchema } from '../cloudflare/lib.js';
import { handleFunction } from '../cloudflare/data.js';
import { handleStripeWebhook, handleBillingStatus, verifyStripeSignature, clearPriceCache, WEBHOOK_URL } from '../cloudflare/billing.js';

function d1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    _exec: () => (/^\s*(SELECT|WITH)/i.test(sql) ? { results: db.prepare(sql).all(...args) } : (db.prepare(sql).run(...args), { results: [] })),
  });
  return { prepare: sql => stmt(sql), batch: async list => list.map(s => s._exec()) };
}

// A small in-memory Stripe.
let S;
function fakeStripe() {
  S = { calls: [], customers: [], subs: [], prices: [], sessions: [], hooks: [{ id: 'we_1', url: WEBHOOK_URL, status: 'enabled', enabled_events: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'] }] };
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url), path = u.pathname.replace('/v1/', ''), method = init.method || 'GET';
    const p = method === 'GET' ? u.searchParams : new URLSearchParams(init.body);
    S.calls.push({ method, path, params: Object.fromEntries(p) });
    if (init.headers?.Authorization !== 'Bearer sk_test_ok') return Response.json({ error: { message: 'Invalid API Key' } }, { status: 401 });
    const ok = d => Response.json(d);
    if (path === 'account') return ok({ id: 'acct_1', charges_enabled: true, settings: { dashboard: { display_name: 'WellNest' } } });
    if (path === 'prices' && method === 'GET') {
      const look = p.get('lookup_keys[0]');
      return ok({ data: S.prices.filter(x => (look ? x.lookup_key === look : true) && x.active) });
    }
    if (path === 'prices' && method === 'POST') {
      const price = { id: 'price_' + (S.prices.length + 1), active: true, currency: p.get('currency'), unit_amount: +p.get('unit_amount'), recurring: { interval: p.get('recurring[interval]'), interval_count: 1 }, lookup_key: p.get('lookup_key') };
      S.prices.push(price); return ok(price);
    }
    if (path.startsWith('prices/')) return ok(S.prices.find(x => x.id === path.slice(7)));
    if (path === 'customers' && method === 'GET') return ok({ data: S.customers.filter(c => c.email === p.get('email')) });
    if (path === 'customers' && method === 'POST') { const c = { id: 'cus_' + (S.customers.length + 1), email: p.get('email') }; S.customers.push(c); return ok(c); }
    if (path.startsWith('customers/')) return ok(S.customers.find(c => c.id === path.slice(10)));
    if (path === 'subscriptions') return ok({ data: S.subs.filter(s => s.customer === p.get('customer')) });
    if (path.startsWith('subscriptions/')) return ok(S.subs.find(s => s.id === path.slice(14)));
    if (path === 'checkout/sessions') { const s = { id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1', params: Object.fromEntries(p) }; S.sessions.push(s); return ok(s); }
    if (path === 'billing_portal/sessions') return ok({ url: 'https://billing.stripe.com/p/session/1' });
    if (path === 'webhook_endpoints') return ok({ data: S.hooks });
    return Response.json({ error: { message: 'no route ' + path } }, { status: 404 });
  };
}

const WHSEC = 'whsec_test123';
let env, token;
const DAY = 86400000;
async function makeUser(id, email, createdDaysAgo, data = {}) {
  await env.DB.prepare("INSERT INTO users (id, email, provider, confirmed_at, full_name, role, data, created_date, updated_date) VALUES (?, ?, 'email', ?, 'Member', 'user', ?, ?, ?)")
    .bind(id, email, '2026-01-01', JSON.stringify(data), new Date(Date.now() - createdDaysAgo * DAY).toISOString(), '2026-01-01').run();
}
const { signJwt } = await import('../cloudflare/lib.js');
async function call(name, body = {}, userId = 'u1') {
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers.Authorization = 'Bearer ' + await signJwt(env, { sub: userId, email: 'x' });
  const res = await handleFunction(new Request('https://wellnest.services/api/functions/' + name, { method: 'POST', headers, body: JSON.stringify(body) }), env, name);
  return { status: res.status, body: await res.json() };
}
const tier = async id => JSON.parse((await env.DB.prepare('SELECT data FROM users WHERE id = ?').bind(id).first()).data).subscription_tier;

function signed(event, secret = WHSEC, t = Math.floor(Date.now() / 1000)) {
  const payload = JSON.stringify(event);
  const sig = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return new Request('https://wellnest.services/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body: payload });
}

// One database for the file (the schema is created once per process), emptied before each test.
const DB = d1();
beforeEach(async () => {
  fakeStripe(); clearPriceCache();
  env = { DB, STRIPE_SECRET_KEY: 'sk_test_ok', STRIPE_WEBHOOK_SECRET: WHSEC };
  await ensureSchema(env);
  await DB.prepare('DELETE FROM users').run();
  try { await DB.prepare('DELETE FROM subscriptions').run(); } catch {}
  await makeUser('u1', 'new@example.test', 3);
});

test('new accounts have Premium for 30 days, then the free plan; paid tiers always have it', async () => {
  let r = await call('growthAccess');
  assert.equal(r.body.premium, true);
  assert.equal(r.body.plan, 'trial');
  assert.ok(Date.parse(r.body.trialEndsAt) > Date.now() + 26 * DAY);
  await makeUser('old', 'old@example.test', 45);
  r = await call('growthAccess', {}, 'old');
  assert.deepEqual([r.body.premium, r.body.plan], [false, 'free']);
  await makeUser('payer', 'payer@example.test', 90, { subscription_tier: 'yearly' });
  r = await call('growthAccess', {}, 'payer');
  assert.deepEqual([r.body.premium, r.body.plan], [true, 'yearly']);
  r = await call('growthAccess', {}, null);
  assert.equal(r.body.premium, false);                                 // signed out
});

test('checkout: a Stripe session for the right price, charged when the free month ends', async () => {
  const r = await call('createCheckout', { productKey: 'yearly', successUrl: 'https://wellnest.services/dashboard?from_checkout=1', cancelUrl: 'https://evil.example/x' });
  assert.equal(r.status, 200);
  assert.equal(r.body.url, 'https://checkout.stripe.com/c/pay/cs_1');
  const s = S.sessions[0].params;
  assert.equal(s.mode, 'subscription');
  assert.equal(s.client_reference_id, 'u1');
  assert.equal(s['line_items[0][price]'], S.prices.find(p => p.lookup_key === 'wellnest_premium_yearly').id);
  assert.equal(S.prices.find(p => p.lookup_key === 'wellnest_premium_yearly').unit_amount, 4499);
  assert.equal(s.cancel_url, 'https://wellnest.services/pricing');     // not sent to another site
  const trialEnd = +s['subscription_data[trial_end]'] * 1000;
  assert.ok(Math.abs(trialEnd - (Date.now() + 27 * DAY)) < 60_000);   // account is 3 days old
  assert.equal(S.customers.length, 1);

  // Older account: billing starts straight away. Monthly price is reused, not re-created.
  await makeUser('old', 'old@example.test', 45);
  await call('createCheckout', { productKey: 'fullaccess' }, 'old');
  await call('createCheckout', { productKey: 'fullaccess' }, 'old');
  assert.equal(S.sessions.at(-1).params['subscription_data[trial_end]'], undefined);
  assert.equal(S.prices.filter(p => p.lookup_key === 'wellnest_premium_monthly').length, 1);

  assert.equal((await call('createCheckout', { productKey: 'lifetime' })).status, 400);
  assert.equal((await call('createCheckout', { productKey: 'yearly' }, null)).status, 401);
});

test('an existing matching price from the old site is reused', async () => {
  S.prices.push({ id: 'price_old_month', active: true, currency: 'aud', unit_amount: 499, recurring: { interval: 'month', interval_count: 1 } });
  await call('createCheckout', { productKey: 'fullaccess' });
  assert.equal(S.sessions[0].params['line_items[0][price]'], 'price_old_month');
  assert.equal(S.calls.filter(c => c.method === 'POST' && c.path === 'prices').length, 0);
});

test('webhook: signed events turn Premium on and off; forged ones are refused', async () => {
  await call('createCheckout', { productKey: 'fullaccess' });
  const sub = { id: 'sub_1', customer: 'cus_1', status: 'trialing', created: 1, items: { data: [{ price: { id: 'price_1', recurring: { interval: 'month' } } }] }, metadata: { user_id: 'u1' } };
  S.subs.push(sub);
  let res = await handleStripeWebhook(signed({ type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_1', customer: 'cus_1', client_reference_id: 'u1' } } }), env);
  assert.equal(res.status, 200);
  assert.equal(await tier('u1'), 'fullaccess');

  sub.status = 'canceled';
  res = await handleStripeWebhook(signed({ type: 'customer.subscription.deleted', data: { object: sub } }), env);
  assert.equal(res.status, 200);
  assert.equal(await tier('u1'), 'free');

  assert.equal((await handleStripeWebhook(signed({ type: 'customer.subscription.updated', data: { object: sub } }, 'whsec_wrong'), env)).status, 400);
  const old = Math.floor(Date.now() / 1000) - 3600;
  assert.equal((await handleStripeWebhook(signed({ type: 'x', data: { object: {} } }, WHSEC, old), env)).status, 400);   // replayed
  assert.equal(await verifyStripeSignature(WHSEC, '{}', null), false);
});

test('people who subscribed before the move are recognised by email', async () => {
  S.customers.push({ id: 'cus_9', email: 'new@example.test' });
  S.subs.push({ id: 'sub_9', customer: 'cus_9', status: 'active', created: 1, items: { data: [{ price: { id: 'price_y', recurring: { interval: 'year' } } }] } });
  const r = await call('syncSubscription');
  assert.deepEqual(r.body, { synced: true, tier: 'yearly' });
  assert.equal(await tier('u1'), 'yearly');
  // And checkout doesn't start a second subscription.
  assert.deepEqual((await call('createCheckout', { productKey: 'yearly' })).body, { alreadySubscribed: true });
  // Webhooks for that customer find the account too.
  await env.DB.prepare('DELETE FROM subscriptions').run();
  S.subs[0].status = 'past_due';
  await handleStripeWebhook(signed({ type: 'customer.subscription.updated', data: { object: S.subs[0] } }), env);
  assert.equal(await tier('u1'), 'yearly');                            // past_due keeps access while Stripe retries
});

test('billing portal, missing key, and the admin status page', async () => {
  assert.equal((await call('billingPortal')).status, 404);             // no billing account yet
  await call('createCheckout', { productKey: 'fullaccess' });
  assert.equal((await call('billingPortal', { returnUrl: 'https://wellnest.services/settings' })).body.url, 'https://billing.stripe.com/p/session/1');

  const noKey = { ...env, STRIPE_SECRET_KEY: '' };
  const r = await handleFunction(new Request('https://wellnest.services/api/functions/createCheckout', { method: 'POST', headers: { Authorization: 'Bearer ' + await signJwt(env, { sub: 'u1' }) }, body: '{"productKey":"yearly"}' }), noKey, 'createCheckout');
  assert.equal(r.status, 503);
  assert.match((await r.json()).error, /isn't set up|aren't set up/);

  const status = async (e, user) => (await handleBillingStatus(new Request('https://wellnest.services/api/billing/status'), e, user)).json();
  assert.equal((await handleBillingStatus(new Request('https://x/'), env, { email: 'a@b.c', role: 'user' })).status, 403);
  let st = await status(env, { email: 'a@b.c', role: 'admin' });
  assert.equal(st.ok, true, JSON.stringify(st.problems));
  assert.equal(st.secretKey, 'set (test mode)');
  assert.equal(st.prices.yearly.amount, 44.99);
  assert.ok(!JSON.stringify(st).includes('sk_test_ok') && !JSON.stringify(st).includes(WHSEC));   // never shows secrets
  S.hooks = [{ url: 'https://old.example/stripe', status: 'enabled', enabled_events: ['*'] }];
  st = await status(env, { email: 'a@b.c', role: 'admin' });
  assert.equal(st.ok, false);
  assert.match(st.problems.join(' '), /No Stripe webhook points at https:\/\/wellnest\.services\/api\/stripe\/webhook/);
  assert.equal((await status({ ...env, STRIPE_SECRET_KEY: 'sk_test_bad' }, { role: 'admin' })).problems[0], 'Stripe rejected the secret key. Check STRIPE_SECRET_KEY in Cloudflare.');
});

test('the Worker routes the webhook (no sign-in) and the admin status page (sign-in)', async () => {
  const { default: worker } = await import('../cloudflare/worker.js');
  const e = { ...env, ASSETS: { fetch: async () => new Response('x') } };
  const hook = await worker.fetch(new Request('https://wellnest.services/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': 't=1,v1=00' }, body: '{}' }), e);
  assert.equal(hook.status, 400);                                       // reached the handler, bad signature
  assert.equal((await worker.fetch(new Request('https://wellnest.services/api/billing/status'), e)).status, 401);
});

test("Stripe's 'Send test event' (made-up customer) is acknowledged, not an error", async () => {
  const fake = { id: 'sub_000', customer: 'cus_00000000000000', status: 'active', items: { data: [] }, metadata: {} };
  const res = await handleStripeWebhook(signed({ type: 'customer.subscription.updated', data: { object: fake } }), env);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { received: true, matched: false });
  const cs = await handleStripeWebhook(signed({ type: 'checkout.session.completed', data: { object: { mode: 'subscription', subscription: 'sub_missing', customer: 'cus_0' } } }), env);
  assert.equal(cs.status, 200);
});
