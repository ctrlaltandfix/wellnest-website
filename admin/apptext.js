// The website pages are drawn twice: first from their HTML file, then the app
// (assets/index-*.js) redraws them from its own built-in copy. So a wording change
// made in a page's HTML is also made in the app's code, or visitors won't see it.
//
// Only wording can be carried over. Changes to layout (adding, removing or moving
// sections, links, attributes) are reported, because the app would undo them.
//
// Runs in the browser on /admin/edit (the app file is ~900 KB, too much work for a
// Free-plan Worker request) and in the tests.

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", middot: "·", copy: "©", rarr: "→" };
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}

// Split HTML into tags (incl. comments, and whole script/style blocks) and text.
function tokens(html) {
  const out = [];
  const re = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]*>/gi;
  let last = 0, m;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push({ text: html.slice(last, m.index) });
    out.push({ tag: m[0] });
    last = re.lastIndex;
  }
  if (last < html.length) out.push({ text: html.slice(last) });
  return out;
}

const norm = t => decodeEntities(t.trim().replace(/\s+/g, " "));

// Drop a tag fragment cut off at either end of a snippet ("…svg> Pick up…</sp").
function trimPartialTags(html) {
  const lt = html.indexOf("<"), gt = html.indexOf(">");
  if (gt >= 0 && (lt < 0 || gt < lt)) html = html.slice(gt + 1);
  const lastLt = html.lastIndexOf("<"), lastGt = html.lastIndexOf(">");
  if (lastLt > lastGt) html = html.slice(0, lastLt);
  return html;
}

