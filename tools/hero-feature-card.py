#!/usr/bin/env python3
"""Replace the homepage hero graphic with the WellNest feature card.

The homepage hero is drawn by the app (component `tv` in the main bundle), and
index.html / 404.html hold a prerendered copy shown until the app loads. This
swaps both for the feature card below and adds its styles to the main CSS.
Safe to re-run: it replaces the previous card if one is already there.

Usage: python3 tools/hero-feature-card.py [repo_dir]
"""
import json, math, pathlib, random, re, sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
BUNDLE = ROOT / "assets" / "index-calendar-20261107-wn2.js"
CSS = ROOT / "assets" / "index-Cj0oiCRe-wn2.css"
PAGES = [ROOT / "index.html", ROOT / "404.html"]

# ---------- illustrative 30-day pain trend (easing over the month) ----------
random.seed(7)
W, H = 320, 96
vals = []
for i in range(30):
    base = 7.6 - 4.2 * (i / 29) ** 0.9
    flare = {5: 1.2, 6: 0.8, 13: 1.0, 21: 0.7}.get(i, 0)
    vals.append(max(2.2, min(8.8, base + flare + random.uniform(-0.3, 0.3))))
pts = [(round(i * W / 29, 1), round(H - 8 - (v - 2) / 7 * (H - 20), 1)) for i, v in enumerate(vals)]

def smooth(points):
    d = f"M{points[0][0]} {points[0][1]}"
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i else points[i]
        p1, p2 = points[i], points[i + 1]
        p3 = points[i + 2] if i + 2 < len(points) else p2
        c1 = (round(p1[0] + (p2[0] - p0[0]) / 6, 1), round(p1[1] + (p2[1] - p0[1]) / 6, 1))
        c2 = (round(p2[0] - (p3[0] - p1[0]) / 6, 1), round(p2[1] - (p3[1] - p1[1]) / 6, 1))
        d += f" C{c1[0]} {c1[1]} {c2[0]} {c2[1]} {p2[0]} {p2[1]}"
    return d

LINE = smooth(pts)
AREA = LINE + f" L{W} {H} L0 {H} Z"
END = pts[-1]

# ---------- the card, as a small element tree ----------
def E(tag, attrs=None, *children):
    return (tag, attrs or {}, list(children))

ARROW = E("svg", {"viewBox": "0 0 16 16", "aria-hidden": "true", "className": "hb-fc-arrow"},
          E("path", {"d": "M3 8h9M8.5 4l4 4-4 4", "fill": "none", "stroke": "currentColor", "strokeWidth": "1.8", "strokeLinecap": "round", "strokeLinejoin": "round"}))
CHECK = E("svg", {"viewBox": "0 0 16 16", "aria-hidden": "true"},
          E("path", {"d": "M3.5 8.5l3 3 6-7", "fill": "none", "stroke": "currentColor", "strokeWidth": "2", "strokeLinecap": "round", "strokeLinejoin": "round"}))

def stat(label, value, unit, delta, down=False):
    big = E("strong", {}, value, E("small", {}, unit)) if unit else E("strong", {}, value)
    return E("div", {"className": "hb-fc-stat"},
             E("span", {"className": "hb-fc-label"}, label), big,
             E("span", {"className": "hb-fc-delta hb-fc-down" if down else "hb-fc-delta"}, delta))

