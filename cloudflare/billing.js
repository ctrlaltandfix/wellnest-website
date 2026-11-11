// Billing with Stripe: Premium Monthly (A$4.99) and Premium Yearly (A$44.99).
//
// Secrets (Cloudflare dashboard → wellnest → Settings → Variables and secrets,
// type "Secret"; never in this repo):
//   STRIPE_SECRET_KEY       sk_live_… (or sk_test_… to try it out)
//   STRIPE_WEBHOOK_SECRET   whsec_… of the endpoint https://wellnest.services/api/stripe/webhook
// Optional variables: STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY (price_…) to pin
// specific prices. Otherwise the prices are found by lookup key, then by matching
// an existing active AUD price, and created once if there is none.
//
// Access: every account has Premium for its first 30 days (no card needed). After
// that, Premium comes from a Stripe subscription (active, trialing or past_due),
// which is written to the account as subscription_tier "fullaccess" or "yearly".
//
// App functions (POST /api/functions/<name>, see data.js):
//   createCheckout   { productKey, successUrl, cancelUrl } -> { url } | { alreadySubscribed }
//   syncSubscription {} -> { synced, tier }   (also finds subscriptions made before the move)
//   growthAccess     {} -> { premium, plan, trialEndsAt, referralApplied }
//   billingPortal    { returnUrl } -> { url }   Stripe's page to change card / cancel
// Endpoints:
//   POST /api/stripe/webhook   Stripe events (signature checked)
//   GET  /api/billing/status   admins: is everything set up? (no secrets shown)
import { SITE, ALLOWED_ORIGINS, json, fail, now } from "./lib.js";
import { isAnalyticsAdmin } from "./analytics.js";

export const TRIAL_DAYS = 30;
const DAY = 86_400_000;
export const PLANS = {
  fullaccess: { name: "WellNest Premium Monthly", amount: 499, interval: "month", lookup: "wellnest_premium_monthly", env: "STRIPE_PRICE_MONTHLY" },
  yearly: { name: "WellNest Premium Yearly", amount: 4499, interval: "year", lookup: "wellnest_premium_yearly", env: "STRIPE_PRICE_YEARLY" },
};
const PAID = new Set(["active", "trialing", "past_due"]);
export const WEBHOOK_URL = SITE + "/api/stripe/webhook";
export const WEBHOOK_EVENTS = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"];

export const SCHEMA = `CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY, customer_id TEXT, subscription_id TEXT, status TEXT NOT NULL DEFAULT 'none',
  plan TEXT, price_id TEXT, current_period_end INTEGER, cancel_at_period_end INTEGER NOT NULL DEFAULT 0, updated TEXT NOT NULL)`;
let schemaReady = false;
async function ensureBilling(env) {
  if (schemaReady) return;
  await env.DB.prepare(SCHEMA).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS subscriptions_customer ON subscriptions(customer_id)").run();
  schemaReady = true;
}

