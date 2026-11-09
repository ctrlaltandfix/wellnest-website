// Telling search engines about new and changed pages (IndexNow: Bing, Yandex,
// Seznam, Naver and others share submissions). Google reads the sitemap listed
// in robots.txt instead.
//
//   POST /api/seo/indexnow   admins only. Body { urls?: [...] }; without urls,
//                            every page in the sitemap is submitted.
// Edit WellNest also submits the pages it publishes (see editor.js).
import { SITE, json, fail } from "./lib.js";
import { isAnalyticsAdmin } from "./analytics.js";

// Served at /<key>.txt so search engines can confirm the submission is ours.
export const INDEXNOW_KEY = "d1fda5e2b1c74046813bc420e8dbe005";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const HOST = new URL(SITE).host;

// The public address of a repo page: about.html, about/index.html -> /about
export function pageUrl(path) {
  if (!/\.html$/.test(path) || /^(admin|assets|404)/.test(path)) return null;
  const slug = path.replace(/(^|\/)index\.html$/, "").replace(/\.html$/, "");
  return SITE + "/" + slug;
}

export async function submitIndexNow(urls) {
  const list = [...new Set(urls.filter(u => typeof u === "string" && u.startsWith(SITE + "/")))].slice(0, 10_000);
  if (!list.length) return { submitted: 0, status: null };
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: list }),
    signal: AbortSignal.timeout(15_000),
  });
  // 200 = received, 202 = received (key check pending); anything else is a problem.
  return { submitted: list.length, status: res.status, ok: res.status === 200 || res.status === 202, detail: res.ok ? undefined : (await res.text()).slice(0, 300) };
}

export async function sitemapUrls(env, origin) {
  const res = await env.ASSETS.fetch(new Request(origin + "/sitemap.xml"));
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
}

export async function handleIndexNow(request, env, user) {
  if (!(await isAnalyticsAdmin(env, user))) return fail(403, "Only site admins can do this.");
  if (request.method !== "POST") return fail(405, "Use POST.");
  let body = {};
  try { body = await request.json(); } catch {}
  const urls = Array.isArray(body.urls) && body.urls.length ? body.urls : await sitemapUrls(env, new URL(request.url).origin);
  return json(await submitIndexNow(urls));
}

// Daily (wrangler.jsonc "triggers"): tell IndexNow about every sitemap page that
// is new or whose <lastmod> changed since the last successful submission, so Bing
// (which also feeds ChatGPT search, DuckDuckGo and others) hears about changes
// without anyone pressing a button. What was sent is kept in the config table.
export function sitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => ({
    url: (m[1].match(/<loc>([^<]+)<\/loc>/) || [])[1]?.trim(),
    lastmod: (m[1].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1]?.trim() || "",
  })).filter(e => e.url);
}
export async function scheduledIndexNow(env) {
  const res = await env.ASSETS.fetch(new Request(SITE + "/sitemap.xml"));
  if (!res.ok) return { submitted: 0, status: null };
  const entries = sitemapEntries(await res.text());
  const row = await env.DB.prepare("SELECT value FROM config WHERE key = 'indexnow_sent'").first();
  let sent = {};
  try { sent = JSON.parse(row?.value || "{}"); } catch {}
  const changed = entries.filter(e => sent[e.url] !== e.lastmod);
  if (!changed.length) return { submitted: 0, status: null };
  const result = await submitIndexNow(changed.map(e => e.url));
  if (result.ok) {
    const next = {};
    for (const e of entries) next[e.url] = changed.includes(e) ? e.lastmod : sent[e.url];
    await env.DB.prepare("INSERT INTO config (key, value) VALUES ('indexnow_sent', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(JSON.stringify(next)).run();
  } else console.error("IndexNow", result.status, result.detail);
  return result;
}
