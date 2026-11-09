// Website traffic for wellnest.services, stored in our own D1 database.
//
//   POST /api/analytics/collect   page view / time-on-page beacons from /wn-stats.js
//   GET  /api/analytics/stats     numbers for the dashboard at /admin/analytics
//                                 (signed-in users whose email is in ADMIN_EMAILS)
//
// Privacy: no IP address, cookie or account is stored. "visitor" is a keyed hash
// of IP + browser that changes every day, so a person can't be followed across
// days; "session" is a random id kept in that browser tab only. Rows older than
// 400 days are deleted automatically.
import { json, fail, hmac, uuid, rateLimited, sha256 } from "./lib.js";

const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|monitor|curl|wget|python|axios|node-fetch/i;
const DAY = 86400000;
const MAX_SECONDS = 1800; // one page can count at most 30 minutes

const clip = (v, n) => (typeof v === "string" ? v.slice(0, n) : "");

export function cleanPath(p) {
  let path = clip(p, 300).split(/[?#]/)[0] || "/";
  if (!path.startsWith("/")) return null;
  path = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (path.length > 1) path = path.replace(/\/+$/, "");
  return path.slice(0, 200);
}

export function deviceOf(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "Tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function browserOf(ua) {
  if (/Edg\//.test(ua)) return "Edge";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome|CriOS/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return "Other";
}

export function sourceOf(referrer, utmSource, ownHost) {
  const utm = clip(utmSource, 60).trim().toLowerCase();
  if (utm) return utm;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "").replace(/^m\./, "");
    // Moving between our own pages isn't a new source; only the page a visit starts on gets one.
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

export async function handleCollect(request, env) {
  if (request.method !== "POST") return fail(405, "Method not allowed");
  const ua = request.headers.get("User-Agent") || "";
  if (!ua || BOTS.test(ua)) return new Response(null, { status: 204 });

  let body;
  try {
    body = JSON.parse((await request.text()).slice(0, 4000));
  } catch {
    return fail(400, "Invalid request");
  }
  const id = clip(body?.id, 40);
  if (!/^[A-Za-z0-9-]{8,40}$/.test(id)) return fail(400, "Invalid request");

  // Time on page: the tab reports how long the page was visible.
  if (body.t === "l") {
    const seconds = Math.max(0, Math.min(MAX_SECONDS, Math.round(Number(body.d) || 0)));
    if (seconds) {
      await env.DB.prepare("UPDATE page_views SET seconds = ? WHERE id = ? AND seconds < ? AND ts > ?")
        .bind(seconds, id, seconds, Date.now() - DAY).run();
    }
    return new Response(null, { status: 204 });
  }
  if (body.t !== "v") return fail(400, "Invalid request");

  const path = cleanPath(body.p);
  const session = clip(body.s, 40);
  if (!path || !/^[A-Za-z0-9-]{8,40}$/.test(session)) return fail(400, "Invalid request");
  if (await rateLimited(env, request, "analytics", 200, 600)) return new Response(null, { status: 204 });

  const ts = Date.now();
  const day = new Date(ts).toISOString().slice(0, 10);
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const visitor = (await hmac(env, "visitor", `${day}|${ip}|${ua}`)).slice(0, 22);
  const host = new URL(request.url).hostname;

  await env.DB.prepare(
    `INSERT OR IGNORE INTO page_views (id, ts, day, path, country, source, campaign, device, browser, visitor, session)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id, ts, day, path,
    clip(request.cf?.country, 2) || "XX",
    sourceOf(clip(body.r, 500), body.u, host),
    clip(body.c, 80).trim().toLowerCase() || null,
    deviceOf(ua), browserOf(ua), visitor, session,
  ).run();

  if (Math.random() < 0.01) {
    await env.DB.prepare("DELETE FROM page_views WHERE ts < ?").bind(ts - 400 * DAY).run();
  }
  return new Response(null, { status: 204 });
}

export async function isAnalyticsAdmin(env, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  // ADMIN_EMAIL_SHA256 (wrangler.jsonc): SHA-256 of each admin's lower-case email,
  // so admin addresses aren't readable in the public repo.
  const hashes = String(env.ADMIN_EMAIL_SHA256 || "").toLowerCase().split(/[\s,;]+/).filter(Boolean);
  if (hashes.length && hashes.includes(await sha256(String(user.email || "").trim().toLowerCase()))) return true;
  // Accepts "a@x.com", "a@x.com, b@y.com", one per line, or a pasted value still in quotes.
  const allowed = String(env.ADMIN_EMAILS || "").split(/[\s,;]+/)
    .map(s => s.replace(/^["'<\[]+|["'>\]]+$/g, "").trim().toLowerCase()).filter(Boolean);
  return allowed.includes(String(user.email || "").toLowerCase());
}

export async function handleStats(request, env, user) {
  if (!(await isAnalyticsAdmin(env, user))) {
    return fail(403, "This account can't see site statistics. Add its email to ADMIN_EMAILS in Cloudflare.", {
      signed_in_as: user?.email || null,
      admin_emails_set: Boolean(String(env.ADMIN_EMAILS || env.ADMIN_EMAIL_SHA256 || "").trim()),
    });
  }
  const url = new URL(request.url);
  const days = Math.max(1, Math.min(365, Math.round(Number(url.searchParams.get("days")) || 30)));
  // The viewer's UTC offset in minutes (e.g. 660 for Sydney summer time), so days line up with theirs.
  const tz = Math.max(-840, Math.min(840, Math.round(Number(url.searchParams.get("tz")) || 0)));
  const now = Date.now();
  const since = now - days * DAY;
  const prevSince = since - days * DAY;
  const bucket = days <= 2 ? 3600000 : DAY;
  const off = tz * 60000;
  const db = env.DB;

  const totalsSql = `
    SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT session) AS sessions,
      (SELECT ROUND(AVG(t), 1) FROM (SELECT SUM(seconds) AS t FROM page_views WHERE ts >= ?1 AND ts < ?2 GROUP BY session)) AS avg_session_seconds,
      (SELECT ROUND(100.0 * SUM(n = 1) / COUNT(*), 1) FROM (SELECT COUNT(*) AS n FROM page_views WHERE ts >= ?1 AND ts < ?2 GROUP BY session)) AS bounce_rate
    FROM page_views WHERE ts >= ?1 AND ts < ?2`;
  const top = (col, limit = 10) => db.prepare(
    `SELECT ${col} AS name, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views
     FROM page_views WHERE ts >= ? AND ${col} IS NOT NULL GROUP BY ${col} ORDER BY visitors DESC, views DESC LIMIT ${limit}`,
  ).bind(since);

  const [totals, prev, series, pages, countries, sources, campaigns, devices, browsers, live] = await db.batch([
    db.prepare(totalsSql).bind(since, now + 1),
    db.prepare(totalsSql).bind(prevSince, since),
    db.prepare(
      `SELECT CAST((ts + ?1) / ?2 AS INTEGER) * ?2 - ?1 AS t, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors
       FROM page_views WHERE ts >= ?3 GROUP BY 1 ORDER BY 1`,
    ).bind(off, bucket, since),
    db.prepare(
      `SELECT path AS name, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors,
         ROUND(AVG(CASE WHEN seconds > 0 THEN seconds END), 0) AS avg_seconds
       FROM page_views WHERE ts >= ? GROUP BY path ORDER BY views DESC LIMIT 25`,
    ).bind(since),
    top("country", 25),
    top("source", 15),
    db.prepare(
      `SELECT campaign AS name, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views
       FROM page_views WHERE ts >= ? AND campaign IS NOT NULL GROUP BY campaign ORDER BY visitors DESC LIMIT 10`,
    ).bind(since),
    top("device", 5),
    top("browser", 8),
    // People active in the last 5 minutes (one person with two tabs counts once).
    db.prepare("SELECT COUNT(DISTINCT visitor) AS n FROM page_views WHERE ts >= ?").bind(now - 5 * 60000),
  ]);

  return json({
    days, bucket, tz, generated: new Date(now).toISOString(),
    totals: totals.results[0], previous: prev.results[0],
    series: series.results, pages: pages.results, countries: countries.results,
    sources: sources.results, campaigns: campaigns.results,
    devices: devices.results, browsers: browsers.results,
    live: live.results[0]?.n || 0,
  });
}