// ---------- Stripe API ----------
function form(params, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => typeof item === "object" ? form(item, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item)));
    else if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe(env, method, path, params) {
  if (!env.STRIPE_SECRET_KEY) throw Object.assign(new Error("Payments aren't set up yet (STRIPE_SECRET_KEY is missing)."), { status: 503 });
  const qs = method === "GET" && params ? "?" + form(params) : "";
  const res = await fetch("https://api.stripe.com/v1/" + path + qs, {
    method,
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: method === "GET" ? undefined : form(params || {}),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Stripe", method, path, res.status, data?.error?.message);
    throw Object.assign(new Error(res.status === 401 ? "Stripe rejected the secret key. Check STRIPE_SECRET_KEY in Cloudflare."
      : "Payment provider error: " + (data?.error?.message || res.status)), { status: 502, stripe: res.status });
  }
  return data;
}

// The Stripe price for a plan (cached per Worker instance).
const priceCache = {};
export function clearPriceCache() { for (const k in priceCache) delete priceCache[k]; }
export async function priceFor(env, key) {
  const plan = PLANS[key];
  if (!plan) throw Object.assign(new Error("Unknown plan."), { status: 400 });
  if (env[plan.env]) return env[plan.env];
  if (priceCache[key]) return priceCache[key];
  const byLookup = await stripe(env, "GET", "prices", { lookup_keys: [plan.lookup], active: "true", limit: 1 });
  let price = byLookup.data?.[0];
  if (!price) {
    // Reuse a matching price from before (e.g. created with the old site).
    const all = await stripe(env, "GET", "prices", { active: "true", type: "recurring", currency: "aud", limit: 100 });
    price = (all.data || []).find(p => p.unit_amount === plan.amount && p.recurring?.interval === plan.interval && (p.recurring?.interval_count || 1) === 1);
  }
  if (!price) {
    price = await stripe(env, "POST", "prices", {
      currency: "aud", unit_amount: plan.amount, recurring: { interval: plan.interval }, lookup_key: plan.lookup,
      product_data: { name: plan.name }, tax_behavior: "inclusive",
    });
  }
  return (priceCache[key] = price.id);
}

// ---------- accounts ----------
async function row(env, userId) {
  await ensureBilling(env);
  return env.DB.prepare("SELECT * FROM subscriptions WHERE user_id = ?").bind(userId).first();
}

export function trialEndsAt(user) {
  const created = Date.parse(user?.created_date || "");
  return Number.isFinite(created) ? created + TRIAL_DAYS * DAY : 0;
}

function tierOf(user) {
  try { return JSON.parse(user.data || "{}").subscription_tier || "free"; } catch { return "free"; }
}

async function setTier(env, userId, tier) {
  await env.DB.prepare("UPDATE users SET data = json_set(data, '$.subscription_tier', ?), updated_date = ? WHERE id = ?").bind(tier, now(), userId).run();
}

// The Stripe customer for an account: remembered, or found by email (so people who
// subscribed before the move are recognised), or created.
async function customerFor(env, user, create) {
  const r = await row(env, user.id);
  if (r?.customer_id) return r.customer_id;
  const found = await stripe(env, "GET", "customers", { email: user.email, limit: 10 });
  let customer = (found.data || []).find(c => !c.deleted);
  if (!customer && !create) return null;
  if (!customer) customer = await stripe(env, "POST", "customers", { email: user.email, name: user.full_name || undefined, metadata: { user_id: user.id } });
  await env.DB.prepare(`INSERT INTO subscriptions (user_id, customer_id, updated) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET customer_id = excluded.customer_id, updated = excluded.updated`).bind(user.id, customer.id, now()).run();
  return customer.id;
}

function planOfPrice(price) {
  const interval = price?.recurring?.interval;
  return interval === "year" ? "yearly" : "fullaccess";
}

// Record a Stripe subscription on the account it belongs to.
export async function applySubscription(env, userId, sub) {
  await ensureBilling(env);
  const price = sub.items?.data?.[0]?.price;
  const paid = PAID.has(sub.status);
  await env.DB.prepare(`INSERT INTO subscriptions (user_id, customer_id, subscription_id, status, plan, price_id, current_period_end, cancel_at_period_end, updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET customer_id = excluded.customer_id, subscription_id = excluded.subscription_id, status = excluded.status,
      plan = excluded.plan, price_id = excluded.price_id, current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end, updated = excluded.updated`)
    .bind(userId, typeof sub.customer === "string" ? sub.customer : sub.customer?.id, sub.id, sub.status, planOfPrice(price), price?.id || null,
      sub.current_period_end ? sub.current_period_end * 1000 : null, sub.cancel_at_period_end ? 1 : 0, now()).run();
  const tier = paid ? planOfPrice(price) : "free";
  await setTier(env, userId, tier);
  return tier;
}

// The subscription that counts for a customer: a paying one first, newest first.
function best(subs) {
  const rank = s => (PAID.has(s.status) ? 2 : 0) + (s.status === "active" ? 1 : 0);
  return [...subs].sort((a, b) => rank(b) - rank(a) || b.created - a.created)[0] || null;
}

export async function syncSubscription(env, user) {
  if (!env.STRIPE_SECRET_KEY) return { synced: false };
  const customer = await customerFor(env, user, false);
  if (!customer) return { synced: false, tier: tierOf(user) };
  const subs = await stripe(env, "GET", "subscriptions", { customer, status: "all", limit: 20 });
  const sub = best(subs.data || []);
  const before = tierOf(user);
  const tier = sub ? await applySubscription(env, user.id, sub) : before;
  return { synced: tier !== before, tier };
}

export async function growthAccess(env, user) {
  if (!user) return { premium: false, plan: "free", referralApplied: false };
  const tier = tierOf(user);
  let complimentary = false;
  try { complimentary = !!JSON.parse(user.data || "{}").complimentary_full_access; } catch {}
  const ends = trialEndsAt(user);
  const plan = PLANS[tier] ? tier : user.role === "admin" || complimentary ? "full" : ends > Date.now() ? "trial" : "free";
  return { premium: plan !== "free", plan, trialEndsAt: ends ? new Date(ends).toISOString() : null, referralApplied: false };
}

function safeUrl(u, fallback) {
  try {
    const url = new URL(u);
    if (ALLOWED_ORIGINS.has(url.origin)) return url.toString();
  } catch {}
  return fallback;
}

export async function createCheckout(env, user, b) {
  if (!user) throw Object.assign(new Error("Please sign in first."), { status: 401 });
  const key = String(b.productKey || "");
  if (!PLANS[key]) throw Object.assign(new Error("Unknown plan."), { status: 400 });
  // Already paying: send them to their dashboard instead of a second subscription.
  const sync = await syncSubscription(env, user);
  if (PLANS[sync.tier]) return { alreadySubscribed: true };
  const customer = await customerFor(env, user, true);
  const price = await priceFor(env, key);
  // Card details now, first charge when the account's free 30 days end (Stripe
  // needs a trial end at least 2 days away; otherwise billing starts today).
  const trialEnd = trialEndsAt(user);
  const subscription_data = { metadata: { user_id: user.id, plan: key } };
  if (trialEnd > Date.now() + 2 * DAY + 60_000) subscription_data.trial_end = Math.floor(trialEnd / 1000);
  const session = await stripe(env, "POST", "checkout/sessions", {
    mode: "subscription", customer, client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    success_url: safeUrl(b.successUrl, SITE + "/dashboard?from_checkout=1"),
    cancel_url: safeUrl(b.cancelUrl, SITE + "/pricing"),
    allow_promotion_codes: "true",
    metadata: { user_id: user.id, plan: key },
    subscription_data,
  });
  return { url: session.url };
}

export async function billingPortal(env, user, b) {
  if (!user) throw Object.assign(new Error("Please sign in first."), { status: 401 });
  const customer = await customerFor(env, user, false);
  if (!customer) throw Object.assign(new Error("There's no billing account yet. Choose a plan on the pricing page first."), { status: 404 });
  const session = await stripe(env, "POST", "billing_portal/sessions", { customer, return_url: safeUrl(b.returnUrl, SITE + "/settings") });
  return { url: session.url };
}

// ---------- webhook ----------
const enc = new TextEncoder();
async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(text)))].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Stripe-Signature: t=<seconds>,v1=<hex>[,v1=…]. Rejects old or forged events.
export async function verifyStripeSignature(secret, payload, header, toleranceSeconds = 300, nowMs = Date.now()) {
  if (!secret || !header) return false;
  let t = null; const sigs = [];
  for (const piece of header.split(",")) {
    const [k, v] = piece.split("=");
    if (k === "t") t = Number(v);
    else if (k === "v1" && v) sigs.push(v);
  }
  if (!t || !sigs.length || Math.abs(nowMs / 1000 - t) > toleranceSeconds) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some(s => s.length === expected.length && [...s].reduce((d, c, i) => d | (c.charCodeAt(0) ^ expected.charCodeAt(i)), 0) === 0);
}

