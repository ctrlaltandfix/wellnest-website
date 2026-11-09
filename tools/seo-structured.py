#!/usr/bin/env python3
"""Richer search and share data for every page in the sitemap.

For each page (and its twin x/index.html, and 404.html as the homepage's copy):
- Share image: og:image / twitter:image point at the page's own 1200x630 image
  (og/<page>.png, from tools/og-images.mjs) as absolute URLs, with size and alt.
- Organization: a PNG logo (Google doesn't take SVG logos) and the App Store
  listing as sameAs.
- A <script id="wn-seo-extra"> block of structured data:
    BreadcrumbList   Home > (Guides | Free tools) > page
    Article          guides and comparisons: headline, dates, publisher, image
    FAQPage          the page's visible FAQ (details.faq-item), if it has none yet
    WebSite          homepage: the site's name for search results
- A tiny script (wn-seo-dedupe) that switches off the copies of these types the
  app adds again after it loads, so search engines see each one once. (It
  changes their type rather than removing them: the app removes its own later.)
- The app bundle's Organization logos point at the PNG logo too.
Article details (author, publish date, sources) come from the app's guide pages
where it has them. Safe to re-run: blocks and tags are replaced, not duplicated.

Usage: python3 tools/seo-structured.py [repo-root]
"""
import html as H, json, pathlib, re, sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
SITE = "https://wellnest.services"
ORG = SITE + "/#organization"
APP_STORE = "https://apps.apple.com/au/app/wellnest/id6759418128"
LOGO = {"@type": "ImageObject", "url": SITE + "/og/logo.png", "width": 512, "height": 512}
AUTHOR = {"@type": "Person", "name": "Chris Greenfield", "url": SITE + "/about", "jobTitle": "Founder"}
BUNDLES = sorted(ROOT.glob("assets/index-calendar-*.js"))

def app_guides():
    """Publish date, sources and article flag for pages drawn by the app's guide template."""
    info = {}
    for bundle in BUNDLES:
        code = bundle.read_text(encoding="utf-8")
        default = (re.search(r"publishedDate:_=`([0-9-]+)`", code) or [None, None])[1]
        starts = [m for m in re.finditer(r"\(Uv,\{pageName:`[^`]+`,url:`https://wellnest\.services/([^`]*)`", code)]
        for i, m in enumerate(starts):
            seg = code[m.start(): starts[i + 1].start() if i + 1 < len(starts) else m.start() + 60000]
            pub = re.search(r"publishedDate:`([0-9-]+)`", seg)
            src = re.search(r"sources:\[(.*?)\]", seg, re.S)
            info[m.group(1) or "index"] = {"published": pub.group(1) if pub else default,
                                         "article": not re.search(r"\barticle:!1", seg),
                                         "sources": re.findall(r"url:`(https?://[^`]+)`", src.group(1)) if src else []}
    return info
APP = app_guides()

# Runs before the app: the app adds its own breadcrumbs / FAQ / article data after
# loading; turn those copies off so each type appears once (ours, already in the page).
DEDUPE = ("<script id=\"wn-seo-dedupe\">(function(){var own=document.getElementById(\"wn-seo-extra\");if(!own||!window.MutationObserver)return;"
  "var have={};try{JSON.parse(own.textContent)[\"@graph\"].forEach(function(n){have[n[\"@type\"]]=1})}catch(e){return}"
  "function fix(el){if(el===own||el.type!==\"application/ld+json\")return;try{var d=JSON.parse(el.textContent),g=d[\"@graph\"]||[d],"
  "k=g.filter(function(n){return !have[n[\"@type\"]]});if(k.length===g.length)return;if(!k.length){el.type=\"application/x-wn-duplicate\";return}"
  "el.textContent=JSON.stringify(d[\"@graph\"]?Object.assign(d,{\"@graph\":k}):k[0])}catch(e){}}"
  "new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.tagName===\"SCRIPT\")fix(n);"
  "else if(n.querySelectorAll)n.querySelectorAll(\"script\").forEach(fix)})})}).observe(document.documentElement,{childList:true,subtree:true})})();</script>")

