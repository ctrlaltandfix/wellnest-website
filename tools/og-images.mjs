// Share images for every page in the sitemap (1200×630, what Facebook, LinkedIn,
// X, Slack and iMessage show for a link), plus a 512×512 PNG logo for search
// engines (Google doesn't accept SVG logos).
//
//   node tools/og-images.mjs [repo-root]      -> og/<page>.png, og/logo.png
//
// Needs Playwright with Chromium and the brand fonts from npm:
//   npm pack @fontsource/bricolage-grotesque @fontsource/instrument-serif
// (set FONTS_DIR to the folder they were unpacked into).
// Re-run after changing a page's heading. tools/seo-structured.py points the
// pages at these files.
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");
const ROOT = resolve(process.argv[2] || ".");
const FONTS = process.env.FONTS_DIR || "/tmp/claude-0/fonts";
const OUT = join(ROOT, "og");
mkdirSync(OUT, { recursive: true });

export const SECTIONS = {
  guide: ["chronic-health-tracker-guide", "best-chronic-illness-tracker-apps", "flare-up-diary-guide", "symptom-diary-guide",
    "appointment-prep-checklist", "asthma-action-plan-guide", "seizure-first-aid-and-diary", "crps-symptoms-guide",
    "how-to-describe-pain-to-your-doctor", "pain-scale-chart"],
  compare: ["wellnest-vs-bearable", "wellnest-vs-manage-my-pain", "wellnest-vs-careclinic"],
  tool: ["free-tools", "free-medication-list", "free-symptom-summary-maker", "chronic-pain-diary"],
};
const KICKER = { guide: "Guide", compare: "Compare", tool: "Free tool", tracker: "Chronic health tracker", page: "WellNest" };
const TRACKERS = ["chronic-illness-tracker", "symptom-tracker-app", "crps-tracker", "asthma-tracker", "seizure-diary", "fibromyalgia-tracker",
  "medication-tracker", "emergency-action-plan", "medical-expense-tracker"];
export const sectionOf = slug => Object.keys(SECTIONS).find(k => SECTIONS[k].includes(slug)) || (TRACKERS.includes(slug) ? "tracker" : "page");

const unescape = s => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function headline(html) {
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  const text = h1 ? unescape(h1.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim() : "";
  const title = unescape((html.match(/og:title" content="([^"]+)"/) || [])[1] || "").replace(/\s*[|–-]\s*WellNest.*$/, "").trim();
  return text && text.length <= 62 ? text : title || text;
}

const fontUrl = f => "file://" + join(FONTS, f);
const css = `
@font-face{font-family:Brico;font-weight:700;src:url(${fontUrl("fontsource-bricolage-grotesque-5.3.0/files/bricolage-grotesque-latin-700-normal.woff2")})}
@font-face{font-family:Brico;font-weight:800;src:url(${fontUrl("fontsource-bricolage-grotesque-5.3.0/files/bricolage-grotesque-latin-800-normal.woff2")})}
@font-face{font-family:Serif;font-style:italic;src:url(${fontUrl("fontsource-instrument-serif-5.3.0/files/instrument-serif-latin-400-italic.woff2")})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;font-family:Brico,system-ui,sans-serif;color:#f3faf0;
 background:radial-gradient(900px 520px at 88% 8%,#1f5a45 0%,#0f3a31 38%,#091e1d 70%);position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(120deg,transparent 35%,#000 100%)}
.wrap{position:absolute;inset:64px 72px 60px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:38px;letter-spacing:-.04em}
.brand img{width:58px;height:auto}
.kicker{margin-top:46px;align-self:flex-start;background:#d8fa8d;color:#16372f;font-weight:700;font-size:22px;padding:9px 18px;border-radius:999px;letter-spacing:.01em}
h1{margin-top:22px;font-weight:700;letter-spacing:-.035em;line-height:1.04;max-width:1000px;text-wrap:balance}
h1 em{font-family:Serif;font-weight:400;font-style:italic;color:#d8fa8d;letter-spacing:-.01em}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;font-size:24px;color:#a9c4b5}
.foot b{color:#f3faf0;font-weight:700}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#d8fa8d,#6fd39b 60%,#2a9d66)}`;

function page(kicker, text, mark) {
  // The last few words in the serif accent, like the site's headings.
  const words = text.split(" ");
  const n = words.length > 5 ? 2 : words.length > 2 ? 1 : 0;
  const lead = words.slice(0, words.length - n).join(" "), tail = words.slice(words.length - n).join(" ");
  return `<!doctype html><meta charset=utf-8><style>${css}</style><div class=grid></div><div class=wrap>
<div class=brand><img src="${mark}">wellnest</div>
<div class=kicker>${esc(kicker)}</div>
<h1 id=h>${esc(lead)}${tail ? ` <em>${esc(tail)}</em>` : ""}</h1>
<div class=foot><span><b>wellnest.services</b></span><span>Made in Australia · Free 30-day trial</span></div></div><div class=bar></div>`;
}

const sitemap = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
const slugs = [...sitemap.matchAll(/<loc>https:\/\/wellnest\.services\/?([^<]*)<\/loc>/g)].map(m => m[1] || "index");
const mark = "data:image/webp;base64," + readFileSync(join(ROOT, "landing/homebeta-header-mark.webp")).toString("base64");
if (!existsSync(join(FONTS, "fontsource-bricolage-grotesque-5.3.0"))) throw new Error("Brand fonts not found in " + FONTS);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const tab = await ctx.newPage();
for (const slug of slugs) {
  const html = readFileSync(join(ROOT, slug + ".html"), "utf8");
  const kicker = slug === "index" ? "Chronic health tracker" : KICKER[sectionOf(slug)];
  const text = slug === "index" ? "Track less. Understand more. Live better." : headline(html);
  await tab.setContent(page(kicker, text, mark), { waitUntil: "load" });
  await tab.evaluate(() => document.fonts.ready);
  // Largest size that fits in three lines.
  await tab.evaluate(() => {
    const h = document.getElementById("h");
    for (let s = 84; s >= 46; s -= 2) { h.style.fontSize = s + "px"; if (h.getBoundingClientRect().height <= s * 1.04 * 3 + 4) break; }
  });
  await tab.screenshot({ path: join(OUT, slug + ".png"), type: "png" });
  console.log(slug.padEnd(38), text);
}
// Logo: the mark on white, square, for structured data.
await ctx.close();
const logoCtx = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
const lt = await logoCtx.newPage();
await lt.setContent(`<body style="margin:0;width:512px;height:512px;display:grid;place-items:center;background:#fff"><img src="${mark}" style="width:440px">`);
await lt.screenshot({ path: join(OUT, "logo.png") });
await browser.close();