async function userForCustomer(env, customerId, metaUser) {
  await ensureBilling(env);
  if (metaUser) {
    const u = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(metaUser).first();
    if (u) return u.id;
  }
  const r = await env.DB.prepare("SELECT user_id FROM subscriptions WHERE customer_id = ?").bind(customerId).first();
  if (r) return r.user_id;
  // A subscription from before the move: match the customer's email to an account.
  // (Stripe's "Send test event" uses made-up customers: no account, but not an error.)
  let c = null;
  try { c = await stripe(env, "GET", "customers/" + customerId); } catch { return null; }
  if (!c?.email) return null;
  const u = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(c.email).first();
  return u?.id || null;
}

export async function handleStripeWebhook(request, env) {
  if (request.method !== "POST") return fail(405, "Use POST.");
  const payload = await request.text();
  if (!(await verifyStripeSignature(env.STRIPE_WEBHOOK_SECRET, payload, request.headers.get("Stripe-Signature")))) {
    console.error("Stripe webhook: bad signature", env.STRIPE_WEBHOOK_SECRET ? "" : "(STRIPE_WEBHOOK_SECRET missing)");
    return fail(400, "Invalid signature");
  }
  const event = JSON.parse(payload);
  const obj = event.data?.object || {};
  if (event.type === "checkout.session.completed" && obj.mode === "subscription" && obj.subscription) {
    let sub;
    try { sub = await stripe(env, "GET", "subscriptions/" + obj.subscription); }
    catch { console.error("Stripe webhook: subscription not found", obj.subscription); return json({ received: true, matched: false }); }
    const userId = await userForCustomer(env, obj.customer, obj.client_reference_id || obj.metadata?.user_id);
    if (userId) await applySubscription(env, userId, sub);
  } else if (event.type?.startsWith("customer.subscription.")) {
    const userId = await userForCustomer(env, obj.customer, obj.metadata?.user_id);
    if (userId) {
      // The newest state from Stripe (events can arrive out of order).
      const subs = await stripe(env, "GET", "subscriptions", { customer: obj.customer, status: "all", limit: 20 });
      const sub = best(subs.data || []) || obj;
      await applySubscription(env, userId, sub);
    } else {
      console.error("Stripe webhook: no account for customer", obj.customer);
      return json({ received: true, matched: false });
    }
  }
  return json({ received: true });
}

