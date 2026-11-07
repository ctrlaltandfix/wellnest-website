import { getUser } from '@netlify/identity';
import { getDatabase } from '@netlify/database';
import { randomBytes, createHash, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';
import type { Config } from '@netlify/functions';
import { reconcile } from '../lib/calendar-sync.mjs';

export default async (request: Request) => {
  const headers = { 'Cache-Control': 'private, no-store' };
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
  const url = new URL(request.url);
  const action = url.pathname.split('/').pop();
  const clientId = Netlify.env.get('GOOGLE_CALENDAR_CLIENT_ID');
  const secret = Netlify.env.get('GOOGLE_CALENDAR_CLIENT_SECRET');
  const callback = `${url.origin}/api/calendar/callback`;
  const cookieName = '__Host-wn-calendar';
  const clearCookie = `${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
  const redirect = (status: string) => new Response(null, { status: 303, headers: { ...headers, Location: `/settings?calendar=${status}`, 'Set-Cookie': clearCookie } });
  const methods: Record<string, string> = { status:'GET', calendars:'GET', connect:'POST', callback:'GET', select:'POST', sync:'POST', disconnect:'DELETE' };
  if (!action || methods[action] !== request.method) return json({ error:'Method not allowed' }, 405);
  if (!['GET'].includes(request.method) && request.headers.get('Origin') !== url.origin) return json({ error:'Invalid request origin' }, 403);
  if (!clientId || !secret) return action === 'callback' ? redirect('setup-required') : json({ error:'Google Calendar connection is awaiting setup.', configured:false }, 503);
  const key = createHash('sha256').update('wellnest-calendar-v1:' + secret).digest();
  const seal = (value: unknown) => {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
  };
  const open = (value: string) => {
    const bytes = Buffer.from(value, 'base64url'), decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0,12));
    decipher.setAuthTag(bytes.subarray(12,28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString('utf8'));
  };
  const google = async (target: string, options: RequestInit = {}) => {
    const response = await fetch(target, { ...options, signal: AbortSignal.timeout(12000) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(Error('Google Calendar could not complete the request. Try again or reconnect your Google account.'), { status: response.status });
    return data;
  };
  let client;
  try {
    let authId: string;
    if (action === 'callback') {
      const state = url.searchParams.get('state') || '';
      const cookie = request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
      let payload;
      try {
        payload = open(state);
        const received = createHash('sha256').update(cookie || '').digest();
        const expected = Buffer.from(payload.nonce, 'hex');
        if (!cookie || expected.length !== received.length || !timingSafeEqual(expected, received) || payload.expires < Date.now() || payload.origin !== url.origin) throw Error();
      } catch { return redirect('invalid-state'); }
      if (url.searchParams.has('error')) return redirect('cancelled');
      if (!url.searchParams.get('code')) return redirect('failed');
      authId = payload.authId;
    } else {
      const identity = await getUser();
      if (!identity?.id) return json({ error:'Sign in to connect your calendar.' }, 401);
      authId = identity.id;
    }
    client = await getDatabase().pool.connect();
    await client.query('BEGIN');
    await client.query('SET LOCAL ROLE wellnest_runtime');
    await client.query("SELECT set_config('wellnest.service', 'true', true)");
    const account = (await client.query('SELECT id FROM wellnest_users WHERE auth_id = $1', [authId])).rows[0];
    await client.query("SELECT set_config('wellnest.service', 'false', true)");
    if (!account) { await client.query('ROLLBACK'); return json({ error:'Sign in again to load your account.' }, 403); }
    await client.query("SELECT set_config('wellnest.user_id', $1, true)", [account.id]);
    // Serialize selection, disconnect and sync for an account across browser tabs.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", ['calendar:' + account.id]);
    let connection = (await client.query('SELECT * FROM wellnest_google_calendar WHERE owner_id = $1 FOR UPDATE', [account.id])).rows[0];
    if (action === 'connect') {
      const nonce = randomBytes(32).toString('base64url');
      const state = seal({ authId, nonce:createHash('sha256').update(nonce).digest('hex'), expires:Date.now()+600000, origin:url.origin });
      const consent = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      consent.search = new URLSearchParams({ client_id:clientId, redirect_uri:callback, response_type:'code', access_type:'offline', prompt:'consent select_account', state,
        scope:'https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events' }).toString();
      await client.query('COMMIT');
      return Response.json({ url:consent.toString() }, { headers:{ ...headers, 'Set-Cookie':`${cookieName}=${nonce}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600` } });
    }
    if (action === 'callback') {
      // Google authorization is for calendar access only, separate from app sign-in.
      const tokens = await google('https://oauth2.googleapis.com/token', { method:'POST', body:new URLSearchParams({ code:url.searchParams.get('code')!, client_id:clientId, client_secret:secret, redirect_uri:callback, grant_type:'authorization_code' }) });
      if (!tokens.refresh_token || !tokens.access_token) throw Error('Reconnect and grant calendar access.');
      await client.query(`INSERT INTO wellnest_google_calendar (owner_id, credentials) VALUES ($1,$2)
        ON CONFLICT (owner_id) DO UPDATE SET credentials = EXCLUDED.credentials, calendar_id = NULL, calendar_name = NULL, calendar_timezone = NULL, sync_state = '{}', last_synced_at = NULL`,
        [account.id, seal({ refresh_token:tokens.refresh_token })]);
      await client.query('COMMIT');
      return redirect('connected');
    }
    if (action === 'status') {
      await client.query('COMMIT');
      return json({ configured:true, connected:!!connection, calendarId:connection?.calendar_id || '', calendarName:connection?.calendar_name || '', lastSyncedAt:connection?.last_synced_at || null });
    }
    if (!connection) { await client.query('ROLLBACK'); return json({ error:'Connect your Google account first.' }, 409); }
    if (action === 'disconnect') {
      // Removing encrypted credentials stops access; existing appointments are retained.
      await client.query('DELETE FROM wellnest_google_calendar WHERE owner_id = $1', [account.id]);
      await client.query('COMMIT');
      return json({ connected:false });
    }
    const credentials = open(connection.credentials);
    const token = await google('https://oauth2.googleapis.com/token', { method:'POST', body:new URLSearchParams({ client_id:clientId, client_secret:secret, refresh_token:credentials.refresh_token, grant_type:'refresh_token' }) });
    const api = async (path: string, method = 'GET', body?: unknown, etag?: string): Promise<any> => {
      const response = await fetch('https://www.googleapis.com/calendar/v3/' + path, { method,
        headers:{ Authorization:`Bearer ${token.access_token}`, ...(body ? { 'Content-Type':'application/json' } : {}), ...(etag ? { 'If-Match':etag } : {}) },
        ...(body ? { body:JSON.stringify(body) } : {}), signal:AbortSignal.timeout(12000) });
      if (method === 'GET' && [404,410].includes(response.status)) return null;
      if (method === 'DELETE' && [204,404,410].includes(response.status)) return {};
      if (method === 'POST' && response.status === 409 && (body as any)?.id) return api(path + '/' + (body as any).id);
      if (!response.ok) throw Object.assign(Error(response.status === 412 ? 'This event changed during sync. Sync again to load the latest version.' : 'Calendar access failed. Check calendar permissions or reconnect Google.'), { status:response.status });
      return response.status === 204 ? {} : response.json();
    };
    const calendars = async () => {
      const items: any[] = []; let page = '';
      do {
        const data = await api('users/me/calendarList?' + new URLSearchParams({ minAccessRole:'writer', maxResults:'250', ...(page ? { pageToken:page } : {}) }));
        items.push(...(data.items || []).filter((c:any)=>!c.deleted && ['owner','writer'].includes(c.accessRole)));
        page = data.nextPageToken || '';
      } while (page);
      return items;
    };
    if (action === 'calendars') {
      const items = (await calendars()).map(c=>({ id:c.id, name:c.summaryOverride || c.summary || c.id, primary:!!c.primary, timeZone:c.timeZone }));
      await client.query('COMMIT'); return json({ items });
    }
    if (action === 'select') {
      const data = await request.json();
      if (typeof data.calendarId !== 'string' || !data.calendarId || data.calendarId.length > 1024) { await client.query('ROLLBACK'); return json({ error:'Choose a calendar.' }, 400); }
      const chosen = (await calendars()).find(c=>c.id===data.calendarId);
      if (!chosen) { await client.query('ROLLBACK'); return json({ error:'Choose a calendar you can edit.' }, 403); }
      await client.query('UPDATE wellnest_google_calendar SET calendar_id=$2, calendar_name=$3, calendar_timezone=$4, last_synced_at=NULL WHERE owner_id=$1', [account.id, chosen.id, chosen.summaryOverride || chosen.summary, chosen.timeZone || 'UTC']);
      await client.query('COMMIT'); return json({ calendarId:chosen.id });
    }
    if (!connection.calendar_id) { await client.query('ROLLBACK'); return json({ error:'Choose a calendar in Settings first.' }, 409); }
    const backup = (await client.query(`SELECT * FROM wellnest_records WHERE owner_id=$1 AND entity='CloudDataBackup' AND data->>'backup_key'='wellnest-local-data' ORDER BY updated_date DESC LIMIT 1 FOR UPDATE`, [account.id])).rows[0];
    if (!backup) { await client.query('ROLLBACK'); return json({ error:'Wait for account sync to finish, then try again.' }, 409); }
    const calendar = connection.calendar_id, base = 'calendars/' + encodeURIComponent(calendar) + '/events';
    // Import a bounded date range; linked events outside it are checked individually.
    const now = new Date(), start = new Date(now), end = new Date(now);
    start.setUTCFullYear(now.getUTCFullYear()-1); end.setUTCFullYear(now.getUTCFullYear()+2);
    const events: any[] = []; let page = '';
    do {
      const data = await api(base + '?' + new URLSearchParams({ singleEvents:'true', showDeleted:'true', timeMin:start.toISOString(), timeMax:end.toISOString(), maxResults:'2500', ...(page ? { pageToken:page } : {}) }));
      events.push(...data.items || []); page = data.nextPageToken || '';
      if (events.length > 5000) throw Error('This calendar has too many events. Choose a smaller calendar to sync.');
    } while (page);
    const local = backup.data?.data?.local_data || {};
    const result = await reconcile({ owner:account.id, calendar, timeZone:connection.calendar_timezone || 'UTC', appointments:local.appts || [], deletedIds:local.trackerDeleted?.appts || [], links:connection.sync_state[calendar]?.links || {}, events,
      api:(method:string, id:string, body?:unknown, etag?:string)=>api(base + (id ? '/' + encodeURIComponent(id) : ''), method, body, etag) });
    const savedAt = new Date().toISOString();
    const nextBackup = { ...backup.data, last_synced_at:savedAt, data:{ ...backup.data.data, saved_at:savedAt, local_data:{ ...local, appts:result.appointments, trackerDeleted:{ ...local.trackerDeleted, appts:result.deletedIds } } } };
    await client.query(`UPDATE wellnest_records SET data=$3::jsonb, updated_date=now() WHERE entity='CloudDataBackup' AND id=$1 AND owner_id=$2`, [backup.id, account.id, JSON.stringify(nextBackup)]);
    await client.query('UPDATE wellnest_google_calendar SET sync_state=$2::jsonb, last_synced_at=$3 WHERE owner_id=$1', [account.id, JSON.stringify({ ...connection.sync_state, [calendar]:{ links:result.links } }), savedAt]);
    await client.query('COMMIT');
    return json({ lastSyncedAt:savedAt, count:result.appointments.length, partial:result.partial });
  } catch (error: any) {
    if (client) await client.query('ROLLBACK').catch(()=>{});
    if (action === 'callback') return redirect('failed');
    return json({ error:error?.status === 400 || error?.status === 401 ? 'Google access expired or was declined. Reconnect your Google account.' : 'Calendar sync could not finish. Try again, or reconnect Google if access has changed.' }, 503);
  } finally { client?.release(); }
};

export const config: Config = { path:['/api/calendar/status','/api/calendar/connect','/api/calendar/callback','/api/calendar/calendars','/api/calendar/select','/api/calendar/sync','/api/calendar/disconnect'] };
