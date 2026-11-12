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
var fail = /* @__PURE__ */ __name2222((status, error, extra = {}) => json({ error, msg: error, error_description: error, ...extra }, status), "fail");
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
function b64urlDecode(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
__name(b64urlDecode, "b64urlDecode");
__name2(b64urlDecode, "b64urlDecode");
__name22(b64urlDecode, "b64urlDecode");
__name222(b64urlDecode, "b64urlDecode");
__name2222(b64urlDecode, "b64urlDecode");
var randomToken = /* @__PURE__ */ __name2222((n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n))), "randomToken");
var uuid = /* @__PURE__ */ __name2222(() => crypto.randomUUID(), "uuid");
var now = /* @__PURE__ */ __name2222(() => (/* @__PURE__ */ new Date()).toISOString(), "now");
async function sha256(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256, "sha256");
__name2(sha256, "sha256");
__name22(sha256, "sha256");
__name222(sha256, "sha256");
__name2222(sha256, "sha256");
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
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64url(salt)}$${await pbkdf2(password, salt, PBKDF2_ITER)}`;
}
__name(hashPassword, "hashPassword");
__name2(hashPassword, "hashPassword");
__name22(hashPassword, "hashPassword");
__name222(hashPassword, "hashPassword");
__name2222(hashPassword, "hashPassword");
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
async function hmac(env, purpose, text) {
  return b64url(await crypto.subtle.sign("HMAC", await hmacKey(env, purpose), enc.encode(text)));
}
__name(hmac, "hmac");
__name2(hmac, "hmac");
__name22(hmac, "hmac");
__name222(hmac, "hmac");
__name2222(hmac, "hmac");
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
function emailLayout(title, body2, button, link) {
  const esc = /* @__PURE__ */ __name2222((s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]), "esc");
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
function linkFor(kind, token) {
  return `${SITE}/login#${kind}=${encodeURIComponent(token)}`;
}
__name(linkFor, "linkFor");
__name2(linkFor, "linkFor");
__name22(linkFor, "linkFor");
__name222(linkFor, "linkFor");
__name2222(linkFor, "linkFor");
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
async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const state = await verifyJwt(env, url.searchParams.get("state"));
  const back = /* @__PURE__ */ __name2222((target2, hash) => {
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
var BOTS = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|monitor|curl|wget|python|axios|node-fetch/i;
var DAY = 864e5;
var MAX_SECONDS = 1800;
var clip = /* @__PURE__ */ __name2222((v, n) => typeof v === "string" ? v.slice(0, n) : "", "clip");
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
  const top = /* @__PURE__ */ __name2222((col, limit = 10) => db.prepare(
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
var GH_BASE = "/wellnest-website";
function stripBase(text) {
  return text.split("\\/wellnest-website").join("").split(GH_BASE + "/").join("/").split(GH_BASE).join("");
}
__name(stripBase, "stripBase");
__name2(stripBase, "stripBase");
__name22(stripBase, "stripBase");
__name222(stripBase, "stripBase");
__name2222(stripBase, "stripBase");
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
function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}
__name(b64decode, "b64decode");
__name2(b64decode, "b64decode");
__name22(b64decode, "b64decode");
__name222(b64decode, "b64decode");
__name2222(b64decode, "b64decode");
async function listTree(env) {
  const t = await gh(env, `/git/trees/${BRANCH}?recursive=1`);
  return t.tree.filter((e) => e.type === "blob").map((e) => ({ path: e.path, sha: e.sha, size: e.size }));
}
__name(listTree, "listTree");
__name2(listTree, "listTree");
__name22(listTree, "listTree");
__name222(listTree, "listTree");
__name2222(listTree, "listTree");
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
var PROVIDERS = {
  anthropic: { name: "Claude", key: "ANTHROPIC_API_KEY" },
  openai: { name: "ChatGPT", key: "OPENAI_API_KEY" },
  gemini: { name: "Gemini", key: "GEMINI_API_KEY" },
  cloudflare: { name: "Cloudflare AI", binding: "AI", free: true }
};
var connectedTo = /* @__PURE__ */ __name2222((env, p) => Boolean(PROVIDERS[p].binding ? env[PROVIDERS[p].binding] : env[PROVIDERS[p].key]), "connectedTo");
var CF_MODELS = [
  { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 120B (free)" },
  { id: "@cf/google/gemma-4-26b-a4b-it", name: "Gemma 4 26B (free)" },
  { id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash (free)" }
];
var BUSY = /* @__PURE__ */ new Set([408, 500, 502, 503, 504, 520, 522, 524, 529]);
var RETRY_WAITS = [3e3, 8e3];
var CALL_TIMEOUT = { ms: 12e4 };
var MAX_RATE_WAIT = 2e4;
var sleep = /* @__PURE__ */ __name2222((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
var busyError = /* @__PURE__ */ __name2222((who, other, tries) => Object.assign(new Error(`${who} is overloaded right now \u2014 its servers turned the request away ${tries} times. This usually clears within minutes. Try again shortly, or switch to ${other}or Cloudflare AI.`), { status: 502, retryable: true }), "busyError");
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
function toAnthropic(m) {
  if (!m.images?.length) return { role: m.role, content: m.content };
  return { role: m.role, content: [...m.images.map((i) => ({ type: "image", source: { type: "base64", media_type: i.type, data: i.data } })), { type: "text", text: m.content }] };
}
__name(toAnthropic, "toAnthropic");
__name2(toAnthropic, "toAnthropic");
__name22(toAnthropic, "toAnthropic");
__name222(toAnthropic, "toAnthropic");
__name2222(toAnthropic, "toAnthropic");
function toOpenAI(m) {
  if (!m.images?.length) return { role: m.role, content: m.content };
  return { role: m.role, content: [...m.images.map((i) => ({ type: "image_url", image_url: { url: `data:${i.type};base64,${i.data}` } })), { type: "text", text: m.content }] };
}
__name(toOpenAI, "toOpenAI");
__name2(toOpenAI, "toOpenAI");
__name22(toOpenAI, "toOpenAI");
__name222(toOpenAI, "toOpenAI");
__name2222(toOpenAI, "toOpenAI");
function toGemini(m) {
  return { role: m.role === "assistant" ? "model" : "user", parts: [...(m.images || []).map((i) => ({ inlineData: { mimeType: i.type, data: i.data } })), { text: m.content }] };
}
__name(toGemini, "toGemini");
__name2(toGemini, "toGemini");
__name22(toGemini, "toGemini");
__name222(toGemini, "toGemini");
__name2222(toGemini, "toGemini");
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
function readRequests(text) {
  return [...String(text).matchAll(/^\s*READ:\s*(\S+)\s*$/gm)].map((m) => m[1]);
}
__name(readRequests, "readRequests");
__name2(readRequests, "readRequests");
__name22(readRequests, "readRequests");
__name222(readRequests, "readRequests");
__name2222(readRequests, "readRequests");
function hasEdits(text) {
  return /<<<<<<< (EDIT|CREATE) /.test(text);
}
__name(hasEdits, "hasEdits");
__name2(hasEdits, "hasEdits");
__name22(hasEdits, "hasEdits");
__name222(hasEdits, "hasEdits");
__name2222(hasEdits, "hasEdits");
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
function clearTreeCache() {
  treeCache = null;
}
__name(clearTreeCache, "clearTreeCache");
__name2(clearTreeCache, "clearTreeCache");
__name22(clearTreeCache, "clearTreeCache");
__name222(clearTreeCache, "clearTreeCache");
__name2222(clearTreeCache, "clearTreeCache");
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
function withoutApp(html) {
  return html.replace(/<script\b[^>]*\bsrc=["'][^"']*\/assets\/index[^"']*\.js["'][^>]*>\s*<\/script>/gi, "").replace(/<link\b[^>]*\brel=["']modulepreload["'][^>]*>/gi, "");
}
__name(withoutApp, "withoutApp");
__name2(withoutApp, "withoutApp");
__name22(withoutApp, "withoutApp");
__name222(withoutApp, "withoutApp");
__name2222(withoutApp, "withoutApp");
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
async function row(env, userId) {
  await ensureBilling(env);
  return env.DB.prepare("SELECT * FROM subscriptions WHERE user_id = ?").bind(userId).first();
}
__name(row, "row");
__name2(row, "row");
__name22(row, "row");
__name222(row, "row");
__name2222(row, "row");
function trialEndsAt(user) {
  const created = Date.parse(user?.created_date || "");
  return Number.isFinite(created) ? created + TRIAL_DAYS * DAY2 : 0;
}
__name(trialEndsAt, "trialEndsAt");
__name2(trialEndsAt, "trialEndsAt");
__name22(trialEndsAt, "trialEndsAt");
__name222(trialEndsAt, "trialEndsAt");
__name2222(trialEndsAt, "trialEndsAt");
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
async function setTier(env, userId, tier) {
  await env.DB.prepare("UPDATE users SET data = json_set(data, '$.subscription_tier', ?), updated_date = ? WHERE id = ?").bind(tier, now(), userId).run();
}
__name(setTier, "setTier");
__name2(setTier, "setTier");
__name22(setTier, "setTier");
__name222(setTier, "setTier");
__name2222(setTier, "setTier");
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
function planOfPrice(price) {
  const interval = price?.recurring?.interval;
  return interval === "year" ? "yearly" : "fullaccess";
}
__name(planOfPrice, "planOfPrice");
__name2(planOfPrice, "planOfPrice");
__name22(planOfPrice, "planOfPrice");
__name222(planOfPrice, "planOfPrice");
__name2222(planOfPrice, "planOfPrice");
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
function best(subs) {
  const rank = /* @__PURE__ */ __name2222((s) => (PAID.has(s.status) ? 2 : 0) + (s.status === "active" ? 1 : 0), "rank");
  return [...subs].sort((a, b) => rank(b) - rank(a) || b.created - a.created)[0] || null;
}
__name(best, "best");
__name2(best, "best");
__name22(best, "best");
__name222(best, "best");
__name2222(best, "best");
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
var sqlValue = /* @__PURE__ */ __name2222((v) => typeof v === "boolean" ? v ? 1 : 0 : v, "sqlValue");
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
async function handleEntities(request, env, user, entity, id) {
  if (!ENTITY_RE.test(entity)) return fail(400, "Invalid record type");
  const url = new URL(request.url);
  const m = request.method;
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
function sameAppointment(a, b) {
  return JSON.stringify(appointmentFields(a)) === JSON.stringify(appointmentFields(b));
}
__name(sameAppointment, "sameAppointment");
__name2(sameAppointment, "sameAppointment");
__name22(sameAppointment, "sameAppointment");
__name222(sameAppointment, "sameAppointment");
async function eventId(owner, calendar, id) {
  return sha256(JSON.stringify([owner, calendar, id]));
}
__name(eventId, "eventId");
__name2(eventId, "eventId");
__name22(eventId, "eventId");
__name222(eventId, "eventId");
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
async function reconcile({ owner, calendar, timeZone, appointments, deletedIds, links, events, api: api2 }) {
  const records = new Map(appointments.map((a) => [String(a.id), a]));
  const deleted = new Set(deletedIds.map(String));
  const remote = new Map(events.map((e) => [e.id, e]));
  const next = { ...links };
  const seen = /* @__PURE__ */ new Set();
  let operations = 0, partial = false;
  const deadline = Date.now() + 35e3;
  const available = /* @__PURE__ */ __name222(() => {
    const ready = operations < 100 && Date.now() < deadline;
    if (!ready) partial = true;
    return ready;
  }, "available");
  const call = /* @__PURE__ */ __name222(async (...args) => {
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
async function handleCalendar(request, env) {
  const headers = { "Cache-Control": "private, no-store" };
  const json2 = /* @__PURE__ */ __name222((body2, status = 200) => Response.json(body2, { status, headers }), "json");
  const url = new URL(request.url);
  const action = url.pathname.split("/").pop();
  const clientId = env.GOOGLE_CALENDAR_CLIENT_ID || env.GOOGLE_CLIENT_ID;
  const secret = env.GOOGLE_CALENDAR_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;
  const callback = `${SITE}/api/auth/google/callback`;
  const cookieName = "__Host-wn-calendar";
  const clearCookie = `${cookieName}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`;
  const redirect = /* @__PURE__ */ __name222((status) => new Response(null, { status: 303, headers: { ...headers, Location: `/settings?calendar=${status}`, "Set-Cookie": clearCookie } }), "redirect");
  const methods = { status: "GET", calendars: "GET", connect: "POST", callback: "GET", select: "POST", sync: "POST", disconnect: "DELETE" };
  if (!action || methods[action] !== request.method) return json2({ error: "Method not allowed" }, 405);
  if (!["GET"].includes(request.method) && request.headers.get("Origin") !== url.origin) return json2({ error: "Invalid request origin" }, 403);
  if (!clientId || !secret) return action === "callback" ? redirect("setup-required") : json2({ error: "Google Calendar connection is awaiting setup.", configured: false }, 503);
  const rawKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("wellnest-calendar-v1:" + secret));
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]);
  const seal = /* @__PURE__ */ __name222(async (value) => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(value))));
    return b64url(new Uint8Array([...iv, ...encrypted]));
  }, "seal");
  const open = /* @__PURE__ */ __name222(async (value) => {
    const bytes = b64urlDecode(value);
    return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12))));
  }, "open");
  const google = /* @__PURE__ */ __name222(async (target, options = {}) => {
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
    const api2 = /* @__PURE__ */ __name222(async (path, method = "GET", body2, etag) => {
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
    const calendars = /* @__PURE__ */ __name222(async () => {
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
      api: /* @__PURE__ */ __name222((method, id, body2, etag) => api2(base + (id ? "/" + encodeURIComponent(id) : ""), method, body2, etag), "api")
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
function subscriptionTimeZone(value) {
  if (typeof value !== "string" || value.length > 100) throw new Error("Choose a valid time zone.");
  new Intl.DateTimeFormat("en", { timeZone: value }).format();
  return value;
}
__name(subscriptionTimeZone, "subscriptionTimeZone");
__name2(subscriptionTimeZone, "subscriptionTimeZone");
__name22(subscriptionTimeZone, "subscriptionTimeZone");
__name222(subscriptionTimeZone, "subscriptionTimeZone");
async function subscriptionUrl(env, row2) {
  return SITE + "/api/calendar/feed/" + row2.id + "/" + await hmac(env, "calendar-subscription", row2.id + ":" + row2.nonce) + ".ics";
}
__name(subscriptionUrl, "subscriptionUrl");
__name2(subscriptionUrl, "subscriptionUrl");
__name22(subscriptionUrl, "subscriptionUrl");
__name222(subscriptionUrl, "subscriptionUrl");
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
function icsEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}
__name(icsEscape, "icsEscape");
__name2(icsEscape, "icsEscape");
__name22(icsEscape, "icsEscape");
__name222(icsEscape, "icsEscape");
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
function icsStamp(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
__name(icsStamp, "icsStamp");
__name2(icsStamp, "icsStamp");
__name22(icsStamp, "icsStamp");
__name222(icsStamp, "icsStamp");
function calendarWallTime(date, time, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error("Invalid appointment date or time");
  const wall = Date.parse(date + "T" + time + ":00Z");
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 10) !== date) throw Error("Invalid appointment date");
  const format = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const local = /* @__PURE__ */ __name222((value) => {
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
function simpleCalendarPage(request) {
  if (request.method !== "GET") return fail(405, "Method not allowed");
  return new Response(SIMPLE_CALENDAR_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
__name(simpleCalendarPage, "simpleCalendarPage");
__name2(simpleCalendarPage, "simpleCalendarPage");
__name22(simpleCalendarPage, "simpleCalendarPage");
__name222(simpleCalendarPage, "simpleCalendarPage");
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
function calendarQuickAddPage(request) {
  if (request.method !== "GET") return fail(405, "Method not allowed");
  return new Response(CALENDAR_QUICK_ADD_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "Referrer-Policy": "no-referrer", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
__name(calendarQuickAddPage, "calendarQuickAddPage");
__name2(calendarQuickAddPage, "calendarQuickAddPage");
__name22(calendarQuickAddPage, "calendarQuickAddPage");
__name222(calendarQuickAddPage, "calendarQuickAddPage");
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
var SETTINGS_EDITS = [['import {createCalendarIntegration} from "./google-calendar-20261107-wn2.js";', ""], ["var {CalendarSettings:WnCalendarSettings,CalendarSync:WnCalendarSync}=createCalendarIntegration(K);", ""], ["(0,$.jsx)(WnCalendarSettings,{userId:e?.id}),", ""], ["(0,$.jsx)(WnCalendarSync,{userId:s?.id,ready:u,getTracker:()=>wnTrackerSync.current,refresh:w}),", ""], ["Manage your profile, sync preferences, and customize home screen cards.", "Manage your backups, appearance and dashboard shortcuts."], ["Export JSON Backup", "Download backup"], ["01 / ON THIS DEVICE", "DEVICE STORAGE"], ["02 / YOUR CLOUD ACCOUNT", "CLOUD BACKUP"], ["Keep it close. ", "On this device. "], ["Store locally.", ""], ["Take it with you. ", "Your WellNest account. "], ["Access remotely.", ""], ["By default, your health logs are saved directly on this browser and device. You can export a full JSON backup whenever you choose.", "Your health records are stored in this browser. Download a backup to keep a separate copy."], ["Visible Dashboard Spaces", "Dashboard cards"], ["Toggle which condition and care spaces appear on your Dashboard Beta overview.", "Choose the cards shown on your dashboard."], ["Choose which shortcuts appear in the top bar. Settings stays available so you can restore hidden items. These choices are saved on this device and are separate from your overview cards.", "Choose your top-bar shortcuts. Settings is always available. These choices are saved on this device."]];
function streamlinedSettingsSource(source) {
  for (const [before, after] of SETTINGS_EDITS) source = source.split(before).join(after);
  return source;
}
__name(streamlinedSettingsSource, "streamlinedSettingsSource");
__name2(streamlinedSettingsSource, "streamlinedSettingsSource");
__name22(streamlinedSettingsSource, "streamlinedSettingsSource");
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
function routineSyncSource(source) {
  if (source.includes("function WnRoutineSyncButton(")) return source;
  for (const [before, after] of [["function We({data:e,onSelectSection:t,onOpenModal:n,onToggleMedSlot:r})", "function We({data:e,onSelectSection:t,onOpenModal:n,onToggleMedSlot:r,onSyncRoutine:wnSyncRoutine})"], ["` DAILY CARE ROUTINE`]})}),(0,$.jsxs)(`div`,{className:`db-routine-panel`", "` DAILY CARE ROUTINE`]})}),(0,$.jsx)(WnRoutineSyncButton,{onSync:wnSyncRoutine}),(0,$.jsxs)(`div`,{className:`db-routine-panel`"], ["jsx)(We,{data:a,onSelectSection:i,onOpenModal:e=>p({kind:e,initialData:null}),onToggleMedSlot:re})", "jsx)(We,{data:a,onSelectSection:i,onOpenModal:e=>p({kind:e,initialData:null}),onToggleMedSlot:re,onSyncRoutine:async()=>{const tracker=wnTrackerSync.current;if(!tracker)throw Error(`Sign in and wait for your account to load, then try again.`);await tracker.sync();w();}})"]]) source = source.split(before).join(after);
  return source + "\nfunction WnRoutineSyncButton({onSync}) {\n const [busy,setBusy]=K.useState(false),[message,setMessage]=K.useState(''),[failed,setFailed]=K.useState(false),lock=K.useRef(false);\n async function run(){if(lock.current)return;lock.current=true;setBusy(true);setMessage('');setFailed(false);\n try{await onSync();setMessage('Account records synced.');}\n catch(error){setFailed(true);setMessage(error?.message||'Could not sync. Please try again.');}\n finally{lock.current=false;setBusy(false);}\n }\n return (0,$.jsxs)('div',{style:{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:8,flexWrap:'wrap'},children:[\n (0,$.jsx)('button',{type:'button',onClick:run,disabled:busy,'aria-label':'Sync daily care routine with your WellNest account','aria-busy':busy,title:'Upload pending changes and refresh from your WellNest account',style:{border:'1px solid currentColor',borderRadius:999,padding:'5px 10px',fontSize:12,fontWeight:700,background:'transparent',color:'inherit',cursor:busy?'wait':'pointer',minHeight:32},children:busy?'Syncing\u2026':'\u21BB Sync'}),\n message&&(0,$.jsx)('span',{role:failed?'alert':'status',style:{fontSize:12,lineHeight:1.4},children:message})\n ]});\n}\n";
}
__name(routineSyncSource, "routineSyncSource");
async function routineSyncResponse(request, response, path) {
  if (request.method !== "GET" || response.status !== 200) return response;
  const dashboard = path === "/assets/dashboardbeta-calendar-20261107-wn2.js", entry = path === "/assets/index-calendar-20261107-wn2.js";
  if (!dashboard && !entry) return response;
  const text = await response.text(), next = dashboard ? routineSyncSource(text).split("(0,$.jsx)(`div`,{children:(0,$.jsxs)(`button`,{type:`button`,className:`db-tag db-widget-title`,onClick:()=>t(`meds`),\"aria-label\":`Daily Care Routine — open Medications`,children:[(0,$.jsx)(g,{size:14}),` DAILY CARE ROUTINE`]})}),(0,$.jsx)(WnRoutineSyncButton,{onSync:wnSyncRoutine})").join("(0,$.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:12,flexWrap:`wrap`,width:`100%`},children:[(0,$.jsxs)(`button`,{type:`button`,className:`db-tag db-widget-title`,onClick:()=>t(`meds`),\"aria-label\":`Daily Care Routine — open Medications`,style:{margin:0},children:[(0,$.jsx)(g,{size:14}),` DAILY CARE ROUTINE`]}),(0,$.jsx)(WnRoutineSyncButton,{onSync:wnSyncRoutine})]})") : text.split("dashboardbeta-calendar-20261107-wn2.js?settings=20261112").join("dashboardbeta-calendar-20261107-wn2.js?settings=20261112&routine=20261112-header");
  const out = new Response(next, response);
  out.headers.delete("ETag");
  out.headers.delete("Content-Length");
  out.headers.set("Cache-Control", "no-cache");
  return out;
}
__name(routineSyncResponse, "routineSyncResponse");
export {
  cleanAddress,
  worker_default as default
};