CARD = E("div", {"className": "hb-hero-visual hb-fc-stage", "aria-label": "Illustrative preview: a WellNest summary ready for your next appointment", "data-hb-reveal": True},
  E("div", {"className": "hb-fc-glow", "aria-hidden": "true"}),
  E("article", {"className": "hb-fc"},
    E("div", {"className": "hb-fc-top"},
      E("span", {"className": "hb-fc-badge"}, E("span", {"className": "hb-fc-pulse", "aria-hidden": "true"}), "Ready for your next appointment"),
      E("span", {"className": "hb-fc-range"}, "Last 30 days")),
    E("h2", {"className": "hb-fc-title"}, "Your health story, ", E("em", {}, "in one page.")),
    E("div", {"className": "hb-fc-stats"},
      stat("Average pain", "5.2", "/10", "↓ 18% vs last month", True),
      stat("Doses on time", "96", "%", "58 of 60 taken"),
      stat("Flares logged", "3", None, "2 after cold days")),
    E("div", {"className": "hb-fc-chart", "role": "img", "aria-label": "Illustrative 30-day pain trend, easing across the month"},
      E("svg", {"viewBox": f"0 0 {W} {H}", "preserveAspectRatio": "none", "aria-hidden": "true"},
        E("defs", {}, E("linearGradient", {"id": "hbFcFill", "x1": "0", "y1": "0", "x2": "0", "y2": "1"},
          E("stop", {"offset": "0", "stopColor": "#d8fa8d", "stopOpacity": "0.38"}),
          E("stop", {"offset": "1", "stopColor": "#d8fa8d", "stopOpacity": "0"}))),
        E("path", {"d": AREA, "fill": "url(#hbFcFill)"}),
        E("path", {"className": "hb-fc-line", "d": LINE, "fill": "none", "stroke": "#d8fa8d", "strokeWidth": "2.4", "strokeLinecap": "round", "vectorEffect": "non-scaling-stroke"})),
      E("div", {"className": "hb-fc-axis", "aria-hidden": "true"}, E("span", {}, "1 Oct"), E("span", {}, "15 Oct"), E("span", {}, "30 Oct"))),
    E("ul", {"className": "hb-fc-insights"},
      E("li", {}, E("span", {"className": "hb-fc-dot", "aria-hidden": "true"}), "Flares followed cold, wet days"),
      E("li", {}, E("span", {"className": "hb-fc-dot", "aria-hidden": "true"}), "Pain eased in weeks with 7+ hours of sleep")),
    E("div", {"className": "hb-fc-actions"},
      E("span", {"className": "hb-fc-btn"}, "Export PDF for my specialist", ARROW),
      E("span", {"className": "hb-fc-share"}, "Share with care circle")),
    E("p", {"className": "hb-fc-note"}, "Illustrative preview · Example data")),
  E("div", {"className": "hb-fc-chip hb-fc-chip-dose", "aria-hidden": "true"},
    E("span", {"className": "hb-fc-check"}, CHECK),
    E("span", {}, E("strong", {}, "Gabapentin taken"), E("small", {}, "8:02 am · on time"))),
  E("div", {"className": "hb-fc-chip hb-fc-chip-streak", "aria-hidden": "true"},
    E("strong", {}, "14"), E("span", {}, "days seizure-free")),
)

# ---------- render to React calls (bundle) and HTML (prerender) ----------
def jsx(node):
    if isinstance(node, str):
        return json.dumps(node, ensure_ascii=False)
    tag, attrs, children = node
    props = []
    for k, v in attrs.items():
        key = k if re.match(r"^[A-Za-z_$][\w$]*$", k) else json.dumps(k)
        if isinstance(v, dict):
            v = "{" + ",".join(f"{kk}:{json.dumps(vv)}" for kk, vv in v.items()) + "}"
        elif v is True:
            v = "!0"
        else:
            v = json.dumps(v, ensure_ascii=False)
        props.append(f"{key}:{v}")
    if len(children) == 1:
        props.append(f"children:{jsx(children[0])}")
        fn = "R.jsx"
    elif children:
        props.append("children:[" + ",".join(jsx(c) for c in children) + "]")
        fn = "R.jsxs"
    else:
        fn = "R.jsx"
    return f"(0,{fn})({json.dumps(tag)},{{{','.join(props)}}})"

HTML_ATTR = {"className": "class", "strokeWidth": "stroke-width", "strokeLinecap": "stroke-linecap",
             "strokeLinejoin": "stroke-linejoin", "stopColor": "stop-color", "stopOpacity": "stop-opacity",
             "vectorEffect": "vector-effect"}
def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
def html(node):
    if isinstance(node, str):
        return esc(node)
    tag, attrs, children = node
    out = []
    for k, v in attrs.items():
        name = HTML_ATTR.get(k, k)
        if isinstance(v, dict):
            v = ";".join(f"{kk}:{vv}" for kk, vv in v.items())
        if v is True:
            out.append(f'{name}="true"')
        else:
            out.append(f'{name}="{esc(str(v))}"')
    open_tag = f"<{tag}{' ' if out else ''}{' '.join(out)}>"
    return open_tag + "".join(html(c) for c in children) + f"</{tag}>"

