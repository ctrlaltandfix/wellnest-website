// WellNest on Cloudflare: the website (dist-cloudflare/, clean root addresses)
// and its API (sign-in, account, records, files) backed by the D1 database.
import { SITE, json, fail, corsHeaders, ensureSchema, currentUser } from "./lib.js";
import { handleIdentity, handleGoogleCallback } from "./identity.js";
import { handleCollect, handleStats } from "./analytics.js";
import { handleEditor, servePreview, servePreviewApp, previewCookie } from "./editor.js";
import { handleIndexNow } from "./seo.js";
import { handleMe, handleEntities, handleUploads, handleFileSign, handleFileRaw, handleFunction } from "./data.js";

const OLD_BASE = "/wellnest-website";

// Routes the app draws itself (they have no page file). From the app's router.
const APP_ROUTES = new Set(["achievements", "appointments", "asthma", "care-circle", "chronic-pain", "confirm-free-kit", "dashboard",
  "dashboard-beta", "email-preferences", "emergency-plan", "emergency-plan-shared", "epilepsy", "exercises", "expenses",
  "free-symptom-diary-template", "growth", "login", "medications", "meeting-note-shared", "reflection", "settings", "start"]);
const PUBLIC_APP_ROUTES = new Set(["free-symptom-diary-template"]);

// Pages the old app linked to in capitals; they're served in lower case.
const RENAMED = { "/pricing": true, "/privacypolicy": true, "/termsofservice": true };

// The one address a page should be reached at, or null if `url` already is it.
// /Pricing -> /pricing, /about.html -> /about, /index.html -> /, /about/ -> /about
export async function cleanAddress(env, url) {
  const p = url.pathname;
  if (p === "/" || p.startsWith("/assets/") || p.startsWith("/api/") || p.startsWith("/admin") || url.searchParams.has("wn_preview")) return null;
  if (p === "/index.html") return "/";
  const lower = p.toLowerCase().replace(/\.html$/, "");
  if (RENAMED[lower] && p !== lower) return lower;
  const page = p.match(/^\/([A-Za-z0-9-]+)\.html$/);
  if (page && page[1] !== "404") return "/" + page[1];
  if (p.length > 1 && p.endsWith("/") && /^\/[A-Za-z0-9/-]+\/$/.test(p)) {
    // Only when the page is really served without the slash (some folders need it).
    const bare = p.replace(/\/+$/, "");
    const head = await env.ASSETS.fetch(new Request(url.origin + bare, { method: "HEAD", redirect: "manual" }));
    if (head.status === 200) return bare;
  }
  return null;
}

async function api(request, env, path) {
  await ensureSchema(env);
  const parts = path.split("/").filter(Boolean).slice(1); // after "api"

  if (parts[0] === "_identity") return handleIdentity(request, env, "/" + parts.slice(1).join("/"));
  if (path === "/api/auth/google/callback") return handleGoogleCallback(request, env);
  if (parts[0] === "files" && parts[1] === "raw" && parts[2] && request.method === "GET") return handleFileRaw(request, env, parts[2]);
  if (parts[0] === "functions" && parts[1] && request.method === "POST") return handleFunction(request, env, parts[1]);
  if (path === "/api/analytics/collect") return handleCollect(request, env);
  if (path === "/api/claude/status") return json({ connected: false, reason: "Not configured" });
  if (path === "/api/calendar/status") return json({ configured: false, connected: false });
  if (parts[0] === "calendar") return json({ error: "Google Calendar connection is awaiting setup.", configured: false }, 503);

  const user = await currentUser(env, request);
  if (!user) return fail(401, "Authentication required");

  if (path === "/api/analytics/stats" && request.method === "GET") return handleStats(request, env, user);
  if (parts[0] === "editor" && parts[1]) return handleEditor(request, env, user, parts[1]);
  if (path === "/api/seo/indexnow") return handleIndexNow(request, env, user);
  if (path === "/api/auth/me") return handleMe(request, env, user);
  if (parts[0] === "entities" && parts[1]) return handleEntities(request, env, user, decodeURIComponent(parts[1]), parts[2] && decodeURIComponent(parts[2]));
  if (parts[0] === "uploads") return handleUploads(request, env, user, parts.slice(1));
  if (path === "/api/files/sign" && request.method === "POST") return handleFileSign(request, env, user);
  if (path === "/api/files/aliases") return json({ aliases: {} });
  return fail(404, "Not found");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // One address for the site: www -> wellnest.services
    if (url.hostname === "www.wellnest.services") {
      return Response.redirect(SITE + url.pathname + url.search, 301);
    }
    // Old links with the GitHub Pages prefix -> the clean address
    if (url.pathname === OLD_BASE || url.pathname.startsWith(OLD_BASE + "/")) {
      const next = new URL(url.origin + (url.pathname.slice(OLD_BASE.length) || "/") + url.search);
      return Response.redirect(url.origin + ((await cleanAddress(env, next)) || next.pathname) + url.search, 301);
    }

    // The app's sign-in library also uses Netlify Identity's original address.
    if (url.pathname === "/.netlify/identity" || url.pathname.startsWith("/.netlify/identity/")) {
      url.pathname = "/api/_identity" + url.pathname.slice("/.netlify/identity".length);
    }
    if (url.pathname.startsWith("/api/")) {
      const cors = corsHeaders(request);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      let res;
      try {
        res = await api(request, env, url.pathname);
      } catch (e) {
        console.error("API error", url.pathname, e?.stack || e);
        const status = e instanceof SyntaxError ? 400 : e?.status || 500;
        res = fail(status, status === 413 ? "That's too large to save." : status === 400 ? "Invalid request" : "Something went wrong. Please try again.");
      }
      if (!Object.keys(cors).length || res.status === 101) return res;
      const out = new Response(res.body, res);
      for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
      return out;
    }

    // Edit WellNest: /page?wn_preview=ID shows that page with unpublished changes.
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
    // One address per page for search engines: permanent redirects from the
    // variants (/Pricing, /about.html, /about/) to the address the page is served at.
    if (request.method === "GET" || request.method === "HEAD") {
      const clean = await cleanAddress(env, url);
      if (clean) return Response.redirect(url.origin + clean + url.search, 301);
    }

    let res = await env.ASSETS.fetch(request);
    // Pages that exist only inside the app (no file of their own) come back from the
    // 404 page, which starts the app. Answer them as found, and keep the private ones
    // out of search results.
    const route = url.pathname.replace(/\/+$/, "").split("/")[1] || "";
    if (res.status === 404 && APP_ROUTES.has(route)) {
      res = new Response(res.body, { status: 200, headers: res.headers });
      if (!PUBLIC_APP_ROUTES.has(route)) res.headers.set("X-Robots-Tag", "noindex");
    }
    // The workers.dev address serves the same site: keep it out of search results.
    if (url.hostname.endsWith(".workers.dev")) {
      res = new Response(res.body, res);
      res.headers.set("X-Robots-Tag", "noindex");
    }
    // Opening an ordinary page ends any preview in this browser, so the live site
    // never loads the editor's unpublished app copy.
    const dest = request.headers.get("Sec-Fetch-Dest");
    if (previewCookie(request) && (dest === "document" || dest === "iframe") && !url.pathname.startsWith("/assets/")) {
      const out = new Response(res.body, res);
      out.headers.append("Set-Cookie", "wn_preview=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax");
      return out;
    }
    return res;
  },
};
