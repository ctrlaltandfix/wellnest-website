// Finishes a Google sign-in that was started on the WellNest copy on GitHub Pages.
//
// Netlify Identity always sends people back to wellnest.services after Google,
// with the sign-in token in the address (#access_token=...). When the bridge
// marked the sign-in as started from GitHub Pages (wn_return cookie), this serves
// a tiny page that forwards the person, with their token, to the GitHub copy.
// Everyone else gets the normal site.
//
// The handoff script is served from /imported/, which the site's
// Content-Security-Policy already allows.
import type { Config, Context } from "@netlify/edge-functions";

const ALLOWED = new Set(["https://ctrlaltandfix.github.io"]);
const SCRIPT = "/imported/wn-google-return.js";
const CLEAR = "wn_return=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax";

const HANDOFF_JS = `(function () {
  var t = document.documentElement.getAttribute("data-target") || "", h = location.hash;
  if (t && /(^#|&)(access_token|error)=/.test(h)) { location.replace(t + h); return; }
  var s = location.search ? location.search + "&" : "?";
  location.replace(location.pathname + s + "wn_ret=0" + h);
})();`;

function target(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(decodeURIComponent(raw));
    return ALLOWED.has(u.origin) ? u.origin + u.pathname : null;
  } catch {
    return null;
  }
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  if (url.pathname === SCRIPT) {
    return new Response(HANDOFF_JS, {
      headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const raw = context.cookies.get("wn_return");
  if (!raw || request.method !== "GET" || url.searchParams.get("wn_ret") === "0") return;
  if (!(request.headers.get("accept") ?? "").includes("text/html")) return;

  const dest = target(raw);
  if (!dest) {
    const res = await context.next();
    const out = new Response(res.body, res);
    out.headers.append("Set-Cookie", CLEAR);
    return out;
  }

  const attr = dest.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const page = `<!doctype html><html lang="en" data-target="${attr}"><head><meta charset="utf-8">` +
    `<title>Signing you in…</title><script src="${SCRIPT}"></script></head>` +
    `<body style="font-family:system-ui,sans-serif;padding:2rem">Signing you in…</body></html>`;
  return new Response(page, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
      "set-cookie": CLEAR,
    },
  });
};

export const config: Config = {
  path: ["/", "/login", "/dashboard", SCRIPT],
};