STYLES = """
/* hb-feature-card:start */
.hb-hero-visual.hb-fc-stage{height:auto;min-height:600px;padding:58px 0 58px;transform:translate(10px)}
.hb-fc-glow{position:absolute;inset:8% 6% 12%;border-radius:50%;background:radial-gradient(closest-side,#d8fa8d40,#d8fa8d12 55%,transparent);filter:blur(30px);z-index:0;animation:hb-fc-breathe 7s ease-in-out infinite}
@property --hb-fc-angle{syntax:"<angle>";inherits:false;initial-value:0deg}
.hb-fc{position:relative;z-index:2;width:min(100%,480px);padding:26px 26px 20px;border-radius:28px;color:#f3faf0;background:linear-gradient(155deg,#15463c 0%,#0e3029 45%,#0a2420 100%);box-shadow:0 40px 90px #010d0f8c,0 0 0 1px #d8fa8d2e,inset 0 1px 0 #ffffff1f;transform:rotate(-2deg);animation:hb-hover 8s ease-in-out infinite;isolation:isolate}
.hb-fc:before{content:"";position:absolute;inset:-1.5px;border-radius:inherit;padding:1.5px;background:conic-gradient(from var(--hb-fc-angle),#d8fa8d00 0deg,#d8fa8d 60deg,#d8fa8d00 130deg,#d8fa8d00 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:hb-fc-spin 6s linear infinite;pointer-events:none;z-index:-1}
.hb-fc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.hb-fc-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 12px 7px 10px;border-radius:999px;background:#d8fa8d;color:#0b2621;font:700 12px/1 Geist,Inter,system-ui,sans-serif;letter-spacing:.01em}
.hb-fc-pulse{width:8px;height:8px;border-radius:50%;background:#1f7a52;box-shadow:0 0 0 0 #1f7a5299;animation:hb-fc-pulse 2s ease-out infinite}
.hb-fc-range{font:600 11px/1 Geist,Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#bcd3c4}
.hb-fc-title{margin:18px 0 18px;font:700 clamp(26px,3vw,32px)/1.05 Bricolage Grotesque,Geist,sans-serif;letter-spacing:-.03em;color:#f3faf0}
.hb-fc-title em{font:italic 400 1.08em/1 Instrument Serif,Georgia,serif;letter-spacing:-.01em;color:#d8fa8d}
.hb-fc-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.hb-fc-stat{display:flex;flex-direction:column;gap:4px;padding:12px 12px 11px;border-radius:16px;background:#ffffff0d;border:1px solid #ffffff14;min-width:0}
.hb-fc-label{font:600 11px/1.2 Geist,Inter,system-ui,sans-serif;color:#a9c4b5}
.hb-fc-stat strong{font:700 28px/1 Bricolage Grotesque,Geist,sans-serif;letter-spacing:-.03em;color:#fff}
.hb-fc-stat strong small{font-size:14px;font-weight:600;color:#a9c4b5;margin-left:1px}
.hb-fc-delta{font:500 11px/1.25 Geist,Inter,system-ui,sans-serif;color:#cfe0d5}
.hb-fc-delta.hb-fc-down{color:#d8fa8d}
.hb-fc-chart{position:relative;margin-top:16px;padding:14px 12px 8px;border-radius:18px;background:linear-gradient(180deg,#ffffff0a,#ffffff03);border:1px solid #ffffff12}
.hb-fc-chart svg{display:block;width:100%;height:96px;overflow:visible}
.hb-fc-line{filter:drop-shadow(0 0 6px #d8fa8d99);stroke-dasharray:900;stroke-dashoffset:900;animation:hb-fc-draw 2.2s .3s cubic-bezier(.3,.7,.2,1) forwards}
.hb-fc-axis{display:flex;justify-content:space-between;margin-top:6px;font:600 10px/1 Geist,Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#8fab9c}
.hb-fc-insights{list-style:none;margin:14px 0 0;padding:0;display:grid;gap:8px}
.hb-fc-insights li{display:flex;align-items:center;gap:10px;font:500 13.5px/1.35 Geist,Inter,system-ui,sans-serif;color:#e4efe7}
.hb-fc-dot{flex:none;width:7px;height:7px;border-radius:50%;background:#d8fa8d;box-shadow:0 0 10px #d8fa8d}
.hb-fc-actions{display:flex;align-items:center;gap:14px;margin-top:18px;flex-wrap:wrap}
.hb-fc-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 16px;border-radius:999px;background:#d8fa8d;color:#0b2621;font:700 13.5px/1 Geist,Inter,system-ui,sans-serif;box-shadow:0 10px 24px #d8fa8d2e}
.hb-fc-arrow{width:15px;height:15px}
.hb-fc-share{font:600 13px/1 Geist,Inter,system-ui,sans-serif;color:#cfe0d5;text-decoration:underline;text-decoration-color:#d8fa8d80;text-underline-offset:4px}
.hb-fc-note{margin:14px 0 0;font:500 11px/1 Geist,Inter,system-ui,sans-serif;color:#86a394;text-align:right}
.hb-fc-chip{position:absolute;z-index:3;display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:18px;background:#f3faf0;color:#16372f;box-shadow:0 22px 45px #010d0f59;border:1px solid #ffffffb3;font-family:Geist,Inter,system-ui,sans-serif}
.hb-fc-chip strong{display:block;font-size:13.5px;font-weight:700;line-height:1.2}
.hb-fc-chip small{display:block;font-size:11.5px;color:#56715f;margin-top:2px}
.hb-fc-chip-dose{left:0;bottom:6px;transform:rotate(-3deg);animation:hb-hover 7s 1s ease-in-out infinite}
.hb-fc-check{display:grid;place-items:center;width:30px;height:30px;border-radius:10px;background:#1f7a52;color:#fff}
.hb-fc-check svg{width:16px;height:16px}
.hb-fc-chip-streak{right:0;top:0;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 16px;transform:rotate(4deg);animation:hb-hover 9s .5s ease-in-out infinite;background:#d8fa8d;border-color:#ecffc4}
.hb-fc-chip-streak strong{font:700 30px/1 Bricolage Grotesque,Geist,sans-serif;letter-spacing:-.03em}
.hb-fc-chip-streak span{font-size:12px;font-weight:600;color:#2d5240}
@keyframes hb-fc-spin{to{--hb-fc-angle:360deg}}
@keyframes hb-fc-pulse{0%{box-shadow:0 0 0 0 #1f7a5299}80%,to{box-shadow:0 0 0 9px #1f7a5200}}
@keyframes hb-fc-draw{to{stroke-dashoffset:0}}
@keyframes hb-fc-breathe{0%,to{opacity:.75;scale:1}50%{opacity:1;scale:1.05}}
@media (width<=900px){.hb-hero-visual.hb-fc-stage{min-height:0;margin:20px auto 0;padding:52px 0 52px;transform:none}}
@media (width<=650px){.hb-hero-visual.hb-fc-stage{padding:0 0 64px}.hb-fc{padding:22px 18px 18px;border-radius:24px;transform:none}.hb-fc-stats{gap:6px}.hb-fc-stat{padding:10px 9px}.hb-fc-stat strong{font-size:23px}.hb-fc-delta{font-size:10.5px}.hb-fc-chip-dose{left:4px;bottom:0;padding:9px 12px}.hb-fc-chip-streak{right:4px;top:auto;bottom:0;padding:8px 12px;transform:rotate(3deg)}.hb-fc-chip-streak strong{font-size:24px}.hb-fc-note{text-align:left}}
@media (prefers-reduced-motion:reduce){.hb-fc,.hb-fc:before,.hb-fc-glow,.hb-fc-chip,.hb-fc-pulse{animation:none}.hb-fc-line{animation:none;stroke-dashoffset:0}}
/* hb-feature-card:end */
"""

