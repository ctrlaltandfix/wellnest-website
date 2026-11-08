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
SKIP_DIRS = {".git", "node_modules", "netlify", "tests", "tools", "cloudflare", ".wrangler"}

ASSET_DIRS = r"(?:landing|imported|assets|favicon\.svg|favicon)"

# Signed-in features (accounts, health data) need the WellNest server, which
# GitHub Pages cannot run, so these routes open the live app instead.
LIVE_APP = "https://wellnest-web.netlify.app"
APP_ROUTES = (r"^/(?:login|start|startfree|signin|signup|register|dashboard(?:-beta)?|chronic-pain|asthma|epilepsy"
              r"|medications|appointments|care-circle|exercises|reflection|expenses|emergency-plan"
              r"|emergency-plan-shared|meeting-note-shared|achievements|settings|growth|email-preferences"
              r"|confirm-free-kit)/?$|^/(?:auth|ios-auth)(?:/|$)")

# Runs before anything else on every page (source: tools/gh-pages-bootstrap.js).
_boot = (pathlib.Path(__file__).with_name("gh-pages-bootstrap.js")).read_text(encoding="utf-8")
_boot = re.sub(r"^/\*.*?\*/\s*", "", _boot, flags=re.S)  # drop header comment
_boot = (_boot.replace("__BASE__", BASE).replace("__LIVE__", LIVE_APP)
         .replace('"__ROUTES__"', '"' + APP_ROUTES.replace("\\", "\\\\") + '"'))
LINK_FIX = '<script id="gh-pages-base">' + _boot.strip() + "</script>"


def patch_js(text: str) -> str:
    # 1. Vite module-preload URL helper:  function(e){return`/`+e}
    text = re.sub(r"function\((\w)\)\{return[`\"]/[`\"]\+\1\}",
                  lambda m: "function(%s){return`%s/`+%s}" % (m[1], BASE, m[1]), text)
    # 2. React Router default basename:  basename:t=`/`
    text = re.sub(r"basename:(\w)=[`\"]/[`\"]", lambda m: "basename:%s=`%s`" % (m[1], BASE), text)
    # 3. Hard-coded asset paths in string literals
    text = re.sub(r"([`\"'])/(?!%s/)(%s)" % (re.escape(B), ASSET_DIRS),
                  lambda m: "%s%s/%s" % (m[1], BASE, m[2]), text)
    # 5. Netlify Identity endpoint: use the WellNest server (set by the bootstrap)
    for name in set(re.findall(r"(\w+)=[`\"]/\.netlify/identity[`\"]", text)):
        text = re.sub(r"(?<!__WN_IDENTITY__\|\|)`\$\{window\.location\.origin\}\$\{%s\}`" % name,
                      lambda m: "(window.__WN_IDENTITY__||%s)" % m[0], text)
    # 6. Post-login redirect sanitiser: keep the target inside the GitHub Pages path,
    #    and compare against /login, /start, /auth/ without the prefix.
    marker = "let n=new URL(e||`/dashboard`,t);"
    if marker in text and "n.pathname.indexOf(`%s/`)" % BASE not in text:
        i = text.index(marker) + len(marker)
        j = text.index("return n.searchParams", i)
        body = text[i:j].replace("n.pathname.toLowerCase()",
                                 "n.pathname.toLowerCase().replace(/^%s(?=\\/|$)/,``)" % BASE.replace("/", "\\/"))
        text = (text[:i] + "n.pathname.indexOf(`%s/`)&&(n.pathname=`%s`+n.pathname);" % (BASE, BASE)
                + body + text[j:])
    # 4. Hard page navigations: location.assign(`/x`), location.href=`/`, new URL(`/x`, ...)
    text = re.sub(r"(location\.(?:assign|replace)\(|location\.href=|new URL\()([`\"'])/(?!/)(?!%s(?:/|[`\"']))"
                  % re.escape(B), lambda m: "%s%s%s/" % (m[1], m[2], BASE), text)
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
    # meta refresh and inline location.replace('/x') redirects (e.g. /demo)
    text = re.sub(r'(content="\d+;\s*url=)/(?!/)(?!%s/)' % re.escape(B), lambda m: m[1] + BASE + "/", text)
    text = re.sub(r"(location\.(?:assign|replace)\(|location\.href=)([`\"'])/(?!/)(?!%s(?:/|[`\"']))"
                  % re.escape(B), lambda m: "%s%s%s/" % (m[1], m[2], BASE), text)
    # inject (or refresh) the link fixer, right after <head>
    text = re.sub(r'\s*<script id="gh-pages-base">.*?</script>', "", text, flags=re.S)
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
