// Builds the Cloudflare copy of WellNest, served at the root of wellnest.services.
//
// The repo is built for GitHub Pages, where every link starts with
// /wellnest-website/. This copies the website files into dist-cloudflare/ and
// removes that prefix from every page, script and stylesheet, so Cloudflare can
// serve clean addresses like https://wellnest.services/dashboard.
//
// Runs automatically on every Cloudflare deploy (wrangler.jsonc "build").
// Manual run: node tools/build-cloudflare.mjs
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist-cloudflare");
const BASE = "/wellnest-website";

// Not part of the website (server code, tooling, config).
const SKIP = new Set([
  ".git", ".github", ".wrangler", "node_modules", "dist-cloudflare",
  "netlify", "netlify.toml", "tools", "tests", "cloudflare",
  "package.json", "package-lock.json", "wrangler.jsonc",
  ".assetsignore", ".gitignore", "github-pages-bridge.ts",
]);
const TEXT = new Set([".html", ".js", ".mjs", ".css"]);

function stripBase(text) {
  return text
    // escaped forms inside regular expressions, e.g. /^\/wellnest-website(?=\/|$)/
    .split("\\/wellnest-website").join("")
    // links, assets and app routes: /wellnest-website/x -> /x
    .split(BASE + "/").join("/")
    // the bare base (router basename, link-fixer constant) -> root
    .split(BASE).join("");
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let files = 0, changed = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const src = join(dir, name);
    const rel = relative(ROOT, src);
    if (dir === ROOT && SKIP.has(name)) continue;
    const dest = join(OUT, rel);
    if (statSync(src).isDirectory()) {
      mkdirSync(dest, { recursive: true });
      walk(src);
      continue;
    }
    files++;
    if (TEXT.has(extname(name))) {
      const text = readFileSync(src, "utf8");
      const out = stripBase(text);
      if (out !== text) changed++;
      writeFileSync(dest, out);
    } else {
      cpSync(src, dest);
    }
  }
}
walk(ROOT);

const leftover = [];
(function check(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) check(p);
    else if (TEXT.has(extname(name)) && readFileSync(p, "utf8").includes("wellnest-website")) leftover.push(relative(OUT, p));
  }
})(OUT);

console.log(`Cloudflare build: ${files} files, ${changed} rewritten for the site root -> dist-cloudflare/`);
if (leftover.length) {
  console.error("Still mentions wellnest-website:", leftover.slice(0, 10).join(", "));
  process.exit(1);
}
