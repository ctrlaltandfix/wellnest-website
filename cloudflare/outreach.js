import { json, fail, ALLOWED_ORIGINS } from './lib.js';
import { isAnalyticsAdmin } from './analytics.js';
export const stages = ['New', 'Contacted', 'Replied', 'Interested', 'Signed up', 'Not interested', 'Do not contact'];
export async function handleOutreach(request, env, user) {
  if (!user) return fail(401, 'Authentication required');
  if (!await isAnalyticsAdmin(env, user)) return fail(403, 'Admin access required');
  const method = request.method;
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) return fail(405, 'Method not allowed');
  if (method !== 'GET' && !ALLOWED_ORIGINS.has(request.headers.get('Origin'))) return fail(403, 'Invalid request origin');
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS outreach_leads (id TEXT PRIMARY KEY, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL)`).run();
  if (method === 'GET') {
    const rows = await env.DB.prepare('SELECT * FROM outreach_leads ORDER BY updated_at DESC').all();
    return json({ items: rows.results.map(r => ({ ...JSON.parse(r.data), id: r.id, version: r.version })) });
  }
  let input;
  try { input = await request.json(); } catch { return fail(400, 'Invalid JSON'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail(400, 'Invalid lead');
  const id = method === 'POST' ? crypto.randomUUID() : input.id;
  if (typeof id !== 'string' || id.length > 100) return fail(400, 'Invalid lead ID');
  if (method !== 'POST' && !Number.isInteger(input.version)) return fail(400, 'Missing version');
  if (method === 'DELETE') {
    const deleted = await env.DB.prepare('DELETE FROM outreach_leads WHERE id = ? AND version = ? RETURNING id').bind(id, input.version).first();
    return deleted ? json({ deleted: true }) : fail(409, 'Lead changed. Refresh before deleting.');
  }
  const data = {};
  for (const [key, max] of Object.entries({ member: 150, community: 150, source: 2000, request: 2000, stage: 40, contacted: 10, followup: 10, notes: 5000 })) {
    if (typeof input[key] !== 'string' || input[key].length > max) return fail(400, 'Invalid ' + key);
    data[key] = input[key].trim();
  }
  if (!data.member || !data.community || !data.request || !stages.includes(data.stage)) return fail(400, 'Member, community, request and stage are required');
  try { const url = new URL(data.source); if (url.protocol !== 'https:' || url.username || url.password) throw Error(); } catch { return fail(400, 'Use an HTTPS source link'); }
  for (const key of ['contacted', 'followup']) {
    const value = data[key];
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return fail(400, 'Invalid ' + key + ' date');
  }
  const now = new Date().toISOString();
  if (method === 'POST') {
    await env.DB.prepare('INSERT INTO outreach_leads (id, data, version, updated_at) VALUES (?, ?, 1, ?)').bind(id, JSON.stringify(data), now).run();
    return json({ ...data, id, version: 1 }, 201);
  }
  const updated = await env.DB.prepare('UPDATE outreach_leads SET data = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? RETURNING version').bind(JSON.stringify(data), now, id, input.version).first();
  return updated ? json({ ...data, id, version: updated.version }) : fail(409, 'Lead changed in another session. Refresh before saving.');
}