# ---------- apply ----------
bundle = BUNDLE.read_text(encoding="utf-8")
m = re.search(r"function tv\(\)\{return.*?\}(?=function nv\(\))", bundle, re.S)
if not m:
    sys.exit("hero component tv() not found in the bundle")
bundle = bundle[:m.start()] + "function tv(){return " + jsx(CARD) + "}" + bundle[m.end():]
BUNDLE.write_text(bundle, encoding="utf-8")

def replace_div(text, start):
    """Replace the <div ...> starting at `start` (with its matching </div>)."""
    depth, i = 0, start
    for t in re.finditer(r"<div\b|</div>", text[start:]):
        depth += 1 if t.group(0) == "<div" else -1
        if depth == 0:
            end = start + t.end()
            return text[:start] + html(CARD) + text[end:]
    raise SystemExit("unbalanced hero markup")

for page in PAGES:
    if not page.exists():
        continue
    t = page.read_text(encoding="utf-8")
    i = t.find('<div class="hb-hero-visual')
    if i < 0:
        print(f"{page.name}: no prerendered hero (skipped)")
        continue
    page.write_text(replace_div(t, i), encoding="utf-8")
    print(f"{page.name}: prerendered hero replaced")

css = CSS.read_text(encoding="utf-8")
css = re.sub(r"\n?/\* hb-feature-card:start \*/.*?/\* hb-feature-card:end \*/\n?", "", css, flags=re.S)
CSS.write_text(css.rstrip() + "\n" + STYLES.strip() + "\n", encoding="utf-8")
print("bundle + styles updated")
