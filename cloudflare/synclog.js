// Sync log: a short record of how the iPhone app and the web dashboard save the
// account backup, so routine sync problems can be diagnosed from real traffic.
//
//   GET /api/admin/sync-log   newest entries, for site admins (shown at /admin/sync)
//
// Only shapes are stored (sizes, revisions, dose-log dates with token counts and
// token formats with IDs masked, status and error text), never medication names,
// notes or other record contents. The newest 300 entries are kept.
//
// Backups can be well over 1 MB, so this never parses a whole request or reply:
// it scans the text for the few small fields it needs. Each request is written
// before it runs and completed afterwards, so a request the platform cuts off
// (for example for exceeding its CPU limit) still shows up, marked unfinished.
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

// The first JSON object stored under `key` in a JSON text, parsed on its own.
// Skips non-object values (trackerDeleted.medlog is a list) and huge objects.
export function objectAt(text, key, limit = 300000) {
  if (!text) return undefined;
  const needle = JSON.stringify(key);
  for (let from = 0; ;) {
    const at = text.indexOf(needle, from);
    if (at < 0) return undefined;
    from = at + needle.length;
    let i = from;
    while (text[i] === ' ' || text[i] === '\n' || text[i] === '\r' || text[i] === '\t') i++;
    if (text[i] !== ':') continue;
    i++;
    while (text[i] === ' ' || text[i] === '\n' || text[i] === '\r' || text[i] === '\t') i++;
    if (text[i] !== '{') continue;
    let depth = 0, inString = false, escaped = false;
    for (let j = i; j < text.length && j - i < limit; j++) {
      const ch = text[j];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') inString = true;
      else if (ch === '{') depth++;
      else if (ch === '}' && --depth === 0) {
        try { return JSON.parse(text.slice(i, j + 1)); } catch { return undefined; }
      }
    }
    return undefined;
  }
}

const numberAt = (text, key) => {
  const m = text && text.match(new RegExp(`${JSON.stringify(key)}\\s*:\\s*(-?\\d+)`));
  return m ? Number(m[1]) : null;
};

// Token format with record IDs masked: "wn_m3k9x2a_ab12c__morning" becomes
// "<wn-id>__morning", so the slot naming the phone uses is visible.
export function tokenShape(token) {
  const s = String(token);
  const kind = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) ? '<uuid>' : /^\d+$/.test(id) ? '<number>' : /^wn_/.test(id) ? '<wn-id>' : /^med-/.test(id) ? '<med-id>' : '<id>';
  const at = s.lastIndexOf('__');
  if (at > 0) return `${kind(s.slice(0, at))}__${s.slice(at + 2, at + 32)}`;
  return s.replace(/[A-Za-z0-9_-]{6,}/g, kind).slice(0, 60);
}

// Newest three dates in a dose log with their token counts, plus token formats.
export function doseSummary(log) {
  if (!log || typeof log !== 'object' || Array.isArray(log)) return null;
  const days = Object.keys(log).filter((k) => /^\d{4}-\d{2}-\d{2}/.test(k)).sort();
  const shown = days.slice(-3);
  const shapes = new Set();
  for (const day of shown) if (Array.isArray(log[day])) for (const token of log[day]) if (shapes.size < 6) shapes.add(tokenShape(token));
  return {
    dates: Object.fromEntries(shown.map((d) => [d, Array.isArray(log[d]) ? log[d].length : typeof log[d]])),
    total_dates: days.length,
    formats: [...shapes],
  };
}

// Small facts from a backup body, found by scanning rather than parsing it.
export function scan(text) {
  if (!text) return null;
  const out = { revision: numberAt(text, 'sync_revision'), protocol: numberAt(text, '_sync_protocol') };
  for (const key of ['medlog', 'wn-medlog']) {
    const summary = doseSummary(objectAt(text, key));
    if (summary) (out.dose_log ||= {})[key] = summary;
  }
  const flags = ['_dose_ops', '_tracker_ops', 'backup_key', 'local_data'].filter((k) => text.includes(JSON.stringify(k)));
  if (flags.length) out.fields = flags;
  return out;
}

const safe = (promise) => promise.catch(() => null);

// Write the entry before the request runs; returns its id, or null.
export async function startSync(env, request, url, requestText) {
  try {
    await ensureTable(env);
    const user = await currentUser(env, request).catch(() => null);
    const detail = { bytes: requestText ? requestText.length : Number(request.headers.get('Content-Length')) || 0, ua: (request.headers.get('User-Agent') || '').slice(0, 80), unfinished: true };
    if (url.search) detail.query = url.search.slice(0, 200);
    const row = await env.DB.prepare('INSERT INTO sync_log (at, user_id, client, method, path, status, ms, detail) VALUES (?, ?, ?, ?, ?, 0, NULL, ?) RETURNING id')
      .bind(new Date().toISOString(), user?.id || null, isNative(request) ? 'iphone' : 'web', request.method, url.pathname.slice(0, 200), JSON.stringify(detail)).first();
    return row ? { id: row.id, detail } : null;
  } catch {
    return null;
  }
}

// Complete the entry with the server's answer.
export async function finishSync(env, entry, requestText, response, ms) {
  if (!entry) return;
  try {
    const detail = { ...entry.detail };
    delete detail.unfinished;
    const sent = scan(requestText);
    if (sent) detail.sent = sent;
    const replyText = await response.text().catch(() => '');
    detail.reply_bytes = replyText.length;
    if (response.status >= 400) {
      let reply = null;
      if (replyText.length < 20000) try { reply = JSON.parse(replyText); } catch {}
      detail.error = String(reply?.error || reply?.message || replyText).slice(0, 300);
    } else {
      const stored = scan(replyText);
      if (stored && (stored.revision != null || stored.dose_log)) detail.stored = { revision: stored.revision, dose_log: stored.dose_log };
    }
    await env.DB.prepare('UPDATE sync_log SET status = ?, ms = ?, detail = ? WHERE id = ?').bind(response.status, ms, JSON.stringify(detail), entry.id).run();
    await safe(env.DB.prepare('DELETE FROM sync_log WHERE id <= (SELECT MAX(id) FROM sync_log) - ?').bind(KEEP).run());
  } catch {
    // Logging must never affect the request it describes.
  }
}

// Record a request that threw inside the Worker.
export async function failSync(env, entry, error, ms) {
  if (!entry) return;
  try {
    const detail = { ...entry.detail, error: String(error?.message || error).slice(0, 300) };
    delete detail.unfinished;
    await env.DB.prepare('UPDATE sync_log SET status = ?, ms = ?, detail = ? WHERE id = ?').bind(-1, ms, JSON.stringify(detail), entry.id).run();
  } catch {}
}

const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };

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
