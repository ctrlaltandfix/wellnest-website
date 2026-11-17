const ACCOUNT_QUERY = `SELECT u.id, u.email, u.full_name, u.provider, u.role, u.created_date, u.confirmed_at,
  json_extract(CASE WHEN json_valid(u.data) THEN u.data ELSE '{}' END, '$.complimentary_full_access') AS complimentary,
  json_extract(CASE WHEN json_valid(u.data) THEN u.data ELSE '{}' END, '$.subscription_tier') AS account_tier,
  s.customer_id, s.subscription_id, s.status, s.plan, s.current_period_end, s.cancel_at_period_end
  FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id`;

const PAGE_SIZE = 25;
const AUDIT_SCHEMA = `CREATE TABLE IF NOT EXISTS account_admin_audit (
  id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, user_id TEXT NOT NULL,
  action TEXT NOT NULL, created_date TEXT NOT NULL
)`;
const ACCESS_FIELD = "COALESCE(json_extract(CASE WHEN json_valid(data) THEN data ELSE '{}' END, '$.complimentary_full_access'), 0)";

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function error(message, status) {
  return json({ error: message }, status);
}

function dashboardLink(env, kind, id) {
  if (!id || !/^(?:cus|sub)_[A-Za-z0-9]+$/.test(id)) return null;
  const test = /^(?:sk|rk)_test_/.test(env.STRIPE_SECRET_KEY || '') ? 'test/' : '';
  return 'https://dashboard.stripe.com/' + test + kind + '/' + id;
}

function accountView(env, account, actor) {
  return {
    id: account.id,
    email: account.email,
    name: account.full_name,
    provider: account.provider,
    canManage: account.role !== 'admin' && account.id !== actor.id,
    createdAt: account.created_date,
    confirmedAt: account.confirmed_at,
    complimentary: Boolean(account.complimentary),
    accountTier: account.account_tier || 'free',
    billing: {
      status: account.status || 'none',
      plan: account.plan,
      periodEnd: account.current_period_end,
      ending: Boolean(account.cancel_at_period_end),
      customerUrl: dashboardLink(env, 'customers', account.customer_id),
      subscriptionUrl: dashboardLink(env, 'subscriptions', account.subscription_id),
    },
  };
}

async function listAccounts(env, params, actor) {
  const term = (params.get('q') || '').trim().slice(0, 160);
  const cursor = params.get('after');
  let after;
  if (cursor) {
    try {
      after = JSON.parse(cursor);
      if (!Array.isArray(after) || after.length !== 2 || after.some(value => typeof value !== 'string' || value.length > 160)) throw Error();
    } catch {
      return error('Invalid account page.', 400);
    }
  }
  const conditions = [];
  const bindings = [];
  if (term) {
    conditions.push("(instr(lower(u.email), lower(?)) > 0 OR instr(lower(u.full_name), lower(?)) > 0 OR u.id = ? OR s.customer_id = ? OR s.subscription_id = ?)");
    bindings.push(term, term, term, term, term);
  }
  if (after) {
    conditions.push('(u.created_date, u.id) < (?, ?)');
    bindings.push(...after);
  }
  const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
  const { results } = await env.DB.prepare(ACCOUNT_QUERY + where + ' ORDER BY u.created_date DESC, u.id DESC LIMIT ?')
    .bind(...bindings, PAGE_SIZE + 1).all();
  const page = results.slice(0, PAGE_SIZE);
  const last = page.at(-1);
  return json({
    accounts: page.map(account => accountView(env, account, actor)),
    next: results.length > PAGE_SIZE ? JSON.stringify([last.created_date, last.id]) : null,
  });
}

