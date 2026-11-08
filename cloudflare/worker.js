// Serves WellNest on Cloudflare at the root of wellnest.services.
//
// The site files come from dist-cloudflare/ (built by tools/build-cloudflare.mjs
// on every deploy), with clean addresses like /dashboard and /pricing. Old links
// that still include /wellnest-website/ (bookmarks, earlier emails) are sent
// permanently to the same page without it. Everything else is served straight
// from the files; app routes like /dashboard get 404.html, the app shell
// (wrangler.jsonc "not_found_handling").
const OLD_BASE = "/wellnest-website";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === OLD_BASE || url.pathname.startsWith(OLD_BASE + "/")) {
      const clean = url.pathname.slice(OLD_BASE.length) || "/";
      return Response.redirect(url.origin + clean + url.search, 301);
    }
    return env.ASSETS.fetch(request);
  },
};
