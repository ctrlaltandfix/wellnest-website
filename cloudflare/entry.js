import worker from './worker.js';
import { handleOutreach } from './outreach.js';
import { corsHeaders, fail } from './lib.js';
import { shouldLog, recordSync, handleSyncLog } from './synclog.js';

// Pass a request to the main Worker, recording account backup traffic in the sync log.
async function logged(request, env, ctx, url) {
  if (!shouldLog(request, url)) return worker.fetch(request, env, ctx);
  const requestText = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.clone().text().catch(() => '');
  const started = Date.now();
  const response = await worker.fetch(request, env, ctx);
  const copy = response.clone();
  const done = recordSync(env, request, url, requestText, copy, Date.now() - started);
  if (ctx?.waitUntil) ctx.waitUntil(done); else await done;
  return response;
}

export default {
  ...worker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/admin/sync-log' && request.method === 'GET') {
      try { return await handleSyncLog(request, env); } catch { return fail(503, 'Unable to load the sync log.'); }
    }
    if (url.pathname !== '/api/outreach/leads') return logged(request, env, ctx, url);
    const cors = corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    let response;
    try {
      // Authenticate through the production Worker's existing session handling.
      const identityUrl = new URL('/api/auth/me', url);
      const identity = await worker.fetch(new Request(identityUrl, { headers: request.headers }), env, ctx);
      if (!identity.ok) return identity;
      response = await handleOutreach(request, env, await identity.json());
    } catch {
      response = fail(503, 'Unable to load or save leads. Please try again.');
    }
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    return new Response(response.body, { status: response.status, headers });
  },
};