async function checkoutDetails(env, stripe, account) {
  if (!account.customer_id) return json({ checkout: null, linked: false });
  if (!env.STRIPE_SECRET_KEY) return error('Stripe is unavailable. The saved billing summary is still shown.', 503);
  let startingAfter;
  try {
    do {
      const page = await stripe(env, 'GET', 'checkout/sessions', {
        customer: account.customer_id,
        status: 'complete',
        ...(account.subscription_id ? { subscription: account.subscription_id } : {}),
        limit: 100,
        starting_after: startingAfter,
      });
      const session = page.data.find(item => {
        if (item.mode !== 'subscription') return false;
        const references = [item.client_reference_id, item.metadata?.user_id].filter(Boolean);
        return references.length ? references.every(id => id === account.id) :
          Boolean(account.subscription_id && item.subscription === account.subscription_id);
      });
      if (session) {
        return json({ linked: true, checkout: {
          source: session.payment_link ? 'Stripe Payment Link' : 'Stripe Checkout',
          startedAt: session.created,
          paymentStatus: session.payment_status,
        } });
      }
      startingAfter = page.has_more ? page.data.at(-1)?.id : null;
    } while (startingAfter);
    return json({ checkout: null, linked: true });
  } catch {
    return error('Could not load Checkout details from Stripe. Try again shortly.', 502);
  }
}

async function updateAccess(request, env, actor, account) {
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return error('Account changes must come from the WellNest admin page.', 403);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return error('Expected JSON.', 415);
  const body = await request.json().catch(() => null);
  if (typeof body?.complimentary !== 'boolean') return error('Choose whether to grant complimentary access.', 400);
  if (account.id === actor.id || account.role === 'admin') return error('Admin access is managed separately.', 403);
  if (body.complimentary && !account.confirmed_at) return error('The user must confirm their email first.', 409);
  const enabled = Number(body.complimentary);
  const now = new Date().toISOString();
  const allowed = "id = ? AND role <> 'admin' AND (? = 0 OR confirmed_at IS NOT NULL) " +
    "AND json_type(CASE WHEN json_valid(data) THEN data ELSE 'null' END) = 'object'";
  await env.DB.prepare(AUDIT_SCHEMA).run();
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO account_admin_audit (id, actor_id, user_id, action, created_date)
      SELECT ?, ?, id, ?, ? FROM users WHERE ${allowed} AND ${ACCESS_FIELD} <> ?`)
      .bind(crypto.randomUUID(), actor.id, enabled ? 'grant_complimentary' : 'revoke_complimentary', now, account.id, enabled, enabled),
    env.DB.prepare(`UPDATE users SET data = json_set(CASE WHEN json_valid(data) THEN data ELSE '{}' END,
      '$.complimentary_full_access', json(?)), updated_date = ? WHERE ${allowed} AND ${ACCESS_FIELD} <> ?`)
      .bind(String(body.complimentary), now, account.id, enabled, enabled),
  ]);
  const updated = await env.DB.prepare(ACCOUNT_QUERY + ' WHERE u.id = ?').bind(account.id).first();
  if (!updated) return error('This account no longer exists.', 404);
  if (Boolean(updated.complimentary) !== body.complimentary) return error('The account changed. Refresh and try again.', 409);
  return json({ account: accountView(env, updated, actor) });
}

export async function handleAccountAdmin(request, env, user, { isAdmin, ensureBilling, stripe }) {
  if (!await isAdmin(env, user)) return error('Only site admins can manage user accounts.', 403);
  await ensureBilling(env);
  const { searchParams: params } = new URL(request.url);
  const id = params.get('id');
  if (request.method === 'GET' && !id) return listAccounts(env, params, user);
  if (!['GET', 'POST'].includes(request.method)) return error('Method not allowed.', 405);
  if (!id || id.length > 160) return error('An account ID is required.', 400);
  const account = await env.DB.prepare(ACCOUNT_QUERY + ' WHERE u.id = ?').bind(id).first();
  if (!account) return error('Account not found.', 404);
  return request.method === 'GET' ? checkoutDetails(env, stripe, account) : updateAccess(request, env, user, account);
}