// ---------- admin check ----------
export async function handleBillingStatus(request, env, user) {
  if (!(await isAnalyticsAdmin(env, user))) return fail(403, "Only site admins can see this.");
  const out = {
    secretKey: env.STRIPE_SECRET_KEY ? (env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "set (live mode)" : env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "set (test mode)" : "set (unrecognised format)") : "MISSING",
    webhookSecret: env.STRIPE_WEBHOOK_SECRET ? (env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_") ? "set" : "set (unrecognised format)") : "MISSING",
    webhookUrlExpected: WEBHOOK_URL, prices: {}, webhooks: [], problems: [],
  };
  if (!env.STRIPE_SECRET_KEY) { out.problems.push("Add STRIPE_SECRET_KEY as a Secret in Cloudflare."); return json(out); }
  try {
    const account = await stripe(env, "GET", "account");
    out.account = { id: account.id, name: account.settings?.dashboard?.display_name || account.business_profile?.name, chargesEnabled: account.charges_enabled };
    if (!account.charges_enabled) out.problems.push("Stripe says this account can't take payments yet (finish activation in Stripe).");
    for (const key of Object.keys(PLANS)) {
      const id = await priceFor(env, key);
      const p = await stripe(env, "GET", "prices/" + id);
      out.prices[key] = { id, amount: p.unit_amount / 100, currency: p.currency, interval: p.recurring?.interval, active: p.active };
    }
    const hooks = await stripe(env, "GET", "webhook_endpoints", { limit: 50 });
    out.webhooks = (hooks.data || []).map(h => ({ url: h.url, status: h.status, events: h.enabled_events }));
    const ours = out.webhooks.find(h => h.url === WEBHOOK_URL);
    if (!ours) out.problems.push(`No Stripe webhook points at ${WEBHOOK_URL}. Add one (Developers → Webhooks) with the events: ${WEBHOOK_EVENTS.join(", ")}; then put its signing secret in STRIPE_WEBHOOK_SECRET.`);
    else {
      if (ours.status !== "enabled") out.problems.push("The webhook for this site is disabled in Stripe.");
      const missing = ours.events.includes("*") ? [] : WEBHOOK_EVENTS.filter(e => !ours.events.includes(e));
      if (missing.length) out.problems.push("The webhook is missing these events: " + missing.join(", "));
    }
    const old = out.webhooks.filter(h => h.url !== WEBHOOK_URL && h.status === "enabled");
    if (old.length) out.problems.push("Other enabled webhooks (probably the old site's) will fail and can be disabled: " + old.map(h => h.url).join(", "));
  } catch (e) {
    out.problems.push(e.message);
  }
  if (!env.STRIPE_WEBHOOK_SECRET) out.problems.push("Add STRIPE_WEBHOOK_SECRET (the webhook's signing secret) as a Secret in Cloudflare.");
  out.ok = !out.problems.length;
  return json(out);
}

export async function billingFunction(env, request, name, user, b) {
  switch (name) {
    case "createCheckout": return json(await createCheckout(env, user, b));
    case "syncSubscription": return json(user ? await syncSubscription(env, user) : { synced: false });
    case "growthAccess": return json(await growthAccess(env, user));
    case "billingPortal": return json(await billingPortal(env, user, b));
  }
  return null;
}
