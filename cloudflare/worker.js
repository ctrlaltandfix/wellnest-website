// Serves the WellNest GitHub Pages copy on Cloudflare Workers.
//
// The files are built for https://ctrlaltandfix.github.io/wellnest-website/,
// so every link starts with /wellnest-website/. This Worker serves them at the
// same paths on Cloudflare: it strips the prefix before reading the static
// files, keeps the prefix on Cloudflare's own folder redirects, sends "/" to
// "/wellnest-website/", and shows 404.html (the app shell) for app routes like
// /wellnest-website/dashboard, the same way GitHub Pages does.
const BASE = "/wellnest-website";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === BASE) {
      return Response.redirect(url.origin + BASE + "/" + url.search, 302);
    }

    const assetUrl = new URL(url);
    if (url.pathname.startsWith(BASE + "/")) assetUrl.pathname = url.pathname.slice(BASE.length);
    const res = await env.ASSETS.fetch(new Request(assetUrl, request));

    // Folder redirects (/about -> /about/) must keep the /wellnest-website prefix.
    const loc = res.headers.get("Location");
    if (res.status >= 300 && res.status < 400 && loc) {
      const target = new URL(loc, assetUrl);
      if (target.origin === url.origin && !target.pathname.startsWith(BASE + "/")) {
        target.pathname = BASE + target.pathname;
        return new Response(null, { status: res.status, headers: { Location: target.pathname + target.search } });
      }
    }

    // App routes have no file of their own: serve the app shell, as GitHub Pages does.
    if (res.status === 404 && request.method === "GET" && (request.headers.get("Accept") || "").includes("text/html")) {
      // "/404" (not "/404.html": Cloudflare redirects .html URLs to their clean form)
      const shell = await env.ASSETS.fetch(new Request(new URL("/404", url), request));
      return new Response(shell.body, { status: 404, headers: shell.headers });
    }
    return res;
  },
};
