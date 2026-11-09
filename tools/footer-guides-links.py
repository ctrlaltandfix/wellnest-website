#!/usr/bin/env python3
"""Add a "Guides & trackers" row of links to the WellNest footer (homepage style).

Why: Google had found ~29 content pages only through the sitemap and never
crawled them ("Discovered - currently not indexed"). The homepage is the page
Google visits most, and its footer linked to none of the guides. The other
content pages already link to each other in their footers.

The row goes just above the copyright line, in:
  - the prerendered pages that use this footer (index, 404, pricing, ...)
  - the app's own copies of the footer (it redraws pages after loading)
  - the stylesheet (one small rule set)
Re-runnable: does nothing if the row is already there.
"""
import glob, html, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "/wellnest-website"

LINKS = [
    ("/symptom-tracker-app", "Symptom tracker app"),
    ("/pain-scale-chart", "Pain scale chart 1–10"),
    ("/medication-tracker", "Medication tracker"),
    ("/fibromyalgia-tracker", "Fibromyalgia tracker"),
    ("/medical-expense-tracker", "Medical expense tracker"),
    ("/emergency-action-plan", "Emergency action plan"),
    ("/how-to-describe-pain-to-your-doctor", "Describing pain to your doctor"),
    ("/flare-up-diary-guide", "Flare-up diary guide"),
    ("/symptom-diary-guide", "Symptom diary guide"),
    ("/crps-symptoms-guide", "CRPS symptoms guide"),
    ("/asthma-action-plan-guide", "Asthma action plan guide"),
    ("/seizure-first-aid-and-diary", "Seizure first aid & diary"),
    ("/chronic-health-tracker-guide", "Chronic health tracker guide"),
    ("/best-chronic-illness-tracker-apps", "Best chronic illness tracker apps"),
    ("/wellnest-vs-bearable", "WellNest vs Bearable"),
    ("/wellnest-vs-careclinic", "WellNest vs CareClinic"),
    ("/wellnest-vs-manage-my-pain", "WellNest vs Manage My Pain"),
    ("/press", "Press"),
]
LABEL = "Guides & trackers"
ARIA = "Guides and trackers"

CSS = (".hb-site .hb-footer-more{display:flex;flex-wrap:wrap;gap:9px 20px;padding:0 0 30px}"
       ".hb-site .hb-footer-more span{width:100%;color:#204434;margin-bottom:3px;font-size:11px;font-weight:800}"
       ".hb-site .hb-footer-more a{color:#708578;font-size:12px;transition:color .2s}"
       ".hb-site .hb-footer-more a:hover{color:#176848}")


def html_row():
    links = "".join(f'<a href="{BASE}{href}">{html.escape(text, quote=False)}</a>' for href, text in LINKS)
    return f'<nav class="hb-footer-more" aria-label="{ARIA}"><span>{html.escape(LABEL, quote=False)}</span>{links}</nav>'


def js_row():
    kids = ",".join(f"(0,R.jsx)(`a`,{{href:`{href}`,children:`{text}`}})" for href, text in LINKS)
    return (f"(0,R.jsxs)(`nav`,{{className:`hb-footer-more`,\"aria-label\":`{ARIA}`,"
            f"children:[(0,R.jsx)(`span`,{{children:`{LABEL}`}}),{kids}]}}),")


def main():
    changed = []
    # Pages
    for path in sorted(glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)):
        if "/dist-cloudflare/" in path or "/node_modules/" in path:
            continue
        s = open(path, encoding="utf-8").read()
        if 'class="hb-footer-bottom"' not in s or "hb-footer-more" in s:
            continue
        s2 = s.replace('<div class="hb-footer-bottom">', html_row() + '<div class="hb-footer-bottom">', 1)
        open(path, "w", encoding="utf-8").write(s2)
        changed.append(os.path.relpath(path, ROOT))

    # App copies of the footer (the app's own JSX runtime is imported as R)
    index = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    apps = sorted(set(re.findall(r'assets/index[^"/]*\.js', index)))
    for rel in apps:
        p = os.path.join(ROOT, rel)
        s = open(p, encoding="utf-8").read()
        if "hb-footer-more" in s:
            continue
        anchor = "(0,R.jsxs)(`div`,{className:`hb-footer-bottom`"
        n = s.count(anchor)
        if not n:
            sys.exit(f"{rel}: footer not found - the app has changed; update this tool")
        s = s.replace(anchor, js_row() + anchor)
        open(p, "w", encoding="utf-8").write(s)
        changed.append(f"{rel} ({n} footers)")

    # Stylesheet the pages load
    for rel in sorted(set(re.findall(r'assets/index[^"/]*\.css', index))):
        p = os.path.join(ROOT, rel)
        s = open(p, encoding="utf-8").read()
        if ".hb-footer-more" in s:
            continue
        open(p, "w", encoding="utf-8").write(s.rstrip("\n") + "\n" + CSS + "\n")
        changed.append(rel)

    print("\n".join(changed) if changed else "Already applied.")


if __name__ == "__main__":
    main()
