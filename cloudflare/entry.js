import worker from './worker.js';
import { handleOutreach } from './outreach.js';
import { corsHeaders, fail } from './lib.js';

export default {
  ...worker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/outreach/leads') return worker.fetch(request, env, ctx);
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
