#!/usr/bin/env python3
"""Give every page one address search engines can trust.

wellnest.services serves clean addresses (/pricing, /free-tools). Older links,
canonical tags, the sitemap and the app's page list still pointed some pages at
addresses that redirect (/free-tools.html) or don't exist (/Pricing,
/PrivacyPolicy, /TermsOfService), so search engines saw a redirect or a 404 as
each page's "real" address. This rewrites those references to the clean,
lower-case address the page is actually served at.

Touches only page addresses: links to site pages, canonical/og:url/JSON-LD URLs,
the sitemap, llms*.txt, and canonicalPath / absolute URLs in the app bundle.
App routes, asset files and other code are left alone. Safe to re-run.

Usage: python3 tools/seo-urls.py [repo-root]
"""
import pathlib, re, sys, datetime

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
TODAY = datetime.date.today().isoformat()
RENAMED = {"Pricing": "pricing", "PrivacyPolicy": "privacypolicy", "TermsOfService": "termsofservice"}
SKIP_DIRS = {".git", "node_modules", "dist-cloudflare", ".wrangler", "cloudflare", "tools", "tests", "netlify", "admin"}
BUNDLES = sorted(ROOT.glob("assets/index-calendar-*.js"))

# A site page reference: absolute (https://wellnest.services/x) or the GitHub
# Pages form (/wellnest-website/x), followed by a page slug.
PREFIX = r"(https://(?:www\.)?wellnest\.services/|/wellnest-website/)"

def page_slug(slug):
    """The clean address for a slug like 'free-tools.html' or 'Pricing'."""
    base = slug[:-5] if slug.endswith(".html") else slug
    base = RENAMED.get(base, base)
    return "" if base == "index" else base

def fix_text(text):
    # x.html -> x (root-level pages only; not 404.html, not asset files)
    text = re.sub(PREFIX + r"(?!404\.html)([A-Za-z0-9-]+)\.html(?=[\"'#?`)\s<,]|$)",
                  lambda m: m.group(1) + page_slug(m.group(2) + ".html"), text)
    # /Pricing, /PrivacyPolicy, /TermsOfService -> lower case
    text = re.sub(PREFIX + r"(" + "|".join(RENAMED) + r")(?=[\"'#?`)\s<,/]|$)",
                  lambda m: m.group(1) + RENAMED[m.group(2)], text)
    return text

def fix_bundle(text):
    text = re.sub(r"canonicalPath:`/([A-Za-z0-9-]+)(?:\.html)?`",
                  lambda m: "canonicalPath:`/" + page_slug(m.group(1)) + "`", text)
    text = re.sub(r"(https://wellnest\.services/)([A-Za-z0-9-]+)\.html(?=`)", lambda m: m.group(1) + page_slug(m.group(2) + ".html"), text)
    text = re.sub(r"(https://wellnest\.services/|(?<=[>\s])wellnest\.services/)(" + "|".join(RENAMED) + r")(?=[`<\s])",
                  lambda m: m.group(1) + RENAMED[m.group(2)], text)
    # Links the app draws: <a href> and router <Link to>. (Its router ignores case.)
    text = re.sub(r"\b(href|to):`/(" + "|".join(RENAMED) + r")`", lambda m: f"{m.group(1)}:`/{RENAMED[m.group(2)]}`", text)
    # (Only <a href>: the router's own redirects to /x.html are how the app reaches those pages.)
    text = re.sub(r"\bhref:`/([a-z0-9-]+)\.html`", lambda m: f"href:`/{page_slug(m.group(1) + '.html')}`", text)
    # A page without its own canonical address falls back to /PageName: lower-case it.
    text = text.replace("`/${e}`);document.title", "`/${e.toLowerCase()}`);document.title")
    return text

def fix_sitemap(text):
    seen, out = set(), []
    for old_block in re.findall(r"\s*<url>.*?</url>", text, re.S):
        block = fix_text(old_block)
        if block != old_block:  # its address changed: ask search engines to look again
            block = re.sub(r"<lastmod>[^<]*</lastmod>", f"<lastmod>{TODAY}</lastmod>", block)
        loc = re.search(r"<loc>([^<]+)</loc>", block).group(1)
        if loc in seen:
            continue
        seen.add(loc)
        out.append(block)
    head, tail = text.split("<url>", 1)[0].rstrip(), "\n</urlset>\n"
    return head + "".join(out) + tail

changed = []
for path in sorted(ROOT.rglob("*")):
    if not path.is_file() or any(p in SKIP_DIRS for p in path.relative_to(ROOT).parts):
        continue
    rel = path.relative_to(ROOT).as_posix()
    if path.suffix in (".html", ".txt", ".xml", ".webmanifest", ".json") and not rel.startswith("assets/"):
        old = path.read_text(encoding="utf-8", errors="surrogateescape")
        new = fix_sitemap(old) if rel == "sitemap.xml" else fix_text(old)
        if new != old:
            path.write_text(new, encoding="utf-8", errors="surrogateescape")
            changed.append(rel)
for path in BUNDLES:
    old = path.read_text(encoding="utf-8")
    new = fix_bundle(old)
    if new != old:
        path.write_text(new, encoding="utf-8")
        changed.append(path.relative_to(ROOT).as_posix())

print(f"{len(changed)} files updated")
for c in changed[:60]:
    print("  " + c)
