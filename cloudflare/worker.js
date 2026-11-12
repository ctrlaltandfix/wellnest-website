var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare/worker.js
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __defProp22 = Object.defineProperty;
var __name22 = /* @__PURE__ */ __name2((target, value) => __defProp22(target, "name", { value, configurable: true }), "__name");
var __defProp222 = Object.defineProperty;
var __name222 = /* @__PURE__ */ __name22((target, value) => __defProp222(target, "name", { value, configurable: true }), "__name");
var __defProp2222 = Object.defineProperty;
var __name2222 = /* @__PURE__ */ __name222((target, value) => __defProp2222(target, "name", { value, configurable: true }), "__name");
var __defProp22222 = Object.defineProperty;
var __name22222 = /* @__PURE__ */ __name2222((target, value) => __defProp22222(target, "name", { value, configurable: true }), "__name");
var __defProp222222 = Object.defineProperty;
var __name222222 = /* @__PURE__ */ __name22222((target, value) => __defProp222222(target, "name", { value, configurable: true }), "__name");
var __defProp2222222 = Object.defineProperty;
var __name2222222 = /* @__PURE__ */ __name222222((target, value) => __defProp2222222(target, "name", { value, configurable: true }), "__name");
var SITE = "https://wellnest.services";
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://wellnest.services",
  "https://www.wellnest.services",
  "https://ctrlaltandfix.github.io",
  "https://wellnest.email-chrisgreenfield.workers.dev"
]);
var ACCESS_TTL = 3600;
function json(body2, status = 200, extra = {}) {
  return new Response(JSON.stringify(body2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", ...extra }
  });
}
__name(json, "json");
__name2(json, "json");
__name22(json, "json");
__name222(json, "json");
__name2222(json, "json");
__name22222(json, "json");
__name222222(json, "json");
__name2222222(json, "json");
var fail = /* @__PURE__ */ __name2222222((status, error, extra = {}) => json({ error, msg: error, error_description: error, ...extra }, status), "fail");
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With",
    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, ETag",
    "Access-Control-Max-Age": "600",
    Vary: "Origin"
  };
}
__name(corsHeaders, "corsHeaders");
__name2(corsHeaders, "corsHeaders");
__name22(corsHeaders, "corsHeaders");
__name222(corsHeaders, "corsHeaders");
__name2222(corsHeaders, "corsHeaders");
__name22222(corsHeaders, "corsHeaders");
__name222222(corsHeaders, "corsHeaders");
__name2222222(corsHeaders, "corsHeaders");
var enc = new TextEncoder();
function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64url, "b64url");
__name2(b64url, "b64url");
__name22(b64url, "b64url");
__name222(b64url, "b64url");
__name2222(b64url, "b64url");
__name22222(b64url, "b64url");
__name222222(b64url, "b64url");
__name2222222(b64url, "b64url");
function b64urlDecode(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
__name(b64urlDecode, "b64urlDecode");
__name2(b64urlDecode, "b64urlDecode");
__name22(b64urlDecode, "b64urlDecode");
__name222(b64urlDecode, "b64urlDecode");
__name2222(b64urlDecode, "b64urlDecode");
__name22222(b64urlDecode, "b64urlDecode");
__name222222(b64urlDecode, "b64urlDecode");
__name2222222(b64urlDecode, "b64urlDecode");
var randomToken = /* @__PURE__ */ __name2222222((n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n))), "randomToken");
var uuid = /* @__PURE__ */ __name2222222(() => crypto.randomUUID(), "uuid");
var now = /* @__PURE__ */ __name2222222(() => (/* @__PURE__ */ new Date()).toISOString(), "now");
async function sha256(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
__name2(sha256, "sha256");
__name22(sha256, "sha256");
__name222(sha256, "sha256");
__name2222(sha256, "sha256");
__name22222(sha256, "sha256");
__name222222(sha256, "sha256");
__name2222222(sha256, "sha256");
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
__name(timingSafeEqual, "timingSafeEqual");
__name2(timingSafeEqual, "timingSafeEqual");
__name22(timingSafeEqual, "timingSafeEqual");
__name222(timingSafeEqual, "timingSafeEqual");
__name2222(timingSafeEqual, "timingSafeEqual");
__name22222(timingSafeEqual, "timingSafeEqual");
__name222222(timingSafeEqual, "timingSafeEqual");
__name2222222(timingSafeEqual, "timingSafeEqual");
var PBKDF2_ITER = 1e5;
async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return b64url(bits);
}
__name(pbkdf2, "pbkdf2");
__name2(pbkdf2, "pbkdf2");
__name22(pbkdf2, "pbkdf2");
__name222(pbkdf2, "pbkdf2");
__name2222(pbkdf2, "pbkdf2");
__name22222(pbkdf2, "pbkdf2");
__name222222(pbkdf2, "pbkdf2");
__name2222222(pbkdf2, "pbkdf2");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64url(salt)}$${await pbkdf2(password, salt, PBKDF2_ITER)}`;
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
__name22(hashPassword, "hashPassword");
__name222(hashPassword, "hashPassword");
__name2222(hashPassword, "hashPassword");
__name22222(hashPassword, "hashPassword");
__name222222(hashPassword, "hashPassword");
__name2222222(hashPassword, "hashPassword");
async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [kind, iter, salt, hash] = stored.split("$");
  if (kind !== "pbkdf2") return false;
  return timingSafeEqual(await pbkdf2(password, b64urlDecode(salt), Number(iter)), hash);
}
__name(verifyPassword, "verifyPassword");
__name2(verifyPassword, "verifyPassword");
__name22(verifyPassword, "verifyPassword");
__name222(verifyPassword, "verifyPassword");
__name2222(verifyPassword, "verifyPassword");
__name22222(verifyPassword, "verifyPassword");
__name222222(verifyPassword, "verifyPassword");
__name2222222(verifyPassword, "verifyPassword");
var secretCache = null;
async function serverSecret(env) {
  if (secretCache) return secretCache;
  let row2 = await env.DB.prepare("SELECT value FROM config WHERE key = 'signing_secret'").first();
  if (!row2) {
    await env.DB.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('signing_secret', ?)").bind(randomToken(48)).run();
    row2 = await env.DB.prepare("SELECT value FROM config WHERE key = 'signing_secret'").first();
  }
  secretCache = row2.value;
  return secretCache;
}
__name(serverSecret, "serverSecret");
__name2(serverSecret, "serverSecret");
__name22(serverSecret, "serverSecret");
__name222(serverSecret, "serverSecret");
__name2222(serverSecret, "serverSecret");
__name22222(serverSecret, "serverSecret");
__name222222(serverSecret, "serverSecret");
__name2222222(serverSecret, "serverSecret");
async function hmacKey(env, purpose) {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(await serverSecret(env) + "|" + purpose),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(hmacKey, "hmacKey");
__name2(hmacKey, "hmacKey");
__name22(hmacKey, "hmacKey");
__name222(hmacKey, "hmacKey");
__name2222(hmacKey, "hmacKey");
__name22222(hmacKey, "hmacKey");
__name222222(hmacKey, "hmacKey");
__name2222222(hmacKey, "hmacKey");
async function hmac(env, purpose, text) {
  return b64url(await crypto.subtle.sign("HMAC", await hmacKey(env, purpose), enc.encode(text)));
}
__name(hmac, "hmac");
__name2(hmac, "hmac");
__name22(hmac, "hmac");
__name222(hmac, "hmac");
__name2222(hmac, "hmac");
__name22222(hmac, "hmac");
__name222222(hmac, "hmac");
__name2222222(hmac, "hmac");
async function hmacVerify(env, purpose, text, sig) {
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(env, purpose), b64urlDecode(sig), enc.encode(text));
  } catch {
    return false;
  }
}
__name(hmacVerify, "hmacVerify");
__name2(hmacVerify, "hmacVerify");
__name22(hmacVerify, "hmacVerify");
__name222(hmacVerify, "hmacVerify");
__name2222(hmacVerify, "hmacVerify");
__name22222(hmacVerify, "hmacVerify");
__name222222(hmacVerify, "hmacVerify");
__name2222222(hmacVerify, "hmacVerify");
async function signJwt(env, claims, ttl = ACCESS_TTL) {
  const iat = Math.floor(Date.now() / 1e3);
  const head = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body2 = b64url(enc.encode(JSON.stringify({ ...claims, iat, exp: iat + ttl })));
  return `${head}.${body2}.${await hmac(env, "jwt", `${head}.${body2}`)}`;
}
__name(signJwt, "signJwt");
__name2(signJwt, "signJwt");
__name22(signJwt, "signJwt");
__name222(signJwt, "signJwt");
__name2222(signJwt, "signJwt");
__name22222(signJwt, "signJwt");
__name222222(signJwt, "signJwt");
__name2222222(signJwt, "signJwt");
async function verifyJwt(env, token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) return null;
  if (!await hmacVerify(env, "jwt", `${parts[0]}.${parts[1]}`, parts[2])) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
    return claims.exp * 1e3 > Date.now() ? claims : null;
  } catch {
    return null;
  }
}
__name(verifyJwt, "verifyJwt");
__name2(verifyJwt, "verifyJwt");
__name22(verifyJwt, "verifyJwt");
__name222(verifyJwt, "verifyJwt");
__name2222(verifyJwt, "verifyJwt");
__name22222(verifyJwt, "verifyJwt");
__name222222(verifyJwt, "verifyJwt");
__name2222222(verifyJwt, "verifyJwt");
var ACCESS_TOKEN_TTL = ACCESS_TTL;
function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1];
  const c = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)nf_jwt=([^;]+)/);
  return c ? decodeURIComponent(c[1]) : null;
}
__name(bearer, "bearer");
__name2(bearer, "bearer");
__name22(bearer, "bearer");
__name222(bearer, "bearer");
__name2222(bearer, "bearer");
__name22222(bearer, "bearer");
__name222222(bearer, "bearer");
__name2222222(bearer, "bearer");
async function currentUser(env, request) {
  const claims = await verifyJwt(env, bearer(request));
  if (!claims?.sub) return null;
  return env.DB.prepare("SELECT * FROM users WHERE id = ? AND confirmed_at IS NOT NULL").bind(claims.sub).first();
}
__name(currentUser, "currentUser");
__name2(currentUser, "currentUser");
__name22(currentUser, "currentUser");
__name222(currentUser, "currentUser");
__name2222(currentUser, "currentUser");
__name22222(currentUser, "currentUser");
__name222222(currentUser, "currentUser");
__name2222222(currentUser, "currentUser");
var SCHEMA = [
  `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT,
     provider TEXT NOT NULL DEFAULT 'email', confirmed_at TEXT, confirmation_sent_at TEXT,
     full_name TEXT NOT NULL DEFAULT '', role TEXT NOT NULL DEFAULT 'user',
     data TEXT NOT NULL DEFAULT '{}', created_date TEXT NOT NULL, updated_date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tokens (
     token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     kind TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS tokens_user ON tokens(user_id, kind)`,
  `CREATE TABLE IF NOT EXISTS records (
     entity TEXT NOT NULL, id TEXT NOT NULL, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_date TEXT NOT NULL, updated_date TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}',
     PRIMARY KEY (entity, id))`,
  `CREATE INDEX IF NOT EXISTS records_owner ON records(entity, owner_id, created_date)`,
  `CREATE TABLE IF NOT EXISTS files (
     id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
     chunk_count INTEGER NOT NULL, created_date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS file_chunks (
     file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE, idx INTEGER NOT NULL, data BLOB NOT NULL,
     PRIMARY KEY (file_id, idx))`,
  `CREATE TABLE IF NOT EXISTS uploads (
     id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     name TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
     chunk_size INTEGER NOT NULL, chunk_count INTEGER NOT NULL, created_date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS upload_chunks (
     upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE, idx INTEGER NOT NULL, data BLOB NOT NULL,
     PRIMARY KEY (upload_id, idx))`,
  `CREATE TABLE IF NOT EXISTS waitlist (email TEXT PRIMARY KEY COLLATE NOCASE, name TEXT, list TEXT NOT NULL, created_date TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT NOT NULL, key TEXT NOT NULL, window INTEGER NOT NULL,
     hits INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (bucket, key, window))`,
  // Website traffic (cloudflare/analytics.js). No IP addresses are stored:
  // "visitor" is a hash that changes every day, "session" is per browser tab.
  `CREATE TABLE IF NOT EXISTS page_views (
     id TEXT PRIMARY KEY, ts INTEGER NOT NULL, day TEXT NOT NULL, path TEXT NOT NULL,
     country TEXT, source TEXT, campaign TEXT, device TEXT, browser TEXT,
     visitor TEXT NOT NULL, session TEXT NOT NULL, seconds INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS page_views_ts ON page_views (ts)`,
  // Edit WellNest previews (cloudflare/editor.js): unpublished page drafts, kept 24 hours.
  `CREATE TABLE IF NOT EXISTS editor_previews (
     id TEXT NOT NULL, path TEXT NOT NULL, content TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY (id, path))`
];
var schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map((sql) => env.DB.prepare(sql)));
  schemaReady = true;
}
__name(ensureSchema, "ensureSchema");
__name2(ensureSchema, "ensureSchema");
__name22(ensureSchema, "ensureSchema");
__name222(ensureSchema, "ensureSchema");
__name2222(ensureSchema, "ensureSchema");
__name22222(ensureSchema, "ensureSchema");
__name222222(ensureSchema, "ensureSchema");
__name2222222(ensureSchema, "ensureSchema");
async function rateLimited(env, request, bucket, limit, windowSeconds = 600, extraKey = "") {
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const key = await sha256(ip + "|" + extraKey.toLowerCase());
  const window = Math.floor(Date.now() / 1e3 / windowSeconds);
  const row2 = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, key, window, hits) VALUES (?, ?, ?, 1)
     ON CONFLICT (bucket, key, window) DO UPDATE SET hits = hits + 1 RETURNING hits`
  ).bind(bucket, key, window).first();
  if (Math.random() < 0.02) {
    await env.DB.prepare("DELETE FROM rate_limits WHERE window < ?").bind(window - 2).run();
  }
  return row2.hits > limit;
}
__name(rateLimited, "rateLimited");
__name2(rateLimited, "rateLimited");
__name22(rateLimited, "rateLimited");
__name222(rateLimited, "rateLimited");
__name2222(rateLimited, "rateLimited");
__name22222(rateLimited, "rateLimited");
__name222222(rateLimited, "rateLimited");
__name2222222(rateLimited, "rateLimited");
async function sendEmail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[email not sent: RESEND_API_KEY missing] to=${to} subject=${subject}
${text}`);
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM || "WellNest <hello@wellnest.services>", to: [to], subject, html, text })
  });
  if (!res.ok) console.error("Resend error", res.status, (await res.text()).slice(0, 300));
  return res.ok;
}
__name(sendEmail, "sendEmail");
__name2(sendEmail, "sendEmail");
__name22(sendEmail, "sendEmail");
__name222(sendEmail, "sendEmail");
__name2222(sendEmail, "sendEmail");
__name22222(sendEmail, "sendEmail");
__name222222(sendEmail, "sendEmail");
__name2222222(sendEmail, "sendEmail");
function emailLayout(title, body2, button, link) {
  const esc = /* @__PURE__ */ __name2222222((s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]), "esc");
  return `<!doctype html><html><body style="margin:0;background:#f3f6f1;font-family:Arial,Helvetica,sans-serif;color:#17332b">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:22px;font-weight:bold;color:#1f5c4a">wellnest</td></tr>
<tr><td style="padding-top:20px;font-size:20px;font-weight:bold">${esc(title)}</td></tr>
<tr><td style="padding-top:12px;font-size:15px;line-height:1.5">${esc(body2)}</td></tr>
${button ? `<tr><td style="padding-top:24px"><a href="${esc(link)}" style="display:inline-block;background:#1f5c4a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">${esc(button)}</a></td></tr>
<tr><td style="padding-top:16px;font-size:12px;color:#5b6f68;word-break:break-all">Or copy this link: ${esc(link)}</td></tr>` : ""}
<tr><td style="padding-top:24px;font-size:12px;color:#5b6f68">If you didn't ask for this, you can ignore this email.</td></tr>
</table></td></tr></table></body></html>`;
}
__name(emailLayout, "emailLayout");
__name2(emailLayout, "emailLayout");
__name22(emailLayout, "emailLayout");
__name222(emailLayout, "emailLayout");
__name2222(emailLayout, "emailLayout");
__name22222(emailLayout, "emailLayout");
__name222222(emailLayout, "emailLayout");
__name2222222(emailLayout, "emailLayout");
var REFRESH_TTL = 60 * 60 * 24 * 60;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var GOOGLE_CALLBACK = `${SITE}/api/auth/google/callback`;
function gotrueUser(u) {
  let meta = {};
  try {
    meta = JSON.parse(u.data || "{}");
  } catch {
  }
  return {
    id: u.id,
    aud: "",
    role: "",
    email: u.email,
    confirmed_at: u.confirmed_at,
    confirmation_sent_at: u.confirmation_sent_at,
    app_metadata: { provider: u.provider, roles: [u.role] },
    user_metadata: { full_name: u.full_name || meta.full_name || "", avatar_url: meta.avatar_url },
    created_at: u.created_date,
    updated_at: u.updated_date
  };
}
__name(gotrueUser, "gotrueUser");
__name2(gotrueUser, "gotrueUser");
__name22(gotrueUser, "gotrueUser");
__name222(gotrueUser, "gotrueUser");
__name2222(gotrueUser, "gotrueUser");
__name22222(gotrueUser, "gotrueUser");
__name222222(gotrueUser, "gotrueUser");
__name2222222(gotrueUser, "gotrueUser");
async function storeToken(env, userId, kind, ttlSeconds) {
  const token = randomToken(32);
  await env.DB.prepare("INSERT INTO tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)").bind(await sha256(token), userId, kind, Date.now() + ttlSeconds * 1e3).run();
  return token;
}
__name(storeToken, "storeToken");
__name2(storeToken, "storeToken");
__name22(storeToken, "storeToken");
__name222(storeToken, "storeToken");
__name2222(storeToken, "storeToken");
__name22222(storeToken, "storeToken");
__name222222(storeToken, "storeToken");
__name2222222(storeToken, "storeToken");
async function consumeToken(env, token, kind) {
  if (!token) return null;
  const row2 = await env.DB.prepare("DELETE FROM tokens WHERE token_hash = ? AND kind = ? RETURNING user_id, expires_at").bind(await sha256(token), kind).first();
  if (!row2 || row2.expires_at < Date.now()) return null;
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row2.user_id).first();
}
__name(consumeToken, "consumeToken");
__name2(consumeToken, "consumeToken");
__name22(consumeToken, "consumeToken");
__name222(consumeToken, "consumeToken");
__name2222(consumeToken, "consumeToken");
__name22222(consumeToken, "consumeToken");
__name222222(consumeToken, "consumeToken");
__name2222222(consumeToken, "consumeToken");
async function renewRefreshToken(env, token) {
  if (!token) return null;
  const row2 = await env.DB.prepare("UPDATE tokens SET expires_at = ? WHERE token_hash = ? AND kind = 'refresh' AND expires_at > ? RETURNING user_id").bind(Date.now() + REFRESH_TTL * 1e3, await sha256(String(token)), Date.now()).first();
  return row2 && env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row2.user_id).first();
}
__name(renewRefreshToken, "renewRefreshToken");
__name2(renewRefreshToken, "renewRefreshToken");
__name22(renewRefreshToken, "renewRefreshToken");
__name222(renewRefreshToken, "renewRefreshToken");
__name2222(renewRefreshToken, "renewRefreshToken");
__name22222(renewRefreshToken, "renewRefreshToken");
__name222222(renewRefreshToken, "renewRefreshToken");
__name2222222(renewRefreshToken, "renewRefreshToken");
async function issueSession(env, user) {
  const g = gotrueUser(user);
  const access = await signJwt(env, { sub: user.id, email: user.email, aud: "", app_metadata: g.app_metadata, user_metadata: g.user_metadata });
  const refresh = await storeToken(env, user.id, "refresh", REFRESH_TTL);
  return { access_token: access, token_type: "bearer", expires_in: ACCESS_TOKEN_TTL, refresh_token: refresh };
}
__name(issueSession, "issueSession");
__name2(issueSession, "issueSession");
__name22(issueSession, "issueSession");
__name222(issueSession, "issueSession");
__name2222(issueSession, "issueSession");
__name22222(issueSession, "issueSession");
__name222222(issueSession, "issueSession");
__name2222222(issueSession, "issueSession");
async function readBody(request) {
  const type = request.headers.get("Content-Type") || "";
  if (type.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(await request.text()));
  try {
    return await request.json();
  } catch {
    return {};
  }
}
__name(readBody, "readBody");
__name2(readBody, "readBody");
__name22(readBody, "readBody");
__name222(readBody, "readBody");
__name2222(readBody, "readBody");
__name22222(readBody, "readBody");
__name222222(readBody, "readBody");
__name2222222(readBody, "readBody");
function linkFor(kind, token) {
  return `${SITE}/login#${kind}=${encodeURIComponent(token)}`;
}
__name(linkFor, "linkFor");
__name2(linkFor, "linkFor");
__name22(linkFor, "linkFor");
__name222(linkFor, "linkFor");
__name2222(linkFor, "linkFor");
__name22222(linkFor, "linkFor");
__name222222(linkFor, "linkFor");
__name2222222(linkFor, "linkFor");
async function sendConfirmation(env, user) {
  const token = await storeToken(env, user.id, "confirm", 60 * 60 * 24);
  await env.DB.prepare("UPDATE users SET confirmation_sent_at = ? WHERE id = ?").bind(now(), user.id).run();
  const link = linkFor("confirmation_token", token);
  return sendEmail(env, {
    to: user.email,
    subject: "Confirm your WellNest account",
    html: emailLayout("Confirm your email", "Tap the button below to confirm your email and finish setting up your WellNest account.", "Confirm my email", link),
    text: `Confirm your WellNest account: ${link}`
  });
}
__name(sendConfirmation, "sendConfirmation");
__name2(sendConfirmation, "sendConfirmation");
__name22(sendConfirmation, "sendConfirmation");
__name222(sendConfirmation, "sendConfirmation");
__name2222(sendConfirmation, "sendConfirmation");
__name22222(sendConfirmation, "sendConfirmation");
__name222222(sendConfirmation, "sendConfirmation");
__name2222222(sendConfirmation, "sendConfirmation");
function safeRedirect(target) {
  try {
    if (typeof target === "string" && (target.startsWith("wellnest://") || target.startsWith("wellnest:"))) {
      return target;
    }
    const u = new URL(target);
    if (ALLOWED_ORIGINS.has(u.origin)) return u.origin + u.pathname;
  } catch {
  }
  return `${SITE}/login`;
}
__name(safeRedirect, "safeRedirect");
__name2(safeRedirect, "safeRedirect");
__name22(safeRedirect, "safeRedirect");
__name222(safeRedirect, "safeRedirect");
__name2222(safeRedirect, "safeRedirect");
__name22222(safeRedirect, "safeRedirect");
__name222222(safeRedirect, "safeRedirect");
__name2222222(safeRedirect, "safeRedirect");
async function handleIdentity(request, env, path) {
  const method = request.method;
  if (path === "/settings" && method === "GET") {
    return json({
      external: { google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), github: false, gitlab: false, bitbucket: false, facebook: false, email: true, saml: false },
      external_labels: {},
      disable_signup: false,
      autoconfirm: false
    });
  }
  if (path === "/signup" && method === "POST") {
    const body2 = await readBody(request);
    const email = String(body2.email || "").trim().toLowerCase();
    const password = String(body2.password || "");
    if (await rateLimited(env, request, "signup", 10)) return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    if (!EMAIL_RE.test(email)) return fail(422, "Please enter a valid email address.");
    if (password.length < 8) return fail(422, "Password should be at least 8 characters.");
    const fullName = String(body2.data?.full_name || body2.data?.name || "").slice(0, 120);
    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (user?.confirmed_at) return fail(422, "A user with this email address has already been registered");
    const t = now();
    if (user) {
      await env.DB.prepare("UPDATE users SET password_hash = ?, full_name = COALESCE(NULLIF(?, ''), full_name), updated_date = ? WHERE id = ?").bind(await hashPassword(password), fullName, t, user.id).run();
    } else {
      await env.DB.prepare(`INSERT INTO users (id, email, password_hash, provider, full_name, data, created_date, updated_date)
        VALUES (?, ?, ?, 'email', ?, ?, ?, ?)`).bind(uuid(), email, await hashPassword(password), fullName, JSON.stringify({ full_name: fullName }), t, t).run();
    }
    user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!await sendConfirmation(env, user)) return fail(500, "We couldn't send your confirmation email. Please try again shortly.");
    user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
    return json(gotrueUser(user));
  }
  if (path === "/verify" && method === "POST") {
    const body2 = await readBody(request);
    const type = body2.type || "signup";
    if (await rateLimited(env, request, "verify", 20)) return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    if (type === "signup") {
      const user = await consumeToken(env, body2.token, "confirm");
      if (!user) return fail(404, "This confirmation link is invalid or has expired. Please sign up again to get a new one.");
      await env.DB.prepare("UPDATE users SET confirmed_at = COALESCE(confirmed_at, ?), updated_date = ? WHERE id = ?").bind(now(), now(), user.id).run();
      const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
      return json(await issueSession(env, fresh));
    }
    if (type === "recovery") {
      const user = await consumeToken(env, body2.token, "recovery");
      if (!user) return fail(404, "This reset link is invalid or has expired. Please request a new one.");
      await env.DB.prepare("UPDATE users SET confirmed_at = COALESCE(confirmed_at, ?) WHERE id = ?").bind(now(), user.id).run();
      const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
      return json(await issueSession(env, fresh));
    }
    return fail(400, "Unsupported verification type.");
  }
  if (path === "/token" && method === "POST") {
    const body2 = await readBody(request);
    if (body2.grant_type === "password") {
      const email = String(body2.username || "").trim().toLowerCase();
      if (await rateLimited(env, request, "login", 10, 600, email)) {
        return json({ error: "too_many_requests", error_description: "Too many sign-in attempts. Please wait a few minutes and try again." }, 429);
      }
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
      if (!user || !await verifyPassword(String(body2.password || ""), user.password_hash)) {
        return json({ error: "invalid_grant", error_description: "No user found with that email, or password invalid." }, 400);
      }
      if (!user.confirmed_at) {
        return json({ error: "invalid_grant", error_description: "Email not confirmed" }, 400);
      }
      return json(await issueSession(env, user));
    }
    if (body2.grant_type === "refresh_token") {
      const user = await renewRefreshToken(env, body2.refresh_token);
      if (!user || !user.confirmed_at) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
      const g = gotrueUser(user);
      const access = await signJwt(env, { sub: user.id, email: user.email, aud: "", app_metadata: g.app_metadata, user_metadata: g.user_metadata });
      return json({ access_token: access, token_type: "bearer", expires_in: ACCESS_TOKEN_TTL, refresh_token: body2.refresh_token });
    }
    return json({ error: "unsupported_grant_type", error_description: "Unsupported grant type" }, 400);
  }
  if (path === "/user") {
    const claims = await verifyJwt(env, bearer(request));
    const user = claims && await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(claims.sub).first();
    if (!user) return fail(401, "Invalid token");
    if (method === "GET") return json(gotrueUser(user));
    if (method === "PUT") {
      const body2 = await readBody(request);
      const t = now();
      if (body2.password !== void 0) {
        if (String(body2.password).length < 8) return fail(422, "Password should be at least 8 characters.");
        await env.DB.prepare("UPDATE users SET password_hash = ?, updated_date = ? WHERE id = ?").bind(await hashPassword(String(body2.password)), t, user.id).run();
        await env.DB.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = 'refresh'").bind(user.id).run();
      }
      if (body2.data && typeof body2.data === "object") {
        const fullName = body2.data.full_name !== void 0 ? String(body2.data.full_name).slice(0, 120) : null;
        await env.DB.prepare("UPDATE users SET full_name = COALESCE(?, full_name), data = json_patch(data, ?), updated_date = ? WHERE id = ?").bind(fullName, JSON.stringify({ full_name: fullName ?? void 0, avatar_url: body2.data.avatar_url }), t, user.id).run();
      }
      const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
      return json(gotrueUser(fresh));
    }
  }
  if (path === "/logout" && method === "POST") {
    const claims = await verifyJwt(env, bearer(request));
    if (claims?.sub) await env.DB.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = 'refresh'").bind(claims.sub).run();
    return new Response(null, { status: 204 });
  }
  if (path === "/recover" && method === "POST") {
    const body2 = await readBody(request);
    const email = String(body2.email || "").trim().toLowerCase();
    if (await rateLimited(env, request, "recover", 5, 600, email)) return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    const user = EMAIL_RE.test(email) && await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (user) {
      const token = await storeToken(env, user.id, "recovery", 60 * 60);
      const link = linkFor("recovery_token", token);
      await sendEmail(env, {
        to: user.email,
        subject: "Reset your WellNest password",
        html: emailLayout("Reset your password", "Tap the button below to choose a new password for your WellNest account. The link works for one hour.", "Choose a new password", link),
        text: `Reset your WellNest password: ${link}`
      });
    }
    return json({});
  }
  if (path === "/authorize" && method === "GET") {
    const url = new URL(request.url);
    if (url.searchParams.get("provider") !== "google" || !env.GOOGLE_CLIENT_ID) return fail(400, "Unsupported sign-in provider.");
    const state = await signJwt(env, { purpose: "google", rt: safeRedirect(url.searchParams.get("redirect_to") || ""), n: randomToken(8) }, 600);
    const consent = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    consent.search = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state
    }).toString();
    return Response.redirect(consent.toString(), 302);
  }
  return fail(404, "Not found");
}
__name(handleIdentity, "handleIdentity");
__name2(handleIdentity, "handleIdentity");
__name22(handleIdentity, "handleIdentity");
__name222(handleIdentity, "handleIdentity");
__name2222(handleIdentity, "handleIdentity");
__name22222(handleIdentity, "handleIdentity");
__name222222(handleIdentity, "handleIdentity");
__name2222222(handleIdentity, "handleIdentity");
async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const state = await verifyJwt(env, url.searchParams.get("state"));
  const back = /* @__PURE__ */ __name2222222((target2, hash) => {
    const dest = `${target2}#${hash}`;
    return new Response(null, { status: 302, headers: { "Location": dest } });
  }, "back");
  const target = state?.purpose === "google" ? state.rt : `${SITE}/login`;
  if (!state || state.purpose !== "google") return back(target, "error=access_denied&error_description=" + encodeURIComponent("Sign-in expired. Please try again."));
  if (url.searchParams.get("error")) return back(target, "error=access_denied&error_description=" + encodeURIComponent("Google sign-in was cancelled."));
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: url.searchParams.get("code") || "",
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK,
        grant_type: "authorization_code"
      })
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.id_token) throw new Error("token exchange failed");
    const profile = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(tokens.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
    ));
    if (profile.aud !== env.GOOGLE_CLIENT_ID || !profile.email || profile.email_verified !== true) throw new Error("unverified email");
    const email = String(profile.email).toLowerCase();
    const t = now();
    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user) {
      await env.DB.prepare(`INSERT INTO users (id, email, provider, confirmed_at, full_name, data, created_date, updated_date)
        VALUES (?, ?, 'google', ?, ?, ?, ?, ?)`).bind(uuid(), email, t, String(profile.name || "").slice(0, 120), JSON.stringify({ full_name: profile.name || "", avatar_url: profile.picture }), t, t).run();
    } else if (!user.confirmed_at) {
      await env.DB.prepare("UPDATE users SET confirmed_at = ?, password_hash = NULL, updated_date = ? WHERE id = ?").bind(t, t, user.id).run();
    }
    user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    const s = await issueSession(env, user);
    return back(state.rt, new URLSearchParams({ access_token: s.access_token, token_type: "bearer", expires_in: String(s.expires_in), refresh_token: s.refresh_token }).toString());
  } catch (e) {
    console.error("Google sign-in failed", e?.message);
    return back(target, "error=server_error&error_description=" + encodeURIComponent("Google sign-in didn't work. Please try again."));
  }
}
__name(handleGoogleCallback, "handleGoogleCallback");
__name2(handleGoogleCallback, "handleGoogleCallback");
__name22(handleGoogleCallback, "handleGoogleCallback");
__name222(handleGoogleCallback, "handleGoogleCallback");
__name2222(handleGoogleCallback, "handleGoogleCallback");
__name22222(handleGoogleCallback, "handleGoogleCallback");
__name222222(handleGoogleCallback, "handleGoogleCallback");
__name2222222(handleGoogleCallback, "handleGoogleCallback");
var BOTS = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|monitor|curl|wget|python|axios|node-fetch/i;
var DAY = 864e5;
var MAX_SECONDS = 1800;
var clip = /* @__PURE__ */ __name2222222((v, n) => typeof v === "string" ? v.slice(0, n) : "", "clip");
function cleanPath(p) {
  let path = clip(p, 300).split(/[?#]/)[0] || "/";
  if (!path.startsWith("/")) return null;
  path = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path.slice(0, 200);
}
__name(cleanPath, "cleanPath");
__name2(cleanPath, "cleanPath");
__name22(cleanPath, "cleanPath");
__name222(cleanPath, "cleanPath");
__name2222(cleanPath, "cleanPath");
__name22222(cleanPath, "cleanPath");
__name222222(cleanPath, "cleanPath");
__name2222222(cleanPath, "cleanPath");
function deviceOf(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "Tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "Mobile";
  return "Desktop";
}
__name(deviceOf, "deviceOf");
__name2(deviceOf, "deviceOf");
__name22(deviceOf, "deviceOf");
__name222(deviceOf, "deviceOf");
__name2222(deviceOf, "deviceOf");
__name22222(deviceOf, "deviceOf");
__name222222(deviceOf, "deviceOf");
__name2222222(deviceOf, "deviceOf");
function browserOf(ua) {
  if (/Edg\//.test(ua)) return "Edge";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome|CriOS/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return "Other";
}
__name(browserOf, "browserOf");
__name2(browserOf, "browserOf");
__name22(browserOf, "browserOf");
__name222(browserOf, "browserOf");
__name2222(browserOf, "browserOf");
__name22222(browserOf, "browserOf");
__name222222(browserOf, "browserOf");
__name2222222(browserOf, "browserOf");
function sourceOf(referrer, utmSource, ownHost) {
  const utm = clip(utmSource, 60).trim().toLowerCase();
  if (utm) return utm;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === ownHost || host === "wellnest.services" || host.endsWith(".wellnest.services")) return null;
    if (!host) return "Direct";
    if (/(^|\.)google\./.test(host)) return "google";
    if (/(^|\.)bing\.com$/.test(host)) return "bing";
    if (/facebook\.com$|fb\.me$/.test(host)) return "facebook";
    if (/instagram\.com$/.test(host)) return "instagram";
    if (/^t\.co$|twitter\.com$|x\.com$/.test(host)) return "x";
    if (/reddit\.com$/.test(host)) return "reddit";
    if (/linkedin\.com$|lnkd\.in$/.test(host)) return "linkedin";
    if (/chatgpt\.com$|openai\.com$/.test(host)) return "chatgpt";
    return host.slice(0, 80);
  } catch {
    return "Direct";
  }
}
__name(sourceOf, "sourceOf");
__name2(sourceOf, "sourceOf");
__name22(sourceOf, "sourceOf");
__name222(sourceOf, "sourceOf");
__name2222(sourceOf, "sourceOf");
__name22222(sourceOf, "sourceOf");
__name222222(sourceOf, "sourceOf");
__name2222222(sourceOf, "sourceOf");
async function handleCollect(request, env) {
  if (request.method !== "POST") return fail(405, "Method not allowed");
  const ua = request.headers.get("User-Agent") || "";
  if (!ua || BOTS.test(ua)) return new Response(null, { status: 204 });
  let body2;
  try {
    body2 = JSON.parse((await request.text()).slice(0, 4e3));
  } catch {
    return fail(400, "Invalid request");
  }
  const id = clip(body2?.id, 40);
  if (!/^[A-Za-z0-9-]{8,40}$/.test(id)) return fail(400, "Invalid request");
  if (body2.t === "l") {
    const seconds = Math.max(0, Math.min(MAX_SECONDS, Math.round(Number(body2.d) || 0)));
    if (seconds) {
      await env.DB.prepare("UPDATE page_views SET seconds = ? WHERE id = ? AND seconds < ? AND ts > ?").bind(seconds, id, seconds, Date.now() - DAY).run();
    }
    return new Response(null, { status: 204 });
  }
  if (body2.t !== "v") return fail(400, "Invalid request");
  const path = cleanPath(body2.p);
  const session = clip(body2.s, 40);
  if (!path || !/^[A-Za-z0-9-]{8,40}$/.test(session)) return fail(400, "Invalid request");
  if (await rateLimited(env, request, "analytics", 200, 600)) return new Response(null, { status: 204 });
  const ts = Date.now();
  const day = new Date(ts).toISOString().slice(0, 10);
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const visitor = (await hmac(env, "visitor", `${day}|${ip}|${ua}`)).slice(0, 22);
  const host = new URL(request.url).hostname;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO page_views (id, ts, day, path, country, source, campaign, device, browser, visitor, session)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    ts,
    day,
    path,
    clip(request.cf?.country, 2) || "XX",
    sourceOf(clip(body2.r, 500), body2.u, host),
    clip(body2.c, 80).trim().toLowerCase() || null,
    deviceOf(ua),
    browserOf(ua),
    visitor,
    session
  ).run();
  if (Math.random() < 0.01) {
    await env.DB.prepare("DELETE FROM page_views WHERE ts < ?").bind(ts - 400 * DAY).run();
  }
  return new Response(null, { status: 204 });
}
__name(handleCollect, "handleCollect");
__name2(handleCollect, "handleCollect");
__name22(handleCollect, "handleCollect");
__name222(handleCollect, "handleCollect");
__name2222(handleCollect, "handleCollect");
__name22222(handleCollect, "handleCollect");
__name222222(handleCollect, "handleCollect");
__name2222222(handleCollect, "handleCollect");
async function isAnalyticsAdmin(env, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const hashes = String(env.ADMIN_EMAIL_SHA256 || "").toLowerCase().split(/[\s,;]+/).filter(Boolean);
  if (hashes.length && hashes.includes(await sha256(String(user.email || "").trim().toLowerCase()))) return true;
  const allowed = String(env.ADMIN_EMAILS || "").split(/[\s,;]+/).map((s) => s.replace(/^["'<\[]+|["'>\]]+$/g, "").trim().toLowerCase()).filter(Boolean);
  return allowed.includes(String(user.email || "").toLowerCase());
}
__name(isAnalyticsAdmin, "isAnalyticsAdmin");
__name2(isAnalyticsAdmin, "isAnalyticsAdmin");
__name22(isAnalyticsAdmin, "isAnalyticsAdmin");
__name222(isAnalyticsAdmin, "isAnalyticsAdmin");
__name2222(isAnalyticsAdmin, "isAnalyticsAdmin");
__name22222(isAnalyticsAdmin, "isAnalyticsAdmin");
__name222222(isAnalyticsAdmin, "isAnalyticsAdmin");
__name2222222(isAnalyticsAdmin, "isAnalyticsAdmin");
async function handleStats(request, env, user) {
  if (!await isAnalyticsAdmin(env, user)) {
    return fail(403, "This account can't see site statistics. Add its email to ADMIN_EMAILS in Cloudflare.", {
      signed_in_as: user?.email || null,
      admin_emails_set: Boolean(String(env.ADMIN_EMAILS || env.ADMIN_EMAIL_SHA256 || "").trim())
    });
  }
  const url = new URL(request.url);
  const days = Math.max(1, Math.min(365, Math.round(Number(url.searchParams.get("days")) || 30)));
  const tz = Math.max(-840, Math.min(840, Math.round(Number(url.searchParams.get("tz")) || 0)));
  const now2 = Date.now();
  const since = now2 - days * DAY;
  const prevSince = since - days * DAY;
  const bucket = days <= 2 ? 36e5 : DAY;
  const off = tz * 6e4;
  const db = env.DB;
  const totalsSql = `
    SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT session) AS sessions,
      (SELECT ROUND(AVG(t), 1) FROM (SELECT SUM(seconds) AS t FROM page_views WHERE ts >= ?1 AND ts < ?2 GROUP BY session)) AS avg_session_seconds,
      (SELECT ROUND(100.0 * SUM(n = 1) / COUNT(*), 1) FROM (SELECT COUNT(*) AS n FROM page_views WHERE ts >= ?1 AND ts < ?2 GROUP BY session)) AS bounce_rate
    FROM page_views WHERE ts >= ?1 AND ts < ?2`;
  const top = /* @__PURE__ */ __name2222222((col, limit = 10) => db.prepare(
    `SELECT ${col} AS name, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views
     FROM page_views WHERE ts >= ? AND ${col} IS NOT NULL GROUP BY ${col} ORDER BY visitors DESC, views DESC LIMIT ${limit}`
  ).bind(since), "top");
  const [totals, prev, series, pages, countries, sources, campaigns, devices, browsers, live] = await db.batch([
    db.prepare(totalsSql).bind(since, now2 + 1),
    db.prepare(totalsSql).bind(prevSince, since),
    db.prepare(
      `SELECT CAST((ts + ?1) / ?2 AS INTEGER) * ?2 - ?1 AS t, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM page_views WHERE ts >= ?3 GROUP BY 1 ORDER BY 1`
    ).bind(off, bucket, since),
    db.prepare(
      `SELECT path AS name, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors,
         ROUND(AVG(CASE WHEN seconds > 0 THEN seconds END), 0) AS avg_seconds
       FROM page_views WHERE ts >= ? GROUP BY path ORDER BY views DESC LIMIT 25`
    ).bind(since),
    top("country", 25),
    top("source", 15),
    db.prepare(
      `SELECT campaign AS name, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views
       FROM page_views WHERE ts >= ? AND campaign IS NOT NULL GROUP BY campaign ORDER BY visitors DESC LIMIT 10`
    ).bind(since),
    top("device", 5),
    top("browser", 8),
    // People active in the last 5 minutes (one person with two tabs counts once).
    db.prepare("SELECT COUNT(DISTINCT visitor) AS n FROM page_views WHERE ts >= ?").bind(now2 - 5 * 6e4)
  ]);
  return json({
    days,
    bucket,
    tz,
    generated: new Date(now2).toISOString(),
    totals: totals.results[0],
    previous: prev.results[0],
    series: series.results,
    pages: pages.results,
    countries: countries.results,
    sources: sources.results,
    campaigns: campaigns.results,
    devices: devices.results,
    browsers: browsers.results,
    live: live.results[0]?.n || 0
  });
}
__name(handleStats, "handleStats");
__name2(handleStats, "handleStats");
__name22(handleStats, "handleStats");
__name222(handleStats, "handleStats");
__name2222(handleStats, "handleStats");
__name22222(handleStats, "handleStats");
__name222222(handleStats, "handleStats");
__name2222222(handleStats, "handleStats");
var GH_BASE = "/wellnest-website";
function stripBase(text) {
  return text.split("\\/wellnest-website").join("").split(GH_BASE + "/").join("/").split(GH_BASE).join("");
}
__name(stripBase, "stripBase");
__name2(stripBase, "stripBase");
__name22(stripBase, "stripBase");
__name222(stripBase, "stripBase");
__name2222(stripBase, "stripBase");
__name22222(stripBase, "stripBase");
__name222222(stripBase, "stripBase");
__name2222222(stripBase, "stripBase");
var INDEXNOW_KEY = "d1fda5e2b1c74046813bc420e8dbe005";
var ENDPOINT = "https://api.indexnow.org/indexnow";
var HOST = new URL(SITE).host;
function pageUrl(path) {
  if (!/\.html$/.test(path) || /^(admin|assets|404)/.test(path)) return null;
  const slug = path.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
  return SITE + "/" + slug;
}
__name(pageUrl, "pageUrl");
__name2(pageUrl, "pageUrl");
__name22(pageUrl, "pageUrl");
__name222(pageUrl, "pageUrl");
__name2222(pageUrl, "pageUrl");
__name22222(pageUrl, "pageUrl");
__name222222(pageUrl, "pageUrl");
__name2222222(pageUrl, "pageUrl");
async function submitIndexNow(urls) {
  const list = [...new Set(urls.filter((u) => typeof u === "string" && u.startsWith(SITE + "/")))].slice(0, 1e4);
  if (!list.length) return { submitted: 0, status: null };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: list }),
    signal: AbortSignal.timeout(15e3)
  });
  return { submitted: list.length, status: res.status, ok: res.status === 200 || res.status === 202, detail: res.ok ? void 0 : (await res.text()).slice(0, 300) };
}
__name(submitIndexNow, "submitIndexNow");
__name2(submitIndexNow, "submitIndexNow");
__name22(submitIndexNow, "submitIndexNow");
__name222(submitIndexNow, "submitIndexNow");
__name2222(submitIndexNow, "submitIndexNow");
__name22222(submitIndexNow, "submitIndexNow");
__name222222(submitIndexNow, "submitIndexNow");
__name2222222(submitIndexNow, "submitIndexNow");
async function sitemapUrls(env, origin) {
  const res = await env.ASSETS.fetch(new Request(origin + "/sitemap.xml"));
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}
__name(sitemapUrls, "sitemapUrls");
__name2(sitemapUrls, "sitemapUrls");
__name22(sitemapUrls, "sitemapUrls");
__name222(sitemapUrls, "sitemapUrls");
__name2222(sitemapUrls, "sitemapUrls");
__name22222(sitemapUrls, "sitemapUrls");
__name222222(sitemapUrls, "sitemapUrls");
__name2222222(sitemapUrls, "sitemapUrls");
async function handleIndexNow(request, env, user) {
  if (!await isAnalyticsAdmin(env, user)) return fail(403, "Only site admins can do this.");
  if (request.method !== "POST") return fail(405, "Use POST.");
  let body2 = {};
  try {
    body2 = await request.json();
  } catch {
  }
  const urls = Array.isArray(body2.urls) && body2.urls.length ? body2.urls : await sitemapUrls(env, new URL(request.url).origin);
  return json(await submitIndexNow(urls));
}
__name(handleIndexNow, "handleIndexNow");
__name2(handleIndexNow, "handleIndexNow");
__name22(handleIndexNow, "handleIndexNow");
__name222(handleIndexNow, "handleIndexNow");
__name2222(handleIndexNow, "handleIndexNow");
__name22222(handleIndexNow, "handleIndexNow");
__name222222(handleIndexNow, "handleIndexNow");
__name2222222(handleIndexNow, "handleIndexNow");
function sitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => ({
    url: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1]?.trim(),
    lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1]?.trim() || ""
  })).filter((e) => e.url);
}
__name(sitemapEntries, "sitemapEntries");
__name2(sitemapEntries, "sitemapEntries");
__name22(sitemapEntries, "sitemapEntries");
__name222(sitemapEntries, "sitemapEntries");
__name2222(sitemapEntries, "sitemapEntries");
__name22222(sitemapEntries, "sitemapEntries");
__name222222(sitemapEntries, "sitemapEntries");
__name2222222(sitemapEntries, "sitemapEntries");
async function scheduledIndexNow(env) {
  const res = await env.ASSETS.fetch(new Request(SITE + "/sitemap.xml"));
  if (!res.ok) return { submitted: 0, status: null };
  const entries = sitemapEntries(discoveryText(await res.text(), "/sitemap.xml"));
  const row2 = await env.DB.prepare("SELECT value FROM config WHERE key = 'indexnow_sent'").first();
  let sent = {};
  try {
    sent = JSON.parse(row2?.value || "{}");
  } catch {
  }
  const changed = entries.filter((e) => sent[e.url] !== e.lastmod);
  if (!changed.length) return { submitted: 0, status: null };
  const result = await submitIndexNow(changed.map((e) => e.url));
  if (result.ok) {
    const next = {};
    for (const e of entries) next[e.url] = changed.includes(e) ? e.lastmod : sent[e.url];
    await env.DB.prepare("INSERT INTO config (key, value) VALUES ('indexnow_sent', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(JSON.stringify(next)).run();
  } else console.error("IndexNow", result.status, result.detail);
  return result;
}
__name(scheduledIndexNow, "scheduledIndexNow");
__name2(scheduledIndexNow, "scheduledIndexNow");
__name22(scheduledIndexNow, "scheduledIndexNow");
__name222(scheduledIndexNow, "scheduledIndexNow");
__name2222(scheduledIndexNow, "scheduledIndexNow");
__name22222(scheduledIndexNow, "scheduledIndexNow");
__name222222(scheduledIndexNow, "scheduledIndexNow");
__name2222222(scheduledIndexNow, "scheduledIndexNow");
var REPO = "ctrlaltandfix/wellnest-website";
var BRANCH = "main";
var MAX_FILE = 4e5;
var MAX_READ_ROUNDS = 4;
var BLOCKED_PREFIX = ["cloudflare/", "tools/", "tests/", "netlify/", ".github/", "node_modules/", "assets/", "admin/", "dist-cloudflare/", ".wrangler/"];
var BLOCKED_FILE = /* @__PURE__ */ new Set(["wrangler.jsonc", "package.json", "package-lock.json", ".gitignore", ".assetsignore", "github-pages-bridge.ts", "netlify.toml", ".nojekyll"]);
var EDITABLE_EXT = /\.(html|css|txt|xml|svg|md|json|webmanifest)$/i;
function editable(path) {
  if (typeof path !== "string" || !path || path.length > 200) return false;
  if (path.startsWith("/") || path.includes("..") || path.includes("\\") || /[\0-\x1f]/.test(path)) return false;
  if (BLOCKED_FILE.has(path) || BLOCKED_PREFIX.some((p) => path.startsWith(p))) return false;
  return EDITABLE_EXT.test(path);
}
__name(editable, "editable");
__name2(editable, "editable");
__name22(editable, "editable");
__name222(editable, "editable");
__name2222(editable, "editable");
__name22222(editable, "editable");
__name222222(editable, "editable");
__name2222222(editable, "editable");
var APP_FILE = /^assets\/index[A-Za-z0-9._-]*\.js$/;
var MAX_APP_FILE = 19e5;
function mirrorOf(path, tree) {
  let m = path.match(/^(.+)\.html$/);
  if (m && !m[1].endsWith("/index") && tree.has(m[1] + "/index.html")) return m[1] + "/index.html";
  m = path.match(/^(.+)\/index\.html$/);
  if (m && tree.has(m[1] + ".html")) return m[1] + ".html";
  return null;
}
__name(mirrorOf, "mirrorOf");
__name2(mirrorOf, "mirrorOf");
__name22(mirrorOf, "mirrorOf");
__name222(mirrorOf, "mirrorOf");
__name2222(mirrorOf, "mirrorOf");
__name22222(mirrorOf, "mirrorOf");
__name222222(mirrorOf, "mirrorOf");
__name2222222(mirrorOf, "mirrorOf");
async function gh(env, path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "wellnest-editor",
      ...init.body ? { "Content-Type": "application/json" } : {}
    }
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    let reason = text;
    try {
      reason = JSON.parse(text).message || text;
    } catch {
    }
    const err = new Error(`GitHub ${res.status}: ${reason}`);
    err.reason = reason;
    err.status = res.status === 401 || res.status === 403 ? 502 : res.status === 404 ? 404 : 502;
    err.github = res.status;
    throw err;
  }
  return res.json();
}
__name(gh, "gh");
__name2(gh, "gh");
__name22(gh, "gh");
__name222(gh, "gh");
__name2222(gh, "gh");
__name22222(gh, "gh");
__name222222(gh, "gh");
__name2222222(gh, "gh");
function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
__name(b64decode, "b64decode");
__name2(b64decode, "b64decode");
__name22(b64decode, "b64decode");
__name222(b64decode, "b64decode");
__name2222(b64decode, "b64decode");
__name22222(b64decode, "b64decode");
__name222222(b64decode, "b64decode");
__name2222222(b64decode, "b64decode");
async function listTree(env) {
  const t = await gh(env, `/git/trees/${BRANCH}?recursive=1`);
  return t.tree.filter((e) => e.type === "blob").map((e) => ({ path: e.path, sha: e.sha, size: e.size }));
}
__name(listTree, "listTree");
__name2(listTree, "listTree");
__name22(listTree, "listTree");
__name222(listTree, "listTree");
__name2222(listTree, "listTree");
__name22222(listTree, "listTree");
__name222222(listTree, "listTree");
__name2222222(listTree, "listTree");
async function readFile(env, path) {
  const f = await gh(env, `/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${BRANCH}`);
  if (Array.isArray(f) || f.type !== "file") throw Object.assign(new Error("Not a file"), { status: 404 });
  if (f.size > MAX_FILE) throw Object.assign(new Error("That file is too large to edit here."), { status: 413 });
  return { path, sha: f.sha, content: b64decode(f.content || "") };
}
__name(readFile, "readFile");
__name2(readFile, "readFile");
__name22(readFile, "readFile");
__name222(readFile, "readFile");
__name2222(readFile, "readFile");
__name22222(readFile, "readFile");
__name222222(readFile, "readFile");
__name2222222(readFile, "readFile");
var PROVIDERS = {
  anthropic: { name: "Claude", key: "ANTHROPIC_API_KEY" },
  openai: { name: "ChatGPT", key: "OPENAI_API_KEY" },
  gemini: { name: "Gemini", key: "GEMINI_API_KEY" },
  cloudflare: { name: "Cloudflare AI", binding: "AI", free: true }
};
var connectedTo = /* @__PURE__ */ __name2222222((env, p) => Boolean(PROVIDERS[p].binding ? env[PROVIDERS[p].binding] : env[PROVIDERS[p].key]), "connectedTo");
var CF_MODELS = [
  { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 120B (free)" },
  { id: "@cf/google/gemma-4-26b-a4b-it", name: "Gemma 4 26B (free)" },
  { id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash (free)" }
];
var BUSY = /* @__PURE__ */ new Set([408, 500, 502, 503, 504, 520, 522, 524, 529]);
var RETRY_WAITS = [3e3, 8e3];
var CALL_TIMEOUT = { ms: 12e4 };
var MAX_RATE_WAIT = 2e4;
var sleep = /* @__PURE__ */ __name2222222((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
var busyError = /* @__PURE__ */ __name2222222((who, other, tries) => Object.assign(new Error(`${who} is overloaded right now \u2014 its servers turned the request away ${tries} times. This usually clears within minutes. Try again shortly, or switch to ${other}or Cloudflare AI.`), { status: 502, retryable: true }), "busyError");
function rateWait(res, data) {
  const h = Number(res.headers.get("retry-after"));
  if (Number.isFinite(h) && h > 0) return h * 1e3;
  const m = String(data?.error?.message || "").match(/(?:try again|retry) in (\d+(?:\.\d+)?)\s*(ms|s)\b/i);
  return m ? Number(m[1]) * (m[2].toLowerCase() === "ms" ? 1 : 1e3) : 2e3;
}
__name(rateWait, "rateWait");
__name2(rateWait, "rateWait");
__name22(rateWait, "rateWait");
__name222(rateWait, "rateWait");
__name2222(rateWait, "rateWait");
__name22222(rateWait, "rateWait");
__name222222(rateWait, "rateWait");
__name2222222(rateWait, "rateWait");
async function provFetch(url, init, who) {
  let res, body2, data, attempt = 0;
  const other = who === "Gemini" ? "another Gemini model (e.g. Gemini 2.5 Flash), " : "another model, ";
  for (; ; ) {
    let wait = null;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(CALL_TIMEOUT.ms) });
      body2 = await res.text();
      data = null;
      try {
        data = JSON.parse(body2);
      } catch {
      }
      if (BUSY.has(res.status)) wait = RETRY_WAITS[attempt];
      else if (res.status === 429 && !/free_tier|Free Tier|quota|credit|billing|insufficient|balance|payment/i.test(body2)) {
        const w = rateWait(res, data);
        if (w <= MAX_RATE_WAIT) wait = Math.max(w, RETRY_WAITS[attempt] ?? 0);
      }
    } catch (e) {
      if (attempt >= RETRY_WAITS.length) {
        const stalled = e?.name === "TimeoutError" || e?.name === "AbortError";
        throw Object.assign(new Error(stalled ? `${who} took too long to answer (over ${Math.round(CALL_TIMEOUT.ms / 1e3)} seconds, ${attempt + 1} tries). Try a shorter request, a faster model, or Cloudflare AI.` : `Couldn't reach ${who} (${e?.message || e}). Try again shortly.`), { status: 502, retryable: true });
      }
      await sleep(RETRY_WAITS[attempt++]);
      continue;
    }
    if (wait == null || attempt >= RETRY_WAITS.length) break;
    await sleep(wait);
    attempt++;
  }
  if (BUSY.has(res.status)) throw busyError(who, other, attempt + 1);
  if (res.status === 429 && !/free_tier|Free Tier|quota|credit|billing|insufficient|balance|payment/i.test(body2)) {
    throw Object.assign(new Error(`${who} is limiting how often requests can be sent right now. Wait a minute and try again, or switch to ${other}or Cloudflare AI.`), { status: 502, retryable: true });
  }
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || body2.slice(0, 200) || res.statusText;
    const billing = { Claude: "platform.claude.com \u2192 Settings \u2192 Billing", ChatGPT: "platform.openai.com \u2192 Settings \u2192 Billing", Gemini: "aistudio.google.com \u2192 Billing" }[who];
    if (who === "Gemini" && /free_tier|Free Tier/.test(msg)) {
      const model = (msg.match(/model: ([\w.-]+)/) || [])[1] || "this model";
      const wait = (msg.match(/retry in ((?:\d+h)?(?:\d+m)?\d+)(?:\.\d+)?s/i) || [])[1];
      const text = /limit: 0\b/.test(msg) ? `${model} isn't included in Gemini's free tier. Choose a Flash model (for example Gemini 3 Flash or Gemini 2.5 Flash) in the model picker, or add billing to the key's Google project.` : `Gemini's free-tier limit for ${model} has been reached${wait ? ` \u2014 it resets in about ${wait}s` : ""}. Try a Flash model, or wait.`;
      throw Object.assign(new Error(`Gemini: ${text}`), { status: 502 });
    }
    const hint = /credit|billing|quota|insufficient|balance|payment/i.test(msg) ? ` (API keys are billed separately from a ${who} subscription \u2014 add credit at ${billing}, for the same account the key was made in.)` : "";
    throw Object.assign(new Error(`${who} said: ${msg}${hint}`), { status: 502 });
  }
  return data;
}
__name(provFetch, "provFetch");
__name2(provFetch, "provFetch");
__name22(provFetch, "provFetch");
__name222(provFetch, "provFetch");
__name2222(provFetch, "provFetch");
__name22222(provFetch, "provFetch");
__name222222(provFetch, "provFetch");
__name2222222(provFetch, "provFetch");
async function listModels(env, provider) {
  if (provider === "cloudflare") return CF_MODELS;
  if (provider === "anthropic") {
    const d = await provFetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }
    }, "Claude");
    return d.data.map((m) => ({ id: m.id, name: m.display_name || m.id }));
  }
  if (provider === "openai") {
    const d = await provFetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }
    }, "ChatGPT");
    return d.data.map((m) => m.id).filter((id) => /^(gpt-|o\d|chatgpt-)/.test(id) && !/audio|realtime|transcribe|tts|image|embedding|search|instruct|moderation|codex|-\d{4}-\d{2}-\d{2}$/.test(id)).sort().reverse().map((id) => ({ id, name: id }));
  }
  if (provider === "gemini") {
    const d = await provFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": env.GEMINI_API_KEY }
    }, "Gemini");
    return (d.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent") && /gemini/.test(m.name) && !/embedding|tts|image|live|audio|vision/.test(m.name)).map((m) => ({ id: m.name.replace(/^models\//, ""), name: m.displayName || m.name }));
  }
  throw Object.assign(new Error("Unknown provider"), { status: 400 });
}
__name(listModels, "listModels");
__name2(listModels, "listModels");
__name22(listModels, "listModels");
__name222(listModels, "listModels");
__name2222(listModels, "listModels");
__name22222(listModels, "listModels");
__name222222(listModels, "listModels");
__name2222222(listModels, "listModels");
var IMAGE_TYPES = /* @__PURE__ */ new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
var MAX_IMAGE_B64 = 6e6;
var MAX_IMAGES = 6;
function cleanImages(list, budget) {
  const out = [];
  for (const im of Array.isArray(list) ? list : []) {
    if (budget.left <= 0) break;
    if (!im || !IMAGE_TYPES.has(im.type) || typeof im.data !== "string" || im.data.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(im.data)) continue;
    out.push({ type: im.type, data: im.data });
    budget.left--;
  }
  return out;
}
__name(cleanImages, "cleanImages");
__name2(cleanImages, "cleanImages");
__name22(cleanImages, "cleanImages");
__name222(cleanImages, "cleanImages");
__name2222(cleanImages, "cleanImages");
__name22222(cleanImages, "cleanImages");
__name222222(cleanImages, "cleanImages");
__name2222222(cleanImages, "cleanImages");
function toAnthropic(m) {
  if (!m.images?.length) return { role: m.role, content: m.content };
  return { role: m.role, content: [...m.images.map((i) => ({ type: "image", source: { type: "base64", media_type: i.type, data: i.data } })), { type: "text", text: m.content }] };
}
__name(toAnthropic, "toAnthropic");
__name2(toAnthropic, "toAnthropic");
__name22(toAnthropic, "toAnthropic");
__name222(toAnthropic, "toAnthropic");
__name2222(toAnthropic, "toAnthropic");
__name22222(toAnthropic, "toAnthropic");
__name222222(toAnthropic, "toAnthropic");
__name2222222(toAnthropic, "toAnthropic");
function toOpenAI(m) {
  if (!m.images?.length) return { role: m.role, content: m.content };
  return { role: m.role, content: [...m.images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.type};base64,${i.data}` } })), { type: "text", text: m.content }] };
}
__name(toOpenAI, "toOpenAI");
__name2(toOpenAI, "toOpenAI");
__name22(toOpenAI, "toOpenAI");
__name222(toOpenAI, "toOpenAI");
__name2222(toOpenAI, "toOpenAI");
__name22222(toOpenAI, "toOpenAI");
__name222222(toOpenAI, "toOpenAI");
__name2222222(toOpenAI, "toOpenAI");
function toGemini(m) {
  return { role: m.role === "assistant" ? "model" : "user", parts: [...(m.images || []).map((i) => ({ inlineData: { mimeType: i.type, data: i.data } })), { text: m.content }] };
}
__name(toGemini, "toGemini");
__name2(toGemini, "toGemini");
__name22(toGemini, "toGemini");
__name222(toGemini, "toGemini");
__name2222(toGemini, "toGemini");
__name22222(toGemini, "toGemini");
__name222222(toGemini, "toGemini");
__name2222222(toGemini, "toGemini");
async function runCloudflare(env, model, input) {
  let timer;
  const stall = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${Math.round(CALL_TIMEOUT.ms / 1e3)} seconds`)), CALL_TIMEOUT.ms);
  });
  try {
    return await Promise.race([env.AI.run(model, input), stall]);
  } finally {
    clearTimeout(timer);
  }
}
__name(runCloudflare, "runCloudflare");
__name2(runCloudflare, "runCloudflare");
__name22(runCloudflare, "runCloudflare");
__name222(runCloudflare, "runCloudflare");
__name2222(runCloudflare, "runCloudflare");
__name22222(runCloudflare, "runCloudflare");
__name222222(runCloudflare, "runCloudflare");
__name2222222(runCloudflare, "runCloudflare");
async function callModel(env, provider, model, system, messages, info = {}) {
  if (provider === "anthropic") {
    const d = await provFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 16e3, system, messages: messages.map(toAnthropic) })
    }, "Claude");
    return (d.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  }
  if (provider === "openai") {
    const d = await provFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_completion_tokens: 16e3, messages: [{ role: "system", content: system }, ...messages.map(toOpenAI)] })
    }, "ChatGPT");
    return d.choices?.[0]?.message?.content || "";
  }
  if (provider === "cloudflare") {
    const input = {
      // These models read text only; a screenshot is mentioned so the reply makes sense.
      messages: [{ role: "system", content: system }, ...messages.map((m) => ({ role: m.role, content: m.images?.length ? `${m.content}

(The owner attached ${m.images.length} screenshot(s), which this model can't see.)` : m.content }))],
      max_tokens: 8e3
    };
    const order = [model, ...CF_MODELS.map((m) => m.id).filter((id) => id !== model)];
    let first = null;
    for (const id of order) {
      for (let attempt = 0; ; attempt++) {
        try {
          const out = await runCloudflare(env, id, input);
          const text = typeof out?.response === "string" ? out.response : out?.choices?.[0]?.message?.content || out?.result?.response || "";
          if (!text.trim()) throw new Error("The model sent back an empty reply.");
          info.model = id;
          return text;
        } catch (e) {
          const msg = String(e?.message || e);
          if (!first) first = msg;
          console.error("Cloudflare AI failed", JSON.stringify({ model: id, attempt, error: msg.slice(0, 300) }));
          if (/3036|neurons|daily/i.test(msg)) throw Object.assign(new Error(`Cloudflare AI said: ${msg} (Today's free Cloudflare AI allowance may be used up; it resets daily at 10\u201311 am Sydney time.)`), { status: 502 });
          const retrySame = !/5035|Workers Paid|403|context|too long|too many tokens|maximum.*tokens/i.test(msg);
          if (!retrySame || attempt >= 1) break;
          await sleep(RETRY_WAITS[0]);
        }
      }
    }
    const hint = /5035|Workers Paid|403/.test(first) ? " (This model now needs Cloudflare's Workers Paid plan; pick another free model.)" : /context|too long|too many tokens|maximum.*tokens/i.test(first) ? " (The conversation is too long for this model \u2014 press New chat and ask again.)" : "";
    throw Object.assign(new Error(`Cloudflare AI said: ${first}${hint} The other free models couldn't answer either; try again in a minute.`), { status: 502, retryable: !hint });
  }
  if (provider === "gemini") {
    const d = await provFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(toGemini),
        generationConfig: { maxOutputTokens: 16e3 }
      })
    }, "Gemini");
    return (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
  }
  throw Object.assign(new Error("Unknown provider"), { status: 400 });
}
__name(callModel, "callModel");
__name2(callModel, "callModel");
__name22(callModel, "callModel");
__name222(callModel, "callModel");
__name2222(callModel, "callModel");
__name22222(callModel, "callModel");
__name222222(callModel, "callModel");
__name2222222(callModel, "callModel");
function systemPrompt(files, focus) {
  return `You are the website editor for WellNest (wellnest.services), a chronic-health tracking service made in Australia. The site owner chats with you to change the website. Reply in plain, friendly language for a non-developer, in Australian English.

HOW THE SITE IS BUILT
- Plain HTML pages in a GitHub repo. Each page has a twin: "about.html" and "about/index.html" are the same page; edit only the .html one and the twin is updated automatically.
- Links and asset paths in these files start with "/wellnest-website/" (for the GitHub Pages copy). Keep that prefix exactly as it is in new links and images; it is removed automatically on wellnest.services.
- The signed-in app (dashboard etc.) is a compiled bundle in assets/ and can't be edited here. Server code, admin pages and build files can't be edited here either. If asked for those, say so briefly.
- Keep each page's structured data, meta tags, analytics tags and the "gh-pages-base" script intact unless asked.

EDITABLE FILES
${files.join("\n")}

The owner is currently previewing: ${focus || "(nothing)"}
The owner may attach screenshots (of this site or others) to show what they mean; use them to understand the request, then change the files as usual.

TO READ A FILE, reply with only lines like:
READ: path/to/file.html
(you'll then be given its current contents, including any unpublished changes).

TO CHANGE A FILE, include one block per change, copying the existing text exactly (enough of it to be unique in the file):
<<<<<<< EDIT path/to/file.html
existing text, copied exactly
=======
replacement text
>>>>>>> END

TO CREATE A NEW FILE:
<<<<<<< CREATE path/to/new-page.html
full contents
>>>>>>> END

IMPORTANT: after a page loads, the app redraws it from its own copy. Changes to wording inside existing elements are carried into the app automatically, so visitors see them. Changes to layout \u2014 adding, removing or moving elements, or changing links, images, classes or other attributes \u2014 only reach search engines and the moment before the app loads; visitors won't see them. So prefer wording changes, and if a request needs a layout change, do it but say clearly that visitors won't see it until the app itself is updated.

Rules: read a file before editing it unless its contents are already in this conversation. Make the smallest change that does what was asked. Outside the blocks, say in one or two sentences what you changed. Nothing goes live until the owner presses Publish.`;
}
__name(systemPrompt, "systemPrompt");
__name2(systemPrompt, "systemPrompt");
__name22(systemPrompt, "systemPrompt");
__name222(systemPrompt, "systemPrompt");
__name2222(systemPrompt, "systemPrompt");
__name22222(systemPrompt, "systemPrompt");
__name222222(systemPrompt, "systemPrompt");
__name2222222(systemPrompt, "systemPrompt");
function readRequests(text) {
  return [...String(text).matchAll(/^\s*READ:\s*(\S+)\s*$/gm)].map((m) => m[1]);
}
__name(readRequests, "readRequests");
__name2(readRequests, "readRequests");
__name22(readRequests, "readRequests");
__name222(readRequests, "readRequests");
__name2222(readRequests, "readRequests");
__name22222(readRequests, "readRequests");
__name222222(readRequests, "readRequests");
__name2222222(readRequests, "readRequests");
function hasEdits(text) {
  return /<<<<<<< (EDIT|CREATE) /.test(text);
}
__name(hasEdits, "hasEdits");
__name2(hasEdits, "hasEdits");
__name22(hasEdits, "hasEdits");
__name222(hasEdits, "hasEdits");
__name2222(hasEdits, "hasEdits");
__name22222(hasEdits, "hasEdits");
__name222222(hasEdits, "hasEdits");
__name2222222(hasEdits, "hasEdits");
var HISTORY_BUDGET = { cloudflare: 6e4, other: 3e5 };
function trimHistory(messages, budget) {
  const out = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const size = m.content.length + (m.images?.length || 0) * 1e3;
    if (out.length && used + size > budget) break;
    out.unshift(used + size > budget ? { ...m, content: m.content.slice(0, budget) } : m);
    used += size;
  }
  while (out.length > 1 && out[0].role !== "user") out.shift();
  return out;
}
__name(trimHistory, "trimHistory");
__name2(trimHistory, "trimHistory");
__name22(trimHistory, "trimHistory");
__name222(trimHistory, "trimHistory");
__name2222(trimHistory, "trimHistory");
__name22222(trimHistory, "trimHistory");
__name222222(trimHistory, "trimHistory");
__name2222222(trimHistory, "trimHistory");
var treeCache = null;
async function cachedTree(env) {
  if (treeCache && Date.now() - treeCache.at < 6e4) return treeCache.tree;
  const tree = await listTree(env);
  treeCache = { at: Date.now(), tree };
  return tree;
}
__name(cachedTree, "cachedTree");
__name2(cachedTree, "cachedTree");
__name22(cachedTree, "cachedTree");
__name222(cachedTree, "cachedTree");
__name2222(cachedTree, "cachedTree");
__name22222(cachedTree, "cachedTree");
__name222222(cachedTree, "cachedTree");
__name2222222(cachedTree, "cachedTree");
function clearTreeCache() {
  treeCache = null;
}
__name(clearTreeCache, "clearTreeCache");
__name2(clearTreeCache, "clearTreeCache");
__name22(clearTreeCache, "clearTreeCache");
__name222(clearTreeCache, "clearTreeCache");
__name2222(clearTreeCache, "clearTreeCache");
__name22222(clearTreeCache, "clearTreeCache");
__name222222(clearTreeCache, "clearTreeCache");
__name2222222(clearTreeCache, "clearTreeCache");
async function runChat(env, body2) {
  const provider = String(body2.provider || "");
  if (!PROVIDERS[provider]) throw Object.assign(new Error("Choose an AI provider."), { status: 400 });
  if (!connectedTo(env, provider)) throw Object.assign(new Error(`${PROVIDERS[provider].name} isn't connected yet.`), { status: 400 });
  const model = String(body2.model || "").slice(0, 120);
  if (!model) throw Object.assign(new Error("Choose a model."), { status: 400 });
  const drafts = body2.drafts && typeof body2.drafts === "object" ? body2.drafts : {};
  const budget = { left: MAX_IMAGES };
  const messages = trimHistory((Array.isArray(body2.messages) ? body2.messages : []).filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-30).reverse().map((m) => ({ role: m.role, content: m.content.slice(0, 2e5) || "(see screenshot)", images: m.role === "user" ? cleanImages(m.images, budget) : [] })).reverse(), provider === "cloudflare" ? HISTORY_BUDGET.cloudflare : HISTORY_BUDGET.other);
  if (!messages.length || messages[messages.length - 1].role !== "user") throw Object.assign(new Error("Nothing to send."), { status: 400 });
  const tree = await cachedTree(env);
  const names = tree.map((f) => f.path).filter(editable).filter((p) => !/^(.+)\/index\.html$/.test(p) || !tree.some((f) => f.path === p.replace(/\/index\.html$/, ".html")));
  const system = systemPrompt(names, body2.focus);
  const reads = [], info = {};
  let reply = "";
  for (let round = 0; round <= MAX_READ_ROUNDS; round++) {
    reply = await callModel(env, provider, info.model || model, system, messages, info);
    const want = [...new Set(readRequests(reply))].slice(0, 6);
    if (!want.length || hasEdits(reply) || round === MAX_READ_ROUNDS) break;
    const parts = await Promise.all(want.map(async (path) => {
      if (!editable(path)) return `${path}: can't be read or edited here.`;
      try {
        const content = typeof drafts[path] === "string" ? drafts[path] : (await readFile(env, path)).content;
        reads.push(path);
        return `=== ${path} ===
${content}
=== end of ${path} ===`;
      } catch (e) {
        return `${path}: not found.`;
      }
    }));
    messages.push({ role: "assistant", content: reply });
    messages.push({ role: "user", content: `(Editor) Here are the files you asked for:

${parts.join("\n\n")}` });
  }
  const out = { reply, reads };
  if (info.model && info.model !== model) {
    out.model_used = info.model;
    out.model_name = (CF_MODELS.find((m) => m.id === info.model) || {}).name || info.model;
  }
  return out;
}
__name(runChat, "runChat");
__name2(runChat, "runChat");
__name22(runChat, "runChat");
__name222(runChat, "runChat");
__name2222(runChat, "runChat");
__name22222(runChat, "runChat");
__name222222(runChat, "runChat");
__name2222222(runChat, "runChat");
var KEEPALIVE_MS = { value: 15e3 };
async function handleChat(request, env) {
  const body2 = await request.json();
  const started = Date.now();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const enc3 = new TextEncoder();
  const tick = setInterval(() => {
    writer.write(enc3.encode(" ")).catch(() => {
    });
  }, KEEPALIVE_MS.value);
  (async () => {
    let result;
    try {
      result = await runChat(env, body2);
    } catch (err) {
      const e = explainGitHub(err, "chat") || err;
      const status = e?.status && e.status < 600 ? e.status : 500;
      console.error("Editor chat failed", JSON.stringify({ provider: body2?.provider, model: body2?.model, status, seconds: Math.round((Date.now() - started) / 1e3), error: String(e?.message || e).slice(0, 500) }));
      result = { error: status >= 500 && status !== 502 ? "Something went wrong. Please try again." : e.message, status, retryable: Boolean(e?.retryable) || status >= 500 && status !== 502 };
    } finally {
      clearInterval(tick);
    }
    try {
      await writer.write(enc3.encode(JSON.stringify(result)));
      await writer.close();
    } catch {
    }
  })();
  return new Response(readable, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
__name(handleChat, "handleChat");
__name2(handleChat, "handleChat");
__name22(handleChat, "handleChat");
__name222(handleChat, "handleChat");
__name2222(handleChat, "handleChat");
__name22222(handleChat, "handleChat");
__name222222(handleChat, "handleChat");
__name2222222(handleChat, "handleChat");
var PREVIEW_TTL = 24 * 3600 * 1e3;
async function handlePreviewSave(request, env) {
  const body2 = await request.json();
  let id = String(body2.id || "");
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) id = randomToken(24);
  const files = body2.files && typeof body2.files === "object" ? body2.files : {};
  const stmts = [env.DB.prepare("DELETE FROM editor_previews WHERE id = ? OR updated < ?").bind(id, Date.now() - PREVIEW_TTL)];
  for (const [path, content] of Object.entries(files).slice(0, 50)) {
    if (!editable(path) || typeof content !== "string" || content.length > MAX_FILE) continue;
    stmts.push(env.DB.prepare("INSERT INTO editor_previews (id, path, content, updated) VALUES (?, ?, ?, ?)").bind(id, path, content, Date.now()));
  }
  await env.DB.batch(stmts);
  return json({ id });
}
__name(handlePreviewSave, "handlePreviewSave");
__name2(handlePreviewSave, "handlePreviewSave");
__name22(handlePreviewSave, "handlePreviewSave");
__name222(handlePreviewSave, "handlePreviewSave");
__name2222(handlePreviewSave, "handlePreviewSave");
__name22222(handlePreviewSave, "handlePreviewSave");
__name222222(handlePreviewSave, "handlePreviewSave");
__name2222222(handlePreviewSave, "handlePreviewSave");
var TYPES = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", txt: "text/plain; charset=utf-8", xml: "application/xml", svg: "image/svg+xml", md: "text/plain; charset=utf-8", json: "application/json", webmanifest: "application/manifest+json" };
function previewCookie(request) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)wn_preview=([A-Za-z0-9_-]{20,64})/);
  return m ? m[1] : null;
}
__name(previewCookie, "previewCookie");
__name2(previewCookie, "previewCookie");
__name22(previewCookie, "previewCookie");
__name222(previewCookie, "previewCookie");
__name2222(previewCookie, "previewCookie");
__name22222(previewCookie, "previewCookie");
__name222222(previewCookie, "previewCookie");
__name2222222(previewCookie, "previewCookie");
async function servePreviewApp(request, env, url) {
  const id = previewCookie(request);
  const path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!id || request.method !== "GET" || !APP_FILE.test(path)) return null;
  const row2 = await env.DB.prepare("SELECT content FROM editor_previews WHERE id = ? AND path = ? AND updated > ?").bind(id, path, Date.now() - PREVIEW_TTL).first();
  if (!row2) return null;
  return new Response(row2.content, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store", "X-WellNest-Preview": "draft" } });
}
__name(servePreviewApp, "servePreviewApp");
__name2(servePreviewApp, "servePreviewApp");
__name22(servePreviewApp, "servePreviewApp");
__name222(servePreviewApp, "servePreviewApp");
__name2222(servePreviewApp, "servePreviewApp");
__name22222(servePreviewApp, "servePreviewApp");
__name222222(servePreviewApp, "servePreviewApp");
__name2222222(servePreviewApp, "servePreviewApp");
function withoutApp(html) {
  return html.replace(/<script\b[^>]*\bsrc=["'][^"']*\/assets\/index[^"']*\.js["'][^>]*>\s*<\/script>/gi, "").replace(/<link\b[^>]*\brel=["']modulepreload["'][^>]*>/gi, "");
}
__name(withoutApp, "withoutApp");
__name2(withoutApp, "withoutApp");
__name22(withoutApp, "withoutApp");
__name222(withoutApp, "withoutApp");
__name2222(withoutApp, "withoutApp");
__name22222(withoutApp, "withoutApp");
__name222222(withoutApp, "withoutApp");
__name2222222(withoutApp, "withoutApp");
async function servePreview(request, env, url) {
  const id = url.searchParams.get("wn_preview") || "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id) || request.method !== "GET") return null;
  const p = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const candidates = p === "" ? ["index.html"] : p.endsWith("/") ? [p + "index.html"] : [p, p + ".html", p + "/index.html"];
  for (const c of candidates) {
    const gp = c;
    const row2 = await env.DB.prepare("SELECT content FROM editor_previews WHERE id = ? AND path = ? AND updated > ?").bind(id, gp, Date.now() - PREVIEW_TTL).first();
    if (row2) {
      const ext = (gp.match(/\.([a-z]+)$/i) || [])[1]?.toLowerCase() || "html";
      const headers = { "Content-Type": TYPES[ext] || "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-WellNest-Preview": "draft" };
      if (url.searchParams.get("wn_static") === "1" && ext === "html") {
        return new Response(withoutApp(stripBase(row2.content)), { headers: { ...headers, "X-WellNest-Preview": "draft-static" } });
      }
      headers["Set-Cookie"] = `wn_preview=${id}; Path=/; Max-Age=900; Secure; HttpOnly; SameSite=Lax`;
      return new Response(stripBase(row2.content), { headers });
    }
  }
  return null;
}
__name(servePreview, "servePreview");
__name2(servePreview, "servePreview");
__name22(servePreview, "servePreview");
__name222(servePreview, "servePreview");
__name2222(servePreview, "servePreview");
__name22222(servePreview, "servePreview");
__name222222(servePreview, "servePreview");
__name2222222(servePreview, "servePreview");
async function handleAppFile(request, env, url) {
  const path = url.searchParams.get("path") || "";
  if (!APP_FILE.test(path)) return fail(400, "Not an app file.");
  const tree = await listTree(env);
  const entry = tree.find((f) => f.path === path);
  if (!entry) return fail(404, "Not found");
  const res = await fetch(`https://api.github.com/repos/${REPO}/git/blobs/${entry.sha}`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw", "User-Agent": "wellnest-editor", "X-GitHub-Api-Version": "2022-11-28" }
  });
  if (!res.ok) return fail(502, `GitHub ${res.status} reading ${path}`);
  return new Response(res.body, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "private, no-store", "X-Sha": entry.sha } });
}
__name(handleAppFile, "handleAppFile");
__name2(handleAppFile, "handleAppFile");
__name22(handleAppFile, "handleAppFile");
__name222(handleAppFile, "handleAppFile");
__name2222(handleAppFile, "handleAppFile");
__name22222(handleAppFile, "handleAppFile");
__name222222(handleAppFile, "handleAppFile");
__name2222222(handleAppFile, "handleAppFile");
async function handleBlob(request, env) {
  const b64 = await request.text();
  if (!b64 || b64.length > MAX_APP_FILE * 1.4 || !/^[A-Za-z0-9+/]+=*$/.test(b64)) return fail(400, "Invalid file.");
  const blob = await gh(env, "/git/blobs", { method: "POST", body: `{"encoding":"base64","content":"${b64}"}` });
  return json({ sha: blob.sha });
}
__name(handleBlob, "handleBlob");
__name2(handleBlob, "handleBlob");
__name22(handleBlob, "handleBlob");
__name222(handleBlob, "handleBlob");
__name2222(handleBlob, "handleBlob");
__name22222(handleBlob, "handleBlob");
__name222222(handleBlob, "handleBlob");
__name2222222(handleBlob, "handleBlob");
async function handlePreviewApp(request, env, url) {
  const id = url.searchParams.get("id") || "", path = url.searchParams.get("path") || "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id) || !APP_FILE.test(path)) return fail(400, "Invalid request.");
  const content = await request.text();
  if (!content || content.length > MAX_APP_FILE) return fail(413, "That's too large to preview.");
  await env.DB.prepare("INSERT OR REPLACE INTO editor_previews (id, path, content, updated) VALUES (?, ?, ?, ?)").bind(id, path, stripBase(content), Date.now()).run();
  return json({ ok: true });
}
__name(handlePreviewApp, "handlePreviewApp");
__name2(handlePreviewApp, "handlePreviewApp");
__name22(handlePreviewApp, "handlePreviewApp");
__name222(handlePreviewApp, "handlePreviewApp");
__name2222(handlePreviewApp, "handlePreviewApp");
__name22222(handlePreviewApp, "handlePreviewApp");
__name222222(handlePreviewApp, "handlePreviewApp");
__name2222222(handlePreviewApp, "handlePreviewApp");
async function handlePublish(request, env, user) {
  const body2 = await request.json();
  const changes = body2.files && typeof body2.files === "object" ? body2.files : {};
  const message = String(body2.message || "").trim().slice(0, 200) || "Update website";
  const entries = Object.entries(changes).slice(0, 50);
  if (!entries.length) return fail(400, "There are no changes to publish.");
  const tree = await listTree(env);
  const shas = new Map(tree.map((f) => [f.path, f.sha]));
  const paths = new Set(tree.map((f) => f.path));
  const writes = /* @__PURE__ */ new Map();
  for (const [path, change] of entries) {
    if (!editable(path)) return fail(400, `${path} can't be changed from the editor.`);
    if (!change || typeof change.content !== "string" || change.content.length > MAX_FILE) return fail(400, `${path} is too large or empty.`);
    const current = shas.get(path) || null;
    if ((change.sha || null) !== current) {
      return fail(409, `${path} changed on GitHub since you started editing it. Discard your changes to it and ask again.`, { path });
    }
    writes.set(path, change.content);
    const twin = mirrorOf(path, paths);
    if (twin && !(twin in changes)) writes.set(twin, change.content);
    if (path === "index.html" && shas.get("404.html") === current && !("404.html" in changes)) writes.set("404.html", change.content);
  }
  const blobs = body2.blobs && typeof body2.blobs === "object" ? Object.entries(body2.blobs).slice(0, 5) : [];
  const blobEntries = [];
  for (const [path, b] of blobs) {
    if (!APP_FILE.test(path) || !b || !/^[0-9a-f]{40}$/.test(b.sha || "")) return fail(400, `${path} can't be changed from the editor.`);
    if ((b.base || null) !== (shas.get(path) || null)) return fail(409, `The app changed on GitHub since you started editing. Discard your changes and ask again.`, { path });
    blobEntries.push({ path, mode: "100644", type: "blob", sha: b.sha });
  }
  const ref = await gh(env, `/git/ref/heads/${BRANCH}`);
  const head = await gh(env, `/git/commits/${ref.object.sha}`);
  const newTree = await gh(env, "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: head.tree.sha, tree: [...writes].map(([path, content]) => ({ path, mode: "100644", type: "blob", content })).concat(blobEntries) })
  });
  const commit = await gh(env, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `${message}

Published from Edit WellNest by ${user.email} (${now()}).`,
      tree: newTree.sha,
      parents: [ref.object.sha]
    })
  });
  await gh(env, `/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
  clearTreeCache();
  const pages = [...writes.keys()].map(pageUrl).filter(Boolean);
  let indexnow = null;
  if (pages.length) {
    try {
      indexnow = await submitIndexNow(pages);
    } catch (e) {
      indexnow = { submitted: 0, error: String(e?.message || e) };
    }
  }
  return json({ indexnow, commit: commit.sha, url: `https://github.com/${REPO}/commit/${commit.sha}`, files: [...writes.keys(), ...blobEntries.map((e) => e.path)] });
}
__name(handlePublish, "handlePublish");
__name2(handlePublish, "handlePublish");
__name22(handlePublish, "handlePublish");
__name222(handlePublish, "handlePublish");
__name2222(handlePublish, "handlePublish");
__name22222(handlePublish, "handlePublish");
__name222222(handlePublish, "handlePublish");
__name2222222(handlePublish, "handlePublish");
function explainGitHub(e, sub) {
  if (e?.github === 401) return Object.assign(new Error("GitHub rejected the GITHUB_TOKEN. It may have expired; make a new one and update it in Cloudflare."), { status: 502 });
  if (e?.github === 403 || e?.github === 404 && sub === "publish") {
    return Object.assign(new Error(`GITHUB_TOKEN can read the repo but isn't allowed to change it. Its settings need Repository access \u2192 Only select repositories \u2192 ${REPO.split("/")[1]}, and Permissions \u2192 Contents \u2192 Read and write. (GitHub said: ${e.reason || e.github})`), { status: 502 });
  }
  return null;
}
__name(explainGitHub, "explainGitHub");
__name2(explainGitHub, "explainGitHub");
__name22(explainGitHub, "explainGitHub");
__name222(explainGitHub, "explainGitHub");
__name2222(explainGitHub, "explainGitHub");
__name22222(explainGitHub, "explainGitHub");
__name222222(explainGitHub, "explainGitHub");
__name2222222(explainGitHub, "explainGitHub");
async function handleEditor(request, env, user, sub) {
  if (!await isAnalyticsAdmin(env, user)) return fail(403, "Only site admins can use the editor.", { signed_in_as: user?.email || null });
  const url = new URL(request.url);
  const GET = request.method === "GET", POST = request.method === "POST";
  if (sub === "status" && GET) {
    return json({
      repo: REPO,
      github: Boolean(env.GITHUB_TOKEN),
      providers: Object.fromEntries(Object.entries(PROVIDERS).map(([k, v]) => [k, { name: v.name, connected: connectedTo(env, k), secret: v.key || null, free: Boolean(v.free) }]))
    });
  }
  if (!env.GITHUB_TOKEN) return fail(503, "GitHub isn't connected yet. Add GITHUB_TOKEN in Cloudflare.");
  try {
    if (sub === "models" && GET) {
      const provider = url.searchParams.get("provider");
      if (!PROVIDERS[provider] || !connectedTo(env, provider)) return fail(400, "That AI isn't connected.");
      return json({ models: await listModels(env, provider) });
    }
    if (sub === "files" && GET) {
      const tree = await listTree(env);
      return json({ files: tree.filter((f) => editable(f.path)).map((f) => ({ path: f.path, sha: f.sha, size: f.size })) });
    }
    if (sub === "file" && GET) {
      const path = url.searchParams.get("path");
      if (!editable(path)) return fail(400, "That file can't be edited here.");
      return json(await readFile(env, path));
    }
    if (sub === "chat" && POST) return await handleChat(request, env);
    if (sub === "preview" && POST) return await handlePreviewSave(request, env);
    if (sub === "publish" && POST) return await handlePublish(request, env, user);
    if (sub === "appfile" && GET) return await handleAppFile(request, env, url);
    if (sub === "blob" && POST) return await handleBlob(request, env);
    if (sub === "preview-app" && POST) return await handlePreviewApp(request, env, url);
  } catch (e) {
    const known = explainGitHub(e, sub);
    if (known) return fail(502, known.message);
    if (e.status && e.status < 500) return fail(e.status, e.message);
    if (e.status === 502) return fail(502, e.message);
    throw e;
  }
  return fail(404, "Not found");
}
__name(handleEditor, "handleEditor");
__name2(handleEditor, "handleEditor");
__name22(handleEditor, "handleEditor");
__name222(handleEditor, "handleEditor");
__name2222(handleEditor, "handleEditor");
__name22222(handleEditor, "handleEditor");
__name222222(handleEditor, "handleEditor");
__name2222222(handleEditor, "handleEditor");
var TRIAL_DAYS = 30;
var DAY2 = 864e5;
var PLANS = {
  fullaccess: { name: "WellNest Premium Monthly", amount: 499, interval: "month", lookup: "wellnest_premium_monthly", env: "STRIPE_PRICE_MONTHLY" },
  yearly: { name: "WellNest Premium Yearly", amount: 4499, interval: "year", lookup: "wellnest_premium_yearly", env: "STRIPE_PRICE_YEARLY" }
};
var PAID = /* @__PURE__ */ new Set(["active", "trialing", "past_due"]);
var WEBHOOK_URL = SITE + "/api/stripe/webhook";
var WEBHOOK_EVENTS = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"];
var SCHEMA2 = `CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY, customer_id TEXT, subscription_id TEXT, status TEXT NOT NULL DEFAULT 'none',
  plan TEXT, price_id TEXT, current_period_end INTEGER, cancel_at_period_end INTEGER NOT NULL DEFAULT 0, updated TEXT NOT NULL)`;
