#!/usr/bin/env python3
"""Make the exported WellNest build work under a GitHub Pages project path.

The build assumes it is served from a domain root ("/"). GitHub Pages serves
this repo from https://ctrlaltandfix.github.io/wellnest-website/, so every
root-relative path has to gain the "/wellnest-website" prefix.

Safe to run more than once (already-prefixed paths are left alone).
Usage:  python3 tools/github-pages-subpath.py [repo_dir] [--base /wellnest-website]
"""
import re, sys, pathlib

args = [a for a in sys.argv[1:] if not a.startswith("--")]
ROOT = pathlib.Path(args[0] if args else ".").resolve()
BASE = "/wellnest-website"
if "--base" in sys.argv:
    BASE = "/" + sys.argv[sys.argv.index("--base") + 1].strip("/")
B = BASE.lstrip("/")  # "wellnest-website"
SKIP_DIRS = {".git", "node_modules", "netlify", "tests", "tools"}

ASSET_DIRS = r"(?:landing|imported|assets|favicon\.svg|favicon)"

# Runs before anything else on every page: rewrites plain root-relative
# links (e.g. <a href="/pricing">) to live under the GitHub Pages path.
LINK_FIX = (
    '<script id="gh-pages-base">(function(){var B="%s";'
    'function fix(u){return typeof u=="string"&&u.charAt(0)=="/"&&u.charAt(1)!="/"'
    '&&u!==B&&u.indexOf(B+"/")!==0?B+u:u}'
    'document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");'
    'if(!a)return;var h=a.getAttribute("href"),n=fix(h);if(n!==h)a.setAttribute("href",n)},true);'
    '})();</script>' % BASE
)


def patch_js(text: str) -> str:
    # 1. Vite module-preload URL helper:  function(e){return`/`+e}
    text = re.sub(r"function\((\w)\)\{return[`\"]/[`\"]\+\1\}",
                  lambda m: "function(%s){return`%s/`+%s}" % (m[1], BASE, m[1]), text)
    # 2. React Router default basename:  basename:t=`/`
    text = re.sub(r"basename:(\w)=[`\"]/[`\"]", lambda m: "basename:%s=`%s`" % (m[1], BASE), text)
    # 3. Hard-coded asset paths in string literals
    text = re.sub(r"([`\"'])/(?!%s/)(%s)" % (re.escape(B), ASSET_DIRS),
                  lambda m: "%s%s/%s" % (m[1], BASE, m[2]), text)
    return text


def patch_html(text: str) -> str:
    # root-relative src/href/content/srcset/poster/action values
    text = re.sub(r'(\s(?:src|href|content|poster|action|data-src)=")/(?!/)(?!%s(?:/|"))' % re.escape(B),
                  lambda m: m[1] + BASE + "/", text)
    text = re.sub(r'(\ssrcset=")([^"]*)"',
                  lambda m: m[1] + re.sub(r"(^|,\s*)/(?!/)(?!%s/)" % re.escape(B),
                                          lambda n: n[1] + BASE + "/", m[2]) + '"', text)
    # asset paths inside inline <style>/<script> (url(/landing/..), "/imported/..")
    text = re.sub(r"(url\(|[`\"'])/(?!%s/)(%s)" % (re.escape(B), ASSET_DIRS),
                  lambda m: "%s%s/%s" % (m[1], BASE, m[2]), text)
    # dashboard boot guard matches window.location.pathname; allow the base prefix
    text = text.replace(r"test(window.location.pathname)",
                        r"test(window.location.pathname.replace(/^%s/,''))" % BASE.replace("/", r"\/"))
    # inject the link fixer once, right after <head>
    if 'id="gh-pages-base"' not in text:
        text = re.sub(r"(<head[^>]*>)", lambda m: m[1] + "\n    " + LINK_FIX, text, count=1)
    return text


changed = 0
for p in ROOT.rglob("*"):
    if not p.is_file() or SKIP_DIRS & set(p.relative_to(ROOT).parts):
        continue
    if p.suffix in (".js", ".mjs", ".css"):
        fn = patch_js
    elif p.suffix == ".html":
        fn = patch_html
    else:
        continue
    old = p.read_text(encoding="utf-8")
    new = fn(old)
    if new != old:
        p.write_text(new, encoding="utf-8")
        changed += 1
print(f"patched {changed} files for base {BASE}")
