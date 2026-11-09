// WellNest on Cloudflare: the website (dist-cloudflare/, clean root addresses)
// and its API (sign-in, account, records, files) backed by the D1 database.
import { SITE, json, fail, corsHeaders, ensureSchema, currentUser } from "./lib.js";
import { handleIdentity, handleGoogleCallback } from "./identity.js";
import { handleCollect, handleStats } from "./analytics.js";
import { handleEditor, servePreview, servePreviewApp, previewCookie } from "./editor.js";
import { handleMe, handleEntities, handleUploads, handleFileSign, handleFileRaw, handleFunction } from "./data.js";

const OLD_BASE = "/wellnest-website";

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
      return Response.redirect(url.origin + (url.pathname.slice(OLD_BASE.length) || "/") + url.search, 301);
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
    return env.ASSETS.fetch(request);
  },
};
