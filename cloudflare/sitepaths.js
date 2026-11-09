// The repo's pages are written for GitHub Pages, where every link starts with
// /wellnest-website/. On wellnest.services they're served from the root, so this
// removes that prefix. Used by tools/build-cloudflare.mjs (every deploy) and by
// the Edit WellNest preview (cloudflare/editor.js).
export const GH_BASE = "/wellnest-website";

export function stripBase(text) {
  return text
    // escaped forms inside regular expressions, e.g. /^\/wellnest-website(?=\/|$)/
    .split("\\/wellnest-website").join("")
    // links, assets and app routes: /wellnest-website/x -> /x
    .split(GH_BASE + "/").join("/")
    // the bare base (router basename, link-fixer constant) -> root
    .split(GH_BASE).join("");
}