GUIDES = {"chronic-health-tracker-guide", "best-chronic-illness-tracker-apps", "flare-up-diary-guide", "symptom-diary-guide",
          "appointment-prep-checklist", "asthma-action-plan-guide", "seizure-first-aid-and-diary", "crps-symptoms-guide",
          "how-to-describe-pain-to-your-doctor", "pain-scale-chart"}
COMPARE = {"wellnest-vs-bearable", "wellnest-vs-manage-my-pain", "wellnest-vs-careclinic"}
TOOLS = {"free-medication-list", "free-symptom-summary-maker", "chronic-pain-diary"}

def text(fragment):
    return re.sub(r"\s+", " ", H.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()

def meta(page, attr, name):
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', page)
    return H.unescape(m.group(1)) if m else ""

def headline(page):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", page, re.S)
    h1 = text(m.group(1)) if m else ""
    title = re.sub(r"\s*[|–-]\s*WellNest.*$", "", meta(page, "property", "og:title")).strip()
    return h1 if h1 and len(h1) <= 70 else (title or h1)

def faq_items(page):
    items = []
    for m in re.finditer(r'<details class="faq-item">\s*<summary>(.*?)</summary>\s*(.*?)</details>', page, re.S):
        q = text(re.sub(r'<span class="faq-icon"></span>', "", m.group(1)))
        a = text(m.group(2))
        if q and a:
            items.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}})
    return items

