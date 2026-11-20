// Sync log: a short record of how the iPhone app and the web dashboard save the
// account backup, so routine sync problems can be diagnosed from real traffic.
//
//   GET /api/admin/sync-log   newest entries, for site admins (shown at /admin/sync)
//
// Only shapes are stored (field names, counts, dates, revisions, status and error
// text), never medication names, notes or other record contents. The newest 300
// entries are kept.
import { currentUser, json, fail } from './lib.js';
import { isAnalyticsAdmin } from './analytics.js';

const KEEP = 300;
let tableReady = null;

const ensureTable = (env) => (tableReady ||= env.DB.prepare(
  `CREATE TABLE IF NOT EXISTS sync_log (
     id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, user_id TEXT, client TEXT NOT NULL,
     method TEXT NOT NULL, path TEXT NOT NULL, status INTEGER NOT NULL, ms INTEGER, detail TEXT NOT NULL DEFAULT '{}')`,
).run().catch((error) => { tableReady = null; throw error; }));

const isNative = (request) => /^WellNest\//.test(request.headers.get('User-Agent') || '');
const isWrite = (method) => method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';

// Which requests to record: everything the iPhone app sends to the API, and the
// web dashboard's saves of the account backup (its 30-second reads are skipped).
export function shouldLog(request, url) {
  if (!url.pathname.startsWith('/api/') || url.pathname.startsWith('/api/admin/sync-log')) return false;
  if (url.pathname.startsWith('/api/analytics/')) return false;
  if (isNative(request)) return true;
  return isWrite(request.method) && /\/entities\/CloudDataBackup(\/|$)/.test(url.pathname);
}

const keysOf = (value, max = 80) => (value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).slice(0, max) : null);

// Dose-log style fields ({"YYYY-MM-DD": [tokens]}): the newest dates and how many
// tokens each holds. Shows which date the phone files today's doses under.
function doseDays(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const days = Object.keys(value).filter((k) => /^\d{4}-\d{2}-\d{2}/.test(k)).sort().slice(-3);
  if (!days.length) return null;
  return Object.fromEntries(days.map((d) => [d, Array.isArray(value[d]) ? value[d].length : typeof value[d]]));
}

// Shape of a backup payload: field names, revision, protocol, counts and dose days.
export function summarize(body) {
  if (!body || typeof body !== 'object') return null;
  const data = body.data && typeof body.data === 'object' ? body.data : body;
  const local = data.local_data && typeof data.local_data === 'object' ? data.local_data : null;
  const out = {
    keys: keysOf(body, 30),
    data_keys: keysOf(data, 40),
    revision: data.sync_revision ?? null,
    protocol: data._sync_protocol ?? local?._sync_protocol ?? null,
  };
  if (body.backup_key !== undefined) out.backup_key = body.backup_key;
  if (local) {
    out.local_keys = keysOf(local);
    const counts = {};
    const doses = {};
    for (const [key, value] of Object.entries(local)) {
      if (Array.isArray(value)) counts[key] = value.length;
      const days = doseDays(value);
      if (days) doses[key] = days;
    }
    out.counts = counts;
    out.dose_days = doses;
    if (Array.isArray(local._sync_ops)) out.ops = local._sync_ops.map((op) => `${op?.key}:${op?.deleted ? 'delete' : 'save'}`).slice(0, 20);
    if (Array.isArray(local._dose_ops)) out.dose_ops = local._dose_ops.map((op) => `${op?.date}:${op?.taken ? 'take' : 'untake'}`).slice(0, 20);
    if (local.trackerDeleted && typeof local.trackerDeleted === 'object') {
      out.tombstones = Object.fromEntries(Object.entries(local.trackerDeleted).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0]));
    }
  }
  return out;
}

const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };

export async function recordSync(env, request, url, requestText, response, ms) {
  try {
    await ensureTable(env);
    const user = await currentUser(env, request).catch(() => null);
    const detail = { bytes: requestText ? requestText.length : 0, ua: (request.headers.get('User-Agent') || '').slice(0, 80) };
    if (url.search) detail.query = url.search.slice(0, 200);
    const sent = summarize(parse(requestText));
    if (sent) detail.sent = sent;
    const resText = await response.text().catch(() => '');
    const reply = parse(resText);
    if (response.status >= 400) detail.error = String(reply?.error || reply?.message || resText).slice(0, 300);
    else {
      const record = Array.isArray(reply) ? reply[0] : Array.isArray(reply?.items) ? reply.items[0] : reply;
      if (record && typeof record === 'object' && record.data) {
        const stored = summarize(record);
        detail.stored = { revision: stored?.revision ?? null, dose_days: stored?.dose_days, counts: stored?.counts };
        detail.record_id = record.id;
        detail.records = Array.isArray(reply) ? reply.length : Array.isArray(reply?.items) ? reply.items.length : 1;
      }
    }
    await env.DB.prepare('INSERT INTO sync_log (at, user_id, client, method, path, status, ms, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(new Date().toISOString(), user?.id || null, isNative(request) ? 'iphone' : 'web', request.method, url.pathname.slice(0, 200), response.status, ms, JSON.stringify(detail))
      .run();
    await env.DB.prepare('DELETE FROM sync_log WHERE id <= (SELECT MAX(id) FROM sync_log) - ?').bind(KEEP).run();
  } catch {
    // Logging must never affect the request it describes.
  }
}

export async function handleSyncLog(request, env) {
  const user = await currentUser(env, request);
  if (!user) return fail(401, 'Authentication required');
  if (!(await isAnalyticsAdmin(env, user))) return fail(403, "This account can't see the sync log.");
  await ensureTable(env);
  const url = new URL(request.url);
  const mine = url.searchParams.get('all') !== '1';
  const rows = await env.DB.prepare(
    `SELECT id, at, user_id, client, method, path, status, ms, detail FROM sync_log ${mine ? 'WHERE user_id = ? OR user_id IS NULL' : ''} ORDER BY id DESC LIMIT 150`,
  ).bind(...(mine ? [user.id] : [])).all();
  return json({ entries: (rows.results || []).map((r) => ({ ...r, detail: parse(r.detail) || {} })) });
}
