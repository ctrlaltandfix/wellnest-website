// Lets the WellNest copy on GitHub Pages (https://ctrlaltandfix.github.io)
// use the WellNest server: sign-in and /api/* data, with the same accounts.
//
// Add to the Netlify project that serves wellnest.services, and declare it
// FIRST in netlify.toml so it wraps every other /api handler:
//
//   [[edge_functions]]
//   path = "/api/*"
//   function = "github-pages-bridge"
//
// Only the origins in ALLOWED get cross-site access. Requests from anywhere
// else pass straight through, untouched.
import type { Context } from "@netlify/edge-functions";

const ALLOWED = new Set(["https://ctrlaltandfix.github.io"]);
const IDENTITY = "/api/_identity"; // proxied to /.netlify/identity

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Requested-With",
    "Access-Control-Expose-Headers": "Content-Disposition, Content-Length, ETag",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const origin = request.headers.get("Origin") ?? "";
  const allowed = ALLOWED.has(origin);
  const isIdentity = url.pathname === IDENTITY || url.pathname.startsWith(IDENTITY + "/");

  // Not for us: leave every other /api request exactly as it was.
  if (!allowed && !isIdentity) return;
  if (allowed && request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const headers = new Headers(request.headers);
  headers.delete("Cookie"); // cross-site calls authenticate with the Bearer token only
  const bearer = headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];

  let response: Response;
  if (isIdentity) {
    // Netlify Identity lives under /.netlify/, which edge functions can't wrap
    // directly, so the GitHub copy reaches it through /api/_identity/*.
    const target = new URL("/.netlify/identity" + url.pathname.slice(IDENTITY.length) + url.search, url.origin);
    headers.delete("Origin");
    headers.delete("Host");
    const hasBody = !["GET", "HEAD"].includes(request.method);
    response = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } else {
    // getUser() reads the nf_jwt cookie; supply it from the verified Bearer token.
    if (bearer) headers.set("Cookie", `nf_jwt=${bearer}`);
    // The request now carries its own token (no ambient cookies), so present it
    // as same-origin to handlers that check Origin (e.g. calendar).
    headers.set("Origin", url.origin);
    response = await context.next(new Request(request, { headers }));
  }

  if (!allowed) return response;
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(corsHeaders(origin))) out.headers.set(k, v);
  out.headers.delete("Set-Cookie");
  return out;
};