var schemaReady2 = false;
async function ensureBilling(env) {
  if (schemaReady2) return;
  await env.DB.prepare(SCHEMA2).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS subscriptions_customer ON subscriptions(customer_id)").run();
  schemaReady2 = true;
}
__name(ensureBilling, "ensureBilling");
__name2(ensureBilling, "ensureBilling");
__name22(ensureBilling, "ensureBilling");
__name222(ensureBilling, "ensureBilling");
__name2222(ensureBilling, "ensureBilling");
__name22222(ensureBilling, "ensureBilling");
__name222222(ensureBilling, "ensureBilling");
__name2222222(ensureBilling, "ensureBilling");
function form(params, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(params)) {
    if (v === void 0 || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((item, i) => typeof item === "object" ? form(item, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(item)));
    else if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}
__name(form, "form");
__name2(form, "form");
__name22(form, "form");
__name222(form, "form");
__name2222(form, "form");
__name22222(form, "form");
__name222222(form, "form");
__name2222222(form, "form");
async function stripe(env, method, path, params) {
  if (!env.STRIPE_SECRET_KEY) throw Object.assign(new Error("Payments aren't set up yet (STRIPE_SECRET_KEY is missing)."), { status: 503 });
  const qs = method === "GET" && params ? "?" + form(params) : "";
  const res = await fetch("https://api.stripe.com/v1/" + path + qs, {
    method,
    headers: { Authorization: "Bearer " + env.STRIPE_SECRET_KEY, "Content-Type": "application/x-www-form-urlencoded", "Stripe-Version": "2024-06-20" },
    body: method === "GET" ? void 0 : form(params || {}),
    signal: AbortSignal.timeout(2e4)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Stripe", method, path, res.status, data?.error?.message);
    throw Object.assign(new Error(res.status === 401 ? "Stripe rejected the secret key. Check STRIPE_SECRET_KEY in Cloudflare." : "Payment provider error: " + (data?.error?.message || res.status)), { status: 502, stripe: res.status });
  }
  return data;
}
__name(stripe, "stripe");
__name2(stripe, "stripe");
__name22(stripe, "stripe");
__name222(stripe, "stripe");
__name2222(stripe, "stripe");
__name22222(stripe, "stripe");
__name222222(stripe, "stripe");
__name2222222(stripe, "stripe");
var priceCache = {};
async function priceFor(env, key) {
  const plan = PLANS[key];
  if (!plan) throw Object.assign(new Error("Unknown plan."), { status: 400 });
  if (env[plan.env]) return env[plan.env];
  if (priceCache[key]) return priceCache[key];
  const byLookup = await stripe(env, "GET", "prices", { lookup_keys: [plan.lookup], active: "true", limit: 1 });
  let price = byLookup.data?.[0];
  if (!price) {
    const all = await stripe(env, "GET", "prices", { active: "true", type: "recurring", currency: "aud", limit: 100 });
    price = (all.data || []).find((p) => p.unit_amount === plan.amount && p.recurring?.interval === plan.interval && (p.recurring?.interval_count || 1) === 1);
  }
  if (!price) {
    price = await stripe(env, "POST", "prices", {
      currency: "aud",
      unit_amount: plan.amount,
      recurring: { interval: plan.interval },
      lookup_key: plan.lookup,
      product_data: { name: plan.name },
      tax_behavior: "inclusive"
    });
  }
  return priceCache[key] = price.id;
}
__name(priceFor, "priceFor");
__name2(priceFor, "priceFor");
__name22(priceFor, "priceFor");
__name222(priceFor, "priceFor");
__name2222(priceFor, "priceFor");
__name22222(priceFor, "priceFor");
__name222222(priceFor, "priceFor");
__name2222222(priceFor, "priceFor");
async function row(env, userId) {
  await ensureBilling(env);
  return env.DB.prepare("SELECT * FROM subscriptions WHERE user_id = ?").bind(userId).first();
}
__name(row, "row");
__name2(row, "row");
__name22(row, "row");
__name222(row, "row");
__name2222(row, "row");
__name22222(row, "row");
__name222222(row, "row");
__name2222222(row, "row");
function trialEndsAt(user) {
  const created = Date.parse(user?.created_date || "");
  return Number.isFinite(created) ? created + TRIAL_DAYS * DAY2 : 0;
}
__name(trialEndsAt, "trialEndsAt");
__name2(trialEndsAt, "trialEndsAt");
__name22(trialEndsAt, "trialEndsAt");
__name222(trialEndsAt, "trialEndsAt");
__name2222(trialEndsAt, "trialEndsAt");
__name22222(trialEndsAt, "trialEndsAt");
__name222222(trialEndsAt, "trialEndsAt");
__name2222222(trialEndsAt, "trialEndsAt");
function tierOf(user) {
  try {
    return JSON.parse(user.data || "{}").subscription_tier || "free";
  } catch {
    return "free";
  }
}
__name(tierOf, "tierOf");
__name2(tierOf, "tierOf");
__name22(tierOf, "tierOf");
__name222(tierOf, "tierOf");
__name2222(tierOf, "tierOf");
__name22222(tierOf, "tierOf");
__name222222(tierOf, "tierOf");
__name2222222(tierOf, "tierOf");
async function setTier(env, userId, tier) {
  await env.DB.prepare("UPDATE users SET data = json_set(data, '$.subscription_tier', ?), updated_date = ? WHERE id = ?").bind(tier, now(), userId).run();
}
__name(setTier, "setTier");
__name2(setTier, "setTier");
__name22(setTier, "setTier");
__name222(setTier, "setTier");
__name2222(setTier, "setTier");
__name22222(setTier, "setTier");
__name222222(setTier, "setTier");
__name2222222(setTier, "setTier");
async function customerFor(env, user, create) {
  const r = await row(env, user.id);
  if (r?.customer_id) return r.customer_id;
  const found = await stripe(env, "GET", "customers", { email: user.email, limit: 10 });
  let customer = (found.data || []).find((c) => !c.deleted);
  if (!customer && !create) return null;
  if (!customer) customer = await stripe(env, "POST", "customers", { email: user.email, name: user.full_name || void 0, metadata: { user_id: user.id } });
  await env.DB.prepare(`INSERT INTO subscriptions (user_id, customer_id, updated) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET customer_id = excluded.customer_id, updated = excluded.updated`).bind(user.id, customer.id, now()).run();
  return customer.id;
}
__name(customerFor, "customerFor");
__name2(customerFor, "customerFor");
__name22(customerFor, "customerFor");
__name222(customerFor, "customerFor");
__name2222(customerFor, "customerFor");
__name22222(customerFor, "customerFor");
__name222222(customerFor, "customerFor");
__name2222222(customerFor, "customerFor");
function planOfPrice(price) {
  const interval = price?.recurring?.interval;
  return interval === "year" ? "yearly" : "fullaccess";
}
__name(planOfPrice, "planOfPrice");
__name2(planOfPrice, "planOfPrice");
__name22(planOfPrice, "planOfPrice");
__name222(planOfPrice, "planOfPrice");
__name2222(planOfPrice, "planOfPrice");
__name22222(planOfPrice, "planOfPrice");
__name222222(planOfPrice, "planOfPrice");
__name2222222(planOfPrice, "planOfPrice");
async function applySubscription(env, userId, sub) {
  await ensureBilling(env);
  const price = sub.items?.data?.[0]?.price;
  const paid = PAID.has(sub.status);
  await env.DB.prepare(`INSERT INTO subscriptions (user_id, customer_id, subscription_id, status, plan, price_id, current_period_end, cancel_at_period_end, updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET customer_id = excluded.customer_id, subscription_id = excluded.subscription_id, status = excluded.status,
      plan = excluded.plan, price_id = excluded.price_id, current_period_end = excluded.current_period_end,
      cancel_at_period_end = excluded.cancel_at_period_end, updated = excluded.updated`).bind(
    userId,
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    sub.id,
    sub.status,
    planOfPrice(price),
    price?.id || null,
    sub.current_period_end ? sub.current_period_end * 1e3 : null,
    sub.cancel_at_period_end ? 1 : 0,
    now()
  ).run();
  const tier = paid ? planOfPrice(price) : "free";
  await setTier(env, userId, tier);
  return tier;
}
__name(applySubscription, "applySubscription");
__name2(applySubscription, "applySubscription");
__name22(applySubscription, "applySubscription");
__name222(applySubscription, "applySubscription");
__name2222(applySubscription, "applySubscription");
__name22222(applySubscription, "applySubscription");
__name222222(applySubscription, "applySubscription");
__name2222222(applySubscription, "applySubscription");
function best(subs) {
  const rank = /* @__PURE__ */ __name2222222((s) => (PAID.has(s.status) ? 2 : 0) + (s.status === "active" ? 1 : 0), "rank");
  return [...subs].sort((a, b) => rank(b) - rank(a) || b.created - a.created)[0] || null;
}
__name(best, "best");
__name2(best, "best");
__name22(best, "best");
__name222(best, "best");
__name2222(best, "best");
__name22222(best, "best");
__name222222(best, "best");
__name2222222(best, "best");
async function syncSubscription(env, user) {
  if (!env.STRIPE_SECRET_KEY) return { synced: false };
  const customer = await customerFor(env, user, false);
  if (!customer) return { synced: false, tier: tierOf(user) };
  const subs = await stripe(env, "GET", "subscriptions", { customer, status: "all", limit: 20 });
  const sub = best(subs.data || []);
  const before = tierOf(user);
  const tier = sub ? await applySubscription(env, user.id, sub) : before;
  return { synced: tier !== before, tier };
}
__name(syncSubscription, "syncSubscription");
__name2(syncSubscription, "syncSubscription");
__name22(syncSubscription, "syncSubscription");
__name222(syncSubscription, "syncSubscription");
__name2222(syncSubscription, "syncSubscription");
__name22222(syncSubscription, "syncSubscription");
__name222222(syncSubscription, "syncSubscription");
__name2222222(syncSubscription, "syncSubscription");
async function growthAccess(env, user) {
  if (!user) return { premium: false, plan: "free", referralApplied: false };
  const tier = tierOf(user);
  let complimentary = false;
  try {
    complimentary = !!JSON.parse(user.data || "{}").complimentary_full_access;
  } catch {
  }
  const ends = trialEndsAt(user);
  const plan = PLANS[tier] ? tier : user.role === "admin" || complimentary ? "full" : ends > Date.now() ? "trial" : "free";
  return { premium: plan !== "free", plan, trialEndsAt: ends ? new Date(ends).toISOString() : null, referralApplied: false };
}
__name(growthAccess, "growthAccess");
__name2(growthAccess, "growthAccess");
__name22(growthAccess, "growthAccess");
__name222(growthAccess, "growthAccess");
__name2222(growthAccess, "growthAccess");
__name22222(growthAccess, "growthAccess");
__name222222(growthAccess, "growthAccess");
__name2222222(growthAccess, "growthAccess");
function safeUrl(u, fallback) {
  try {
    const url = new URL(u);
    if (ALLOWED_ORIGINS.has(url.origin)) return url.toString();
  } catch {
  }
  return fallback;
}
__name(safeUrl, "safeUrl");
__name2(safeUrl, "safeUrl");
__name22(safeUrl, "safeUrl");
__name222(safeUrl, "safeUrl");
__name2222(safeUrl, "safeUrl");
__name22222(safeUrl, "safeUrl");
__name222222(safeUrl, "safeUrl");
__name2222222(safeUrl, "safeUrl");
async function createCheckout(env, user, b) {
  if (!user) throw Object.assign(new Error("Please sign in first."), { status: 401 });
  const key = String(b.productKey || "");
  if (!PLANS[key]) throw Object.assign(new Error("Unknown plan."), { status: 400 });
  const sync = await syncSubscription(env, user);
  if (PLANS[sync.tier]) return { alreadySubscribed: true };
  const customer = await customerFor(env, user, true);
  const price = await priceFor(env, key);
  const trialEnd = trialEndsAt(user);
  const subscription_data = { metadata: { user_id: user.id, plan: key } };
  if (trialEnd > Date.now() + 2 * DAY2 + 6e4) subscription_data.trial_end = Math.floor(trialEnd / 1e3);
  const session = await stripe(env, "POST", "checkout/sessions", {
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    success_url: safeUrl(b.successUrl, SITE + "/dashboard?from_checkout=1"),
    cancel_url: safeUrl(b.cancelUrl, SITE + "/pricing"),
    allow_promotion_codes: "true",
    metadata: { user_id: user.id, plan: key },
    subscription_data
  });
  return { url: session.url };
}
__name(createCheckout, "createCheckout");
__name2(createCheckout, "createCheckout");
__name22(createCheckout, "createCheckout");
__name222(createCheckout, "createCheckout");
__name2222(createCheckout, "createCheckout");
__name22222(createCheckout, "createCheckout");
__name222222(createCheckout, "createCheckout");
__name2222222(createCheckout, "createCheckout");
async function billingPortal(env, user, b) {
  if (!user) throw Object.assign(new Error("Please sign in first."), { status: 401 });
  const customer = await customerFor(env, user, false);
  if (!customer) throw Object.assign(new Error("There's no billing account yet. Choose a plan on the pricing page first."), { status: 404 });
  const session = await stripe(env, "POST", "billing_portal/sessions", { customer, return_url: safeUrl(b.returnUrl, SITE + "/settings") });
  return { url: session.url };
}
__name(billingPortal, "billingPortal");
__name2(billingPortal, "billingPortal");
__name22(billingPortal, "billingPortal");
__name222(billingPortal, "billingPortal");
__name2222(billingPortal, "billingPortal");
__name22222(billingPortal, "billingPortal");
__name222222(billingPortal, "billingPortal");
__name2222222(billingPortal, "billingPortal");
var enc2 = new TextEncoder();
async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey("raw", enc2.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return [...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc2.encode(text)))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hmacHex, "hmacHex");
__name2(hmacHex, "hmacHex");
__name22(hmacHex, "hmacHex");
__name222(hmacHex, "hmacHex");
__name2222(hmacHex, "hmacHex");
__name22222(hmacHex, "hmacHex");
__name222222(hmacHex, "hmacHex");
__name2222222(hmacHex, "hmacHex");
async function verifyStripeSignature(secret, payload, header, toleranceSeconds = 300, nowMs = Date.now()) {
  if (!secret || !header) return false;
  let t = null;
  const sigs = [];
  for (const piece of header.split(",")) {
    const [k, v] = piece.split("=");
    if (k === "t") t = Number(v);
    else if (k === "v1" && v) sigs.push(v);
  }
  if (!t || !sigs.length || Math.abs(nowMs / 1e3 - t) > toleranceSeconds) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return sigs.some((s) => s.length === expected.length && [...s].reduce((d, c, i) => d | c.charCodeAt(0) ^ expected.charCodeAt(i), 0) === 0);
}
__name(verifyStripeSignature, "verifyStripeSignature");
__name2(verifyStripeSignature, "verifyStripeSignature");
__name22(verifyStripeSignature, "verifyStripeSignature");
__name222(verifyStripeSignature, "verifyStripeSignature");
__name2222(verifyStripeSignature, "verifyStripeSignature");
__name22222(verifyStripeSignature, "verifyStripeSignature");
__name222222(verifyStripeSignature, "verifyStripeSignature");
__name2222222(verifyStripeSignature, "verifyStripeSignature");
async function userForCustomer(env, customerId, metaUser) {
  await ensureBilling(env);
  if (metaUser) {
    const u2 = await env.DB.prepare("SELECT id FROM users WHERE id = ?").bind(metaUser).first();
    if (u2) return u2.id;
  }
  const r = await env.DB.prepare("SELECT user_id FROM subscriptions WHERE customer_id = ?").bind(customerId).first();
  if (r) return r.user_id;
  let c = null;
  try {
    c = await stripe(env, "GET", "customers/" + customerId);
  } catch {
    return null;
  }
  if (!c?.email) return null;
  const u = await env.DB.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").bind(c.email).first();
  return u?.id || null;
}
__name(userForCustomer, "userForCustomer");
__name2(userForCustomer, "userForCustomer");
__name22(userForCustomer, "userForCustomer");
__name222(userForCustomer, "userForCustomer");
__name2222(userForCustomer, "userForCustomer");
__name22222(userForCustomer, "userForCustomer");
__name222222(userForCustomer, "userForCustomer");
__name2222222(userForCustomer, "userForCustomer");
async function handleStripeWebhook(request, env) {
  if (request.method !== "POST") return fail(405, "Use POST.");
  const payload = await request.text();
  const header = request.headers.get("Stripe-Signature");
  let valid = false;
  for (const secret of await webhookSecrets(env)) if (await verifyStripeSignature(secret, payload, header)) {
    valid = true;
    break;
  }
  if (!valid) {
    console.error("Stripe webhook: bad signature");
    return fail(400, "Invalid signature");
  }
  const event = JSON.parse(payload);
  const obj = event.data?.object || {};
  if (event.type === "checkout.session.completed" && obj.mode === "subscription" && obj.subscription) {
    let sub;
    try {
      sub = await stripe(env, "GET", "subscriptions/" + obj.subscription);
    } catch {
      console.error("Stripe webhook: subscription not found", obj.subscription);
      return json({ received: true, matched: false });
    }
    const userId = await userForCustomer(env, obj.customer, obj.client_reference_id || obj.metadata?.user_id);
    if (userId) await applySubscription(env, userId, sub);
  } else if (event.type?.startsWith("customer.subscription.")) {
    const userId = await userForCustomer(env, obj.customer, obj.metadata?.user_id);
    if (userId) {
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
__name(handleStripeWebhook, "handleStripeWebhook");
__name2(handleStripeWebhook, "handleStripeWebhook");
__name22(handleStripeWebhook, "handleStripeWebhook");
__name222(handleStripeWebhook, "handleStripeWebhook");
__name2222(handleStripeWebhook, "handleStripeWebhook");
__name22222(handleStripeWebhook, "handleStripeWebhook");
__name222222(handleStripeWebhook, "handleStripeWebhook");
__name2222222(handleStripeWebhook, "handleStripeWebhook");
var SAVED_SECRET = "stripe_webhook_secret";
async function webhookSecrets(env) {
  const out = [];
  if (env.STRIPE_WEBHOOK_SECRET) out.push(env.STRIPE_WEBHOOK_SECRET);
  try {
    const r = await env.DB.prepare("SELECT value FROM config WHERE key = ?").bind(SAVED_SECRET).first();
    if (r?.value) out.push(r.value);
  } catch {
  }
  return out;
}
__name(webhookSecrets, "webhookSecrets");
__name2(webhookSecrets, "webhookSecrets");
__name22(webhookSecrets, "webhookSecrets");
__name222(webhookSecrets, "webhookSecrets");
__name2222(webhookSecrets, "webhookSecrets");
__name22222(webhookSecrets, "webhookSecrets");
__name222222(webhookSecrets, "webhookSecrets");
__name2222222(webhookSecrets, "webhookSecrets");
async function fixWebhook(env) {
  const hooks = (await stripe(env, "GET", "webhook_endpoints", { limit: 50 })).data || [];
  const ours = hooks.find((h) => h.url === WEBHOOK_URL);
  if (!ours) {
    const created = await stripe(env, "POST", "webhook_endpoints", {
      url: WEBHOOK_URL,
      enabled_events: WEBHOOK_EVENTS,
      description: "WellNest on Cloudflare (wellnest.services)"
    });
    await env.DB.prepare("INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(SAVED_SECRET, created.secret).run();
    return "Created the webhook for " + WEBHOOK_URL + " and saved its signing secret.";
  }
  const events = ours.enabled_events || [];
  const missing = events.includes("*") ? [] : WEBHOOK_EVENTS.filter((e) => !events.includes(e));
  const changes = {};
  if (missing.length) changes.enabled_events = [...events, ...missing];
  if (ours.status !== "enabled") changes.disabled = "false";
  if (Object.keys(changes).length) {
    await stripe(env, "POST", "webhook_endpoints/" + ours.id, changes);
    return "Updated the existing webhook for " + WEBHOOK_URL + ".";
  }
  return "The webhook for " + WEBHOOK_URL + " was already set up.";
}
__name(fixWebhook, "fixWebhook");
__name2(fixWebhook, "fixWebhook");
__name22(fixWebhook, "fixWebhook");
__name222(fixWebhook, "fixWebhook");
__name2222(fixWebhook, "fixWebhook");
__name22222(fixWebhook, "fixWebhook");
__name222222(fixWebhook, "fixWebhook");
__name2222222(fixWebhook, "fixWebhook");
async function handleBillingStatus(request, env, user) {
  if (!await isAnalyticsAdmin(env, user)) return fail(403, "Only site admins can see this.");
  const out = {
    secretKey: env.STRIPE_SECRET_KEY ? env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "set (live mode)" : env.STRIPE_SECRET_KEY.startsWith("sk_test_") ? "set (test mode)" : "set (unrecognised format)" : "MISSING",
    webhookSecret: env.STRIPE_WEBHOOK_SECRET ? env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_") ? "set" : "set (unrecognised format)" : "not set in Cloudflare",
    webhookUrlExpected: WEBHOOK_URL,
    prices: {},
    webhooks: [],
    problems: []
  };
  if (!env.STRIPE_SECRET_KEY) {
    out.problems.push("Add STRIPE_SECRET_KEY as a Secret in Cloudflare.");
    return json(out);
  }
  try {
    if (new URL(request.url).searchParams.get("fix") === "webhook") out.fixed = await fixWebhook(env);
    const account2 = await stripe(env, "GET", "account");
    out.account = { id: account2.id, name: account2.settings?.dashboard?.display_name || account2.business_profile?.name, chargesEnabled: account2.charges_enabled };
    if (!account2.charges_enabled) out.problems.push("Stripe says this account can't take payments yet (finish activation in Stripe).");
    for (const key of Object.keys(PLANS)) {
      const id = await priceFor(env, key);
      const p = await stripe(env, "GET", "prices/" + id);
      out.prices[key] = { id, amount: p.unit_amount / 100, currency: p.currency, interval: p.recurring?.interval, active: p.active };
    }
    const hooks = await stripe(env, "GET", "webhook_endpoints", { limit: 50 });
    out.webhooks = (hooks.data || []).map((h) => ({ url: h.url, status: h.status, events: h.enabled_events }));
    const ours = out.webhooks.find((h) => h.url === WEBHOOK_URL);
    if (!ours) out.problems.push(`No Stripe webhook points at ${WEBHOOK_URL}. To set it up automatically, open ${SITE}/api/billing/status?fix=webhook while signed in.`);
    else {
      if (ours.status !== "enabled") out.problems.push("The webhook for this site is disabled in Stripe.");
      const missing = ours.events.includes("*") ? [] : WEBHOOK_EVENTS.filter((e) => !ours.events.includes(e));
      if (missing.length) out.problems.push("The webhook is missing these events: " + missing.join(", "));
    }
    const old = out.webhooks.filter((h) => h.url !== WEBHOOK_URL && h.status === "enabled");
    if (old.length) out.notes = ["Stripe also sends events to: " + [...new Set(old.map((h) => h.url))].join(", ") + ". Those belong to the old site; once it's no longer used, they can be disabled in Stripe (Developers \u2192 Webhooks)."];
  } catch (e) {
    out.problems.push(e.message);
  }
  const saved = (await webhookSecrets(env)).length > (env.STRIPE_WEBHOOK_SECRET ? 1 : 0);
  if (saved) out.webhookSecretSavedBySetup = true;
  if (!env.STRIPE_WEBHOOK_SECRET && !saved) out.problems.push(`No webhook signing secret yet. Open ${SITE}/api/billing/status?fix=webhook while signed in.`);
  out.ok = !out.problems.length;
  return json(out);
}
__name(handleBillingStatus, "handleBillingStatus");
__name2(handleBillingStatus, "handleBillingStatus");
__name22(handleBillingStatus, "handleBillingStatus");
__name222(handleBillingStatus, "handleBillingStatus");
__name2222(handleBillingStatus, "handleBillingStatus");
__name22222(handleBillingStatus, "handleBillingStatus");
__name222222(handleBillingStatus, "handleBillingStatus");
__name2222222(handleBillingStatus, "handleBillingStatus");
async function billingFunction(env, request, name, user, b) {
  switch (name) {
    case "createCheckout":
      return json(await createCheckout(env, user, b));
    case "syncSubscription":
      return json(user ? await syncSubscription(env, user) : { synced: false });
    case "growthAccess":
      return json(await growthAccess(env, user));
    case "billingPortal":
      return json(await billingPortal(env, user, b));
  }
  return null;
}
__name(billingFunction, "billingFunction");
__name2(billingFunction, "billingFunction");
__name22(billingFunction, "billingFunction");
__name222(billingFunction, "billingFunction");
__name2222(billingFunction, "billingFunction");
__name22222(billingFunction, "billingFunction");
__name222222(billingFunction, "billingFunction");
__name2222222(billingFunction, "billingFunction");
var ENTITY_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
var FIELD_RE = /^[A-Za-z_][A-Za-z0-9_.]{0,63}$/;
var META = ["id", "created_by_id", "created_by", "owner_id", "created_date", "updated_date"];
var MAX_RECORD_BYTES = 1024 * 1024;
var CHUNK_SIZE = 1024 * 1024;
var MAX_UPLOAD = 50 * 1024 * 1024;
async function body(request) {
  const text = await request.text();
  if (text.length > MAX_RECORD_BYTES) throw Object.assign(new Error("too large"), { status: 413 });
  if (!text) return {};
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad body");
  return data;
}
__name(body, "body");
__name2(body, "body");
__name22(body, "body");
__name222(body, "body");
__name2222(body, "body");
__name22222(body, "body");
__name222222(body, "body");
__name2222222(body, "body");
function account(u) {
  let data = {};
  try {
    data = JSON.parse(u.data || "{}");
  } catch {
  }
  return { ...data, id: u.id, email: u.email, full_name: u.full_name, role: u.role, created_date: u.created_date, updated_date: u.updated_date };
}
__name(account, "account");
__name2(account, "account");
__name22(account, "account");
__name222(account, "account");
__name2222(account, "account");
__name22222(account, "account");
__name222222(account, "account");
__name2222222(account, "account");
var PROTECTED_ACCOUNT = /* @__PURE__ */ new Set([...META, "email", "role", "subscription_tier", "complimentary_full_access", "password", "password_hash"]);
async function handleMe(request, env, user) {
  if (request.method === "GET") return json(account(user));
  if (request.method === "PATCH") {
    const patch = await body(request);
    for (const k of Object.keys(patch)) if (PROTECTED_ACCOUNT.has(k)) delete patch[k];
    const fullName = typeof patch.full_name === "string" ? patch.full_name.slice(0, 120) : null;
    await env.DB.prepare("UPDATE users SET data = json_patch(data, ?), full_name = COALESCE(?, full_name), updated_date = ? WHERE id = ?").bind(JSON.stringify(patch), fullName, now(), user.id).run();
    const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
    return json(account(fresh));
  }
  return fail(405, "Method not allowed");
}
__name(handleMe, "handleMe");
__name2(handleMe, "handleMe");
__name22(handleMe, "handleMe");
__name222(handleMe, "handleMe");
__name2222(handleMe, "handleMe");
__name22222(handleMe, "handleMe");
__name222222(handleMe, "handleMe");
__name2222222(handleMe, "handleMe");
function serialize(row2, user) {
  let data = {};
  try {
    data = JSON.parse(row2.data);
  } catch {
  }
  return { ...data, id: row2.id, created_by_id: row2.owner_id, created_by: user.email, created_date: row2.created_date, updated_date: row2.updated_date };
}
__name(serialize, "serialize");
__name2(serialize, "serialize");
__name22(serialize, "serialize");
__name222(serialize, "serialize");
__name2222(serialize, "serialize");
__name22222(serialize, "serialize");
__name222222(serialize, "serialize");
__name2222222(serialize, "serialize");
function fieldExpr(field) {
  if (field === "id") return "id";
  if (field === "created_date" || field === "updated_date") return field;
  if (field === "created_by_id" || field === "created_by" || field === "owner_id") return null;
  if (!FIELD_RE.test(field)) throw Object.assign(new Error("bad field"), { status: 400 });
  return `json_extract(data, '$.${field}')`;
}
__name(fieldExpr, "fieldExpr");
__name2(fieldExpr, "fieldExpr");
__name22(fieldExpr, "fieldExpr");
__name222(fieldExpr, "fieldExpr");
__name2222(fieldExpr, "fieldExpr");
__name22222(fieldExpr, "fieldExpr");
__name222222(fieldExpr, "fieldExpr");
__name2222222(fieldExpr, "fieldExpr");
var sqlValue = /* @__PURE__ */ __name2222222((v) => typeof v === "boolean" ? v ? 1 : 0 : v, "sqlValue");
function buildFilter(filter, where, params) {
  for (const [field, cond] of Object.entries(filter || {})) {
    const expr = fieldExpr(field);
    if (expr === null) continue;
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      for (const [op, v] of Object.entries(cond)) {
        const map = { $eq: "=", $ne: "!=", $gt: ">", $gte: ">=", $lt: "<", $lte: "<=" };
        if (map[op]) {
          where.push(`${expr} ${map[op]} ?`);
          params.push(sqlValue(v));
        } else if ((op === "$in" || op === "$nin") && Array.isArray(v)) {
          if (!v.length) {
            where.push(op === "$in" ? "0" : "1");
            continue;
          }
          where.push(`${expr} ${op === "$in" ? "IN" : "NOT IN"} (${v.map(() => "?").join(",")})`);
          params.push(...v.map(sqlValue));
        } else throw Object.assign(new Error("bad operator"), { status: 400 });
      }
    } else if (cond === null) {
      where.push(`${expr} IS NULL`);
    } else if (Array.isArray(cond)) {
      where.push(`${expr} IN (${cond.map(() => "?").join(",") || "NULL"})`);
      params.push(...cond.map(sqlValue));
    } else {
      where.push(`${expr} = ?`);
      params.push(sqlValue(cond));
    }
  }
}
__name(buildFilter, "buildFilter");
__name2(buildFilter, "buildFilter");
__name22(buildFilter, "buildFilter");
__name222(buildFilter, "buildFilter");
__name2222(buildFilter, "buildFilter");
__name22222(buildFilter, "buildFilter");
__name222222(buildFilter, "buildFilter");
__name2222222(buildFilter, "buildFilter");
async function handleEntities(request, env, user, entity, id) {
  if (!ENTITY_RE.test(entity)) return fail(400, "Invalid record type");
  const url = new URL(request.url);
  const m = request.method;
  if (entity === "CloudDataBackup" && (m === "POST" && !id || (m === "PUT" || m === "PATCH") && id)) {
    const guarded = await handleMedicationBackup(request.clone(), env, user, id);
    if (guarded) return guarded;
  }
  if (m === "GET" && !id) {
    let filter = {};
    try {
      filter = JSON.parse(url.searchParams.get("filter") || "{}");
    } catch {
      return fail(400, "Invalid filter");
    }
    const where = ["entity = ?", "owner_id = ?"], params = [entity, user.id];
    buildFilter(filter, where, params);
    if (url.searchParams.get("count") === "true") {
      const r = await env.DB.prepare(`SELECT count(*) AS count FROM records WHERE ${where.join(" AND ")}`).bind(...params).first();
      return json({ count: r.count });
    }
    let sort = url.searchParams.get("sort") || "-created_date";
    const desc = sort.startsWith("-");
    sort = sort.replace(/^[-+]/, "");
    const sortExpr = fieldExpr(sort) || "created_date";
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit"), 10) || 100));
    const skip = Math.max(0, parseInt(url.searchParams.get("skip"), 10) || 0);
    const rows = await env.DB.prepare(
      `SELECT * FROM records WHERE ${where.join(" AND ")} ORDER BY ${sortExpr} ${desc ? "DESC" : "ASC"}, id LIMIT ? OFFSET ?`
    ).bind(...params, limit, skip).all();
    const items = rows.results.map((r) => serialize(r, user));
    return json({ items, next_cursor: items.length === limit ? String(skip + limit) : null });
  }
  if (m === "POST" && !id) {
    const data = await body(request);
    for (const k of META) delete data[k];
    const t = now();
    const row3 = await env.DB.prepare(
      "INSERT INTO records (entity, id, owner_id, created_date, updated_date, data) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(entity, uuid(), user.id, t, t, JSON.stringify(data)).first();
    return json(serialize(row3, user), 201);
  }
  if (!id) return fail(405, "Method not allowed");
  let row2;
  if (m === "GET") {
    row2 = await env.DB.prepare("SELECT * FROM records WHERE entity = ? AND id = ? AND owner_id = ?").bind(entity, id, user.id).first();
  } else if (m === "PATCH" || m === "PUT") {
    const data = await body(request);
    for (const k of META) delete data[k];
    row2 = await env.DB.prepare(
      "UPDATE records SET data = json_patch(data, ?), updated_date = ? WHERE entity = ? AND id = ? AND owner_id = ? RETURNING *"
    ).bind(JSON.stringify(data), now(), entity, id, user.id).first();
  } else if (m === "DELETE") {
    row2 = await env.DB.prepare("DELETE FROM records WHERE entity = ? AND id = ? AND owner_id = ? RETURNING *").bind(entity, id, user.id).first();
  } else {
    return fail(405, "Method not allowed");
  }
  return row2 ? json(serialize(row2, user)) : fail(404, "Record not found");
}
__name(handleEntities, "handleEntities");
__name2(handleEntities, "handleEntities");
__name22(handleEntities, "handleEntities");
__name222(handleEntities, "handleEntities");
__name2222(handleEntities, "handleEntities");
__name22222(handleEntities, "handleEntities");
__name222222(handleEntities, "handleEntities");
__name2222222(handleEntities, "handleEntities");
async function handleUploads(request, env, user, parts) {
  if (request.method === "POST" && parts.length === 0) {
    const b = await body(request);
    const size = Number(b.size);
    if (!Number.isFinite(size) || size < 1 || size > MAX_UPLOAD) return fail(413, "Files must be between 1 byte and 50 MB.");
    const id2 = uuid();
    const chunkCount = Math.ceil(size / CHUNK_SIZE);
    await env.DB.prepare(`INSERT INTO uploads (id, owner_id, name, content_type, size_bytes, chunk_size, chunk_count, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id2, user.id, String(b.name || "document").slice(0, 200), String(b.type || "application/octet-stream").slice(0, 100), size, CHUNK_SIZE, chunkCount, now()).run();
    return json({ upload_id: id2, chunk_size: CHUNK_SIZE, chunk_count: chunkCount }, 201);
  }
  const [id, action, n] = parts;
  const up = await env.DB.prepare("SELECT * FROM uploads WHERE id = ? AND owner_id = ?").bind(id, user.id).first();
  if (!up) return fail(404, "Upload not found");
  if (request.method === "PUT" && action === "chunks") {
    const idx = Number(n);
    if (!Number.isInteger(idx) || idx < 0 || idx >= up.chunk_count) return fail(400, "Invalid chunk");
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength < 1 || bytes.byteLength > up.chunk_size) return fail(413, "Chunk too large");
    await env.DB.prepare("INSERT OR REPLACE INTO upload_chunks (upload_id, idx, data) VALUES (?, ?, ?)").bind(id, idx, bytes).run();
    return json({ received: idx });
  }
  if (request.method === "POST" && action === "complete") {
    const r = await env.DB.prepare("SELECT count(*) AS c, sum(length(data)) AS s FROM upload_chunks WHERE upload_id = ?").bind(id).first();
    if (r.c !== up.chunk_count || r.s !== up.size_bytes) return fail(400, "The upload is incomplete. Please try again.");
    const fileId = uuid();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO files (id, owner_id, name, content_type, size_bytes, chunk_count, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(fileId, user.id, up.name, up.content_type, up.size_bytes, up.chunk_count, now()),
      env.DB.prepare("INSERT INTO file_chunks (file_id, idx, data) SELECT ?, idx, data FROM upload_chunks WHERE upload_id = ?").bind(fileId, id),
      env.DB.prepare("DELETE FROM uploads WHERE id = ?").bind(id)
    ]);
    return json({ file_uri: `wellnest-file://${fileId}`, file_id: fileId, name: up.name, size: up.size_bytes, content_type: up.content_type });
  }
  return fail(405, "Method not allowed");
}
__name(handleUploads, "handleUploads");
__name2(handleUploads, "handleUploads");
__name22(handleUploads, "handleUploads");
__name222(handleUploads, "handleUploads");
__name2222(handleUploads, "handleUploads");
__name22222(handleUploads, "handleUploads");
__name222222(handleUploads, "handleUploads");
__name2222222(handleUploads, "handleUploads");
async function handleFileSign(request, env, user) {
  const b = await body(request);
  const m = String(b.file_uri || "").match(/^wellnest-file:\/\/([0-9a-f-]{36})$/);
  if (!m) return fail(404, "File not found");
  const file = await env.DB.prepare("SELECT id FROM files WHERE id = ? AND owner_id = ?").bind(m[1], user.id).first();
  if (!file) return fail(404, "File not found");
  const ttl = Math.min(3600, Math.max(60, Number(b.expires_in) || 900));
  const exp = Math.floor(Date.now() / 1e3) + ttl;
  const sig = await hmac(env, "file", `${file.id}.${exp}`);
  return json({ signed_url: `${SITE}/api/files/raw/${file.id}?exp=${exp}&sig=${sig}` });
}
__name(handleFileSign, "handleFileSign");
__name2(handleFileSign, "handleFileSign");
__name22(handleFileSign, "handleFileSign");
__name222(handleFileSign, "handleFileSign");
__name2222(handleFileSign, "handleFileSign");
__name22222(handleFileSign, "handleFileSign");
__name222222(handleFileSign, "handleFileSign");
__name2222222(handleFileSign, "handleFileSign");
async function handleFileRaw(request, env, fileId) {
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("exp"));
  if (!exp || exp * 1e3 < Date.now() || !await hmacVerify(env, "file", `${fileId}.${exp}`, url.searchParams.get("sig") || "")) {
    return new Response("This link has expired.", { status: 403 });
  }
  const file = await env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(fileId).first();
  if (!file) return new Response("Not found", { status: 404 });
  const { readable, writable } = new TransformStream();
  (async () => {
    const w = writable.getWriter();
    for (let i = 0; i < file.chunk_count; i++) {
      const c = await env.DB.prepare("SELECT data FROM file_chunks WHERE file_id = ? AND idx = ?").bind(fileId, i).first();
      await w.write(new Uint8Array(c.data));
    }
    await w.close();
  })();
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  return new Response(readable, {
    headers: {
      "Content-Type": file.content_type,
      "Content-Length": String(file.size_bytes),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'"
    }
  });
}
__name(handleFileRaw, "handleFileRaw");
__name2(handleFileRaw, "handleFileRaw");
__name22(handleFileRaw, "handleFileRaw");
__name222(handleFileRaw, "handleFileRaw");
__name2222(handleFileRaw, "handleFileRaw");
__name22222(handleFileRaw, "handleFileRaw");
__name222222(handleFileRaw, "handleFileRaw");
__name2222222(handleFileRaw, "handleFileRaw");
var UNAVAILABLE = "This feature is temporarily unavailable.";
var EMAIL_RE2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function handleFunction(request, env, name) {
  let b = {};
  try {
    b = await body(request);
  } catch {
  }
  switch (name) {
    case "growthAccess":
    case "syncSubscription":
    case "createCheckout":
    case "billingPortal":
      try {
        return await billingFunction(env, request, name, await currentUser(env, request), b);
      } catch (e) {
        if (!e.status) throw e;
        return json({ error: e.message }, e.status);
      }
    case "onNewUserSignup":
    case "emailPreferences":
      return json({ success: true });
    case "emberWaitlist":
    case "freeKit": {
      if (b.website) return json({ success: true });
      const email = String(b.email || "").trim().toLowerCase();
      if (!EMAIL_RE2.test(email)) return json({ success: false, error: "Please enter a valid email address." }, 400);
      if (await rateLimited(env, request, name, 5)) return json({ success: false, error: "Too many attempts. Please try again later." }, 429);
      const existing = await env.DB.prepare("SELECT 1 FROM waitlist WHERE email = ? AND list = ?").bind(email, name).first();
      if (!existing) {
        await env.DB.prepare("INSERT OR IGNORE INTO waitlist (email, name, list, created_date) VALUES (?, ?, ?, ?)").bind(email, String(b.name || "").slice(0, 120), name, now()).run();
      }
      if (name === "freeKit") {
        const link = `${SITE}/free-tools`;
        await sendEmail(env, {
          to: email,
          subject: "Your free WellNest kit",
          html: emailLayout("Your free WellNest kit", "Here are WellNest's free printable trackers and tools: symptom summaries, medication lists, pain diaries and more.", "Open the free kit", link),
          text: `Your free WellNest kit: ${link}`
        });
      }
      return json({ success: true, already_registered: !!existing });
    }
    case "emergencyPlanShare":
      if (b.action === "get") return json({ error: "This link is not valid or has been turned off." }, 404);
      return json({ error: UNAVAILABLE }, 503);
    default:
      return json({ error: UNAVAILABLE }, 503);
  }
}
__name(handleFunction, "handleFunction");
__name2(handleFunction, "handleFunction");
__name22(handleFunction, "handleFunction");
__name222(handleFunction, "handleFunction");
__name2222(handleFunction, "handleFunction");
__name22222(handleFunction, "handleFunction");
__name222222(handleFunction, "handleFunction");
__name2222222(handleFunction, "handleFunction");
var OLD_BASE = "/wellnest-website";
var IMAGE_CACHE = "public, max-age=604800, stale-while-revalidate=86400";
var APP_ROUTES = /* @__PURE__ */ new Set([
  "achievements",
  "appointments",
  "asthma",
  "care-circle",
  "chronic-pain",
  "confirm-free-kit",
  "dashboard",
  "dashboard-beta",
  "email-preferences",
  "emergency-plan",
  "emergency-plan-shared",
  "epilepsy",
  "exercises",
  "expenses",
  "free-symptom-diary-template",
  "growth",
  "login",
  "medications",
  "meeting-note-shared",
  "reflection",
  "settings",
  "start"
]);
var PUBLIC_APP_ROUTES = /* @__PURE__ */ new Set(["free-symptom-diary-template"]);
var LEGACY = {
  "/home": "/",
  "/landing": "/",
  "/careteam": "/care-circle",
  "/journal": "/reflection",
  "/chronicpain": "/chronic-pain",
  "/emergency": "/emergency-plan",
  "/dashboardpainmodal": "/dashboard",
  "/asthmaactionplan": "/asthma",
  "/contacts": "/care-circle"
};
var RENAMED = { "/pricing": true, "/privacypolicy": true, "/termsofservice": true };
async function cleanAddress(env, url) {
  const p = url.pathname;
  if (p === "/" || p.startsWith("/assets/") || p.startsWith("/api/") || p.startsWith("/admin") || url.searchParams.has("wn_preview")) return null;
  if (p === "/index.html") return "/";
  const lower = p.toLowerCase().replace(/\.html$/, "").replace(/\/+$/, "");
  if (RENAMED[lower] && p !== lower) return lower;
  if (LEGACY[lower] !== void 0) return LEGACY[lower];
  if (/[A-Z]/.test(p) && APP_ROUTES.has(lower.slice(1))) return lower;
  const page = p.match(/^\/([A-Za-z0-9-]+)\.html$/);
  if (page && page[1] !== "404") return "/" + page[1];
  if (p.length > 1 && p.endsWith("/") && /^\/[A-Za-z0-9/-]+\/$/.test(p)) {
    const bare = p.replace(/\/+$/, "");
    const head = await env.ASSETS.fetch(new Request(url.origin + bare, { method: "HEAD", redirect: "manual" }));
    if (head.status === 200) return bare;
  }
  return null;
}
__name(cleanAddress, "cleanAddress");
__name2(cleanAddress, "cleanAddress");
__name22(cleanAddress, "cleanAddress");
__name222(cleanAddress, "cleanAddress");
__name2222(cleanAddress, "cleanAddress");
__name22222(cleanAddress, "cleanAddress");
__name222222(cleanAddress, "cleanAddress");
__name2222222(cleanAddress, "cleanAddress");
async function api(request, env, path) {
  await ensureSchema(env);
  const parts = path.split("/").filter(Boolean).slice(1);
  if (parts[0] === "_identity") return handleIdentity(request, env, "/" + parts.slice(1).join("/"));
  if (path === "/api/auth/google/callback") return new URL(request.url).searchParams.get("state")?.startsWith("calendar:") ? handleCalendar(request, env) : handleGoogleCallback(request, env);
  if (parts[0] === "files" && parts[1] === "raw" && parts[2] && request.method === "GET") return handleFileRaw(request, env, parts[2]);
  if (parts[0] === "functions" && parts[1] && request.method === "POST") return handleFunction(request, env, parts[1]);
  if (path === "/api/analytics/collect") return handleCollect(request, env);
  if (path === "/api/stripe/webhook") return handleStripeWebhook(request, env);
  if (path === "/api/claude/status") return json({ connected: false, reason: "Not configured" });
  if (path === "/api/calendar/subscription") return handleCalendarSubscription(request, env);
  if (path.startsWith("/api/calendar/feed/")) return handleCalendarFeed(request, env);
  if (parts[0] === "calendar") return handleCalendar(request, env);
  const user = await currentUser(env, request);
  if (!user) return fail(401, "Authentication required");
  if (path === "/api/analytics/stats" && request.method === "GET") return handleStats(request, env, user);
  if (path === "/api/analytics/accounts" && request.method === "GET") return handleAccountAnalytics(request, env, user);
  if (parts[0] === "editor" && parts[1]) return handleEditor(request, env, user, parts[1]);
  if (path === "/api/seo/indexnow") return handleIndexNow(request, env, user);
  if (path === "/api/billing/status" && request.method === "GET") return handleBillingStatus(request, env, user);
  if (path === "/api/auth/me") return handleMe(request, env, user);
  if (parts[0] === "entities" && parts[1]) return handleEntities(request, env, user, decodeURIComponent(parts[1]), parts[2] && decodeURIComponent(parts[2]));
  if (parts[0] === "uploads") return handleUploads(request, env, user, parts.slice(1));
  if (path === "/api/files/sign" && request.method === "POST") return handleFileSign(request, env, user);
  if (path === "/api/files/aliases") return json({ aliases: {} });
  return fail(404, "Not found");
}
__name(api, "api");
__name2(api, "api");
__name22(api, "api");
__name222(api, "api");
__name2222(api, "api");
__name22222(api, "api");
__name222222(api, "api");
__name2222222(api, "api");
var worker_default = {
  // Daily: tell search engines about new and changed pages (cloudflare/seo.js).
  async scheduled(event, env, ctx) {
    await ensureSchema(env);
    ctx.waitUntil(scheduledIndexNow(env));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (["/chronic-health-tracker", "/chronic-health-tracker/", "/chronic-health-tracker.html"].includes(url.pathname) && ["GET", "HEAD"].includes(request.method)) return Response.redirect(SITE + "/chronic-illness-tracker" + url.search, 301);
    if (url.pathname === "/calendar-quick-add") return calendarQuickAddPage(request);
    if (url.pathname === "/api/calendar/quick-add") return calendarQuickAddData(request, env);
    if (url.pathname === "/calendar-download") return simpleCalendarPage(request);
    if (url.pathname === "/api/calendar/download") return simpleCalendarDownload(request, env);
    if (url.pathname === "/.well-known/apple-app-site-association" || url.pathname === "/apple-app-site-association") {
      const aasa = {
        webcredentials: {
          apps: ["ZJ3T7365MJ.app.bitrig.chrisgreenfield.wellnest"]
        },
        applinks: {
          apps: [],
          details: [
            {
              appIDs: ["ZJ3T7365MJ.app.bitrig.chrisgreenfield.wellnest"],
              components: [
                { "/": "/ios-auth/*" }
              ]
            }
          ]
        }
      };
      return new Response(JSON.stringify(aasa), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
    if (url.hostname === "www.wellnest.services") {
      return Response.redirect(SITE + url.pathname + url.search, 301);
    }
    if (url.pathname === OLD_BASE || url.pathname.startsWith(OLD_BASE + "/")) {
      const next = new URL(url.origin + (url.pathname.slice(OLD_BASE.length) || "/") + url.search);
      return Response.redirect(url.origin + (await cleanAddress(env, next) || next.pathname) + url.search, 301);
    }
    if (url.pathname === "/.netlify/identity" || url.pathname.startsWith("/.netlify/identity/")) {
      url.pathname = "/api/_identity" + url.pathname.slice("/.netlify/identity".length);
    }
    if (url.pathname.startsWith("/api/")) {
      const cors = corsHeaders(request);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let res2;
      try {
        res2 = await api(request, env, url.pathname);
      } catch (e) {
        console.error("API error", url.pathname, e?.stack || e);
        const status = e instanceof SyntaxError ? 400 : e?.status || 500;
        res2 = fail(status, status === 413 ? "That's too large to save." : status === 400 ? "Invalid request" : "Something went wrong. Please try again.");
      }
      if (!Object.keys(cors).length || res2.status === 101) return res2;
      const out = new Response(res2.body, res2);
      for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
      return out;
    }
    if (url.searchParams.has("wn_preview")) {
      await ensureSchema(env);
      const draft = await servePreview(request, env, url);
      if (draft) return draft;
    }
    if (url.pathname.startsWith("/assets/index") && previewCookie(request)) {
      await ensureSchema(env);
      const app = await servePreviewApp(request, env, url);
      if (app) return app;
    }
    if (request.method === "GET" || request.method === "HEAD") {
      const clean = await cleanAddress(env, url);
      if (clean) return Response.redirect(url.origin + clean + url.search, 301);
    }
    if (url.pathname === "/press" && ["GET", "HEAD"].includes(request.method)) return wellnestProductFacts(request, url);
    const image = /^\/(?:imported|landing)\/[^/]+\.(?:png|jpe?g)$/i.test(url.pathname);
    if (image && (request.method === "GET" || request.method === "HEAD") && /image\/webp/.test(request.headers.get("Accept") || "")) {
      const webp = await env.ASSETS.fetch(new Request(url.origin + url.pathname.replace(/\.[a-z]+$/i, ".webp"), { method: request.method, headers: request.headers }));
      if (webp.status === 200 || webp.status === 304) {
        const out = new Response(webp.body, webp);
        out.headers.set("Content-Type", "image/webp");
        out.headers.set("Vary", "Accept");
        out.headers.set("Cache-Control", IMAGE_CACHE);
        return out;
      }
    }
    let res = await env.ASSETS.fetch(request);
    if (request.method === "GET" && res.status === 200 && /^\/admin\/analytics(?:\/|\.html)?$/.test(url.pathname)) {
      const html = await res.text();
      const updated = html.replace('<main id="main">', ACCOUNT_ANALYTICS_HTML + '<main id="main">');
      res = new Response(updated, res);
      res.headers.delete("Content-Length");
      res.headers.delete("ETag");
      res.headers.set("Cache-Control", "private, no-store");
    }
    if (res.status === 200 && /^\/(?:imported|landing|og)\/[^/]+\.(?:png|jpe?g|webp|svg)$/i.test(url.pathname)) {
      res = new Response(res.body, res);
      res.headers.set("Cache-Control", IMAGE_CACHE);
      if (image) res.headers.set("Vary", "Accept");
    }
    const route = url.pathname.replace(/\/+$/, "").split("/")[1] || "";
    if (res.status === 404 && APP_ROUTES.has(route)) {
      res = new Response(res.body, { status: 200, headers: res.headers });
      if (!PUBLIC_APP_ROUTES.has(route)) res.headers.set("X-Robots-Tag", "noindex");
    }
    if (res.status === 200 && /\.txt$/i.test(url.pathname) && !/charset/i.test(res.headers.get("Content-Type") || "")) {
      res = new Response(res.body, res);
      res.headers.set("Content-Type", "text/plain; charset=utf-8");
    }
    if (url.hostname.endsWith(".workers.dev")) {
      res = new Response(res.body, res);
      res.headers.set("X-Robots-Tag", "noindex");
    }
    if (request.method === "GET" && res.status === 200 && /text\/html/i.test(res.headers.get("Content-Type") || "")) {
      const html = await res.text();
      const patched = html.replace('init.credentials = "omit"; init.mode = "cors";', 'init.credentials = p.indexOf("/api/calendar/") === 0 ? "same-origin" : "omit"; init.mode = "cors";').replace("var target = L + p + x.search;", 'var target = (p.indexOf("/api/calendar/") === 0 ? location.origin : L) + p + x.search;');
      res = new Response(patched, res);
      if (patched !== html) {
        res.headers.delete("Content-Length");
        res.headers.delete("ETag");
      }
    }
    if (request.method === "GET" && res.status === 200 && /^\/assets\/google-calendar-[^/]+\.js$/.test(url.pathname)) {
      res = new Response("// Calendar UI shares the dashboard's React instance and existing account-sync engine.\nexport function createCalendarIntegration(React) {\n  const h = React.createElement;\n  const listeners = new Set();\n  let engine = null;\n  const notify = () => { for (const listener of listeners) listener(); };\n  async function request(action, method = 'GET', data) {\n    const response = await fetch('/api/calendar/' + action, { method, credentials:'same-origin',\n      headers: data ? { 'Content-Type':'application/json' } : {}, ...(data ? { body:JSON.stringify(data) } : {}) });\n    const body = await response.json().catch(()=>({}));\n    if (!response.ok) throw Error(body.error || 'Calendar connection could not be loaded. Try again.');\n    return body;\n  }\n  function CalendarSync({ userId, ready, getTracker, refresh }) {\n    const latest = React.useRef({ getTracker, refresh });\n    latest.current = { getTracker, refresh };\n    React.useEffect(() => {\n      if (!userId || !ready) return;\n      let stopped = false, busy = false, timer, active = null, error = '', message = '';\n      const current = {\n        userId,\n        async flush() { const tracker=latest.current.getTracker(); if(!tracker)throw Error('Your account is still loading. Try again shortly.'); await tracker.sync(); },\n        snapshot:()=>({ status:active, busy, error, message }),\n        async load() {\n          try { const result = await request('status'); if (!stopped) { active = result; error = ''; notify(); } return result; }\n          catch (e) { if (!stopped) { error = e.message; notify(); } throw e; }\n        },\n        async run() {\n          if (busy || stopped) return;\n          const tracker = latest.current.getTracker();\n          if (!tracker) return;\n          busy = true; error = ''; message = ''; notify();\n          try {\n            const status = active || await current.load();\n            if (!status.connected || !status.calendarId) return;\n            // Flush edits first. Pull Google changes through the same cloud merge afterwards.\n            await tracker.sync();\n            const result = await request('sync', 'POST', {});\n            await tracker.sync();\n            if (!stopped) {\n              latest.current.refresh();\n              active = { ...status, lastSyncedAt:result.lastSyncedAt };\n              message = result.partial ? 'Changes saved. More appointments are syncing; select Sync now to continue.' : 'Appointments are up to date.';\n            }\n          } catch (e) { if (!stopped) error = e.message; }\n          finally { busy = false; if (!stopped) notify(); }\n        }\n      };\n      engine = current;\n      notify();\n      const schedule = event => {\n        if (event?.type === 'wn-tracker-change' && event.detail?.key !== 'wn-appts') return;\n        clearTimeout(timer);\n        timer = setTimeout(()=>current.run(), 1800);\n      };\n      current.load().then(status=>{ if (status.connected && status.calendarId) schedule(); }).catch(()=>{});\n      const interval = setInterval(()=>{ if (document.visibilityState === 'visible') current.run(); }, 300000);\n      window.addEventListener('wn-tracker-change', schedule);\n      window.addEventListener('online', schedule);\n      window.addEventListener('focus', schedule);\n      return () => {\n        stopped = true; clearTimeout(timer); clearInterval(interval);\n        window.removeEventListener('wn-tracker-change', schedule); window.removeEventListener('online', schedule); window.removeEventListener('focus', schedule);\n        if (engine === current) engine = null;\n      };\n    }, [userId, ready]);\n    return null;\n  }\n  function AdvancedCalendarSettings({ userId }) {\n    const [, update] = React.useReducer(n=>n+1, 0);\n    const [calendars, setCalendars] = React.useState([]);\n    const [selected, setSelected] = React.useState('');\n    const [loading, setLoading] = React.useState(false);\n    const [localError, setLocalError] = React.useState('');\n    const [status, setStatus] = React.useState(null);\n    const current = engine?.userId === userId ? engine : null;\n    const snapshot = current?.snapshot() || {};\n    const value = snapshot.status || status;\n    const busy = loading || snapshot.busy;\n    const error = localError || snapshot.error;\n    async function load() {\n      setLoading(true); setLocalError('');\n      try {\n        const next = current ? await current.load() : await request('status');\n        setStatus(next); setSelected(next.calendarId || '');\n        if (next.connected) setCalendars((await request('calendars')).items);\n      } catch(e) { setLocalError(e.message); }\n      finally { setLoading(false); }\n    }\n    React.useEffect(()=>{ listeners.add(update); return ()=>listeners.delete(update); }, []);\n    React.useEffect(()=>{ load(); }, [userId]);\n    async function perform(action) {\n      setLoading(true); setLocalError('');\n      try {\n        if (action === 'connect') { const data = await request('connect','POST',{}); window.location.assign(data.url); return; }\n        if (action === 'select') {\n          await request('select','POST',{ calendarId:selected });\n          await load(); await engine?.run();\n        }\n        if (action === 'disconnect') { await request('disconnect','DELETE'); setCalendars([]); setSelected(''); await load(); }\n      } catch(e) { setLocalError(e.message); }\n      finally { setLoading(false); }\n    }\n    const callback = new URLSearchParams(window.location.search).get('calendar');\n    const callbackMessage = { connected:'Google connected. Choose the calendar you want to sync.', cancelled:'Google Calendar connection was cancelled. Your appointments were kept.', failed:'Google could not connect. Try again and allow calendar access.', 'invalid-state':'The connection request expired. Connect Google Calendar again.', 'setup-required':'Google Calendar connection is awaiting setup.' }[callback];\n    const button = (label, click, disabled = false, primary = false) => h('button',{ type:'button', className:primary?'db-btn-dark':'db-btn-soft', onClick:click, disabled:busy || disabled },label);\n    return h('section',{ className:'db-bento-card db-surface-white db-google-calendar', 'aria-labelledby':'google-calendar-title', 'aria-busy':!!busy, style:{ marginBottom:24, gap:16, alignItems:'stretch' } },\n      h('div',null,\n        h('span',{ className:'db-kicker' },'CONNECTED CALENDARS'),\n        h('h2',{ id:'google-calendar-title', className:'db-card-title', style:{ marginTop:10 } },'Google Calendar'),\n        h('p',{ className:'db-card-desc' },'Choose your personal calendar or a shared calendar, such as Family. Appointments sync in both directions while WellNest is open.')),\n      callbackMessage && h('p',{ role:'status' },callbackMessage),\n      !value && !error && h('p',{ role:'status' },'Loading calendar connection\u2026'),\n      value?.connected ? h(React.Fragment,null,\n        h('label',{ htmlFor:'google-calendar-choice', style:{ fontWeight:600 } },'Calendar to sync'),\n        h('select',{ id:'google-calendar-choice', value:selected, disabled:!!busy, onChange:e=>setSelected(e.target.value), style:{ width:'100%', maxWidth:520, padding:12, border:'1px solid #c7d6ca', borderRadius:10, background:'var(--db-paper, #fff)', color:'var(--db-ink)', font:'inherit' } },\n          h('option',{ value:'' },'Choose a calendar\u2026'),\n          value.calendarId && !calendars.some(c=>c.id===value.calendarId) && h('option',{ value:value.calendarId },value.calendarName || 'Selected calendar'),\n          ...calendars.map(c=>h('option',{ key:c.id, value:c.id },c.name + (c.primary?' (primary)':'')))),\n        !loading && !error && calendars.length===0 && h('p',null,'No editable calendars are available. Ask the calendar owner for permission to make changes, then refresh.'),\n        h('div',{ style:{ display:'flex', flexWrap:'wrap', gap:10 } },\n          button('Save calendar',()=>perform('select'),!selected || selected===value.calendarId,true),\n          button(snapshot.busy?'Syncing\u2026':'Sync now',()=>current?.run(),!value.calendarId || !current),\n          button('Refresh calendars',load), button('Connect a different Google account',()=>perform('connect')),\n          button('Disconnect',()=>perform('disconnect'))),\n        h('p',{ className:'db-card-desc' },value.calendarId ? `Syncing with ${value.calendarName || 'your selected calendar'}. ${value.lastSyncedAt ? 'Last synced ' + new Date(value.lastSyncedAt).toLocaleString() + '.' : 'Ready for the first sync.'}` : 'Select a writable calendar to start syncing.'),\n        h('p',{ className:'db-card-desc', style:{ fontSize:13 } },'Google events from the past year and next two years appear in WellNest. Deleting a synced appointment deletes it in both places. Google changes take priority if both copies are edited before syncing. Changing calendars copies your WellNest appointments to the new calendar; disconnecting keeps existing events.')\n      ) : button('Connect Google Calendar',()=>perform('connect'),!userId,true),\n      error && h('div',{ role:'alert' },h('p',null,error),button('Retry',load)),\n      snapshot.message && h('p',{ role:'status' },snapshot.message));\n  }\n  function CalendarSubscription({ userId }) {\n    const [value,setValue]=React.useState(null);\n    const [busy,setBusy]=React.useState(false);\n    const [error,setError]=React.useState('');\n    const [message,setMessage]=React.useState('');\n    const [zone,setZone]=React.useState(()=>Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney');\n    React.useEffect(()=>{\n      let active=true;setValue(null);setError('');\n      if(userId)request('subscription').then(result=>{if(active){setValue(result);if(result.timeZone)setZone(result.timeZone);}}).catch(e=>{if(active)setError(e.message);});\n      return ()=>{active=false;};\n    },[userId]);\n    async function change(remove=false) {\n      setBusy(true);setError('');setMessage('');\n      try {\n        if(!remove){\n          if(engine?.userId!==userId || !engine?.flush)throw Error('Wait for your account to finish loading, then try again.');\n          await engine.flush();\n        }\n        const result=await request('subscription',remove?'DELETE':'POST',remove?undefined:{timeZone:zone});\n        setValue(result);setMessage(remove?'Subscription disabled. The old link no longer works. Remove the old calendar from Google if you no longer want to see it.':'Your private subscription link is ready. Add it to Google Calendar using the steps below.');\n      } catch(e){setError(e.message);} finally{setBusy(false);}\n    }\n    async function copy() {\n      try{await navigator.clipboard.writeText(value.url);setMessage('Private link copied. Paste it into Google Calendar \u2192 Other calendars + \u2192 From URL.');}\n      catch{setMessage('Select and copy the private link below.');}\n    }\n    return h('section',{className:'db-bento-card db-surface-white',style:{marginBottom:24,gap:16,alignItems:'stretch'},'aria-labelledby':'calendar-subscription-title','aria-busy':busy},\n      h('div',null,h('span',{className:'db-kicker'},'EASY CALENDAR SETUP'),h('h2',{id:'calendar-subscription-title',className:'db-card-title',style:{marginTop:10}},'Appointments in Google Calendar'),\n        h('p',{className:'db-card-desc'},'Use a private calendar link. No Google Cloud project, API setup or Google sign-in is needed.')),\n      h('p',{className:'db-card-desc'},'WellNest appointments appear in a separate, read-only calendar in Google. Create and edit them in WellNest. Google checks the link periodically, so updates may take several hours.'),\n      h('label',{htmlFor:'wn-calendar-timezone',style:{fontWeight:600}},'Appointment time zone'),\n      h('input',{id:'wn-calendar-timezone',value:zone,onChange:e=>setZone(e.target.value),placeholder:'Australia/Sydney',disabled:busy,style:{padding:12,border:'1px solid #c7d6ca',borderRadius:10,width:'100%',maxWidth:480,color:'var(--db-ink)',background:'var(--db-paper, #fff)'}}),\n      h('p',{className:'db-card-desc',style:{fontSize:13}},'The link includes appointment titles and times, without your notes. Anyone with the link can view those appointments, so keep it private. Disable the subscription here to stop future access.'),\n      !value?.enabled ? h('button',{type:'button',className:'db-btn-dark',disabled:busy||!userId,onClick:()=>change(false)},busy?'Preparing\u2026':'Create private calendar link') : h(React.Fragment,null,\n        h('label',{htmlFor:'wn-private-calendar-url',style:{fontWeight:600}},'Your private calendar link'),\n        h('input',{id:'wn-private-calendar-url',readOnly:true,value:value.url,onFocus:e=>e.target.select(),style:{width:'100%',padding:12,border:'1px solid #c7d6ca',borderRadius:10,color:'var(--db-ink)',background:'var(--db-paper, #fff)'},'aria-label':'Private calendar subscription URL'}),\n        h('div',{style:{display:'flex',flexWrap:'wrap',gap:10}},\n          h('button',{type:'button',className:'db-btn-dark',onClick:copy,disabled:busy},'Copy private link'),\n          h('a',{href:'https://calendar.google.com/',target:'_blank',rel:'noopener noreferrer',className:'db-btn-soft'},'Open Google Calendar'),\n          h('button',{type:'button',className:'db-btn-soft',onClick:()=>change(false),disabled:busy},'Update time zone'),\n          h('button',{type:'button',className:'db-btn-soft',onClick:()=>change(true),disabled:busy},'Disable subscription')),\n        h('ol',{style:{paddingLeft:22,lineHeight:1.7}},h('li',null,'Copy your private link.'),h('li',null,'In Google Calendar on a computer, find Other calendars, select +, then From URL.'),h('li',null,'Paste the link and select Add calendar. You only need to do this once.'))),\n      error&&h('p',{role:'alert'},error),message&&h('p',{role:'status'},message));\n  }\n  function CalendarSettings(props) {\n    return h(React.Fragment,null,h(CalendarSubscription,props),h('details',{style:{marginBottom:24}},h('summary',{style:{cursor:'pointer',padding:12,fontWeight:600}},'Advanced: two-way Google connection (requires Google Cloud setup)'),h(AdvancedCalendarSettings,props)));\n  }\n\n  return { CalendarSettings, CalendarSync };\n}\n", res);
      res.headers.set("Cache-Control", "no-cache");
      res.headers.delete("Content-Length");
      res.headers.delete("ETag");
    }
    res = await discoveryResponse(request, res, url.pathname);
    res = await searchContentResponse(request, res, url.pathname);
    res = await streamlinedSettingsResponse(request, res, url.pathname);
    res = await routineSyncResponse(request, res, url.pathname);
    res = await accountSyncResponse(request, res, url.pathname);
    res = await doseSyncResponse(request, res, url.pathname);
    res = await accountRecordResponse(request, res, url.pathname);
    const dest = request.headers.get("Sec-Fetch-Dest");
    if (previewCookie(request) && (dest === "document" || dest === "iframe") && !url.pathname.startsWith("/assets/")) {
      const out = new Response(res.body, res);
      out.headers.append("Set-Cookie", "wn_preview=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax");
      return out;
    }
    return res;
  }
};
function appointmentFields(a) {
  return { title: a.title || "", date: a.date || "", time: a.time || "", loc: a.loc || "", notes: a.notes || "", specialist: a.specialist || "" };
}
__name(appointmentFields, "appointmentFields");
__name2(appointmentFields, "appointmentFields");
__name22(appointmentFields, "appointmentFields");
__name222(appointmentFields, "appointmentFields");
__name2222(appointmentFields, "appointmentFields");
__name22222(appointmentFields, "appointmentFields");
__name222222(appointmentFields, "appointmentFields");
function sameAppointment(a, b) {
  return JSON.stringify(appointmentFields(a)) === JSON.stringify(appointmentFields(b));
}
__name(sameAppointment, "sameAppointment");
__name2(sameAppointment, "sameAppointment");
__name22(sameAppointment, "sameAppointment");
__name222(sameAppointment, "sameAppointment");
__name2222(sameAppointment, "sameAppointment");
__name22222(sameAppointment, "sameAppointment");
__name222222(sameAppointment, "sameAppointment");
async function eventId(owner, calendar, id) {
  return sha256(JSON.stringify([owner, calendar, id]));
}
__name(eventId, "eventId");
__name2(eventId, "eventId");
__name22(eventId, "eventId");
__name222(eventId, "eventId");
__name2222(eventId, "eventId");
__name22222(eventId, "eventId");
__name222222(eventId, "eventId");
function toGoogle(a, timeZone) {
  let start, end;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || "")) throw Error("An appointment has an invalid date. Update it before syncing.");
  if (a.time) {
    if (!/^\d{2}:\d{2}$/.test(a.time)) throw Error("An appointment has an invalid time. Update it before syncing.");
    const startDate = /* @__PURE__ */ new Date(`${a.date}T${a.time}:00Z`);
    const endDate = new Date(startDate.getTime() + 36e5);
    start = { dateTime: `${a.date}T${a.time}:00`, timeZone };
    end = { dateTime: endDate.toISOString().slice(0, 19), timeZone };
  } else {
    start = { date: a.date };
    end = { date: new Date((/* @__PURE__ */ new Date(`${a.date}T00:00:00Z`)).getTime() + 864e5).toISOString().slice(0, 10) };
  }
  return { summary: a.title || "Appointment", location: a.loc || "", description: a.notes || "", start, end };
}
__name(toGoogle, "toGoogle");
__name2(toGoogle, "toGoogle");
__name22(toGoogle, "toGoogle");
__name222(toGoogle, "toGoogle");
__name2222(toGoogle, "toGoogle");
__name22222(toGoogle, "toGoogle");
__name222222(toGoogle, "toGoogle");
function fromGoogle(event, existing = {}, timeZone = "UTC") {
  const start = event.start || {};
  let date = start.date, time = "";
  if (start.dateTime) {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(start.dateTime));
    const p = Object.fromEntries(parts.map((p2) => [p2.type, p2.value]));
    date = `${p.year}-${p.month}-${p.day}`;
    time = `${p.hour}:${p.minute}`;
  }
  return { ...existing, title: event.summary || "Untitled appointment", date, time, loc: event.location || "", notes: event.description || "", specialist: existing.specialist || "" };
}
__name(fromGoogle, "fromGoogle");
__name2(fromGoogle, "fromGoogle");
__name22(fromGoogle, "fromGoogle");
__name222(fromGoogle, "fromGoogle");
__name2222(fromGoogle, "fromGoogle");
__name22222(fromGoogle, "fromGoogle");
__name222222(fromGoogle, "fromGoogle");
async function reconcile({ owner, calendar, timeZone, appointments, deletedIds, links, events, api: api2 }) {
  const records = new Map(appointments.map((a) => [String(a.id), a]));
  const deleted = new Set(deletedIds.map(String));
  const remote = new Map(events.map((e) => [e.id, e]));
  const next = { ...links };
  const seen = /* @__PURE__ */ new Set();
  let operations = 0, partial = false;
  const deadline = Date.now() + 35e3;
  const available = /* @__PURE__ */ __name222222(() => {
    const ready = operations < 100 && Date.now() < deadline;
    if (!ready) partial = true;
    return ready;
  }, "available");
  const call = /* @__PURE__ */ __name222222(async (...args) => {
    operations++;
    return api2(...args);
  }, "call");
  for (const link of Object.values(links)) seen.add(link.eventId);
  for (const [id, link] of Object.entries(links)) {
    if (!available()) break;
    let event = remote.get(link.eventId);
    if (!event) {
      event = await call("GET", link.eventId);
      if (!event) event = { id: link.eventId, status: "cancelled" };
    }
    seen.add(link.eventId);
    const local = records.get(id);
    if (deleted.has(id) || event.status === "cancelled") {
      if (deleted.has(id) && event.status !== "cancelled") await call("DELETE", event.id, void 0, event.etag);
      records.delete(id);
      deleted.add(id);
      delete next[id];
    } else if (event.etag !== link.etag) {
      const value = fromGoogle(event, local || link.snapshot, timeZone);
      records.set(id, { ...value, id });
      next[id] = { eventId: event.id, etag: event.etag, snapshot: { ...value, id } };
    } else if (local && !sameAppointment(local, link.snapshot)) {
      const body2 = toGoogle(local, timeZone);
      if (local.date === link.snapshot.date && local.time === link.snapshot.time) {
        delete body2.start;
        delete body2.end;
      } else if (event.start?.dateTime && event.end?.dateTime && body2.start.dateTime) {
        const duration = new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime();
        const wallStart = /* @__PURE__ */ new Date(body2.start.dateTime + "Z");
        body2.end.dateTime = new Date(wallStart.getTime() + duration).toISOString().slice(0, 19);
      }
      const updated = await call("PATCH", event.id, body2, event.etag);
      next[id] = { eventId: event.id, etag: updated.etag, snapshot: local };
    }
  }
  for (const event of events) {
    if (seen.has(event.id) || event.status === "cancelled" || !event.start) continue;
    const id = event.extendedProperties?.private?.wellnestOwner === owner ? event.extendedProperties.private.wellnestId : `google-${await eventId(owner, calendar, event.id)}`;
    if (!id) continue;
    if (deleted.has(id)) {
      if (!available()) continue;
      await call("DELETE", event.id, void 0, event.etag);
      continue;
    }
    const local = records.get(id);
    const value = fromGoogle(event, local, timeZone);
    records.set(id, { ...value, id });
    next[id] = { eventId: event.id, etag: event.etag, snapshot: { ...value, id } };
    seen.add(event.id);
  }
  for (const [id, local] of records) {
    if (next[id] || deleted.has(id)) continue;
    if (!available()) break;
    const googleId = await eventId(owner, calendar, id);
    const event = await call("POST", "", {
      ...toGoogle(local, timeZone),
      id: googleId,
      extendedProperties: { private: { wellnestOwner: owner, wellnestId: id } }
    });
    next[id] = { eventId: event.id, etag: event.etag, snapshot: local };
  }
  return { partial, appointments: [...records.values()].filter((a) => !deleted.has(String(a.id))), deletedIds: [...deleted], links: next };
}
__name(reconcile, "reconcile");
__name2(reconcile, "reconcile");
__name22(reconcile, "reconcile");
__name222(reconcile, "reconcile");
__name2222(reconcile, "reconcile");
__name22222(reconcile, "reconcile");
__name222222(reconcile, "reconcile");
async function handleCalendar(request, env) {
  const headers = { "Cache-Control": "private, no-store" };
  const json2 = /* @__PURE__ */ __name222222((body2, status = 200) => Response.json(body2, { status, headers }), "json");
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID || env.GOOGLE_CLIENT_ID;
  const secret = env.GOOGLE_CALENDAR_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;
  const callback = `${SITE}/api/auth/google/callback`;
  const cookieName = "__Host-wn-calendar";
  const clearCookie = `${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
  const redirect = /* @__PURE__ */ __name222222((status) => new Response(null, { status: 303, headers: { ...headers, Location: `/settings?calendar=${status}`, "Set-Cookie": clearCookie } }), "redirect");
  const methods = { status: "GET", calendars: "GET", connect: "POST", callback: "GET", select: "POST", sync: "POST", disconnect: "DELETE" };
  if (!action || methods[action] !== request.method) return json2({ error: "Method not allowed" }, 405);
  if (!["GET"].includes(request.method) && request.headers.get("Origin") !== url.origin) return json2({ error: "Invalid request origin" }, 403);
  if (!clientId || !secret) return action === "callback" ? redirect("setup-required") : json2({ error: "Google Calendar connection is awaiting setup.", configured: false }, 503);
  const rawKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("wellnest-calendar-v1:" + secret));
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]);
  const seal = /* @__PURE__ */ __name222222(async (value) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(value))));
    return b64url(new Uint8Array([...iv, ...encrypted]));
  }, "seal");
  const open = /* @__PURE__ */ __name222222(async (value) => {
    const bytes = b64urlDecode(value);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12))));
  }, "open");
  const google = /* @__PURE__ */ __name222222(async (target, options = {}) => {
    const response = await fetch(target, { ...options, signal: AbortSignal.timeout(12e3) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(Error("Google Calendar could not complete the request. Try again or reconnect your Google account."), { status: response.status });
    return data;
  }, "google");
  let lease = null;
  let owner = null;
  try {
    let authId;
    if (action === "callback") {
      const state = url.searchParams.get("state") || "";
      const cookie = request.headers.get("cookie")?.split(";").map((s) => s.trim()).find((s) => s.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
      let payload;
      try {
        payload = await open(state.replace(/^calendar:/, ""));
        if (payload.expires < Date.now() || !ALLOWED_ORIGINS.has(payload.origin)) throw Error();
        if (url.pathname === "/api/auth/google/callback" && url.origin !== payload.origin) {
          const relay = new URL("/api/calendar/callback", payload.origin);
          for (const field of ["state", "code", "error"]) if (url.searchParams.has(field)) relay.searchParams.set(field, url.searchParams.get(field));
          return new Response(null, { status: 303, headers: { Location: relay.toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
        }
        if (!cookie || !timingSafeEqual(payload.nonce, await sha256(cookie)) || payload.origin !== url.origin) throw Error();
      } catch {
        return redirect("invalid-state");
      }
      if (url.searchParams.has("error")) return redirect("cancelled");
      if (!url.searchParams.get("code")) return redirect("failed");
      authId = payload.authId;
    } else {
      const identity = await currentUser(env, request);
      if (!identity?.id) return json2({ error: "Sign in to connect your calendar." }, 401);
      authId = identity.id;
    }
    const account2 = await env.DB.prepare("SELECT id FROM users WHERE id = ? AND confirmed_at IS NOT NULL").bind(authId).first();
    if (!account2) return json2({ error: "Sign in again to load your account." }, 401);
    owner = account2.id;
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS google_calendar (
      owner_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      credentials TEXT NOT NULL, calendar_id TEXT, calendar_name TEXT, calendar_timezone TEXT,
      sync_state TEXT NOT NULL DEFAULT '{}', last_synced_at TEXT, lock_token TEXT, lock_until INTEGER NOT NULL DEFAULT 0
    )`).run();
    let connection = await env.DB.prepare("SELECT * FROM google_calendar WHERE owner_id = ?").bind(owner).first();
    if (connection) connection.sync_state = JSON.parse(connection.sync_state || "{}");
    if (connection && ["select", "sync", "disconnect", "callback"].includes(action)) {
      lease = randomToken(24);
      const acquired = await env.DB.prepare("UPDATE google_calendar SET lock_token = ?, lock_until = ? WHERE owner_id = ? AND lock_until < ?").bind(lease, Date.now() + 18e4, owner, Date.now()).run();
      if (!acquired.meta.changes) {
        lease = null;
        return json2({ error: "A calendar operation is in progress. Try again shortly." }, 409);
      }
      connection = await env.DB.prepare("SELECT * FROM google_calendar WHERE owner_id = ?").bind(owner).first();
      connection.sync_state = JSON.parse(connection.sync_state || "{}");
    }
    if (action === "connect") {
      const nonce = randomToken(32);
      const state = "calendar:" + await seal({ authId, nonce: await sha256(nonce), expires: Date.now() + 6e5, origin: url.origin });
      const consent = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      consent.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callback,
        response_type: "code",
        access_type: "offline",
        prompt: "consent select_account",
        state,
        scope: "https://www.googleapis.com/auth/calendar.calendarlist.readonly https://www.googleapis.com/auth/calendar.events"
      }).toString();
      return Response.json({ url: consent.toString() }, { headers: { ...headers, "Set-Cookie": `${cookieName}=${nonce}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600` } });
    }
    if (action === "callback") {
      const tokens = await google("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ code: url.searchParams.get("code"), client_id: clientId, client_secret: secret, redirect_uri: callback, grant_type: "authorization_code" }) });
      if (!tokens.refresh_token || !tokens.access_token) throw Error("Reconnect and grant calendar access.");
      await env.DB.prepare(`INSERT INTO google_calendar (owner_id,credentials) VALUES (?,?)
        ON CONFLICT(owner_id) DO UPDATE SET credentials=excluded.credentials,calendar_id=NULL,calendar_name=NULL,calendar_timezone=NULL,sync_state='{}',last_synced_at=NULL`).bind(owner, await seal({ refresh_token: tokens.refresh_token })).run();
      return redirect("connected");
    }
    if (action === "status") {
      return json2({ configured: true, connected: !!connection, calendarId: connection?.calendar_id || "", calendarName: connection?.calendar_name || "", lastSyncedAt: connection?.last_synced_at || null });
    }
    if (!connection) {
      return json2({ error: "Connect your Google account first." }, 409);
    }
    if (action === "disconnect") {
      await env.DB.prepare("DELETE FROM google_calendar WHERE owner_id = ?").bind(owner).run();
      return json2({ connected: false });
    }
    const credentials = await open(connection.credentials);
    const token = await google("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: clientId, client_secret: secret, refresh_token: credentials.refresh_token, grant_type: "refresh_token" }) });
    const api2 = /* @__PURE__ */ __name222222(async (path, method = "GET", body2, etag) => {
      const response = await fetch("https://www.googleapis.com/calendar/v3/" + path, {
        method,
        headers: { Authorization: `Bearer ${token.access_token}`, ...body2 ? { "Content-Type": "application/json" } : {}, ...etag ? { "If-Match": etag } : {} },
        ...body2 ? { body: JSON.stringify(body2) } : {},
        signal: AbortSignal.timeout(12e3)
      });
      if (method === "GET" && [404, 410].includes(response.status)) return null;
      if (method === "DELETE" && [204, 404, 410].includes(response.status)) return {};
      if (method === "POST" && response.status === 409 && body2?.id) return api2(path + "/" + body2.id);
      if (!response.ok) throw calendarRequestError(await response.json().catch(() => ({})), response.status);
      return response.status === 204 ? {} : response.json();
    }, "api");
    const calendars = /* @__PURE__ */ __name222222(async () => {
      const items = [];
      let page2 = "";
      do {
        const data = await api2("users/me/calendarList?" + new URLSearchParams({ minAccessRole: "writer", maxResults: "250", ...page2 ? { pageToken: page2 } : {} }));
        items.push(...(data.items || []).filter((c) => !c.deleted && ["owner", "writer"].includes(c.accessRole)));
        page2 = data.nextPageToken || "";
      } while (page2);
      return items;
    }, "calendars");
    if (action === "calendars") {
      const items = (await calendars()).map((c) => ({ id: c.id, name: c.summaryOverride || c.summary || c.id, primary: !!c.primary, timeZone: c.timeZone }));
      return json2({ items });
    }
    if (action === "select") {
      const data = await request.json();
      if (typeof data.calendarId !== "string" || !data.calendarId || data.calendarId.length > 1024) {
        return json2({ error: "Choose a calendar." }, 400);
      }
      const chosen = (await calendars()).find((c) => c.id === data.calendarId);
      if (!chosen) {
        return json2({ error: "Choose a calendar you can edit." }, 403);
      }
      await env.DB.prepare("UPDATE google_calendar SET calendar_id=?,calendar_name=?,calendar_timezone=?,last_synced_at=NULL WHERE owner_id=? AND lock_token=?").bind(chosen.id, chosen.summaryOverride || chosen.summary, chosen.timeZone || "UTC", owner, lease).run();
      return json2({ calendarId: chosen.id });
    }
    if (!connection.calendar_id) {
      return json2({ error: "Choose a calendar in Settings first." }, 409);
    }
    const backup = await env.DB.prepare("SELECT * FROM records WHERE owner_id=? AND entity='CloudDataBackup' AND json_extract(data,'$.backup_key')='wellnest-local-data' ORDER BY updated_date DESC LIMIT 1").bind(owner).first();
    const originalData = backup?.data;
    if (backup) backup.data = JSON.parse(backup.data);
    if (!backup) {
      return json2({ error: "Wait for account sync to finish, then try again." }, 409);
    }
    const calendar = connection.calendar_id, base = "calendars/" + encodeURIComponent(calendar) + "/events";
    const now2 = /* @__PURE__ */ new Date(), start = new Date(now2), end = new Date(now2);
    start.setUTCFullYear(now2.getUTCFullYear() - 1);
    end.setUTCFullYear(now2.getUTCFullYear() + 2);
    const events = [];
    let page = "";
    do {
      const data = await api2(base + "?" + new URLSearchParams({ singleEvents: "true", showDeleted: "true", timeMin: start.toISOString(), timeMax: end.toISOString(), maxResults: "2500", ...page ? { pageToken: page } : {} }));
      events.push(...data.items || []);
      page = data.nextPageToken || "";
      if (events.length > 5e3) throw Error("This calendar has too many events. Choose a smaller calendar to sync.");
    } while (page);
    const local = backup.data?.data?.local_data || {};
    const result = await reconcile({
      owner: account2.id,
      calendar,
      timeZone: connection.calendar_timezone || "UTC",
      appointments: local.appts || [],
      deletedIds: local.trackerDeleted?.appts || [],
      links: connection.sync_state[calendar]?.links || {},
      events,
      api: /* @__PURE__ */ __name222222((method, id, body2, etag) => api2(base + (id ? "/" + encodeURIComponent(id) : ""), method, body2, etag), "api")
    });
    const savedAt = (/* @__PURE__ */ new Date()).toISOString();
    const nextBackup = { ...backup.data, last_synced_at: savedAt, data: { ...backup.data.data, saved_at: savedAt, local_data: { ...local, appts: result.appointments, trackerDeleted: { ...local.trackerDeleted, appts: result.deletedIds } } } };
    const commitTime = Date.now();
    const results = await env.DB.batch([
      env.DB.prepare(`UPDATE google_calendar SET sync_state=?,last_synced_at=? WHERE owner_id=? AND lock_token=? AND lock_until>? AND EXISTS
        (SELECT 1 FROM records WHERE entity='CloudDataBackup' AND id=? AND owner_id=? AND data=?)`).bind(JSON.stringify({ ...connection.sync_state, [calendar]: { links: result.links } }), savedAt, owner, lease, commitTime, backup.id, owner, originalData),
      env.DB.prepare(`UPDATE records SET data=?,updated_date=? WHERE entity='CloudDataBackup' AND id=? AND owner_id=? AND data=? AND EXISTS
        (SELECT 1 FROM google_calendar WHERE owner_id=? AND lock_token=? AND lock_until>?)`).bind(JSON.stringify(nextBackup), savedAt, backup.id, owner, originalData, owner, lease, commitTime)
    ]);
    if (!results.every((r) => r.meta.changes === 1)) return json2({ error: "Appointments changed during sync. Sync again to load the latest changes." }, 409);
    return json2({ lastSyncedAt: savedAt, count: result.appointments.length, partial: result.partial });
  } catch (error) {
    if (action === "callback") return redirect("failed");
    if (error?.calendarCode) return json2({ error: error.message, code: error.calendarCode }, error.clientStatus || 503);
    return json2({ error: error?.status === 400 || error?.status === 401 ? "Google access expired or was declined. Reconnect your Google account." : "Calendar sync could not finish. Try again, or reconnect Google if access has changed." }, 503);
  } finally {
    if (lease && owner) await env.DB.prepare("UPDATE google_calendar SET lock_token=NULL,lock_until=0 WHERE owner_id=? AND lock_token=?").bind(owner, lease).run();
  }
}
__name(handleCalendar, "handleCalendar");
__name2(handleCalendar, "handleCalendar");
__name22(handleCalendar, "handleCalendar");
__name222(handleCalendar, "handleCalendar");
__name2222(handleCalendar, "handleCalendar");
__name22222(handleCalendar, "handleCalendar");
__name222222(handleCalendar, "handleCalendar");
function calendarRequestError(data, status) {
  const details = data?.error?.details || [];
  const disabled = details.some((e) => e.reason === "SERVICE_DISABLED") || (data?.error?.errors || []).some((e) => e.reason === "accessNotConfigured");
  if (disabled) {
    const consumer = details.map((e) => e.metadata?.consumer || "").find((c) => /^projects\/\d+$/.test(c));
    const project = consumer ? consumer.split("/")[1] : "";
    return Object.assign(new Error("Google Calendar API is disabled" + (project ? " in Google Cloud project " + project : " for this app") + ". The app owner must enable Google Calendar API in that project. Then select Refresh calendars; reconnecting is not required."), { calendarCode: "calendar_api_disabled", status, clientStatus: 503 });
  }
  const missing = details.some((e) => e.reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT") || (data?.error?.errors || []).some((e) => e.reason === "insufficientPermissions");
  if (missing) return Object.assign(new Error("Google did not grant all required calendar permissions. Connect your Google account again and allow both calendar permissions."), { calendarCode: "calendar_permissions_missing", status, clientStatus: 403 });
  if (status === 412) return Object.assign(new Error("This event changed during sync. Sync again to load the latest version."), { calendarCode: "calendar_event_changed", status, clientStatus: 409 });
  return Object.assign(new Error("Calendar access failed. Check calendar permissions or reconnect Google."), { status });
}
__name(calendarRequestError, "calendarRequestError");
__name2(calendarRequestError, "calendarRequestError");
__name22(calendarRequestError, "calendarRequestError");
__name222(calendarRequestError, "calendarRequestError");
__name2222(calendarRequestError, "calendarRequestError");
__name22222(calendarRequestError, "calendarRequestError");
__name222222(calendarRequestError, "calendarRequestError");
async function subscriptionSchema(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS calendar_subscriptions (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nonce TEXT NOT NULL, time_zone TEXT NOT NULL, created_at TEXT NOT NULL
  )`).run();
}
__name(subscriptionSchema, "subscriptionSchema");
__name2(subscriptionSchema, "subscriptionSchema");
__name22(subscriptionSchema, "subscriptionSchema");
__name222(subscriptionSchema, "subscriptionSchema");
__name2222(subscriptionSchema, "subscriptionSchema");
__name22222(subscriptionSchema, "subscriptionSchema");
__name222222(subscriptionSchema, "subscriptionSchema");
function subscriptionTimeZone(value) {
  if (typeof value !== "string" || value.length > 100) throw new Error("Choose a valid time zone.");
  new Intl.DateTimeFormat("en", { timeZone: value }).format();
  return value;
}
__name(subscriptionTimeZone, "subscriptionTimeZone");
__name2(subscriptionTimeZone, "subscriptionTimeZone");
__name22(subscriptionTimeZone, "subscriptionTimeZone");
__name222(subscriptionTimeZone, "subscriptionTimeZone");
__name2222(subscriptionTimeZone, "subscriptionTimeZone");
__name22222(subscriptionTimeZone, "subscriptionTimeZone");
__name222222(subscriptionTimeZone, "subscriptionTimeZone");
async function subscriptionUrl(env, row2) {
  return SITE + "/api/calendar/feed/" + row2.id + "/" + await hmac(env, "calendar-subscription", row2.id + ":" + row2.nonce) + ".ics";
}
__name(subscriptionUrl, "subscriptionUrl");
__name2(subscriptionUrl, "subscriptionUrl");
__name22(subscriptionUrl, "subscriptionUrl");
__name222(subscriptionUrl, "subscriptionUrl");
__name2222(subscriptionUrl, "subscriptionUrl");
__name22222(subscriptionUrl, "subscriptionUrl");
__name222222(subscriptionUrl, "subscriptionUrl");
async function handleCalendarSubscription(request, env) {
  if (!["GET", "POST", "DELETE"].includes(request.method)) return fail(405, "Method not allowed");
  const url = new URL(request.url);
  if (request.method !== "GET" && request.headers.get("Origin") !== url.origin) return fail(403, "Invalid request origin");
  const user = await currentUser(env, request);
  if (!user) return fail(401, "Sign in to manage your calendar subscription.");
  await subscriptionSchema(env);
  if (request.method === "DELETE") {
    await env.DB.prepare("DELETE FROM calendar_subscriptions WHERE owner_id=?").bind(user.id).run();
    return json({ enabled: false });
  }
  if (request.method === "POST") {
    let data, zone;
    try {
      data = await request.json();
      zone = subscriptionTimeZone(data.timeZone);
    } catch {
      return fail(400, "Choose a valid time zone.");
    }
    await env.DB.prepare(`INSERT INTO calendar_subscriptions(id,owner_id,nonce,time_zone,created_at) VALUES(?,?,?,?,?)
      ON CONFLICT(owner_id) DO UPDATE SET time_zone=excluded.time_zone`).bind(randomToken(24), user.id, randomToken(32), zone, (/* @__PURE__ */ new Date()).toISOString()).run();
  }
  const row2 = await env.DB.prepare("SELECT * FROM calendar_subscriptions WHERE owner_id=?").bind(user.id).first();
  return json(row2 ? { enabled: true, url: await subscriptionUrl(env, row2), timeZone: row2.time_zone } : { enabled: false });
}
__name(handleCalendarSubscription, "handleCalendarSubscription");
__name2(handleCalendarSubscription, "handleCalendarSubscription");
__name22(handleCalendarSubscription, "handleCalendarSubscription");
__name222(handleCalendarSubscription, "handleCalendarSubscription");
__name2222(handleCalendarSubscription, "handleCalendarSubscription");
__name22222(handleCalendarSubscription, "handleCalendarSubscription");
__name222222(handleCalendarSubscription, "handleCalendarSubscription");
function icsEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}
__name(icsEscape, "icsEscape");
__name2(icsEscape, "icsEscape");
__name22(icsEscape, "icsEscape");
__name222(icsEscape, "icsEscape");
__name2222(icsEscape, "icsEscape");
__name22222(icsEscape, "icsEscape");
__name222222(icsEscape, "icsEscape");
function icsFold(line) {
  const encoder = new TextEncoder();
  let result = "", width = 0;
  for (const c of line) {
    const n = encoder.encode(c).length;
    if (width + n > 75) {
      result += "\r\n ";
      width = 1;
    }
    result += c;
    width += n;
  }
  return result;
}
__name(icsFold, "icsFold");
__name2(icsFold, "icsFold");
__name22(icsFold, "icsFold");
__name222(icsFold, "icsFold");
__name2222(icsFold, "icsFold");
__name22222(icsFold, "icsFold");
__name222222(icsFold, "icsFold");
function icsStamp(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
__name(icsStamp, "icsStamp");
__name2(icsStamp, "icsStamp");
__name22(icsStamp, "icsStamp");
__name222(icsStamp, "icsStamp");
__name2222(icsStamp, "icsStamp");
__name22222(icsStamp, "icsStamp");
__name222222(icsStamp, "icsStamp");
function calendarWallTime(date, time, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error("Invalid appointment date or time");
  const wall = Date.parse(date + "T" + time + ":00Z");
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 10) !== date) throw Error("Invalid appointment date");
  const format = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const local = /* @__PURE__ */ __name222222((value) => {
    const p = Object.fromEntries(format.formatToParts(value).map((p2) => [p2.type, p2.value]));
    return Date.parse(p.year + "-" + p.month + "-" + p.day + "T" + p.hour + ":" + p.minute + ":" + p.second + "Z");
  }, "local");
  let instant = wall;
  for (let i = 0; i < 4; i++) {
    const delta = wall - local(instant);
    if (!delta) return instant;
    instant += delta;
  }
  throw Error("Appointment time does not exist in selected time zone");
}
__name(calendarWallTime, "calendarWallTime");
__name2(calendarWallTime, "calendarWallTime");
__name22(calendarWallTime, "calendarWallTime");
__name222(calendarWallTime, "calendarWallTime");
__name2222(calendarWallTime, "calendarWallTime");
__name22222(calendarWallTime, "calendarWallTime");
__name222222(calendarWallTime, "calendarWallTime");
async function appointmentsCalendar(owner, backup, zone) {
  const local = backup.data?.local_data || {};
  const deleted = new Set((local.trackerDeleted?.appts || []).map(String));
  const stamp = Number.isFinite(Date.parse(backup.last_synced_at || backup.data?.saved_at)) ? icsStamp(backup.last_synced_at || backup.data.saved_at) : "20260101T000000Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//WellNest//Appointments//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:WellNest appointments", "X-WR-TIMEZONE:" + icsEscape(zone), "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const a of local.appts || []) {
    if (!a.id || deleted.has(String(a.id))) continue;
    let start, end;
    try {
      if (a.time) {
        const instant = calendarWallTime(a.date, a.time, zone);
        start = "DTSTART:" + icsStamp(instant);
        end = "DTEND:" + icsStamp(instant + 36e5);
      } else {
        const date = Date.parse(a.date + "T00:00:00Z");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date) || !Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== a.date) continue;
        start = "DTSTART;VALUE=DATE:" + a.date.replace(/-/g, "");
        end = "DTEND;VALUE=DATE:" + new Date(date + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
      }
    } catch {
      continue;
    }
    lines.push("BEGIN:VEVENT", "UID:" + await sha256(owner + ":" + a.id) + "@wellnest.services", "DTSTAMP:" + stamp, "LAST-MODIFIED:" + stamp, start, end, "SUMMARY:" + icsEscape(a.title || "Appointment"), "CLASS:PRIVATE", "TRANSP:OPAQUE", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
__name(appointmentsCalendar, "appointmentsCalendar");
__name2(appointmentsCalendar, "appointmentsCalendar");
__name22(appointmentsCalendar, "appointmentsCalendar");
__name222(appointmentsCalendar, "appointmentsCalendar");
__name2222(appointmentsCalendar, "appointmentsCalendar");
__name22222(appointmentsCalendar, "appointmentsCalendar");
__name222222(appointmentsCalendar, "appointmentsCalendar");
async function handleCalendarFeed(request, env) {
  if (!["GET", "HEAD"].includes(request.method)) return fail(405, "Method not allowed");
  const path = new URL(request.url).pathname;
  const m = path.match(/^\/api\/calendar\/feed\/([A-Za-z0-9_-]{32})\/([A-Za-z0-9_-]{43})\.ics$/);
  if (!m) return fail(404, "Calendar subscription not found");
  await subscriptionSchema(env);
  const row2 = await env.DB.prepare("SELECT * FROM calendar_subscriptions WHERE id=?").bind(m[1]).first();
  if (!row2 || !await hmacVerify(env, "calendar-subscription", row2.id + ":" + row2.nonce, m[2])) return fail(404, "Calendar subscription not found");
  const backup = await env.DB.prepare("SELECT data FROM records WHERE owner_id=? AND entity='CloudDataBackup' AND json_extract(data,'$.backup_key')='wellnest-local-data' ORDER BY updated_date DESC LIMIT 1").bind(row2.owner_id).first();
  if (!backup) return new Response("Your appointments are still syncing. Please try again shortly.", { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
  const text = await appointmentsCalendar(row2.owner_id, JSON.parse(backup.data), row2.time_zone);
  return new Response(request.method === "HEAD" ? null : text, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="wellnest-appointments.ics"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" } });
}
__name(handleCalendarFeed, "handleCalendarFeed");
__name2(handleCalendarFeed, "handleCalendarFeed");
__name22(handleCalendarFeed, "handleCalendarFeed");
__name222(handleCalendarFeed, "handleCalendarFeed");
__name2222(handleCalendarFeed, "handleCalendarFeed");
__name22222(handleCalendarFeed, "handleCalendarFeed");
__name222222(handleCalendarFeed, "handleCalendarFeed");
async function simpleCalendarDownload(request, env) {
  if (request.method !== "GET") return fail(405, "Method not allowed");
  await ensureSchema(env);
  const user = await currentUser(env, request);
  if (!user) return fail(401, "Please sign in to WellNest, then return to this page.");
  let zone;
  try {
    zone = subscriptionTimeZone(new URL(request.url).searchParams.get("timeZone") || "Australia/Sydney");
  } catch {
    return fail(400, "Enter a valid time zone, such as Australia/Sydney.");
  }
  const row2 = await env.DB.prepare("SELECT data FROM records WHERE owner_id=? AND entity='CloudDataBackup' AND json_extract(data,'$.backup_key')='wellnest-local-data' ORDER BY updated_date DESC LIMIT 1").bind(user.id).first();
  if (!row2) return fail(409, "No saved appointments were found. Open your dashboard, let your account finish syncing, then try again.");
  const backup = JSON.parse(row2.data);
  const text = await appointmentsCalendar(user.id, backup, zone);
  if (!text.includes("BEGIN:VEVENT")) return fail(409, "There are no saved appointments with valid dates to export. Add an appointment in your dashboard first.");
  return new Response(text, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="wellnest-appointments.ics"', "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
__name(simpleCalendarDownload, "simpleCalendarDownload");
__name2(simpleCalendarDownload, "simpleCalendarDownload");
__name22(simpleCalendarDownload, "simpleCalendarDownload");
__name222(simpleCalendarDownload, "simpleCalendarDownload");
__name2222(simpleCalendarDownload, "simpleCalendarDownload");
__name22222(simpleCalendarDownload, "simpleCalendarDownload");
__name222222(simpleCalendarDownload, "simpleCalendarDownload");
function simpleCalendarPage(request) {
  if (request.method !== "GET") return fail(405, "Method not allowed");
  return new Response(SIMPLE_CALENDAR_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
__name(simpleCalendarPage, "simpleCalendarPage");
__name2(simpleCalendarPage, "simpleCalendarPage");
__name22(simpleCalendarPage, "simpleCalendarPage");
__name222(simpleCalendarPage, "simpleCalendarPage");
__name2222(simpleCalendarPage, "simpleCalendarPage");
__name22222(simpleCalendarPage, "simpleCalendarPage");
__name222222(simpleCalendarPage, "simpleCalendarPage");
var SIMPLE_CALENDAR_HTML = `<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Download appointments | WellNest</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f1f5f1;color:#17372e;font:17px/1.6 system-ui,-apple-system,sans-serif}main{max-width:660px;margin:8vh auto;padding:36px;background:white;border-radius:24px;box-shadow:0 8px 40px #17372e0b}h1{font-size:34px;line-height:1.2;letter-spacing:-1px}a{color:#1f5c4a}label{display:block;font-weight:600;margin-top:22px}input{display:block;width:100%;padding:12px;border:1px solid #a6bcb0;border-radius:10px;font:inherit;margin:6px 0 20px}button,.button{display:inline-block;background:#1f5c4a;color:white;border:0;border-radius:12px;padding:14px 20px;font:600 17px system-ui;cursor:pointer;text-decoration:none}button:disabled{opacity:.6}small{display:block;color:#536a60}li{margin:10px 0}#status{white-space:pre-line}header{font-weight:750;color:#1f5c4a}@media(max-width:700px){main{margin:20px;padding:26px}}</style>
<main><header>wellnest</header><h1>Appointments in Google Calendar</h1><p>Download a calendar file, then import it into Google. No Google Cloud setup or subscription link needed.</p>
<label for="zone">Appointment time zone</label><input id="zone" value="Australia/Sydney" autocomplete="off"><button id="download">Download appointments (.ics)</button><p id="status" role="status" aria-live="polite"></p>
<h2 style="font-size:22px">Add them to Google</h2><ol><li>Download your appointments using the button above.</li><li>On a computer, open <a href="https://calendar.google.com/" target="_blank" rel="noopener noreferrer">Google Calendar</a> \u2192 Settings \u2192 Import &amp; export.</li><li>Select the downloaded <strong>wellnest-appointments.ics</strong> file, choose your calendar and click <strong>Import</strong>.</li></ol>
<small>This is a one-time copy of your saved WellNest appointments, including titles and times. Notes are excluded. Later edits do not sync automatically. Importing the same appointments again can create duplicates.</small><p><a href="/dashboard">Back to dashboard</a> \xB7 <a href="/login">Sign in to WellNest</a></p></main>
<script>
const zone=document.getElementById('zone'),button=document.getElementById('download'),status=document.getElementById('status');
try{zone.value=Intl.DateTimeFormat().resolvedOptions().timeZone||'Australia/Sydney';}catch{}
button.addEventListener('click',async()=>{
 button.disabled=true;status.textContent='Preparing your appointments\u2026';
 try{
  const response=await fetch('/api/calendar/download?timeZone='+encodeURIComponent(zone.value),{credentials:'same-origin',cache:'no-store'});
  if(!response.ok){const data=await response.json().catch(()=>({}));throw Error(data.error||'Your appointments could not be downloaded. Please try again.');}
  const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wellnest-appointments.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  status.textContent='Your calendar file is ready. Import it into Google Calendar using the steps below.';
 }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
<\/script></html>
`;
async function calendarQuickAddData(request, env) {
  if (request.method !== "GET") return fail(405, "Method not allowed");
  await ensureSchema(env);
  const user = await currentUser(env, request);
  if (!user) return fail(401, "Sign in to WellNest, then return to this page.");
  const row2 = await env.DB.prepare("SELECT data FROM records WHERE owner_id=? AND entity='CloudDataBackup' AND json_extract(data,'$.backup_key')='wellnest-local-data' ORDER BY updated_date DESC LIMIT 1").bind(user.id).first();
  const local = row2 ? JSON.parse(row2.data)?.data?.local_data || {} : {};
  const deleted = new Set((local.trackerDeleted?.appts || []).map(String));
  const appointments = (local.appts || []).filter((a) => a.id && !deleted.has(String(a.id)) && /^\d{4}-\d{2}-\d{2}$/.test(a.date || "")).map((a) => ({ id: a.id, title: a.title || "Appointment", date: a.date, time: a.time || "", loc: a.loc || "" })).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return json({ owner: user.id, appointments });
}
__name(calendarQuickAddData, "calendarQuickAddData");
__name2(calendarQuickAddData, "calendarQuickAddData");
__name22(calendarQuickAddData, "calendarQuickAddData");
__name222(calendarQuickAddData, "calendarQuickAddData");
__name2222(calendarQuickAddData, "calendarQuickAddData");
__name22222(calendarQuickAddData, "calendarQuickAddData");
__name222222(calendarQuickAddData, "calendarQuickAddData");
function calendarQuickAddPage(request) {
  if (request.method !== "GET") return fail(405, "Method not allowed");
  return new Response(CALENDAR_QUICK_ADD_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
__name(calendarQuickAddPage, "calendarQuickAddPage");
__name2(calendarQuickAddPage, "calendarQuickAddPage");
__name22(calendarQuickAddPage, "calendarQuickAddPage");
__name222(calendarQuickAddPage, "calendarQuickAddPage");
__name2222(calendarQuickAddPage, "calendarQuickAddPage");
__name22222(calendarQuickAddPage, "calendarQuickAddPage");
__name222222(calendarQuickAddPage, "calendarQuickAddPage");
var CALENDAR_QUICK_ADD_HTML = `<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Add appointments to Google | WellNest</title><style>*{box-sizing:border-box}body{margin:0;background:#eff5ef;color:#153a2e;font:16px/1.6 system-ui,sans-serif}main{max-width:850px;margin:5vh auto;padding:32px;background:white;border-radius:24px}h1{font-size:34px;line-height:1.2}h2{font-size:19px;margin:0}button,.button{background:#1f5c4a;color:white;border:0;border-radius:10px;padding:12px 16px;font:600 16px system-ui;cursor:pointer}button:disabled{opacity:.5;cursor:default}a{color:#1f5c4a}article{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #d5e0d7;padding:22px 0}.meta,small{color:#567064}#status{white-space:pre-line}.muted{background:#edf3ed;color:#1f5c4a}header{font-weight:750;color:#1f5c4a}#tools{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}@media(max-width:600px){main{margin:12px;padding:24px}article{align-items:start;flex-direction:column}}</style>
<main><header>wellnest</header><h1>Add appointments to Google</h1><p>Your appointments are filled in automatically. Open the next one, then click <strong>Save</strong> in Google Calendar.</p><p class="meta">This sends the title, date, time and location when you click a button. Private appointment notes stay in WellNest. Timed appointments use a one-hour duration; you can adjust it in Google.</p><div id="tools"><button id="next" disabled>Add next appointment to Google</button><button id="refresh" class="muted">Refresh appointments</button></div><p id="status" role="status" aria-live="polite">Loading your appointments\u2026</p><div id="list"></div><small>\u201COpened in Google\u201D means the event form was opened, not that it was saved. Google still requires Save. Later changes and deletions do not sync automatically. Reopening an event can create a duplicate; edit an existing Google event instead when appropriate.</small><p><a href="/appointments">Back to appointments</a> \xB7 <a href="/login">Sign in to WellNest</a></p></main>
<script>
function googleEventURL(a,zone=Intl.DateTimeFormat().resolvedOptions().timeZone || 'Australia/Sydney') {
 const url=new URL('https://calendar.google.com/calendar/render');const date=a.date;
 if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(date||''))throw Error('This appointment needs a valid date in WellNest.');
 const day=new Date(date+'T00:00:00Z');if(!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==date)throw Error('This appointment has an invalid date.');
 let dates;
 if(a.time){if(!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(a.time))throw Error('This appointment needs a valid time in WellNest.');const start=new Date(date+'T'+a.time+':00');if(!Number.isFinite(start.getTime())||start.getHours()!==Number(a.time.slice(0,2))||start.getMinutes()!==Number(a.time.slice(3)))throw Error('This time is not valid in your current time zone.');const stamp=d=>d.toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}Z$/,'Z');dates=stamp(start)+'/'+stamp(new Date(start.getTime()+3600000));}
 else dates=date.replace(/-/g,'')+'/'+new Date(day.getTime()+86400000).toISOString().slice(0,10).replace(/-/g,'');
 url.search=new URLSearchParams({action:'TEMPLATE',text:a.title||'Appointment',dates,ctz:zone,location:a.loc||'',details:'Added from WellNest. Manage this event in Google Calendar.'}).toString();return url.toString();
}
const list=document.getElementById('list'),status=document.getElementById('status'),next=document.getElementById('next');let appointments=[],opened={},owner='';
const fingerprint=a=>JSON.stringify([a.title||'',a.date||'',a.time||'',a.loc||'']);
function openAppointment(a){try{const url=googleEventURL(a);const tab=window.open(url,'_blank','noopener,noreferrer');opened[String(a.id)]=fingerprint(a);try{localStorage.setItem('wn-google-opened:'+owner,JSON.stringify(opened));}catch{}render();status.textContent='Google Calendar has been requested in a new tab. Click Save there. If no tab appeared, allow pop-ups and click the appointment again. Then return here to add the next appointment.';}catch(e){status.textContent=e.message;}}
function render(){list.replaceChildren();let pending=0;for(const a of appointments){const key=String(a.id),same=opened[key]===fingerprint(a);if(!same)pending++;const row=document.createElement('article'),info=document.createElement('div'),title=document.createElement('h2'),meta=document.createElement('div'),button=document.createElement('button');title.textContent=a.title||'Appointment';meta.className='meta';meta.textContent=a.date+(a.time?' \xB7 '+a.time:' \xB7 All day')+(a.loc?' \xB7 '+a.loc:'')+(same?' \xB7 Opened in Google':opened[key]?' \xB7 Changed since last opened':'');button.textContent=same?'Open again in Google':'Add to Google Calendar';button.className=same?'muted':'';button.addEventListener('click',()=>openAppointment(a));info.append(title,meta);row.append(info,button);list.append(row);}next.disabled=!pending;next.textContent=pending?'Add next appointment to Google ('+pending+' remaining)':'All appointments opened';}
async function load(){status.textContent='Loading your saved appointments\u2026';next.disabled=true;try{const r=await fetch('/api/calendar/quick-add',{credentials:'same-origin',cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not load appointments.');owner=data.owner;const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());appointments=data.appointments.filter(a=>a.date>=today.toISOString().slice(0,10));try{opened=JSON.parse(localStorage.getItem('wn-google-opened:'+owner)||'{}')||{};}catch{opened={};}render();status.textContent=appointments.length?'Ready. Use Add next appointment to work through the list without retyping anything. Dates and times use '+(Intl.DateTimeFormat().resolvedOptions().timeZone||'your current time zone')+'.':'No upcoming saved appointments found. Add an appointment in WellNest, let your account sync, then refresh this page.';}catch(e){status.textContent=e.message;}}
next.addEventListener('click',()=>{const a=appointments.find(a=>opened[String(a.id)]!==fingerprint(a));if(a)openAppointment(a);});document.getElementById('refresh').addEventListener('click',load);load();
<\/script></html>
`;
var ACCOUNT_TOTALS_SQL = `SELECT COUNT(*) AS total,
 COALESCE(SUM(u.confirmed_at IS NULL),0) AS unconfirmed,
 COALESCE(SUM(s.status = 'active'),0) AS paid,
 COALESCE(SUM(s.status = 'past_due'),0) AS past_due,
 COALESCE(SUM(u.confirmed_at IS NOT NULL AND (
   s.status = 'trialing' OR (
     COALESCE(s.status,'none') NOT IN ('active','past_due','unpaid','paused')
     AND u.role != 'admin'
     AND COALESCE(json_extract(CASE WHEN json_valid(u.data) THEN u.data ELSE '{}' END,'$.complimentary_full_access'),0) = 0
     AND COALESCE(json_extract(CASE WHEN json_valid(u.data) THEN u.data ELSE '{}' END,'$.subscription_tier'),'free') NOT IN ('fullaccess','yearly')
     AND julianday(u.created_date) > julianday(?1,'-30 days') AND julianday(u.created_date) <= julianday(?1)
   ))),0) AS trials,
 COALESCE(SUM(julianday(u.created_date) >= julianday(?2) AND julianday(u.created_date) <= julianday(?1)),0) AS new_signups
 FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id`;
async function handleAccountAnalytics(request, env, user) {
  if (!await isAnalyticsAdmin(env, user)) return fail(403, "Only site admins can see account statistics.");
  await ensureBilling(env);
  const url = new URL(request.url);
  const days = Math.max(1, Math.min(365, Math.round(Number(url.searchParams.get("days")) || 30)));
  const generated = (/* @__PURE__ */ new Date()).toISOString();
  const start = new Date(Date.parse(generated) - days * 864e5).toISOString();
  const cursor = Date.parse(url.searchParams.get("since") || "");
  const since = new Date(Math.max(Date.parse(generated) - 864e5, Math.min(Date.parse(generated), Number.isFinite(cursor) ? cursor : Date.parse(generated)) - 12e4)).toISOString();
  const [counts, events] = await env.DB.batch([
    env.DB.prepare(ACCOUNT_TOTALS_SQL).bind(generated, start),
    env.DB.prepare("SELECT id FROM users WHERE julianday(created_date) >= julianday(?) AND julianday(created_date) <= julianday(?) ORDER BY created_date, id").bind(since, generated)
  ]);
  return json({ counts: counts.results[0], events: events.results.map((r) => r.id), generated, days });
}
__name(handleAccountAnalytics, "handleAccountAnalytics");
__name2(handleAccountAnalytics, "handleAccountAnalytics");
__name22(handleAccountAnalytics, "handleAccountAnalytics");
__name222(handleAccountAnalytics, "handleAccountAnalytics");
__name2222(handleAccountAnalytics, "handleAccountAnalytics");
__name22222(handleAccountAnalytics, "handleAccountAnalytics");
__name222222(handleAccountAnalytics, "handleAccountAnalytics");
var ACCOUNT_ANALYTICS_HTML = `<style>
#wn-accounts{margin:20px 0;color:var(--ink);font-size:15px}#wn-accounts summary{font:700 24px var(--display);color:var(--ink);padding:6px 0}#wn-accounts summary:focus-visible{outline-color:var(--mark)}.wn-account-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}.wn-account-number{display:block;font:800 38px var(--display);letter-spacing:-.05em}.wn-account-label{font-size:13px;color:var(--muted)}.wn-account-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:14px 0}.wn-account-toolbar button{font:600 13px inherit;border:1px solid var(--line);border-radius:999px;padding:8px 14px;background:white;color:var(--ink);cursor:pointer}.wn-account-toolbar label{display:flex;gap:8px;align-items:center}#wn-account-status{font-size:12px;color:var(--muted)}#wn-celebration{position:fixed;inset:0;z-index:10000;background:rgba(8,30,27,.78);display:grid;place-items:center;padding:24px;overflow:hidden}#wn-celebration[hidden]{display:none}.wn-celebration-card{position:relative;z-index:1;max-width:480px;text-align:center;background:#f8f8f3;color:#16372f;border:1px solid #d8fb96;border-radius:28px;padding:36px;box-shadow:0 20px 80px #0004}.wn-celebration-card h2{font:800 36px/1.1 var(--display);letter-spacing:-.04em;margin:12px 0}.wn-celebration-card button{background:#16372f;color:#d8fb96;border:0;border-radius:99px;padding:10px 22px;font:600 15px system-ui;cursor:pointer}.wn-confetti{position:absolute;top:-10%;width:10px;height:18px;background:var(--piece);left:var(--x);animation:wn-confetti-fall 2.8s var(--delay) ease-in both;pointer-events:none}@keyframes wn-confetti-fall{to{transform:translate3d(var(--drift),115vh,0) rotate(780deg)}}@media(max-width:700px){.wn-account-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(prefers-reduced-motion:reduce){.wn-confetti{display:none}}
</style>
<details id="wn-accounts" class="card" open>
 <summary>Users &amp; subscribers</summary>
 <p>Account totals include 30-day free-trial signups. Trial and paid counts are subsets of total users.</p>
 <div class="wn-account-grid">
  <div><span class="wn-account-label">Total registered users</span><strong class="wn-account-number" id="wn-total">\u2014</strong></div>
  <div><span class="wn-account-label">Active free trials</span><strong class="wn-account-number" id="wn-trials">\u2014</strong></div>
  <div><span class="wn-account-label">Paid subscribers \xB7 Stripe</span><strong class="wn-account-number" id="wn-paid">\u2014</strong></div>
  <div><span class="wn-account-label" id="wn-new-label">New signups \xB7 last 30 days</span><strong class="wn-account-number" id="wn-new">\u2014</strong></div>
 </div>
 <p class="wn-account-label">Totals are current; the date range above filters new signups. Paid means an active Stripe subscription, excluding billing trials and overdue accounts. App Store purchases are not connected to these billing totals.</p>
 <p id="wn-account-extra" class="wn-account-label"></p>
 <div class="wn-account-toolbar"><label><input type="checkbox" id="wn-celebrate-enabled" checked>Celebrate new signups</label><button type="button" id="wn-preview-celebration">Preview celebration</button><button type="button" id="wn-refresh-accounts">Refresh counts</button></div>
 <p id="wn-account-status" role="status">Loading account totals\u2026</p>
</details>
<div id="wn-celebration" hidden role="dialog" aria-modal="true" aria-labelledby="wn-celebration-title" aria-describedby="wn-celebration-message">
 <div class="wn-celebration-card"><span aria-hidden="true" style="font-size:44px">\u{1F389}</span><h2 id="wn-celebration-title">Someone new joined!</h2><p id="wn-celebration-message"></p><button type="button" id="wn-dismiss-celebration">Lovely!</button></div>
</div>
<script>
(function(){
 'use strict';
 const byId=id=>document.getElementById(id),toggle=byId('wn-celebrate-enabled'),overlay=byId('wn-celebration');
 let cursor=null,seen=new Set(),initialized=false,busy=false,pending=false,timer=null,previousFocus=null;
 const format=new Intl.NumberFormat();
 try{toggle.checked=localStorage.getItem('wn-signup-celebrations')!=='off';byId('wn-accounts').open=localStorage.getItem('wn-account-panel')!=='closed';}catch{}
 byId('wn-accounts').addEventListener('toggle',()=>{try{localStorage.setItem('wn-account-panel',byId('wn-accounts').open?'open':'closed');}catch{}});
 toggle.addEventListener('change',()=>{try{localStorage.setItem('wn-signup-celebrations',toggle.checked?'on':'off');}catch{}if(!toggle.checked)dismiss();});
 function dismiss(){clearTimeout(timer);if(overlay.hidden)return;overlay.hidden=true;overlay.querySelectorAll('.wn-confetti').forEach(n=>n.remove());if(previousFocus?.isConnected)previousFocus.focus();}
 function celebrate(count,preview){
  if(!preview&&!toggle.checked)return;
  dismiss();previousFocus=document.activeElement;
  byId('wn-celebration-title').textContent=preview?'A little celebration!':count===1?'Someone new joined!':format.format(count)+' new people joined!';
  byId('wn-celebration-message').textContent=preview?'Preview only \u2014 your signup counts have not changed.':'Your WellNest community is growing. Free-trial signups count too.';
  overlay.hidden=false;byId('wn-dismiss-celebration').focus();
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   for(let i=0;i<80;i++){const p=document.createElement('i');p.className='wn-confetti';p.setAttribute('aria-hidden','true');p.style.setProperty('--x',Math.random()*100+'%');p.style.setProperty('--delay',Math.random()*.5+'s');p.style.setProperty('--drift',(Math.random()-.5)*250+'px');p.style.setProperty('--piece',['#d8fb96','#fff2b8','#a8d9c2','#f3a9b3'][i%4]);overlay.append(p);}
  }
  timer=setTimeout(dismiss,3200);
 }
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();dismiss();}if(e.key==='Tab'){e.preventDefault();byId('wn-dismiss-celebration').focus();}});
 overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
 byId('wn-dismiss-celebration').addEventListener('click',dismiss);
 byId('wn-preview-celebration').addEventListener('click',()=>celebrate(1,true));
 function stored(){try{return JSON.parse(localStorage.getItem('gotrue.user')||'null');}catch{return null;}}
 async function getAccounts(days,retry){
  const u=stored(),headers=u?.token?.access_token?{Authorization:'Bearer '+u.token.access_token}:{};
  const params=new URLSearchParams({days:String(days)});if(cursor)params.set('since',cursor);
  const r=await fetch('/api/analytics/accounts?'+params,{headers,credentials:'include',cache:'no-store'});
  if(r.status===401&&!retry&&u?.token?.refresh_token){
   const refreshed=await fetch('/api/_identity/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:u.token.refresh_token})});
   if(refreshed.ok){const token=await refreshed.json();u.token={...u.token,...token,expires_at:Date.now()+(token.expires_in||3600)*1000};try{localStorage.setItem('gotrue.user',JSON.stringify(u));}catch{}return getAccounts(days,true);}
  }
  return r;
 }
 async function load(){
  if(busy){pending=true;return;}busy=true;
  const days=Number(new URLSearchParams(location.search).get('days'))||30;
  try{
   const r=await getAccounts(days,false);if(!r.ok)throw Error(r.status===401?'Sign in with your admin account to see account totals.':r.status===403?'Account totals are available to site admins only.':'Account totals could not refresh. Please try again.');
   const data=await r.json();const fresh=data.events.filter(id=>!seen.has(id));
   if(initialized&&fresh.length)celebrate(fresh.length,false);
   seen=new Set(data.events);cursor=data.generated;initialized=true;
   const c=data.counts;byId('wn-total').textContent=format.format(c.total);byId('wn-trials').textContent=format.format(c.trials);byId('wn-paid').textContent=format.format(c.paid);byId('wn-new').textContent=format.format(c.new_signups);
   byId('wn-new-label').textContent='New signups \xB7 last '+(data.days===1?'24 hours':data.days===365?'12 months':data.days+' days');
   byId('wn-account-extra').textContent=format.format(c.unconfirmed)+' awaiting email confirmation \xB7 '+format.format(c.past_due)+' overdue subscriptions. Total users includes admin and unconfirmed accounts.';
   byId('wn-account-status').textContent='Updated '+new Date(data.generated).toLocaleTimeString()+'. Checks for new signups every 15 seconds while this page is visible.';
  }catch(e){byId('wn-account-status').textContent=e.message;['wn-total','wn-trials','wn-paid','wn-new'].forEach(id=>byId(id).textContent='\u2014');}
  finally{busy=false;if(pending){pending=false;load();}}
 }
 byId('wn-refresh-accounts').addEventListener('click',load);
 byId('ranges').addEventListener('click',e=>{if(e.target.closest('button'))setTimeout(load,0);});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load();});
 load();setInterval(()=>{if(document.visibilityState==='visible')load();},15000);
})();
<\/script>
`;
var WN_DISCOVERY_PAIRS = [["Chronic Illness Tracker for Multiple Conditions | WellNest", "Chronic Health Tracker for Symptoms & Appointments | WellNest"], ["One chronic illness tracker for asthma, chronic pain and epilepsy", "A chronic health tracker for everyday life with long-term conditions"], ["Track chronic pain, asthma symptoms, peak flow and epilepsy seizures in one app. Organise medications and share PDF records with doctors. Try WellNest.", "WellNest is a chronic health tracker for pain, asthma and epilepsy. Record symptoms, organise medications and appointments, and share PDF reports with your care team."], ["Looking for a chronic health tracker that handles more than one condition?", "WellNest is a chronic health tracker for people living with chronic pain, CRPS, asthma or epilepsy. Use it as a symptom diary, medication record and appointment organiser on the web or iPhone."]];
var WN_DISCOVERY_SCHEMA = '<script id="wn-tracker-application" type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","@id":"https://wellnest.services/#application","name":"WellNest","url":"https://wellnest.services/chronic-illness-tracker","applicationCategory":"HealthApplication","operatingSystem":"Web, iOS","description":"WellNest is a chronic health tracker for pain, asthma and epilepsy. Record symptoms, organise medications and appointments, and share PDF reports with your care team.","featureList":["Symptom diary","Chronic pain and CRPS records","Asthma and peak flow logs","Epilepsy seizure diary","Medication and appointment records","PDF health summaries"],"publisher":{"@id":"https://wellnest.services/#organization"},"installUrl":"https://apps.apple.com/au/app/wellnest/id6759418128"}<\/script>';
function discoveryText(text, path) {
  const app = /^\/assets\/index-calendar-[^/]+\.js$/.test(path);
  if (path === "/chronic-illness-tracker" || app) {
    for (const [before, after] of WN_DISCOVERY_PAIRS) text = text.split(before).join(after);
  }
  if (path === "/") text = text.replace("<strong>chronic health tracker</strong>", '<a href="/chronic-illness-tracker" style="color:inherit;text-decoration:underline;text-underline-offset:3px"><strong>chronic health tracker</strong></a>');
  if (app) text = text.replace("(0,R.jsx)(`strong`,{children:`chronic health tracker`})", "(0,R.jsx)(`a`,{href:`/chronic-illness-tracker`,style:{color:`inherit`,textDecoration:`underline`,textUnderlineOffset:`3px`},children:(0,R.jsx)(`strong`,{children:`chronic health tracker`})})");
  if (path === "/chronic-illness-tracker" && !text.includes('id="wn-tracker-application"')) text = text.replace("</head>", WN_DISCOVERY_SCHEMA + "</head>");
  if (path === "/sitemap.xml") text = text.replace(/<url>[\s\S]*?<\/url>/g, (entry) => /<loc>https:\/\/wellnest\.services\/(?:chronic-illness-tracker)?<\/loc>/.test(entry) ? entry.replace(/<lastmod>[^<]+<\/lastmod>/, "<lastmod>2026-11-12</lastmod>") : entry);
  return text;
}
__name(discoveryText, "discoveryText");
__name2(discoveryText, "discoveryText");
__name22(discoveryText, "discoveryText");
__name222(discoveryText, "discoveryText");
__name2222(discoveryText, "discoveryText");
__name22222(discoveryText, "discoveryText");
__name222222(discoveryText, "discoveryText");
async function discoveryResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200 || !(["/", "/chronic-illness-tracker", "/sitemap.xml"].includes(path) || /^\/assets\/index-calendar-[^/]+\.js$/.test(path))) return response;
  const text = await response.text();
  const changed = discoveryText(text, path);
  const out = new Response(changed, response);
  if (changed !== text) {
    out.headers.delete("Content-Length");
    out.headers.delete("ETag");
    out.headers.delete("Last-Modified");
    out.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  return out;
}
__name(discoveryResponse, "discoveryResponse");
__name2(discoveryResponse, "discoveryResponse");
__name22(discoveryResponse, "discoveryResponse");
__name222(discoveryResponse, "discoveryResponse");
__name2222(discoveryResponse, "discoveryResponse");
__name22222(discoveryResponse, "discoveryResponse");
__name222222(discoveryResponse, "discoveryResponse");
var WN_SEARCH_UPDATES = [["A symptom tracker app for the whole picture of chronic illness", "A symptom tracker app for chronic pain, asthma and epilepsy"], ["When symptoms vary from day to day, it is hard to remember what happened between appointments. WellNest brings dated symptom notes, condition-specific logs, medications, appointments and doctor-ready PDF reports into one place \u2014 without asking you to reconstruct weeks of changes from memory.", "WellNest is a symptom tracker app for people living with chronic pain, CRPS, asthma or epilepsy. Keep a dated symptom diary alongside your medications and appointments, then export PDF records for your care team. Use the web app on a computer or explore WellNest on iPhone. Try a single-entry report preview without signing up."], ["Designed for real-life tracking", "Is WellNest the right symptom tracker for you?"], ["Choose a manageable routine: a quick entry after a significant event or a short check-in at the end of the day. Consistent, honest notes are more useful than filling in details you cannot remember. Track only information you are comfortable storing and review the privacy policy before using a health app.", "Choose WellNest if you want dedicated pain, asthma or seizure records together with medication details, appointments and PDF summaries. The free preview lets you test one entry and its report before creating an account. WellNest records information you enter; it does not detect symptoms or diagnose their cause. Review the screenshots, privacy policy and current plans before choosing."], ["Free Pain, Asthma & Seizure Report Preview | WellNest", "Free Pain Diary & PDF Report Preview | WellNest"], ["Free Pain, Asthma &amp; Seizure Report Preview | WellNest", "Free Pain Diary &amp; PDF Report Preview | WellNest"], ["See how WellNest turns the details you choose to record into a helpful appointment summary. Try one entry, then download your own PDF \u2014 free, with no account needed.", "Try a free pain diary entry and turn it into a PDF appointment summary. Record the details you want to discuss with your care team, then download your report without an account. You can also preview an asthma or seizure record. This preview holds one entry; use the WellNest app for an ongoing health diary."], ["Try a free WellNest report preview for pain, asthma or seizures. Start with blank fields, create one entry dated today and download your own PDF without signup.", "Try a free pain diary entry and download a PDF appointment summary. Preview pain, asthma or seizure records in WellNest without signup or payment."]];
function searchContentText(text, path) {
  const app = /^\/assets\/index-calendar-[^/]+\.js$/.test(path);
  if (app || ["/symptom-tracker-app", "/chronic-pain-diary"].includes(path)) {
    for (const [before, after] of WN_SEARCH_UPDATES) text = text.split(before).join(after);
    text = text.split("https://wellnest.services/symptom-tracker-app.html").join("https://wellnest.services/symptom-tracker-app");
  }
  if (path === "/chronic-pain-diary") text = text.replace("Your story,<br/><em>a little clearer.</em>", "Free pain diary.<br/><em>Your PDF report.</em>");
  if (app) text = text.replace("children:[`Your story,`,(0,R.jsx)(`br`,{}),(0,R.jsx)(`em`,{children:`a little clearer.`})]", "children:[`Free pain diary.`,(0,R.jsx)(`br`,{}),(0,R.jsx)(`em`,{children:`Your PDF report.`})]");
  if (path === "/sitemap.xml") text = text.replace(/<url>[\s\S]*?<\/url>/g, (e) => /<loc>https:\/\/wellnest\.services\/(symptom-tracker-app|chronic-pain-diary)<\/loc>/.test(e) ? e.replace(/<lastmod>[^<]+<\/lastmod>/, "<lastmod>2026-11-12</lastmod>") : e);
  return text;
}
__name(searchContentText, "searchContentText");
__name2(searchContentText, "searchContentText");
__name22(searchContentText, "searchContentText");
__name222(searchContentText, "searchContentText");
__name2222(searchContentText, "searchContentText");
__name22222(searchContentText, "searchContentText");
__name222222(searchContentText, "searchContentText");
async function searchContentResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200 || !(["/symptom-tracker-app", "/chronic-pain-diary", "/sitemap.xml"].includes(path) || /^\/assets\/index-calendar-[^/]+\.js$/.test(path))) return response;
  const before = await response.text(), after = searchContentText(before, path), out = new Response(after, response);
  if (before !== after) {
    out.headers.delete("ETag");
    out.headers.delete("Content-Length");
    out.headers.delete("Last-Modified");
    out.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }
  return out;
}
__name(searchContentResponse, "searchContentResponse");
__name2(searchContentResponse, "searchContentResponse");
__name22(searchContentResponse, "searchContentResponse");
__name222(searchContentResponse, "searchContentResponse");
__name2222(searchContentResponse, "searchContentResponse");
__name22222(searchContentResponse, "searchContentResponse");
__name222222(searchContentResponse, "searchContentResponse");
var SETTINGS_EDITS = [['import {createCalendarIntegration} from "./google-calendar-20261107-wn2.js";', ""], ["var {CalendarSettings:WnCalendarSettings,CalendarSync:WnCalendarSync}=createCalendarIntegration(K);", ""], ["(0,$.jsx)(WnCalendarSettings,{userId:e?.id}),", ""], ["(0,$.jsx)(WnCalendarSync,{userId:s?.id,ready:u,getTracker:()=>wnTrackerSync.current,refresh:w}),", ""], ["Manage your profile, sync preferences, and customize home screen cards.", "Manage your backups, appearance and dashboard shortcuts."], ["Export JSON Backup", "Download backup"], ["01 / ON THIS DEVICE", "DEVICE STORAGE"], ["02 / YOUR CLOUD ACCOUNT", "CLOUD BACKUP"], ["Keep it close. ", "On this device. "], ["Store locally.", ""], ["Take it with you. ", "Your WellNest account. "], ["Access remotely.", ""], ["By default, your health logs are saved directly on this browser and device. You can export a full JSON backup whenever you choose.", "Your health records are stored in this browser. Download a backup to keep a separate copy."], ["Visible Dashboard Spaces", "Dashboard cards"], ["Toggle which condition and care spaces appear on your Dashboard Beta overview.", "Choose the cards shown on your dashboard."], ["Choose which shortcuts appear in the top bar. Settings stays available so you can restore hidden items. These choices are saved on this device and are separate from your overview cards.", "Choose your top-bar shortcuts. Settings is always available. These choices are saved on this device."]];
function streamlinedSettingsSource(source) {
  for (const [before, after] of SETTINGS_EDITS) source = source.split(before).join(after);
  return source;
}
__name(streamlinedSettingsSource, "streamlinedSettingsSource");
__name2(streamlinedSettingsSource, "streamlinedSettingsSource");
__name22(streamlinedSettingsSource, "streamlinedSettingsSource");
__name222(streamlinedSettingsSource, "streamlinedSettingsSource");
__name2222(streamlinedSettingsSource, "streamlinedSettingsSource");
__name22222(streamlinedSettingsSource, "streamlinedSettingsSource");
async function streamlinedSettingsResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200) return response;
  if (/^\/assets\/dashboardbeta-calendar-20261107-wn2\.js$/.test(path)) {
    const out = new Response(streamlinedSettingsSource(await response.text()), response);
    out.headers.delete("ETag");
    out.headers.delete("Content-Length");
    out.headers.set("Cache-Control", "no-cache");
    return out;
  }
  if (/^\/assets\/index-calendar-20261107-wn2\.js$/.test(path)) {
    const text = await response.text();
    const out = new Response(text.split("dashboardbeta-calendar-20261107-wn2.js").join("dashboardbeta-calendar-20261107-wn2.js?settings=20261112"), response);
    out.headers.delete("ETag");
    out.headers.delete("Content-Length");
    out.headers.set("Cache-Control", "no-cache");
    return out;
  }
  return response;
}
__name(streamlinedSettingsResponse, "streamlinedSettingsResponse");
__name2(streamlinedSettingsResponse, "streamlinedSettingsResponse");
__name22(streamlinedSettingsResponse, "streamlinedSettingsResponse");
__name222(streamlinedSettingsResponse, "streamlinedSettingsResponse");
__name2222(streamlinedSettingsResponse, "streamlinedSettingsResponse");
__name22222(streamlinedSettingsResponse, "streamlinedSettingsResponse");
var WELLNEST_PRODUCT_FACTS_HTML = `<!doctype html>
<html lang="en-AU">
  <head>
    <script id="gh-pages-base">(function () {
  var B = "/wellnest-website", L = "https://wellnest.services", R = new RegExp("^/(?:login|start|startfree|signin|signup|register|dashboard(?:-beta)?|chronic-pain|asthma|epilepsy|medications|appointments|care-circle|exercises|reflection|expenses|emergency-plan|emergency-plan-shared|meeting-note-shared|achievements|settings|growth|email-preferences|confirm-free-kit)/?$|^/(?:auth|ios-auth)(?:/|$)", "i"), K = "wn_bridge";
  var D = document.documentElement, of = window.fetch.bind(window);
  window.__WN_IDENTITY__ = L + "/api/_identity";

  function rel(p) { return p.indexOf(B) === 0 ? (p.slice(B.length) || "/") : p; }
  function appUrl(u) {
    try { var x = new URL(u, location.href); return x.origin === location.origin && R.test(rel(x.pathname)) ? x : null; }
    catch (e) { return null; }
  }
  function liveUrl(x) { return L + rel(x.pathname) + x.search + x.hash; }
  function fix(u) {
    return typeof u == "string" && u.charAt(0) == "/" && u.charAt(1) != "/" && u !== B && u.indexOf(B + "/") !== 0 ? B + u : u;
  }
  function token() { var m = document.cookie.match(/(?:^|;\\s*)nf_jwt=([^;]+)/); return m ? decodeURIComponent(m[1]) : null; }

  // --- send API + identity calls to the WellNest server -------------------
  // The server bridge allows only these request headers (plus browser-set ones).
  var OK_HEADERS = /^(authorization|content-type|x-requested-with|accept|accept-language|content-language)$/i;
  function trimHeaders(init, input) {
    var h = new Headers(init.headers || (input instanceof Request ? input.headers : undefined)), out = new Headers();
    h.forEach(function (v, k) { if (OK_HEADERS.test(k)) out.set(k, v); });
    init.headers = out;
    return init;
  }
  window.fetch = function (input, init) {
    try {
      var s = typeof input == "string" ? input : input instanceof URL ? input.href : input && input.url;
      var x = new URL(s, location.href);
      var sameSite = x.origin === location.origin;
      if (x.origin === new URL(L).origin && !(sameSite && /^\\/(?:api\\/|\\.netlify\\/identity)/.test(rel(x.pathname)))) {
        // direct calls to the server (e.g. Netlify Identity's own client): drop extra headers
        init = trimHeaders(Object.assign({}, init || {}), input);
        init.credentials = "omit";
        return of(input instanceof Request ? new Request(input, init) : input, init);
      }
      if (sameSite) {
        var p = rel(x.pathname);
        if (p.indexOf("/.netlify/identity") === 0) p = "/api/_identity" + p.slice(18);
        if (p.indexOf("/api/") === 0) {
          init = trimHeaders(Object.assign({}, init || {}), input);
          var h = init.headers, t = token();
          if (t && !h.has("Authorization") && p.indexOf("/api/_identity") !== 0) h.set("Authorization", "Bearer " + t);
          init.credentials = "omit"; init.mode = "cors";
          var target = L + p + x.search;
          return input instanceof Request ? of(new Request(target, input), init) : of(target, init);
        }
      }
    } catch (e) {}
    return of(input, init);
  };

  // --- is the server bridge live? ------------------------------------------
  var ok = null;
  try { if (sessionStorage.getItem(K) === "1") ok = true; } catch (e) {}
  var hide = document.createElement("style");
  hide.textContent = "html[data-wn-wait] body{visibility:hidden}";
  D.appendChild(hide);
  function settle(v) {
    if (ok !== null) return;
    ok = v;
    try { if (v) sessionStorage.setItem(K, "1"); } catch (e) {}
    if (!v) { var x = appUrl(location.href); if (x) { location.replace(liveUrl(x)); return; } }
    D.removeAttribute("data-wn-wait");
  }
  if (ok === null) {
    of(L + "/api/_identity/settings", { mode: "cors", credentials: "omit" })
      .then(function (r) { settle(r.ok && /json/i.test(r.headers.get("content-type") || "")); }, function () { settle(false); });
    setTimeout(function () { settle(false); }, 6000);
    if (appUrl(location.href)) D.setAttribute("data-wn-wait", "");
  }

  // --- navigation ------------------------------------------------------------
  ["pushState", "replaceState"].forEach(function (k) {
    var o = history[k];
    history[k] = function (s, t, u) {
      var x = u != null && appUrl(String(u));
      if (x && ok === false) { location.assign(liveUrl(x)); return; }
      if (x && ok === null) D.setAttribute("data-wn-wait", "");
      return o.apply(this, arguments);
    };
  });
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href"), n = fix(h), x = appUrl(n);
    if (x && ok === false) {
      a.setAttribute("href", liveUrl(x));
      if (!a.target) { e.preventDefault(); e.stopPropagation(); location.assign(liveUrl(x)); }
      return;
    }
    if (n !== h) a.setAttribute("href", n);
  }, true);

  // --- file previews (<img src="/api/files/...">) load from the server -------
  function fixSrc(el) {
    var v = el.getAttribute && el.getAttribute("src");
    if (v && /^\\/(?:[^/]+\\/)?api\\//.test(v)) { var x = new URL(v, location.href); el.setAttribute("src", L + rel(x.pathname) + x.search); }
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type == "attributes") return fixSrc(m.target);
      m.addedNodes.forEach(function (n) { if (n.nodeType == 1) { fixSrc(n); n.querySelectorAll && n.querySelectorAll("[src]").forEach(fixSrc); } });
    });
  }).observe(D, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
})();<\/script>
    <meta charset="UTF-8" />
    <script id="dashboard-boot-guard">
      // SPA hosting can return the pre-rendered homepage for dashboard requests.
      // Hide that fallback before the browser parses or paints its content.
      if (/^\\/(?:dashboard(?:-beta)?|chronic-pain|asthma|epilepsy|medications|appointments|care-circle|exercises|reflection|expenses|emergency-plan|achievements|settings)\\/?$/i.test(window.location.pathname.replace(/^\\/,''))) {
        document.documentElement.setAttribute('data-dashboard-boot', '');
      }
    <\/script>
    <style>html[data-dashboard-boot],html[data-dashboard-boot] body{background:#081e1b}html[data-dashboard-boot] #root{visibility:hidden}</style>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet"></noscript>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WellNest Product Facts &amp; Media Kit | Chronic Health Tracker</title>
    <meta name="description" content="Media kit for WellNest: app description, founder quote, logo and screenshot downloads, and press contact details." />
    <meta name="apple-itunes-app" content="app-id=6759418128, app-argument=https://wellnest.services/" />
    <meta name="author" content="WellNest" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="https://wellnest.services/press" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="WellNest" />
    <meta property="og:title" content="WellNest Product Facts &amp; Media Kit | Chronic Health Tracker" />
    <meta property="og:description" content="Media kit for WellNest: app description, founder quote, logo and screenshot downloads, and press contact details." />
    <meta property="og:url" content="https://wellnest.services/press" />
    <meta property="og:locale" content="en_AU" />
    <meta property="og:image" content="https://wellnest.services/og/press.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="WellNest media kit \u2014 WellNest" />
    <meta name="twitter:image" content="https://wellnest.services/og/press.png" />
    <meta name="twitter:image:alt" content="WellNest media kit \u2014 WellNest" />
    <meta name="geo.region" content="AU" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="WellNest Product Facts &amp; Media Kit | Chronic Health Tracker" />
    <meta name="twitter:description" content="Media kit for WellNest: app description, founder quote, logo and screenshot downloads, and press contact details." />
    <script>
      // Retire older offline app shells. Wait for cleanup before the one-time
      // refresh, otherwise a phone can reload while its old worker still owns it.
      (function () {
        if (!('serviceWorker' in navigator)) return;
        var hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.getRegistrations().then(async function (regs) {
          if (!regs.length && !hadController) return;
          await Promise.all(regs.map(function (registration) { return registration.unregister(); }));
          if (typeof caches !== 'undefined') {
            var keys = await caches.keys();
            await Promise.all(keys.map(function (key) { return caches.delete(key); }));
          }
          try {
            if (sessionStorage.getItem('wn-current-ui-refresh-v1')) return;
            sessionStorage.setItem('wn-current-ui-refresh-v1', '1');
          } catch (error) { return; }
          window.location.reload();
        }).catch(function () { /* Offline cleanup must not block the app. */ });
      })();
    <\/script>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-GTN93JL5LQ"><\/script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-LCBB6YZSNL"><\/script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-GTN93JL5LQ');
      gtag('config', 'G-LCBB6YZSNL');
    <\/script>
    <script async data-cfasync="false" type="text/javascript" src="https://cdn.seoplatform.io/injector.js?websiteId=28120"><\/script>
    
    <link rel="modulepreload" crossorigin href="/assets/rolldown-runtime-BCiCTKAo-wn2.js">
    <link rel="modulepreload" crossorigin href="/assets/jsx-runtime-Cl3nUQcN-wn2.js">
    <link rel="stylesheet" crossorigin href="/assets/index-Cj0oiCRe-wn2.css">
  <script id="wn-static-page-identity" type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://wellnest.services/#organization","name":"WellNest","url":"https://wellnest.services/","logo":{"@type":"ImageObject","url":"https://wellnest.services/og/logo.png","width":512,"height":512},"sameAs":["https://apps.apple.com/au/app/wellnest/id6759418128"]},{"@type":"WebPage","@id":"https://wellnest.services/press#webpage","url":"https://wellnest.services/press","name":"WellNest Media Kit \u2013 Press Resources & App Assets | WellNest","description":"Media kit for WellNest: app description, founder quote, logo and screenshot downloads, and press contact details.","isPartOf":{"@id":"https://wellnest.services/#website"},"publisher":{"@id":"https://wellnest.services/#organization"}}]}<\/script>
      <script id="wn-seo-extra" type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList","@id":"https://wellnest.services/press#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://wellnest.services/"},{"@type":"ListItem","position":2,"name":"WellNest Media Kit","item":"https://wellnest.services/press"}]}]}<\/script>
    <script id="wn-seo-dedupe">(function(){var own=document.getElementById("wn-seo-extra");if(!own||!window.MutationObserver)return;var have={};try{JSON.parse(own.textContent)["@graph"].forEach(function(n){have[n["@type"]]=1})}catch(e){return}function fix(el){if(el===own||el.type!=="application/ld+json")return;try{var d=JSON.parse(el.textContent),g=d["@graph"]||[d],k=g.filter(function(n){return !have[n["@type"]]});if(k.length===g.length)return;if(!k.length){el.type="application/x-wn-duplicate";return}el.textContent=JSON.stringify(d["@graph"]?Object.assign(d,{"@graph":k}):k[0])}catch(e){}}new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.tagName==="SCRIPT")fix(n);else if(n.querySelectorAll)n.querySelectorAll("script").forEach(fix)})})}).observe(document.documentElement,{childList:true,subtree:true})})();<\/script>
  <style>.reveal{opacity:1!important;transform:none!important}#wellnest-facts dt{margin-top:1.2rem}#wellnest-facts dd{margin:0.35rem 0 0;line-height:1.7}</style></head>
  <body>
    <div id="root"><div class="gp-page"><style>