def ld_types(page):
    types = set()
    for m in re.finditer(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', page, re.S):
        if 'id="wn-seo-extra"' in m.group(0)[:80]:
            continue
        try:
            data = json.loads(m.group(1))
        except ValueError:
            continue
        for node in data.get("@graph", [data]) if isinstance(data, dict) else data:
            t = node.get("@type")
            types.update(t if isinstance(t, list) else [t])
    return types

def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

def fix_organization(page):
    """PNG logo + App Store as sameAs, wherever the Organization node is written out."""
    def one(m):
        try:
            data = json.loads(m.group(2))
        except ValueError:
            return m.group(0)
        nodes = data.get("@graph", [data]) if isinstance(data, dict) else data
        changed = False
        for node in nodes:
            if node.get("@id") == ORG or (node.get("@type") == "Organization" and node.get("name") == "WellNest"):
                if node.get("logo") != LOGO:
                    node["logo"] = LOGO; changed = True
                same = node.get("sameAs") or []
                same = [same] if isinstance(same, str) else same
                if APP_STORE not in same:
                    node["sameAs"] = same + [APP_STORE]; changed = True
        return m.group(1) + dump(data) + m.group(3) if changed else m.group(0)
    return re.sub(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', one, page, flags=re.S)

def share_tags(page, slug, name):
    img = f"{SITE}/og/{slug}.png"
    alt = H.escape(f"{name} — WellNest", quote=True)
    page = re.sub(r'\s*<meta property="og:image:(?:width|height|type|alt)" content="[^"]*" />', "", page)
    page = re.sub(r'\s*<meta name="twitter:image:alt" content="[^"]*" />', "", page)
    tags = (f'<meta property="og:image" content="{img}" />\n    <meta property="og:image:width" content="1200" />\n'
            f'    <meta property="og:image:height" content="630" />\n    <meta property="og:image:type" content="image/png" />\n'
            f'    <meta property="og:image:alt" content="{alt}" />')
    page, n = re.subn(r'<meta property="og:image" content="[^"]*" />', tags, page, count=1)
    if not n:
        page = page.replace("</head>", "    " + tags + "\n  </head>", 1)
    tw = f'<meta name="twitter:image" content="{img}" />\n    <meta name="twitter:image:alt" content="{alt}" />'
    page, n = re.subn(r'<meta name="twitter:image" content="[^"]*" />', tw, page, count=1)
    if not n:
        page = page.replace("</head>", "    " + tw + "\n  </head>", 1)
    return page

SECTION_PAGES = {"chronic-illness-tracker", "symptom-tracker-app", "crps-tracker", "asthma-tracker", "seizure-diary", "fibromyalgia-tracker",
                 "medication-tracker", "emergency-action-plan", "medical-expense-tracker", "guides", "free-tools"}

def short_title(page):
    return re.split(r"\s+[|–]\s+", meta(page, "property", "og:title"))[0].strip() or headline(page)

def extra_graph(page, slug, lastmod):
    url = SITE + ("/" if slug == "index" else "/" + slug)
    name = headline(page)
    graph = []
    if slug == "index":
        graph.append({"@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/", "name": "WellNest",
                      "alternateName": ["WellNest chronic health tracker", "wellnest.services"], "inLanguage": "en-AU",
                      "publisher": {"@id": ORG}})
    else:
        crumbs = [("Home", SITE + "/")]
        if slug in GUIDES or slug in COMPARE:
            crumbs.append(("Guides", SITE + "/guides"))
        elif slug in TOOLS:
            crumbs.append(("Free tools", SITE + "/free-tools"))
        crumb = name if (slug in GUIDES or slug in COMPARE) else short_title(page)
        crumbs.append((crumb, url))
        graph.append({"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]})
    app = APP.get(slug, {})
    if (slug in GUIDES or slug in COMPARE) and app.get("article", True):
        article = {"@type": "Article", "@id": url + "#article", "headline": name[:110],
                   "description": meta(page, "name", "description"), "image": f"{SITE}/og/{slug}.png",
                   "author": AUTHOR, "publisher": {"@id": ORG}, "mainEntityOfPage": {"@id": url + "#webpage"},
                   "inLanguage": "en-AU"}
        if app.get("published"):
            article["datePublished"] = app["published"]
        if app.get("sources"):
            article["citation"] = app["sources"]
        # The repo's history starts when the site was imported, so it can't say when a
        # page was first published; the sitemap's last-updated date is reliable.
        if lastmod:
            article["dateModified"] = max(lastmod, article.get("datePublished", lastmod))
        graph.append(article)
    if "FAQPage" not in ld_types(page):
        items = faq_items(page)
        if len(items) >= 2:
            graph.append({"@type": "FAQPage", "@id": url + "#faq", "mainEntity": items})
    return graph

def apply(page, slug, lastmod):
    page = re.sub(r'\s*<script id="wn-seo-extra" type="application/ld\+json">.*?</script>', "", page, flags=re.S)
    page = re.sub(r'\s*<script id="wn-seo-dedupe">.*?</script>', "", page, flags=re.S)
    page = fix_organization(page)
    page = share_tags(page, slug, headline(page) if slug != "index" else "Chronic health tracker")
    graph = extra_graph(page, slug, lastmod)
    if graph:
        block = f'    <script id="wn-seo-extra" type="application/ld+json">{dump({"@context": "https://schema.org", "@graph": graph})}</script>\n'
        page = page.replace("</head>", block + "    " + DEDUPE + "\n  </head>", 1)
    return page

sitemap = (ROOT / "sitemap.xml").read_text()
entries = re.findall(r"<loc>https://wellnest\.services/?([^<]*)</loc>\s*<lastmod>([^<]*)</lastmod>", sitemap)
changed = []
for slug, lastmod in entries:
    slug = slug or "index"
    targets = [ROOT / f"{slug}.html"] + ([ROOT / slug / "index.html"] if (ROOT / slug / "index.html").exists() else [])
    if slug == "index":
        targets.append(ROOT / "404.html")
    for path in targets:
        old = path.read_text(encoding="utf-8")
        new = apply(old, slug, lastmod)
        if new != old:
            path.write_text(new, encoding="utf-8")
            changed.append(path.relative_to(ROOT).as_posix())
LOGO_JS = '{"@type":`ImageObject`,url:`' + LOGO["url"] + '`,width:512,height:512}'
for bundle in BUNDLES:
    code = bundle.read_text(encoding="utf-8")
    new = re.sub(r'logo:\{"@type":`ImageObject`,url:`[^`]*`(?:,width:\d+,height:\d+)?\}', "logo:" + LOGO_JS, code)
    if new != code:
        bundle.write_text(new, encoding="utf-8")
        changed.append(bundle.relative_to(ROOT).as_posix())
print(f"{len(changed)} files updated")
