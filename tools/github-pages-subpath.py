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

# Signed-in features (accounts, health data) need the WellNest server, which
# GitHub Pages cannot run, so these routes open the live app instead.
LIVE_APP = "https://wellnest.services"
APP_ROUTES = (r"^/(?:login|start|startfree|signin|signup|register|dashboard(?:-beta)?|chronic-pain|asthma|epilepsy"
              r"|medications|appointments|care-circle|exercises|reflection|expenses|emergency-plan"
              r"|emergency-plan-shared|meeting-note-shared|achievements|settings|growth|email-preferences"
              r"|confirm-free-kit)/?$|^/(?:auth|ios-auth)(?:/|$)")

# Runs before anything else on every page:
#  - plain root-relative links (<a href="/pricing">) get the GitHub Pages path
#  - any navigation to an app route (link, router push, direct visit) opens the live app
LINK_FIX = (
    '<script id="gh-pages-base">(function(){var B="%s",L="%s",R=/%s/i;'
    'function rel(p){return p.indexOf(B)===0?p.slice(B.length)||"/":p}'
    'function live(u){try{var x=new URL(u,location.href);if(x.origin!==location.origin)return null;'
    'var p=rel(x.pathname);return R.test(p)?L+p+x.search+x.hash:null}catch(e){return null}}'
    'var here=live(location.href);if(here){location.replace(here);return}'
    '["pushState","replaceState"].forEach(function(k){var o=history[k];history[k]=function(s,t,u){'
    'var l=u!=null&&live(String(u));if(l){location.assign(l);return}return o.apply(this,arguments)}});'
    'function fix(u){return typeof u=="string"&&u.charAt(0)=="/"&&u.charAt(1)!="/"'
    '&&u!==B&&u.indexOf(B+"/")!==0?B+u:u}'
    'document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest("a[href]");'
    'if(!a)return;var h=a.getAttribute("href"),n=fix(h),l=live(n);'
    'if(l){a.setAttribute("href",l);if(!a.target){e.preventDefault();e.stopPropagation();location.assign(l)}return}'
    'if(n!==h)a.setAttribute("href",n)},true);'
    '})();</script>' % (BASE, LIVE_APP, APP_ROUTES.replace("/", r"\/"))
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