.gp-page{background:#f4f1ea;color:#0d1f17;font-family:&#x27;Geist&#x27;,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100vh;position:relative}
.gp-page *,.gp-page *::before,.gp-page *::after{box-sizing:border-box;margin:0;padding:0}
.gp-page a{text-decoration:none}
.gp-page .gp-nav{position:fixed;top:0;left:0;right:0;transform:none;z-index:100;background:rgba(255,254,250,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(13,31,23,.12);border-radius:0;padding:0 32px;height:68px;display:flex;align-items:center;gap:28px;box-shadow:none;animation:none;white-space:nowrap;max-width:none;transition:background .3s ease,box-shadow .3s ease}
.gp-page .gp-nav.scrolled{background:rgba(255,254,250,.95);border-bottom-color:rgba(13,31,23,.12);box-shadow:0 4px 24px rgba(13,31,23,.08)}
.gp-page .gp-nav:hover{background:rgba(255,254,250,.95);box-shadow:none}
.gp-page .gp-nav-logo{display:flex;align-items:center;gap:0;color:#16241c;font-weight:700;font-size:1rem;letter-spacing:0}
.gp-page .gp-nav-logo .nest{color:#00a854;margin-left:-.02em}
.gp-page .gp-nav-logo-mark{width:52px;height:52px;position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:0;margin-right:-8px;overflow:visible}
.gp-page .gp-nav-logo-mark img{width:100%;height:100%;display:block;object-fit:contain;transform:translateY(10px)}
.gp-page .gp-nav-logo-word{display:inline-block;transform:translateY(6px);margin-left:-2px}
.gp-page .gp-nav-links{position:absolute;right:32px;display:flex;align-items:center;gap:32px;list-style:none;margin-right:8px}
.gp-page .gp-nav-links a{color:#6f7a72;text-decoration:none;font-size:.875rem;font-weight:400;transition:color .2s;white-space:nowrap;display:inline-block}
.gp-page .gp-nav-links a:hover{color:#16241c}
.gp-page .gp-nav-cta{background:#00cc66;color:#16241c!important;font-weight:600!important;padding:10px 18px;border-radius:100px;font-size:.85rem!important;transition:all .2s!important;flex-shrink:0}
.gp-page .gp-nav-cta:hover{background:#c8f76b;transform:scale(1.03)}
.gp-page .gp-hero{padding:150px 32px 30px;max-width:920px;margin:0 auto;text-align:center}
.gp-page .gp-back{position:absolute;top:104px;left:32px;z-index:5;display:inline-flex;align-items:center;gap:8px;padding:9px 16px 9px 12px;border-radius:999px;border:1px solid rgba(13,31,23,.18);background:#fff;color:#0d1f17;font-size:14px;font-weight:600;text-decoration:none;transition:background .15s,border-color .15s}
.gp-page .gp-back:hover{background:#f4f1ea;border-color:rgba(13,31,23,.35)}
.gp-page .gp-h1{font-size:clamp(2rem,5vw,3.6rem);font-weight:800;line-height:1.05;letter-spacing:-.04em;margin-bottom:16px}
.gp-page .gp-byline{font-size:.85rem;color:#6b7770;margin-bottom:20px}
.gp-page .gp-intro{font-size:1.1rem;line-height:1.6;color:#2d3b32;max-width:60ch;margin:0 auto}
.gp-page .gp-article{max-width:720px;margin:0 auto;padding:20px 20px 40px}
.gp-page .gp-guide-choice{max-width:760px;margin:8px auto 20px;padding:23px 25px;background:#e9f3e9;border:1px solid #b6d3bc;border-radius:19px;color:#163927}
.gp-page .gp-guide-choice h2{font-size:clamp(1.25rem,2.6vw,1.55rem);line-height:1.25;margin:0 0 7px;letter-spacing:-.025em}
.gp-page .gp-guide-choice p{font-size:.91rem;line-height:1.65;margin:0 0 13px;color:#385341}
.gp-page .gp-guide-choice-links{display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin:0 0 11px}
.gp-page .gp-guide-choice-links a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border:1px solid #164b30;border-radius:999px;background:#164b30;color:#fff;font-size:.87rem;font-weight:750}
.gp-page .gp-guide-choice-links a+a{background:transparent;color:#164b30}
.gp-page .gp-guide-choice-links a:focus-visible{outline:3px solid #118c56;outline-offset:3px}
.gp-page .gp-guide-choice .gp-guide-choice-terms{font-size:.79rem;margin:0;color:#45614d}
.gp-page .gp-wide{max-width:1040px}
.gp-page .gp-notice{background:rgba(0,204,102,.08);border:1px solid rgba(0,204,102,.35);border-radius:16px;padding:20px 24px;font-size:.95rem;line-height:1.6;color:#2d3b32;margin-bottom:8px;font-weight:500}
.gp-page .gp-notice-alert{background:rgba(255,107,74,.09);border-color:rgba(255,107,74,.45)}
.gp-page .gp-p a{color:#0d1f17;font-weight:600;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(13,31,23,.3)}
.gp-page .gp-sources{margin-top:48px;padding-top:24px;border-top:1px solid rgba(13,31,23,.15)}
.gp-page .gp-sources-note{font-size:.85rem;color:#6b7770;line-height:1.55;margin-bottom:16px}
.gp-page .gp-sources-title{font-size:.72rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#6b7770;margin-bottom:12px}
.gp-page .gp-source-list{list-style:none;display:flex;flex-direction:column;gap:8px}
.gp-page .gp-source-list a{color:#0d1f17;font-size:.92rem;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(13,31,23,.3)}
.gp-page .gp-source-list a:hover{color:#0f5c34}
.gp-page .gp-h2{font-size:clamp(1.5rem,3vw,2.1rem);font-weight:700;letter-spacing:-.03em;line-height:1.15;margin:48px 0 16px}
.gp-page .gp-p{font-size:1.02rem;line-height:1.7;color:#2d3b32;margin-bottom:16px}
.gp-page .gp-ul{list-style:none;display:flex;flex-direction:column;gap:12px;margin:0 0 16px}
.gp-page .gp-ul li{position:relative;padding-left:26px;font-size:1.02rem;line-height:1.6;color:#2d3b32}
.gp-page .gp-ul li::before{content:&#x27;&#x27;;position:absolute;left:0;top:.55em;width:12px;height:12px;border-radius:50%;background:#00cc66}
.gp-page .gp-author-box{display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.65);border:1px solid rgba(13,31,23,.1);border-radius:24px;padding:24px;margin-top:48px}
.gp-page .gp-author-box img{width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #0d1f17;flex-shrink:0}
.gp-page .gp-author-box p{font-size:.95rem;line-height:1.55;color:#2d3b32}
.gp-page .gp-photo{width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid #0d1f17;margin-bottom:16px}
.gp-page .gp-table-wrap{display:none;margin-bottom:8px}
.gp-page .gp-table{width:100%;border-collapse:collapse;font-size:.92rem}
.gp-page .gp-table th{text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#6b7770;padding:12px 14px;border-bottom:2px solid rgba(13,31,23,.2)}
.gp-page .gp-table td{padding:14px;border-bottom:1px solid rgba(13,31,23,.1);vertical-align:top;line-height:1.5;color:#2d3b32}
.gp-page .gp-table td:first-child{font-weight:700;color:#0d1f17;white-space:nowrap}
.gp-page .gp-cards{display:flex;flex-direction:column;gap:12px;margin-bottom:8px}
.gp-page .gp-card{background:rgba(255,255,255,.65);border:1px solid rgba(13,31,23,.1);border-radius:16px;padding:18px 20px}
.gp-page .gp-card b{display:block;margin-bottom:6px}
.gp-page .gp-card span{font-size:.8rem;color:#6b7770;display:block;margin-bottom:8px}
.gp-page .gp-card p{font-size:.92rem;line-height:1.55;color:#2d3b32}
.gp-page .gp-small{font-size:.78rem;color:#6b7770;line-height:1.5}
@media(min-width:700px){.gp-page .gp-table-wrap{display:block}.gp-page .gp-cards{display:none}}
.gp-page .gp-hub-grid{display:flex;flex-direction:column;gap:12px;margin-top:8px}
.gp-page .gp-hub-card{background:rgba(255,255,255,.65);border:1px solid rgba(13,31,23,.1);border-radius:16px;padding:18px 24px;display:flex;align-items:center;gap:18px;transition:all .3s;color:inherit}
.gp-page .gp-hub-card:hover{border-color:rgba(0,204,102,.5);box-shadow:0 16px 40px rgba(13,31,23,.08)}
.gp-page .gp-hub-tag{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#0d1f17;background:#00cc66;border-radius:100px;padding:4px 10px;flex-shrink:0}
.gp-page .gp-hub-tag-cond{background:#b8d4f0}
.gp-page .gp-hub-tag-feat{background:#ffb89c}
.gp-page .gp-hub-card h3{font-size:1.05rem;font-weight:700;letter-spacing:-.02em;line-height:1.25;white-space:nowrap}
.gp-page .gp-hub-card p{font-size:.85rem;line-height:1.5;color:#2d3b32;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:900px){
  .gp-page .gp-hub-card{flex-direction:column;align-items:flex-start;gap:8px}
  .gp-page .gp-hub-card h3,.gp-page .gp-hub-card p{white-space:normal;overflow:visible;text-overflow:clip}
}
.gp-page .gp-faq{background:#ede8dc;padding:80px 32px}
.gp-page .gp-faq-title{font-family:&#x27;Instrument Serif&#x27;,serif;font-style:italic;font-size:clamp(2rem,4.5vw,3rem);letter-spacing:-.02em;text-align:center;margin-bottom:48px}
.gp-page .faq-list{max-width:820px;margin:0 auto;border-top:1px solid rgba(13,31,23,.2)}
.gp-page .faq-item{border-bottom:1px solid rgba(13,31,23,.1)}
.gp-page .faq-item summary{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:24px 0;cursor:pointer;font-weight:600;font-size:1.05rem;list-style:none}
.gp-page .faq-item summary::-webkit-details-marker{display:none}
.gp-page .faq-icon{width:28px;height:28px;border-radius:50%;border:1px solid rgba(13,31,23,.2);flex-shrink:0;position:relative;transition:all .3s}
.gp-page .faq-icon::before,.gp-page .faq-icon::after{content:&#x27;&#x27;;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#0d1f17;transition:transform .3s}
.gp-page .faq-icon::before{width:12px;height:1.5px}
.gp-page .faq-icon::after{width:1.5px;height:12px}
.gp-page .faq-item[open] .faq-icon::after{transform:translate(-50%,-50%) scaleY(0)}
.gp-page .faq-item[open] .faq-icon{background:#0d1f17}
.gp-page .faq-item[open] .faq-icon::before,.gp-page .faq-item[open] .faq-icon::after{background:#f4f1ea}
.gp-page .faq-a{padding:0 44px 28px 0;font-size:.98rem;line-height:1.65;color:#2d3b32;max-width:64ch}
.gp-page .gp-cta{background:#0d1f17;color:#f4f1ea;text-align:center;padding:100px 32px;position:relative;overflow:hidden}
.gp-page .gp-cta-heading{font-size:clamp(2.2rem,5.5vw,4rem);font-weight:700;line-height:.95;letter-spacing:-.04em;margin-bottom:24px}
.gp-page .cta-row{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.gp-page .btn-primary{display:inline-flex;align-items:center;gap:12px;padding:18px 32px;background:#00cc66;color:#0d1f17;border-radius:100px;font-weight:600;font-size:.95rem;transition:background .2s}
.gp-page .btn-primary:hover{background:#c8f76b}
.gp-page .btn-secondary{display:inline-flex;align-items:center;gap:10px;padding:18px 28px;background:transparent;color:#f4f1ea;border:1px solid rgba(244,241,234,.3);border-radius:100px;font-weight:500;font-size:.95rem;transition:all .25s}
.gp-page .btn-secondary:hover{background:#f4f1ea;color:#0d1f17;border-color:#f4f1ea}
.gp-page .cta-note{margin-top:28px;font-size:.85rem;color:rgba(244,241,234,.5)}
.gp-page .gp-footer{background:#0d1f17;color:#f4f1ea;padding:40px 32px 30px;border-top:1px solid rgba(244,241,234,.1)}
.gp-page .gp-footer-inner{max-width:1280px;margin:0 auto;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:28px}
.gp-page .gp-footer-logo{display:flex;align-items:center;color:#f4f1ea;font-weight:700;font-size:1rem;line-height:1}
.gp-page .gp-footer-logo img{width:72px;height:72px;object-fit:contain}
.gp-page .gp-footer-logo .nest{color:#00cc66;margin-left:-.1em}
.gp-page .footer-heading{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(244,241,234,.5);margin-bottom:10px;font-weight:600}
.gp-page .footer-links{list-style:none;display:flex;flex-direction:column;gap:8px}
.gp-page .footer-links-row{flex-direction:row;gap:24px}
.gp-page .footer-links a{color:rgba(244,241,234,.6);font-size:.85rem;transition:color .2s}
.gp-page .footer-links a:hover{color:#f4f1ea}
.gp-page .footer-store{display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:8px 16px;border:1px solid rgba(244,241,234,.25);border-radius:100px;color:#f4f1ea;font-size:.78rem;font-weight:600;transition:all .2s}
.gp-page .footer-store:hover{border-color:#00cc66;color:#00cc66}
.gp-page .gp-disclaimer{max-width:1280px;margin:28px auto 8px;font-size:.78rem;line-height:1.5;color:rgba(244,241,234,.45)}
.gp-page .gp-copy{font-size:.8rem;color:rgba(244,241,234,.4);text-align:center}
.gp-page .reveal{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
.gp-page .reveal.visible{opacity:1;transform:translateY(0)}
@media(max-width:900px){
/* Mobile nav matches the landing page: logo + &quot;Start free trial&quot; only */
.gp-page .gp-nav{position:fixed;top:0;left:0;right:0;transform:none;width:100%;max-width:none;border-radius:0;height:56px;padding:0 16px;gap:0;justify-content:space-between;align-items:center;overflow:hidden;animation:none}
.gp-page .gp-nav-logo{font-size:1rem;gap:2px;letter-spacing:-.01em;margin-left:-8px}
.gp-page .gp-nav-logo-mark{display:flex!important;width:52px!important;height:52px!important;margin-top:0!important;margin-right:-10px!important}
.gp-page .gp-nav-links{display:flex!important;position:static;transform:none;gap:0;margin-right:0}
.gp-page .gp-nav-links li:not(:last-child){display:none}
.gp-page .gp-nav-cta{display:inline-flex!important;padding:8px 14px!important;font-size:.8rem!important}
.gp-page .gp-nav-logo-mark img{transform:translateY(5px)}
.gp-page .gp-nav-logo-word{transform:translateY(0)}
.gp-page .gp-hero{padding:100px 20px 20px}
.gp-page .gp-back{top:76px;left:16px;font-size:13px;padding:7px 14px 7px 10px}
.gp-page .gp-back + .gp-hero{padding-top:128px}
.gp-page .gp-article{padding:10px 16px 30px}
.gp-page .gp-faq{padding:50px 20px}
.gp-page .gp-cta{padding:60px 20px}
.gp-page .faq-a{padding-right:0}
}
      </style><nav id="wn-gp-nav" class="gp-nav"><a class="gp-nav-logo" href="/"><div class="gp-nav-logo-mark"><img src="/imported/5b8791d9c9-560935dfd_ChatGPTImageFeb82026at07_05_31PM.png" alt="WellNest"/></div><span class="gp-nav-logo-word">Well<span class="nest">Nest</span></span></a><details class="wn-mobile-site-menu"><summary aria-label="Site navigation"><svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu" aria-hidden="true"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg></summary><nav aria-label="Mobile site navigation"><a href="/">Home</a><a href="/#hb-features">Features</a><a href="/guides">Guides</a><a href="/free-tools">Free tools</a><a href="/pricing">Pricing</a><a href="/dashboard">Log in / Dashboard</a></nav></details><ul class="gp-nav-links"><li><a href="/#hb-features">Features</a></li><li><a href="/#hb-conditions">Conditions</a></li><li><a href="/#hb-how">How it works</a></li><li><a href="/guides">Guides</a></li><li><a href="/free-tools">Free tools</a></li><li><a href="/pricing" class="gp-nav-cta">Start free trial</a></li></ul></nav><section class="gp-hero"><h1 class="gp-h1">WellNest media kit</h1><p class="gp-intro">Everything you need to write about WellNest \u2014 what it is, who built it, and where to get assets.</p></section><article class="gp-article "><section class="reveal"><h2 class="gp-h2">About WellNest (short description)</h2><p class="gp-p">WellNest is an Australian personal health record-keeping app for people living with chronic conditions such as chronic pain, CRPS, asthma and epilepsy. It keeps symptom logs, medications, appointments, care-team contacts, health expenses and emergency plans in one place, and exports dated PDF reports patients can share with their doctors. WellNest does not diagnose, treat or monitor any condition. Every account includes 30 days of Premium free with no card, then a free plan or a Premium subscription.</p></section><section aria-labelledby="wellnest-facts"><h2 id="wellnest-facts" class="gp-h2">WellNest product facts</h2><p class="gp-p">Updated 12 November 2026. This information is published by WellNest, the maker of the app.</p><dl class="gp-p"><dt><strong>Which WellNest is this?</strong></dt><dd>WellNest at wellnest.services is an Australian chronic health tracker founded by Chris Greenfield. It is built and supported by CTRL ALT and FIX (ABN 54 632 545 705). Use this website and the linked App Store listing to identify this product.</dd><dt><strong>What can I track?</strong></dt><dd>Chronic pain and CRPS entries, asthma symptoms and peak flow, epilepsy seizure records, medications, appointments, care-team contacts and health expenses. You can export dated PDF records to discuss with your care team.</dd><dt><strong>Where can I use it?</strong></dt><dd>In a web browser and through the WellNest iPhone app. No native Android app is currently offered. Web and iPhone features may differ; check the app listing and try the tools you need.</dd><dt><strong>Can I try it without an account?</strong></dt><dd>Yes. The <a href="/chronic-pain-diary">free report preview</a> lets you create one pain, asthma or seizure entry and download its PDF without signup. Ongoing tracking requires an account.</dd><dt><strong>What does it cost?</strong></dt><dd>New accounts include 30 days of Premium without a payment card. Premium is AU$4.99 per month or AU$44.99 per year. See <a href="/pricing">current plans and billing terms</a> for what happens after the trial and what is included.</dd><dt><strong>Does it diagnose or automatically detect symptoms?</strong></dt><dd>No. WellNest organises information you enter. It does not diagnose conditions, detect seizures or provide emergency monitoring.</dd><dt><strong>Where can I check privacy and product details?</strong></dt><dd>Read the <a href="/privacypolicy">privacy policy</a>, <a href="/symptom-tracker-app">symptom tracker overview</a> and <a href="/about">founder background</a>. Review storage and backup settings before entering sensitive information.</dd></dl><p class="gp-p"><a href="https://apps.apple.com/au/app/wellnest/id6759418128" rel="noopener noreferrer">Official WellNest iPhone listing</a> \xB7 <a href="/contact">Contact WellNest</a></p></section><section class="reveal"><h2 class="gp-h2">Founder quote</h2><p class="gp-p">&quot;Living with chronic illness taught me that your doctors need to see your complete story \u2014 not scattered notes across apps. That&#x27;s why I built WellNest.&quot; \u2014 Chris Greenfield, founder of WellNest</p></section><section class="reveal"><h2 class="gp-h2">Assets</h2><p class="gp-p">Logo and app screenshots (PNG):</p><ul class="gp-ul"><li><a href="/imported/5b8791d9c9-560935dfd_ChatGPTImageFeb82026at07_05_31PM.png" target="_blank" rel="noopener">WellNest logo (PNG)</a></li><li><a href="/imported/a69448e89b-8148c237d_Dashboard.png" target="_blank" rel="noopener">Dashboard screenshot</a></li><li><a href="/imported/2f7d68ba3f-3784d9875_ChronicPain.png" target="_blank" rel="noopener">Chronic pain diary screenshot</a></li><li><a href="/imported/c2e4e7e3e5-65bab1f98_Asthma.png" target="_blank" rel="noopener">Asthma tracker screenshot</a></li><li><a href="/imported/5973d16019-d9689e47d_Epilepsy.png" target="_blank" rel="noopener">Seizure diary screenshot</a></li><li><a href="/imported/4b5bebf855-a88876a87_EmergencyPlan.png" target="_blank" rel="noopener">Emergency action plan screenshot</a></li></ul><p class="gp-p">Feel free to use these assets in coverage of WellNest.</p></section><section class="reveal"><h2 class="gp-h2">Contact</h2><p class="gp-p">For interviews or further information, see the <a href="/contact">contact page</a> and email with &quot;Press&quot; in the subject line.</p></section></article><section class="gp-cta"><h2 class="gp-cta-heading">Ready when<br/>you are.</h2><div class="cta-row"><a href="/pricing" class="btn-primary"><span>Start free for 30 days</span></a><a href="/chronic-pain-diary" class="btn-secondary">Try a no-signup preview</a><a href="https://apps.apple.com/au/app/wellnest/id6759418128" target="_blank" rel="noopener noreferrer" class="btn-secondary"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"></path></svg>Download on the App Store</a></div><p class="cta-note">30 days free \xB7 No card needed \xB7 Built with care in Australia</p></section><footer class="gp-footer"><div class="gp-footer-inner"><a href="/" class="gp-footer-logo"><img src="/imported/5b8791d9c9-560935dfd_ChatGPTImageFeb82026at07_05_31PM.png" alt="WellNest"/><span>Well<span class="nest">Nest</span></span></a><div><div class="footer-heading">Conditions</div><ul class="footer-links"><li><a href="/symptom-tracker-app">Symptom tracker app</a></li><li><a href="/chronic-illness-tracker">Chronic illness tracker</a></li><li><a href="/chronic-pain-diary">Chronic Pain</a></li><li><a href="/crps-tracker">CRPS</a></li><li><a href="/asthma-tracker">Asthma</a></li><li><a href="/seizure-diary">Epilepsy</a></li><li><a href="/fibromyalgia-tracker">Fibromyalgia</a></li></ul></div><div><div class="footer-heading">Features</div><ul class="footer-links"><li><a href="/medication-tracker">Medication tracker</a></li><li><a href="/emergency-action-plan">Emergency action plan</a></li><li><a href="/medical-expense-tracker">Medical expense tracker</a></li></ul></div><div><div class="footer-heading">Guides</div><ul class="footer-links"><li><a href="/guides">All guides</a></li><li><a href="/chronic-health-tracker-guide">Choosing a chronic health tracker</a></li><li><a href="/best-chronic-illness-tracker-apps">Best chronic illness tracker apps</a></li><li><a href="/flare-up-diary-guide">Chronic illness flare-up diary guide</a></li><li><a href="/symptom-diary-guide">Symptom diary guide</a></li><li><a href="/appointment-prep-checklist">Appointment prep checklist</a></li><li><a href="/asthma-action-plan-guide">Asthma action plans</a></li><li><a href="/seizure-first-aid-and-diary">Seizure first aid &amp; diary</a></li><li><a href="/crps-symptoms-guide">CRPS symptoms guide</a></li><li><a href="/wellnest-vs-bearable">WellNest vs Bearable</a></li><li><a href="/wellnest-vs-manage-my-pain">WellNest vs Manage My Pain</a></li><li><a href="/wellnest-vs-careclinic">WellNest vs CareClinic</a></li><li><a href="/free-tools">All free tools</a></li><li><a href="/free-medication-list">Free printable medication list</a></li><li><a href="/free-symptom-summary-maker">Free appointment summary maker</a></li><li><a href="/pain-scale-chart">Printable pain scale chart</a></li><li><a href="/how-to-describe-pain-to-your-doctor">How to describe pain to your doctor</a></li><li><a href="/chronic-pain-diary">Try the interactive preview</a></li></ul></div><div><div class="footer-heading">Company</div><ul class="footer-links"><li><a href="/about">About WellNest</a></li><li><a href="/for-clinicians">For clinicians</a></li><li><a href="/contact">Contact</a></li><li><a href="/press">Press</a></li></ul><a class="footer-store" href="https://apps.apple.com/au/app/wellnest/id6759418128" target="_blank" rel="noopener noreferrer"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"></path></svg>App Store</a></div><ul class="footer-links footer-links-row"><li><a href="/pricing">Pricing</a></li><li><a href="/privacypolicy">Privacy Policy</a></li><li><a href="/termsofservice">Terms of Service</a></li></ul></div><p class="gp-disclaimer">WellNest is a record-keeping tool. It does not diagnose, treat or monitor any condition and is not an emergency service. In an emergency call 000.</p><p class="gp-copy">\xA9 2026 WellNest. Built with care in Australia.</p></footer></div></div>
    <noscript><style>.reveal{opacity:1!important;transform:none!important}</style><p>Interactive tracking, printable tools and checkout require JavaScript.</p></noscript>
  </body>
</html>
`;
function wellnestProductFacts(request, url) {
  const headers = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=0, must-revalidate" };
  if (url.hostname.endsWith(".workers.dev")) headers["X-Robots-Tag"] = "noindex";
  return new Response(request.method === "HEAD" ? null : WELLNEST_PRODUCT_FACTS_HTML, { headers });
}
__name(wellnestProductFacts, "wellnestProductFacts");
__name2(wellnestProductFacts, "wellnestProductFacts");
__name22(wellnestProductFacts, "wellnestProductFacts");
__name222(wellnestProductFacts, "wellnestProductFacts");
__name2222(wellnestProductFacts, "wellnestProductFacts");
function routineSyncSource(source) {
  if (source.includes("function WnRoutineSyncButton(")) return source;
  for (const [before, after] of [["function We({data:e,onSelectSection:t,onOpenModal:n,onToggleMedSlot:r})", "function We({data:e,onSelectSection:t,onOpenModal:n,onToggleMedSlot:r,onSyncRoutine:wnSyncRoutine})"], ["` DAILY CARE ROUTINE`]})}),(0,$.jsxs)(`div`,{className:`db-routine-panel`", "` DAILY CARE ROUTINE`]})}),(0,$.jsx)(WnRoutineSyncButton,{onSync:wnSyncRoutine}),(0,$.jsxs)(`div`,{className:`db-routine-panel`"], ["jsx)(We,{data:a,onSelectSection:i,onOpenModal:e=>p({kind:e,initialData:null}),onToggleMedSlot:re})", "jsx)(We,{data:a,onSelectSection:i,onOpenModal:e=>p({kind:e,initialData:null}),onToggleMedSlot:re,onSyncRoutine:async()=>{const tracker=wnTrackerSync.current;if(!tracker)throw Error(`Sign in and wait for your account to load, then try again.`);await tracker.sync();w();}})"]]) source = source.split(before).join(after);
  return source + "\nfunction WnRoutineSyncButton({onSync}) {\n const [busy,setBusy]=K.useState(false),[message,setMessage]=K.useState(''),[failed,setFailed]=K.useState(false),lock=K.useRef(false);\n async function run(){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');setFailed(false);\n try{await onSync();setMessage('Account records synced.');}\n catch(error){setFailed(true);setMessage(error?.message||'Could not sync. Please try again.');}\n finally{lock.current=false;setBusy(false);}\n }\n return (0,$.jsxs)('div',{style:{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,flexWrap:'wrap'},children:[\n (0,$.jsx)('button',{type:'button',onClick:run,disabled:busy,'aria-label':'Sync daily care routine with your WellNest account','aria-busy':busy,title:'Upload pending changes and refresh from your WellNest account',style:{border:'1px solid currentColor',borderRadius:999,padding:'5px 10px',fontSize:12,fontWeight:700,background:'transparent',color:'inherit',cursor:busy?'wait':'pointer',minHeight:32},children:busy?'Syncing\u2026':'\u21BB Sync'}),\n message&&(0,$.jsx)('span',{role:failed?'alert':'status',style:{fontSize:12,lineHeight:1.4},children:message})\n ]});\n}\n";
}
__name(routineSyncSource, "routineSyncSource");
__name2(routineSyncSource, "routineSyncSource");
__name22(routineSyncSource, "routineSyncSource");
__name222(routineSyncSource, "routineSyncSource");
async function routineSyncResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200) return response;
  const dashboard = path === "/assets/dashboardbeta-calendar-20261107-wn2.js", entry = path === "/assets/index-calendar-20261107-wn2.js";
  if (!dashboard && !entry) return response;
  const text = await response.text(), next = dashboard ? routineSyncSource(text).split('(0,$.jsx)(`div`,{children:(0,$.jsxs)(`button`,{type:`button`,className:`db-tag db-widget-title`,onClick:()=>t(`meds`),"aria-label":`Daily Care Routine \u2014 open Medications`,children:[(0,$.jsx)(g,{size:14}),` DAILY CARE ROUTINE`]})}),(0,$.jsx)(WnRoutineSyncButton,{onSync:wnSyncRoutine})').join('(0,$.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:12,flexWrap:`wrap`,width:`100%`},children:[(0,$.jsxs)(`button`,{type:`button`,className:`db-tag db-widget-title`,onClick:()=>t(`meds`),"aria-label":`Daily Care Routine \u2014 open Medications`,style:{margin:0},children:[(0,$.jsx)(g,{size:14}),` DAILY CARE ROUTINE`]}),(0,$.jsx)(WnRoutineSyncButton,{onSync:wnSyncRoutine})]})') : text.split("dashboardbeta-calendar-20261107-wn2.js?settings=20261112").join("dashboardbeta-calendar-20261107-wn2.js?settings=20261112&routine=20261112-header");
  const out = new Response(next, response);
  out.headers.delete("ETag");
  out.headers.delete("Content-Length");
  out.headers.set("Cache-Control", "no-cache");
  return out;
}
__name(routineSyncResponse, "routineSyncResponse");
__name2(routineSyncResponse, "routineSyncResponse");
__name22(routineSyncResponse, "routineSyncResponse");
__name222(routineSyncResponse, "routineSyncResponse");
function accountSyncSource(source) {
  if (source.includes("function WnAccountSyncButton(")) return source;
  for (const [before, after] of [["sync:()=>(i=i.catch(()=>{}).then(s),i)}}", "sync:()=>(i=i.catch(()=>{}).then(s),i),syncAll:task=>(i=i.catch(()=>{}).then(s).then(task),i)}}"], ["onExportBackup:p,onBack:m}){return", "onExportBackup:p,onBack:m,onSyncAll:wnSyncAll}){return"], ["children:l?`Disable cloud backup`:`Enable cloud backup`})]})]})]})", "children:l?`Disable cloud backup`:`Enable cloud backup`})]}),(0,$.jsx)(WnAccountSyncButton,{onSync:wnSyncAll,enabled:l&&!!e?.id,email:e?.email})]})]})"], ["onToggleCloudBackup:B,onExportBackup:V,onBack:()=>i(`dashboard`)})", "onToggleCloudBackup:B,onExportBackup:V,onBack:()=>i(`dashboard`),onSyncAll:async()=>{const stamp=await wnSyncAllAccountData({client:D,storage:localStorage,tracker:wnTrackerSync.current,user:s,keys:q,merge:Ne});w();return stamp;}})"]]) source = source.split(before).join(after);
  return source + "\nasync function wnSyncAllAccountData({client,storage,tracker,user,keys,merge}) {\n if(!user?.id)throw Error('Sign in to your WellNest account first.');\n if(!tracker?.syncAll)throw Error('Your account is still loading. Please try again shortly.');\n if(storage.getItem('wn-cloud-sync-enabled')!=='1')throw Error('Enable cloud backup before syncing.');\n return tracker.syncAll(async()=>{\n  const rows=await client.entities.CloudDataBackup.filter({backup_key:'wellnest-local-data',created_by_id:user.id},'-updated_date',100);\n  if(!Array.isArray(rows))throw Error('Your account backup could not be read.');\n  const row=rows.find(r=>r.created_by_id===user.id);\n  if(!row?.id)throw Error('Your account backup is not ready. Please retry.');\n  const data={...row.data,local_data:{...row.data?.local_data}},initial={},writes={};\n  for(const name of ['settings','emergency','asthmaPlan','emergCheck','hospBag','refReminders','refTips','achievements']){\n   if(!keys[name])continue;const raw=storage.getItem(keys[name]);initial[name]=raw;\n   let local=null;if(raw!==null){try{local=JSON.parse(raw);}catch{throw Error('A local record could not be read. Download a backup and contact support.');}}\n   const remote=data.local_data[name];const combined=local===null?remote:remote===undefined?local:merge(remote,local);\n   if(combined!==undefined){data.local_data[name]=combined;writes[name]=JSON.stringify(combined);}\n  }\n  const stamp=new Date().toISOString();data.saved_at=stamp;\n  await client.entities.CloudDataBackup.update(row.id,{backup_key:'wellnest-local-data',enabled:true,last_synced_at:stamp,data});\n  const verified=await client.entities.CloudDataBackup.filter({backup_key:'wellnest-local-data',created_by_id:user.id},'-updated_date',100);\n  if(!Array.isArray(verified)||!verified.some(r=>r.id===row.id&&r.created_by_id===user.id&&r.data?.saved_at===stamp))throw Error('Backup sent, but confirmation is pending. Please retry.');\n  for(const [name,value] of Object.entries(writes))if(storage.getItem(keys[name])===initial[name])storage.setItem(keys[name],value);\n  storage.setItem('wn-cloud-last-synced-at',stamp);return stamp;\n });\n}\nfunction WnAccountSyncButton({onSync,enabled,email}) {\n const [busy,setBusy]=K.useState(false),[message,setMessage]=K.useState(''),[failed,setFailed]=K.useState(false),lock=K.useRef(false);\n async function run(){if(lock.current||!enabled)return;lock.current=true;setBusy(true);setFailed(false);setMessage('');\n try{const stamp=await onSync();setMessage('Account backup synced at '+new Date(stamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})+'.');}\n catch(error){setFailed(true);setMessage(error?.message||'Could not sync. Please retry.');}\n finally{lock.current=false;setBusy(false);}\n }\n return (0,$.jsxs)('div',{style:{display:'grid',gap:10,marginTop:16},children:[\n (0,$.jsx)('p',{style:{fontSize:13,margin:0,lineHeight:1.5},children:'Sync health records and backup settings'+(email?' for '+email:'')+'. This uses your WellNest account, including Google sign-in. Files and billing use their existing account storage.'}),\n (0,$.jsx)('button',{type:'button',className:'db-btn-lime',onClick:run,disabled:busy||!enabled,'aria-busy':busy,style:{justifySelf:'start',minHeight:36,padding:'7px 14px',fontSize:13},children:busy?'Syncing account\u2026':'\u21BB Sync account data'}),\n !enabled&&(0,$.jsx)('span',{style:{fontSize:12},children:'Sign in and enable cloud backup to sync.'}),\n message&&(0,$.jsx)('span',{role:failed?'alert':'status',style:{fontSize:12,lineHeight:1.5},children:message})\n ]});\n}\n";
}
__name(accountSyncSource, "accountSyncSource");
__name2(accountSyncSource, "accountSyncSource");
async function accountSyncResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200) return response;
  const dashboard = path === "/assets/dashboardbeta-calendar-20261107-wn2.js", entry = path === "/assets/index-calendar-20261107-wn2.js";
  if (!dashboard && !entry) return response;
  const text = await response.text(), next = dashboard ? accountSyncSource(text) : text.split("&routine=20261112-header").join("&routine=20261112-header&accountsync=20261112");
  const out = new Response(next, response);
  out.headers.delete("ETag");
  out.headers.delete("Content-Length");
  out.headers.set("Cache-Control", "no-cache");
  return out;
}
__name(accountSyncResponse, "accountSyncResponse");
__name2(accountSyncResponse, "accountSyncResponse");
function mergeDoseState(current, incoming, operations = []) {
  const deleted = new Set(Array.isArray(current?.trackerDeleted?.medlog) ? current.trackerDeleted.medlog : []);
  const days = /* @__PURE__ */ Object.create(null);
  for (const log of [current?.medlog, incoming?.medlog]) {
    if (!log || typeof log !== "object" || Array.isArray(log)) continue;
    for (const [date, tokens] of Object.entries(log)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Array.isArray(tokens)) continue;
      const set = days[date] ||= /* @__PURE__ */ new Set();
      for (const token of tokens) if (typeof token === "string" && token.length <= 500 && !deleted.has(JSON.stringify([date, token]))) set.add(token);
    }
  }
  for (const op of operations) {
    if (!op || !/^\d{4}-\d{2}-\d{2}$/.test(op.date) || typeof op.token !== "string" || op.token.length > 500 || typeof op.taken !== "boolean") throw Object.assign(Error("Invalid dose change"), { status: 400 });
    const id = JSON.stringify([op.date, op.token]), set = days[op.date] ||= /* @__PURE__ */ new Set();
    const wasTaken = Array.isArray(current?.medlog?.[op.date]) && current.medlog[op.date].includes(op.token);
    if (typeof op.baseTaken === 'boolean' ? wasTaken !== op.baseTaken && wasTaken !== op.taken : !op.taken) throw Object.assign(Error('Dose changed on another device. Refresh before changing this dose.'), {status:409});
    if (op.taken) {
      deleted.delete(id);
      set.add(op.token);
    } else {
      deleted.add(id);
      set.delete(op.token);
    }
  }
  return { medlog: Object.fromEntries(Object.entries(days).sort().map(([date, set]) => [date, [...set].sort()])), deleted: [...deleted].sort() };
}
__name(mergeDoseState, "mergeDoseState");
async function handleMedicationBackup(request, env, user, id) {
  const input = await body(request);
  for (const key of META) delete input[key];
  if (input.backup_key && input.backup_key !== "wellnest-local-data") {
    if(id){const row=await env.DB.prepare("SELECT * FROM records WHERE entity = 'CloudDataBackup' AND id = ? AND owner_id = ?").bind(id,user.id).first();if(row && JSON.parse(row.data).backup_key === 'wellnest-local-data')return fail(400,'Account backup key cannot be changed.');}
    return null;
  }
  const trackerOps = input._tracker_ops || [], protocol = input._sync_protocol;
  delete input._tracker_ops; delete input._sync_protocol;
  const operations = input._dose_ops || [];
  delete input._dose_ops;
  if (!Array.isArray(operations) || operations.length > 2e3) return fail(400, "Invalid dose changes");
  if (!input.data || typeof input.data !== "object" || Array.isArray(input.data) || !input.data.local_data || typeof input.data.local_data !== "object" || Array.isArray(input.data.local_data)) {
    if (id) { const row = await env.DB.prepare("SELECT * FROM records WHERE entity = 'CloudDataBackup' AND id = ? AND owner_id = ?").bind(id,user.id).first(); if(row && JSON.parse(row.data).backup_key !== 'wellnest-local-data')return null; }
    return fail(400, 'Account sync requires a complete local_data object.');
  }
  for (let attempt = 0; attempt < 6; attempt++) {
    const row2 = id ? await env.DB.prepare("SELECT * FROM records WHERE entity = 'CloudDataBackup' AND id = ? AND owner_id = ?").bind(id, user.id).first() : await env.DB.prepare("SELECT * FROM records WHERE entity = 'CloudDataBackup' AND owner_id = ? AND json_extract(data, '$.backup_key') = 'wellnest-local-data' ORDER BY updated_date DESC, id LIMIT 1").bind(user.id).first();
    if (id && !row2) return fail(404, "Record not found");
    const existing = row2 ? JSON.parse(row2.data) : {};
    if (row2 && existing.backup_key !== "wellnest-local-data") return null;
    let merged;
    try { merged = mergeAccountRecords(existing.data?.local_data || {}, input.data.local_data, trackerOps, protocol, Number.isSafeInteger(input.data.sync_revision) && input.data.sync_revision === existing.data?.sync_revision); }
    catch(error) { if(error.status === 409 || error.status === 400) return fail(error.status,error.message); throw error; }
    let state;try { state = mergeDoseState(existing.data?.local_data || {}, merged, operations); } catch(error) { if(error.status)return fail(error.status,error.message);throw error; }
    const patch = { ...input, data: { ...input.data, sync_revision: (existing.data?.sync_revision || 0) + 1, local_data: { ...merged, medlog: state.medlog, trackerDeleted: { ...merged.trackerDeleted, medlog: state.deleted } } } };
    const time = now();
    let saved;
    if (row2) {
      saved = await env.DB.prepare("UPDATE records SET data = json_patch(data, ?), updated_date = ? WHERE entity = 'CloudDataBackup' AND id = ? AND owner_id = ? AND data = ? RETURNING *").bind(JSON.stringify(patch), time, row2.id, user.id, row2.data).first();
    } else {
      saved = await env.DB.prepare("INSERT INTO records (entity,id,owner_id,created_date,updated_date,data) SELECT 'CloudDataBackup',?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM records WHERE entity = 'CloudDataBackup' AND owner_id = ? AND json_extract(data, '$.backup_key') = 'wellnest-local-data') RETURNING *").bind(uuid(), user.id, time, time, JSON.stringify(patch), user.id).first();
    }
    if (saved) return json(serialize(saved, user), row2 ? 200 : 201);
  }
  return fail(409, "Your account changed during sync. Please retry.");
}
__name(handleMedicationBackup, "handleMedicationBackup");
function doseSyncSource(source) {
  if (source.includes("n._dose_ops=i.filter")) return source;
  for (const [before, after] of [["s?.id?await e.entities.CloudDataBackup.update(s.id,n):await e.entities.CloudDataBackup.create(n)", "n._dose_ops=i.filter(op=>op.key===`medlog`).map(op=>({date:op.entry.date,token:op.entry.token,taken:!op.deleted}));const saved=s?.id?await e.entities.CloudDataBackup.update(s.id,n):await e.entities.CloudDataBackup.create(n);if(saved?.data?.local_data?.medlog){d.medlog=saved.data.local_data.medlog;d.trackerDeleted={...d.trackerDeleted,medlog:saved.data.local_data.trackerDeleted?.medlog||[]}}"], ["return window.addEventListener(`wn-tracker-change`,i),window.addEventListener(`online`,r),window.addEventListener(`focus`,r),r(),()=>{n=!1,wnTrackerSync.current===e", "const dosePoll=window.setInterval(()=>{if(document.visibilityState===`visible`)r()},30000);return window.addEventListener(`wn-tracker-change`,i),window.addEventListener(`online`,r),window.addEventListener(`focus`,r),r(),()=>{window.clearInterval(dosePoll);n=!1,wnTrackerSync.current===e"]]) source = source.split(before).join(after);
  return source;
}
__name(doseSyncSource, "doseSyncSource");
async function doseSyncResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200) return response;
  const dashboard = path === "/assets/dashboardbeta-calendar-20261107-wn2.js", entry = path === "/assets/index-calendar-20261107-wn2.js";
  if (!dashboard && !entry) return response;
  const text = await response.text(), next = dashboard ? doseSyncSource(text) : text.split("&accountsync=20261112").join("&accountsync=20261112&dosemerge=20261112");
  const out = new Response(next, response);
  out.headers.delete("ETag");
  out.headers.delete("Content-Length");
  out.headers.set("Cache-Control", "no-cache");
  return out;
}
__name(doseSyncResponse, "doseSyncResponse");
export {
  cleanAddress,
  worker_default as default,
  handleMedicationBackup,
  mergeDoseState
};
//# sourceMappingURL=worker.js.map

const SYNC_COLLECTIONS = ['pain','asthma','ep','meds','appts','contacts','exercises','reflection'];
const SYNC_SINGLETONS = ['emergency','settings','asthmaPlan','emergCheck','hospBag'];
function syncSame(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&syncSame(a[k],b[k]));
}
function syncMergeFields(base,remote,local){
 if(syncSame(local,base))return remote;
 if(syncSame(remote,base)||syncSame(local,remote))return local;
 if(base&&remote&&local&&typeof base==='object'&&typeof remote==='object'&&typeof local==='object'&&![base,remote,local].some(Array.isArray)){
  const out=Object.create(null);
  for(const key of new Set([...Object.keys(base),...Object.keys(remote),...Object.keys(local)])){
   if(['_u','updated_at','updated_date','updatedAt'].includes(key)){out[key]=Date.parse(local[key])>Date.parse(remote[key])?local[key]:remote[key];continue;}
   const value=syncMergeFields(base[key],remote[key],local[key]);if(value!==undefined)out[key]=value;
  }
  return out;
 }
 throw Object.assign(Error('A record changed on another device. Review the latest record before retrying.'),{status:409});
}
function mergeAccountRecords(current,incoming,operations=[],protocol=0,revisionMatches=false){
 const data={...current,...incoming},deleted={...current.trackerDeleted,...incoming.trackerDeleted};
 const recordId=r=>r&&typeof r==='object'?(r.id??r.legacy_id??r.uuid):null;
 if(!Array.isArray(operations)||operations.length>2000)throw Object.assign(Error('Invalid record changes'),{status:400});
 for(const op of operations)if(!op||![...SYNC_COLLECTIONS,...SYNC_SINGLETONS].includes(op.key)||!op.entry||recordId(op.entry)==null||typeof op.deleted!=='boolean')throw Object.assign(Error('Invalid record change'),{status:400});
 const collapsed=new Map();
 for(const op of operations){const key=JSON.stringify([op.key,String(recordId(op.entry))]);const first=collapsed.get(key);collapsed.set(key,first?{...op,base:first.base}:op);}
 operations=[...collapsed.values()];
 for(const key of [...SYNC_COLLECTIONS,...SYNC_SINGLETONS]){
  const singleton=SYNC_SINGLETONS.includes(key);
  if(!(key in current)&&!(key in incoming)&&!operations.some(op=>op.key===key))continue;
  const wrap=value=>singleton?(value&&typeof value==='object'&&!Array.isArray(value)?[{id:'$singleton',value}]:[]):Array.isArray(value)?value:[];
  const tombstones=new Set(Array.isArray(current.trackerDeleted?.[key])?current.trackerDeleted[key].map(String):[]),records=new Map(),unkeyed=[];
  for(const record of wrap(current[key])){const id=recordId(record);if(id==null)unkeyed.push(record);else if(!tombstones.has(String(id)))records.set(String(id),record);}
  for(const record of wrap(incoming[key])){
   const id=recordId(record);if(id==null){if(!unkeyed.some(x=>syncSame(x,record)))unkeyed.push(record);continue;}
   const uid=String(id);if(tombstones.has(uid))continue;
   if(!records.has(uid))records.set(uid,record);
   else if(protocol!==2&&protocol!==3&&!syncSame(records.get(uid),record)){if(!revisionMatches)throw Object.assign(Error('This device has an outdated account backup. Refresh before saving changes.'),{status:409});records.set(uid,record);}
  }
  for(const op of operations.filter(op=>op.key===key)){
   const uid=String(recordId(op.entry)),remote=records.get(uid),base=op.base??null;
   if(op.deleted){
    if(remote&&!syncSame(remote,base))throw Object.assign(Error('This record was edited on another device. Review it before deleting.'),{status:409});
    records.delete(uid);tombstones.add(uid);
   }else{
    if(tombstones.has(uid))throw Object.assign(Error('This record was deleted on another device.'),{status:409});
    const merged=syncMergeFields(base,remote??null,op.entry);
    tombstones.delete(uid);if(merged)records.set(uid,merged);
   }
  }
  const list=[...records.values(),...unkeyed];data[key]=singleton?(list.find(r=>r.id==='$singleton')?.value||{}):list;
  deleted[key]=[...tombstones];
 }
 data.trackerDeleted=deleted;return data;
}


function accountRecordSource(source){
 if(source.includes('n._tracker_ops=i.filter'))return source;
 for(const [before,after] of [["exercises:`wn-exercises`,medlog:`wn-medlog`},wnTrackerSync","exercises:`wn-exercises`,medlog:`wn-medlog`,emergency:`wn-emergency`,settings:`wn-settings`,asthmaPlan:`wn-asthma-plan`,emergCheck:`wn-emerg-check`,hospBag:`wn-hosp-bag`},wnTrackerSync"],["_e=(e,t)=>e===`medlog`?","_e=(e,t)=>[`emergency`,`settings`,`asthmaPlan`,`emergCheck`,`hospBag`].includes(e)?t&&typeof t===`object`&&!Array.isArray(t)?[{id:`$singleton`,value:t}]:[]:e===`medlog`?"],["ve=(e,t)=>e===`medlog`?","ve=(e,t)=>[`emergency`,`settings`,`asthmaPlan`,`emergCheck`,`hospBag`].includes(e)?t.find(x=>x.id===`$singleton`)?.value||{}:e===`medlog`?"],["function o(e,n,i=!1){if(!Object.hasOwn(G,e))","function o(e,n,i=!1,base){if(!Object.hasOwn(G,e))"],["c.push({key:e,entry:n,deleted:i})","c.push({key:e,entry:n,deleted:i,base:base===undefined?o.find(x=>x.id===n.id)||null:base})"],["||e.change(i,t);for(let t of o)a.some(e=>e.id===t.id)||e.change(i,t,!0);","||e.change(i,t,!1,o.find(x=>x.id===t.id)||null);for(let t of o)a.some(e=>e.id===t.id)||e.change(i,t,!0,t);"],["n._dose_ops=i.filter","n._sync_protocol=2;n._tracker_ops=i.filter(op=>op.key!==`medlog`);n._dose_ops=i.filter"],["if(saved?.data?.local_data?.medlog){d.medlog=saved.data.local_data.medlog;d.trackerDeleted={...d.trackerDeleted,medlog:saved.data.local_data.trackerDeleted?.medlog||[]}}","if(saved?.data?.local_data){for(const key of Object.keys(G))if(Object.hasOwn(saved.data.local_data,key))d[key]=saved.data.local_data[key];d.trackerDeleted=saved.data.local_data.trackerDeleted||{}}"],["{backup_key:'wellnest-local-data',enabled:true,last_synced_at:stamp,data}","{backup_key:'wellnest-local-data',enabled:true,last_synced_at:stamp,_sync_protocol:2,_tracker_ops:[],data}"],["function o(e,n,i=!1,base){","let wnBaseline=null;function o(e,n,i=!1,base){"],["let f=ye(t.getItem(r),[]).slice(i.length);t.setItem(r,JSON.stringify(f));","wnBaseline=Object.fromEntries(Object.keys(G).map(key=>[key,_e(key,d[key])]));let f=ye(t.getItem(r),[]).slice(i.length);for(const op of f){const sent=[...i].reverse().find(x=>x.key===op.key&&x.entry.id===op.entry.id);if(sent&&op.key!==`medlog`)op.base=sent.deleted?null:sent.entry;}t.setItem(r,JSON.stringify(f));"],["return{read:a,change:o,sync:","return{read:a,baseline:()=>wnBaseline||a(),change:o,sync:"],["o=t[i]||[];for(let t of a)","o=e.baseline()[i]||[];for(let t of a)"]])source=source.split(before).join(after);
 return source;
}
async function accountRecordResponse(request,response,path){
 if(request.method!=='GET'||response.status!==200)return response;
 const dashboard=path==='/assets/dashboardbeta-calendar-20261107-wn2.js',entry=path==='/assets/index-calendar-20261107-wn2.js';if(!dashboard&&!entry)return response;
 const text=await response.text(),next=dashboard?safeSyncSource(accountRecordSource(text)):text.split('&dosemerge=20261112').join('&dosemerge=20261112&recordmerge=20261112&safe=3');
 const out=new Response(next,response);out.headers.delete('ETag');out.headers.delete('Content-Length');out.headers.set('Cache-Control','no-cache');return out;
}

export {mergeAccountRecords,syncMergeFields};


function safeSyncSource(source){if(source.includes("baseTaken:!!op.base"))return source;for(const [before,after] of [["function Z(e,t){localStorage.setItem(e,JSON.stringify(t)),window.dispatchEvent(new CustomEvent(`wn-tracker-change`,{detail:{key:e}}))}", "function Z(e,t){const previous=localStorage.getItem(e);localStorage.setItem(e,JSON.stringify(t)),window.dispatchEvent(new CustomEvent(`wn-tracker-change`,{detail:{key:e,previous}}))}"], ["function Q(e,t){localStorage.setItem(e,JSON.stringify(t)),window.dispatchEvent(new CustomEvent(`wn-tracker-change`,{detail:{key:e}}))}", "function Q(e,t){const previous=localStorage.getItem(e);localStorage.setItem(e,JSON.stringify(t)),window.dispatchEvent(new CustomEvent(`wn-tracker-change`,{detail:{key:e,previous}}))}"], ["o=e.baseline()[i]||[]", "o=Object.hasOwn(n.detail||{},`previous`)?_e(i,ye(n.detail.previous,i===`medlog`?{}:[])):t[i]||[]"], ["token:op.entry.token,taken:!op.deleted", "token:op.entry.token,taken:!op.deleted,baseTaken:!!op.base"]])source=source.split(before).join(after);return source;}

const WELLNEST_ICON_DATA = {"favicon.ico": "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A/9gdAP/X3MD/15yA/9ecQT/XnAE/11vA/9cbgP/W2wD/1prA/9aawP/WmoE/1lpA/9YaAP/V2cD/1ZmA/9WZgP/VWQD/1NiAv9QXgL/UmAD/42XEP/j6Cj/+P8z//X/Nv/n9TX/nKwe/1NgBf9KVwH/TVoC/01ZAv9MWAL/TFgC/0tYAv9LVwL/SlYC/0pVAf9JVAH/SFMC/0dSAf9FTgD/RE4A/0ZgDf9FWwr/RlAA/0dRAf9GUAH/RU4B/2F2A/9hdQT/YHQE/19zBP9fcwP/X3ID/11wA/9cbwP/XG4D/1xtA/9bbQP/WmwD/1pqA/9ZaQP/WGgD/1doA/9XZwP/VmYD/1RkA/9TYwP/UmAC/05dAv9vfQv/uMMg/8LPJf+CkBP/TVwC/0xaAf9OWwL/TlsC/05aAv9NWQL/TFgC/0tXAv9LVwL/S1cC/0tWAv9JVAH/SVQC/0lTAv9HUwH/R1IB/0dRAf9HUQH/R1EB/0dRAf9GUAH/RU8B/2J4BP9idwT/YXcE/2F2BP9gdQT/X3MD/15yA/9ecQP/XXAD/1xvA/9cbgP/W20D/1tsA/9aawP/WWkD/1hoA/9XaAP/V2cD/1ZlA/9VZAP/VGMD/1JhA/9PXgL/UWAD/1JhBP9NXAL/T14C/09dAv9PXAL/T1wC/05bAv9NWgL/TVkC/0xYAf9LVwH/S1cC/0tXAv9KVQL/SlUB/0pVAf9IUwH/SFMB/0hTAf9HUgH/R1IB/0dRAf9GUAH/RE8B/2N6A/9jeQT/Y3kE/2J4BP9hdwT/YHUD/19zA/9ecgP/XnED/11wA/9dbwP/XG8D/1xuBP9bbQP/WmsD/1lqA/9YaQP/WGgD/1dnA/9WZgP/VWQC/1RjA/9TYgP/UmED/1FgAv9SYAP/UmAD/1FfAv9RXgL/T10C/09bAv9PWwL/TloC/01aAv9MWQL/TFgC/0xXAf9LVwH/S1cC/0tWAv9JVQH/SVQB/0hTAf9IUwH/SFMB/0dRAf9GUQH/RVAB/2R8A/9kfAT/ZHsE/2N6BP9ieAT/YXcE/2B2BP9gdAT/X3ME/15yA/9ecQP/XnED/11wA/9cbwP/XG4E/1tsBP9ZagP/WGkD/1hoA/9XZwP/VmYD/1VlA/9VZAP/VGMD/1RjA/9TYgP/U2ED/1JhA/9RXwL/UF4C/1BdAv9PXAL/T1wC/05bAv9NWgL/TVkC/0xYAf9MWAH/TFgB/0tXAv9KVgL/SlUB/0lUAf9JVAH/SFMB/0hSAf9HUgH/RVAB/2R9A/9lfgT/ZX0E/2R8BP9jegT/YnkE/2J4BP9hdgT/YHUE/190BP9fcwP/X3MD/15yBP9dcAT/XG8E/1tuA/9bbAP/WmsD/1lqA/9YaAP/V2cD/1dmA/9WZgP/VWUD/1VlA/9VZAP/VGMD/1RiA/9TYQP/UmAC/1FeAv9QXQL/T1wC/05bAv9OWwL/TloC/01ZAv9MWAH/TFgB/0tXAf9KVgH/SlYB/0pVAf9JVAH/SVQB/0hTAf9HUgH/RlEB/2V/A/9mfwT/Zn8E/2V9BP9lfQT/ZHsE/2N6BP9ieQT/YXcD/2B2BP9fdAT/X3QD/19zBP9ecgT/XXAE/1xvA/9cbgP/W20D/1prA/9ZagP/WGkD/1hoA/9YZwP/VmYD/1ZmA/9VZQP/VWUC/1VkA/9UYgP/UmAC/1FfAv9RXwL/UF4C/09dAv9PXAL/TlsC/01aAv9MWAH/TFgB/0xYAv9LVwH/SlcB/0pWAf9KVQH/SVQB/0hTAf9IUwH/RlEB/2iCA/9ngQT/Z4EE/2eABP9mfwT/ZX4E/2V9BP9kewT/YnkE/2F5BP9hdwT/YHYD/2B1A/9fcwT/XnIE/11xBP9ccAT/XG8D/1tuA/9bbQP/WWsD/1lqA/9ZagP/WGkD/1doA/9WZwP/VWYD/1VkA/9VZAP/U2IC/1JhAv9SYQP/UV8C/1BfAv9QXgL/T10C/05cAv9OWgL/TVkC/01ZAv9LWAH/S1gB/0tXAf9LVgH/SlUB/0lUAf9IUwH/R1IB/2mEA/9ohAT/aIME/2iCBP9ngAT/Zn8E/2V+BP9lfQT/Y3sE/2J6BP9ieQT/YXgD/2F3BP9gdQP/X3QE/19zBP9ecgT/XXEE/11wA/9cbgP/W20D/1psA/9abAP/WWsD/1hpA/9YaQP/VmcD/1VmA/9VZQP/VGQD/1NjA/9TYgP/UWEC/1FgAv9QXwL/UF4C/09eAv9PXQL/TlwC/01bAv9NWgL/TFkB/0tXAf9KVgH/SlYB/0pVAf9JVAH/R1MB/2mFA/9phAT/aIME/2iDBP9oggT/Z4EE/2Z/BP9lfgT/ZH0E/2N7BP9jegT/YnkE/2J5BP9hdwT/X3UE/190BP9ecwT/XnIE/11x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EP/8+hb/wcMU/2JsB/9WYgX/p7Mg/+f3PP/n/UP/sccx/11rC/9KZhr/Ych//2X5qP9e/6D/VfaJ/1LzeP9N0FT/RFcG/0ZPAf9FTgH/Xm8D/11vA/9dbgP/XG0D/1tsA/9ZagP/WGgD/1hoA/9YZwP/VmQD/1FgAv9aZwP/pqsM//TyGv///yT/3eEk/8/YKP/x/Tn/5fc8/52vI/9TXwb/SFMB/0hSAP9JXA3/Uo0//1e9af9T3Xz/UPSE/03WY/9FWQj/Rk8A/0VPAf9fcgP/X3ED/15wA/9dbwP/XG0D/1tsA/9aagP/WWoD/1hoA/9XZgP/VmUD/1NiA/9SYAL/hpAM/+DjIv/8/zD/+P83/93sM/+Ilxj/TVoD/0tWAf9MVwL/S1YC/0lUAf9HUQD/RlMD/0ZeDv9HgCn/Sp09/0ZXBv9GUAH/RU8B/2F1A/9gdAT/X3ME/15yBP9dcAP/XG4D/1ttA/9aawP/WWoD/1hoA/9XZwP/VmYD/1RjA/9PXgL/a3gJ/7rEIP/Czib/c4IP/0tZAf9NWgL/TVkC/0xYAv9LVwL/S1cC/0pVAf9JVAH/SFIB/0ZPAP9GUgL/R1EB/0dRAf9FTwH/YngE/2J3BP9hdgT/X3QD/15yA/9dcQP/XG8D/1xuA/9bbAP/WmoD/1hpA/9XZwP/VmYD/1RjA/9RYAL/VGME/1RjBP9OXQL/UF0C/09cAv9OWwL/TVkC/0xYAv9LVwL/S1YC/0pWAf9JVQH/SFMB/0hSAf9HUgH/R1EB/0VQAf9kewP/ZHsE/2N5BP9hdwT/YHUE/19zA/9ecQP/XXAD/11vA/9cbQP/WmsD/1hpA/9YaAP/VmYD/1VkA/9UYwP/U2IC/1NhA/9SYAP/UF4C/09cAv9PXAL/TloC/01ZAv9MWAH/TFcB/0tXAv9JVQH/SVQB/0hTAf9HUgH/RlAB/2V+A/9lfgT/ZHwE/2N6BP9ieAT/YHYE/190BP9fcwP/XnIE/11wBP9bbgP/WmwD/1lqA/9YaAP/V2cD/1ZlA/9VZQP/VWQD/1RiA/9SYAL/UV4C/1BdAv9PXAL/TlsC/01ZAv9MWAH/S1cB/0pWAf9KVQH/SVQB/0hTAf9GUgH/Z4ED/2eBBP9mfwT/ZX0E/2R8BP9ieQT/YXcE/2B1BP9fdAT/XnIE/11wBP9cbgP/W20D/1lr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", "icon-512.png": "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", "icon-192.png": "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", "icon-180.png": "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", "icon-48.png": "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"};
// Site-wide icons derived from the owner's supplied AppIcon.png, 12 November 2026.
const WELLNEST_ICON_VERSION = '20261112-appicon';
const wellnestIconUrl = size => `/branding/${WELLNEST_ICON_VERSION}/icon-${size}.png`;
const WELLNEST_ICON_LINKS = `<link rel="icon" type="image/x-icon" href="/branding/${WELLNEST_ICON_VERSION}/favicon.ico"><link rel="icon" type="image/png" sizes="48x48" href="${wellnestIconUrl(48)}"><link rel="icon" type="image/png" sizes="192x192" href="${wellnestIconUrl(192)}"><link rel="apple-touch-icon" sizes="180x180" href="${wellnestIconUrl(180)}"><link rel="manifest" href="/site.webmanifest?v=${WELLNEST_ICON_VERSION}">`;
function wellnestIconResponse(request) {
  if(!['GET','HEAD'].includes(request.method))return null;
  const path=new URL(request.url).pathname;
  const legacy={'/favicon.ico':'favicon.ico','/favicon.svg':'icon-48.png','/apple-touch-icon.png':'icon-180.png','/apple-touch-icon-precomposed.png':'icon-180.png','/wellnest-website/favicon.svg':'icon-48.png'};
  const file=path.startsWith(`/branding/${WELLNEST_ICON_VERSION}/`)?path.split('/').pop():legacy[path];
  if(file&&Object.hasOwn(WELLNEST_ICON_DATA,file)){
    const bytes=Uint8Array.from(atob(WELLNEST_ICON_DATA[file]),c=>c.charCodeAt(0));
    return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':file.endsWith('.ico')?'image/x-icon':'image/png','Content-Length':String(bytes.length),'Cache-Control':legacy[path]?'public, max-age=0, must-revalidate':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
  }
  if(path==='/site.webmanifest')return new Response(request.method==='HEAD'?null:JSON.stringify({id:'/',name:'WellNest',short_name:'WellNest',start_url:'/dashboard',scope:'/',display:'standalone',background_color:'#003f38',theme_color:'#003f38',icons:[192,512].map(size=>({src:wellnestIconUrl(size),sizes:`${size}x${size}`,type:'image/png',purpose:'any'}))}),{headers:{'Content-Type':'application/manifest+json','Cache-Control':'public, max-age=0, must-revalidate'}});
  return null;
}
async function wellnestIconHtml(response) {
  if(!response.headers.get('Content-Type')?.includes('text/html')||!response.body)return response;
  const headers=new Headers(response.headers);headers.delete('ETag');headers.delete('Content-Length');if(!/private|no-store/i.test(headers.get('Cache-Control')||''))headers.set('Cache-Control','no-cache');
  const csp=headers.get('Content-Security-Policy');if(csp){let policy=csp;for(const directive of ['img-src','manifest-src']){const pattern=new RegExp('(?:^|;)\\s*'+directive+'\\s+([^;]+)');const match=policy.match(pattern);if(match){if(!match[1].includes("'self'"))policy=policy.replace(match[0],match[0].replace(match[1],match[1].replace(/'none'/g,'')+" 'self'"));}else policy+='; '+directive+" 'self'";}headers.set('Content-Security-Policy',policy);}
  const html=await response.text();
  const cleaned=html.replace(/<link\b[^>]*>/gi,tag=>{const rel=/\brel\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);return rel&&(rel[1]||rel[2]||rel[3]||'').toLowerCase().split(/\s+/).some(x=>['icon','apple-touch-icon','apple-touch-icon-precomposed','mask-icon','manifest'].includes(x))?'':tag;});
  const branded=/<\/head\s*>/i.test(cleaned)?cleaned.replace(/<\/head\s*>/i,WELLNEST_ICON_LINKS+'</head>'):/<html\b[^>]*>/i.test(cleaned)?cleaned.replace(/<html\b[^>]*>/i,tag=>tag+'<head>'+WELLNEST_ICON_LINKS+'</head>'):'<head>'+WELLNEST_ICON_LINKS+'</head>'+cleaned;
  return new Response(branded,{status:response.status,statusText:response.statusText,headers});
}
const wellnestFetchBeforeIcons=worker_default.fetch;
worker_default.fetch=async function(request,env,ctx){
  const icon=wellnestIconResponse(request);if(icon)return icon;
  return wellnestIconHtml(await wellnestFetchBeforeIcons.call(this,request,env,ctx));
};
export {wellnestIconResponse,WELLNEST_ICON_LINKS};