// Compare a before/after HTML snippet (as the AI copied it, often starting or
// ending mid-tag). Same tags in the same order = a wording change; anything else
// (added/removed elements, changed attributes) is a layout change.
export function wordingChanges(before, after) {
  // The usual case: one stretch of text changed. Find it, then widen it to the
  // whole text between tags.
  let p = 0;
  while (p < before.length && p < after.length && before[p] === after[p]) p++;
  let s = 0;
  while (s < before.length - p && s < after.length - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
  const midA = before.slice(p, before.length - s), midB = after.slice(p, after.length - s);
  if (!midA && !midB) return { layout: false, pairs: [] };
  if (!/[<>]/.test(midA + midB)) {
    let L = p; while (L > 0 && before[L - 1] !== ">" && before[L - 1] !== "<") L--;
    let RA = before.length - s; while (RA < before.length && before[RA] !== "<" && before[RA] !== ">") RA++;
    let RB = after.length - s; while (RB < after.length && after[RB] !== "<" && after[RB] !== ">") RB++;
    const left = L > 0 ? before[L - 1] : "", right = RA < before.length ? before[RA] : "";
    // Inside a tag (an attribute such as a link or class) rather than between tags.
    if (left === "<" || right === ">") return { layout: true, pairs: [] };
    const inScript = /<(script|style)\b[^>]*>[^]*$/i.test(before.slice(0, L)) && !/<\/(script|style)>/i.test(before.slice(before.slice(0, L).search(/<(script|style)\b[^>]*>[^]*$/i), L));
    if (inScript) return { layout: true, pairs: [] };
    const from = norm(before.slice(L, RA)), to = norm(after.slice(L, RB));
    return { layout: false, pairs: from && from !== to ? [{ from, to }] : [] };
  }
  // Several changes, or tags involved: compare tag by tag.
  const a = tokens(trimPartialTags(before)), b = tokens(trimPartialTags(after));
  const skel = t => t.filter(x => x.tag || x.text.trim()).map(x => x.tag ? x.tag : "\u0000");
  const sa = skel(a), sb = skel(b);
  if (sa.length !== sb.length || sa.some((x, i) => x !== sb[i])) return { layout: true, pairs: [] };
  const ta = a.filter(x => x.text && x.text.trim()).map(x => norm(x.text));
  const tb = b.filter(x => x.text && x.text.trim()).map(x => norm(x.text));
  const pairs = [];
  ta.forEach((t, i) => { if (t !== tb[i]) pairs.push({ from: t, to: tb[i] }); });
  return { layout: false, pairs };
}

// Text inside a JS string literal (`...`, "..." or '...').
export function jsEscape(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${").replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\r?\n/g, "\\n");
}
const reEscape = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Where the string literals are in minified JS: [start, end) of each literal's text
// (template literals split around their ${...} parts). Wording is only ever
// replaced inside these, never in code.
export function stringRanges(code) {
  const ranges = [], stack = [], n = code.length;
  const REGEX_AFTER = "(,=:[!&|?{};+-*%<>~^";
  const REGEX_WORDS = new Set(["return", "typeof", "case", "void", "in", "of", "delete", "throw", "else", "do", "new", "instanceof", "yield", "await"]);
  let i = 0, depth = 0, prev = "", word = "";
  function template(j) {           // j: first char after ` or after the } closing ${...}
    const start = j;
    while (j < n) {
      const c = code[j];
      if (c === "\\") { j += 2; continue; }
      if (c === "`") { ranges.push([start, j]); i = j + 1; prev = "`"; return; }
      if (c === "$" && code[j + 1] === "{") { ranges.push([start, j]); stack.push(depth); depth++; i = j + 2; prev = "{"; return; }
      j++;
    }
    i = n;
  }
  while (i < n) {
    const c = code[i];
    if (c === " " || c === "\n" || c === "\t" || c === "\r") { i++; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && code[j] !== c) { if (code[j] === "\\") j++; else if (code[j] === "\n") break; j++; }
      ranges.push([i + 1, j]); i = j + 1; prev = '"'; word = ""; continue;
    }
    if (c === "`") { word = ""; template(i + 1); continue; }
    if (c === "/") {
      const d = code[i + 1];
      if (d === "/") { const e = code.indexOf("\n", i); i = e < 0 ? n : e; continue; }
      if (d === "*") { const e = code.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
      if (prev === "" || REGEX_AFTER.includes(prev) || (prev === "a" && REGEX_WORDS.has(word))) {
        let j = i + 1, cls = false;
        while (j < n) {
          const r = code[j];
          if (r === "\\") { j += 2; continue; }
          if (r === "[") cls = true; else if (r === "]") cls = false;
          else if (r === "/" && !cls) break;
          else if (r === "\n") break;
          j++;
        }
        j++;
        while (j < n && /[a-z]/i.test(code[j])) j++;
        i = j; prev = ")"; word = ""; continue;
      }
      i++; prev = "/"; word = ""; continue;
    }
    if (c === "{") { depth++; i++; prev = "{"; word = ""; continue; }
    if (c === "}") {
      if (stack.length && stack[stack.length - 1] === depth - 1) { stack.pop(); depth--; word = ""; template(i + 1); continue; }
      depth--; i++; prev = "}"; word = ""; continue;
    }
    if (/[\w$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(code[j])) j++;
      word = code.slice(i, j); i = j; prev = "a"; continue;
    }
    prev = c; word = ""; i++;
  }
  return ranges;
}

function stringAt(ranges, start, end) {
  let lo = 0, hi = ranges.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, [a, b] = ranges[mid];
    if (end <= a) hi = mid - 1;
    else if (start >= b) lo = mid + 1;
    else return start >= a && end <= b ? ranges[mid] : null;
  }
  return null;
}

// A string that is exactly one name-like word (`Pricing`, `hb-hero`) is usually
// used by the code (a page name, key or class), so it's only changed when the
// code shows it on screen as a label: children:`Pricing`.
function safeToChange(code, range, start, end) {
  const [a, b] = range;
  const whole = start === a && end === b;
  if (!whole || !/^[A-Za-z][\w-]*$/.test(code.slice(a, b))) return true;
  return /children:\s*$/.test(code.slice(Math.max(0, a - 12), a - 1));
}

// Replace whole-phrase occurrences of `from` that are inside the app's text
// (string literals), never in code and never inside a longer word.
export function applyWording(code, pairs) {
  const applied = [], skipped = [];
  for (const { from, to } of pairs) {
    if (from.length < 4) { skipped.push({ from, to, reason: "too short to find safely" }); continue; }
    const ranges = stringRanges(code);
    const needles = [from, from.replace(/ /g, " "), jsEscape(from)].filter((v, i, all) => all.indexOf(v) === i);
    let done = false;
    for (const needle of needles) {
      const re = new RegExp(`(?<![\\p{L}\\p{N}])${reEscape(needle)}(?![\\p{L}\\p{N}])`, "gu");
      let count = 0;
      let held = 0;
      const next = code.replace(re, (m, at) => {
        const range = stringAt(ranges, at, at + m.length);
        if (!range) return m;
        if (!safeToChange(code, range, at, at + m.length)) { held++; return m; }
        count++; return jsEscape(to);
      });
      if (count) { code = next; applied.push(held ? { from, to, count, held } : { from, to, count }); done = true; break; }
      if (held) { skipped.push({ from, to, reason: "only used as a name inside the app, not as visible text" }); done = true; break; }
    }
    if (!done) skipped.push({ from, to, reason: "not found in the app's wording" });
  }
  return { code, applied, skipped };
}

// The app file(s) a page loads, as repo paths (assets/index-….js).
export function appFilesOf(html) {
  const base = "/wellnest" + "-website"; // kept out of the source so the build doesn't rewrite it
  const re = /<script[^>]+src="([^"]+)"/g, out = new Set();
  for (const m of String(html).matchAll(re)) {
    const src = m[1].startsWith(base + "/") ? m[1].slice(base.length) : m[1];
    const hit = src.match(/^\/(assets\/index[^"/]*\.js)$/);
    if (hit) out.add(hit[1]);
  }
  return [...out];
}
