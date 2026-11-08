// Shared helpers for the WellNest API on Cloudflare: responses, CORS, crypto,
// sessions (JWT), the D1 schema, rate limits and email.

export const SITE = "https://wellnest.services";
export const ALLOWED_ORIGINS = new Set([
  "https://wellnest.services",
  "https://www.wellnest.services",
  "https://ctrlaltandfix.github.io",
  "https://wellnest.email-chrisgreenfield.workers.dev",
]);
const ACCESS_TTL = 3600; // seconds

// ---------- responses ----------
export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store", ...extra },
  });
}
export const fail = (status, error, extra = {}) => json({ error, msg: error, error_description: error, ...extra }, status);

export function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With",
    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, ETag",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

// ---------- encoding / crypto ----------
const enc = new TextEncoder();
export function b64url(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function b64urlDecode(str) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}
export const randomToken = (n = 32) => b64url(crypto.getRandomValues(new Uint8Array(n)));
export const uuid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();

export async function sha256(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Passwords: PBKDF2-SHA256 (100k iterations, the Workers maximum).
const PBKDF2_ITER = 100000;
async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return b64url(bits);
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${PBKDF2_ITER}$${b64url(salt)}$${await pbkdf2(password, salt, PBKDF2_ITER)}`;
}
export async function verifyPassword(password, stored) {
  if (!stored) return false;
  const [kind, iter, salt, hash] = stored.split("$");
  if (kind !== "pbkdf2") return false;
  return timingSafeEqual(await pbkdf2(password, b64urlDecode(salt), Number(iter)), hash);
}

// HMAC key derived from the server secret kept in D1 (created on first use).
let secretCache = null;
async function serverSecret(env) {
  if (secretCache) return secretCache;
  let row = await env.DB.prepare("SELECT value FROM config WHERE key = 'signing_secret'").first();
  if (!row) {
    await env.DB.prepare("INSERT OR IGNORE INTO config (key, value) VALUES ('signing_secret', ?)").bind(randomToken(48)).run();
    row = await env.DB.prepare("SELECT value FROM config WHERE key = 'signing_secret'").first();
  }
  secretCache = row.value;
  return secretCache;
}
async function hmacKey(env, purpose) {
  return crypto.subtle.importKey("raw", enc.encode((await serverSecret(env)) + "|" + purpose),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function hmac(env, purpose, text) {
  return b64url(await crypto.subtle.sign("HMAC", await hmacKey(env, purpose), enc.encode(text)));
}
export async function hmacVerify(env, purpose, text, sig) {
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(env, purpose), b64urlDecode(sig), enc.encode(text));
  } catch {
    return false;
  }
}

// ---------- sessions (HS256 JWT, compatible with Netlify Identity clients) ----------
export async function signJwt(env, claims, ttl = ACCESS_TTL) {
  const iat = Math.floor(Date.now() / 1000);
  const head = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify({ ...claims, iat, exp: iat + ttl })));
  return `${head}.${body}.${await hmac(env, "jwt", `${head}.${body}`)}`;
}
export async function verifyJwt(env, token) {
  const parts = (token || "").split(".");
  if (parts.length !== 3) return null;
  if (!(await hmacVerify(env, "jwt", `${parts[0]}.${parts[1]}`, parts[2]))) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
    return claims.exp * 1000 > Date.now() ? claims : null;
  } catch {
    return null;
  }
}
export const ACCESS_TOKEN_TTL = ACCESS_TTL;

export function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1];
  const c = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)nf_jwt=([^;]+)/);
  return c ? decodeURIComponent(c[1]) : null;
}

// The signed-in user for an API request, or null.
export async function currentUser(env, request) {
  const claims = await verifyJwt(env, bearer(request));
  if (!claims?.sub) return null;
  return env.DB.prepare("SELECT * FROM users WHERE id = ? AND confirmed_at IS NOT NULL").bind(claims.sub).first();
}

// ---------- database schema (created on first request) ----------
const SCHEMA = [
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
];
let schemaReady = false;
export async function ensureSchema(env) {
  if (schemaReady) return;
  await env.DB.batch(SCHEMA.map(sql => env.DB.prepare(sql)));
  schemaReady = true;
}

// ---------- rate limiting ----------
export async function rateLimited(env, request, bucket, limit, windowSeconds = 600, extraKey = "") {
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const key = await sha256(ip + "|" + extraKey.toLowerCase());
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, key, window, hits) VALUES (?, ?, ?, 1)
     ON CONFLICT (bucket, key, window) DO UPDATE SET hits = hits + 1 RETURNING hits`,
  ).bind(bucket, key, window).first();
  if (Math.random() < 0.02) {
    await env.DB.prepare("DELETE FROM rate_limits WHERE window < ?").bind(window - 2).run();
  }
  return row.hits > limit;
}

// ---------- email (Resend) ----------
export async function sendEmail(env, { to, subject, html, text }) {
  if (!env.RESEND_API_KEY) {
    console.log(`[email not sent: RESEND_API_KEY missing] to=${to} subject=${subject}\n${text}`);
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM || "WellNest <hello@wellnest.services>", to: [to], subject, html, text }),
  });
  if (!res.ok) console.error("Resend error", res.status, (await res.text()).slice(0, 300));
  return res.ok;
}

export function emailLayout(title, body, button, link) {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return `<!doctype html><html><body style="margin:0;background:#f3f6f1;font-family:Arial,Helvetica,sans-serif;color:#17332b">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-size:22px;font-weight:bold;color:#1f5c4a">wellnest</td></tr>
<tr><td style="padding-top:20px;font-size:20px;font-weight:bold">${esc(title)}</td></tr>
<tr><td style="padding-top:12px;font-size:15px;line-height:1.5">${esc(body)}</td></tr>
${button ? `<tr><td style="padding-top:24px"><a href="${esc(link)}" style="display:inline-block;background:#1f5c4a;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">${esc(button)}</a></td></tr>
<tr><td style="padding-top:16px;font-size:12px;color:#5b6f68;word-break:break-all">Or copy this link: ${esc(link)}</td></tr>` : ""}
<tr><td style="padding-top:24px;font-size:12px;color:#5b6f68">If you didn't ask for this, you can ignore this email.</td></tr>
</table></td></tr></table></body></html>`;
}
