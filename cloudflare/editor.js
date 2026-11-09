// Edit WellNest (/admin/edit): chat with Claude, ChatGPT or Gemini about the
// website, preview their changes, and publish them to GitHub (Cloudflare then
// deploys). Site admins only (see isAnalyticsAdmin in analytics.js).
//
// Secrets (Cloudflare → Workers & Pages → wellnest → Settings → Variables and Secrets):
//   GITHUB_TOKEN        fine-grained token, "Contents: Read and write" on the repo
//   ANTHROPIC_API_KEY   Claude      (console.anthropic.com)
//   OPENAI_API_KEY      ChatGPT     (platform.openai.com)
//   GEMINI_API_KEY      Gemini      (aistudio.google.com)
// Cloudflare AI needs no key: it uses the Worker's own "AI" binding (wrangler.jsonc)
// and Cloudflare's free daily allowance on the free models listed in CF_MODELS.
//
//   GET  /api/editor/status            what's set up
//   GET  /api/editor/models?provider=  models that key can use
//   GET  /api/editor/files             editable files in the repo
//   GET  /api/editor/file?path=        one file (content + sha)
//   POST /api/editor/chat              one AI turn (reads files it asks for)
//   POST /api/editor/preview           save drafts so /page?wn_preview=ID shows them
//   POST /api/editor/publish           commit drafts to GitHub
import { json, fail, now, randomToken } from "./lib.js";
import { isAnalyticsAdmin } from "./analytics.js";
import { stripBase } from "./sitepaths.js";

export const REPO = "ctrlaltandfix/wellnest-website";
const BRANCH = "main";
const MAX_FILE = 400_000;
const MAX_READ_ROUNDS = 4;

// ---------- what the editor may change ----------
// Website pages and their text files. Server code, the build, the compiled app
// bundle and the admin pages are off limits, so a bad edit can't lock you out
// of the editor that would fix it.
const BLOCKED_PREFIX = ["cloudflare/", "tools/", "tests/", "netlify/", ".github/", "node_modules/", "assets/", "admin/", "dist-cloudflare/", ".wrangler/"];
const BLOCKED_FILE = new Set(["wrangler.jsonc", "package.json", "package-lock.json", ".gitignore", ".assetsignore", "github-pages-bridge.ts", "netlify.toml", ".nojekyll"]);
const EDITABLE_EXT = /\.(html|css|txt|xml|svg|md|json|webmanifest)$/i;

export function editable(path) {
  if (typeof path !== "string" || !path || path.length > 200) return false;
  if (path.startsWith("/") || path.includes("..") || path.includes("\\") || /[\0-\x1f]/.test(path)) return false;
  if (BLOCKED_FILE.has(path) || BLOCKED_PREFIX.some(p => path.startsWith(p))) return false;
  return EDITABLE_EXT.test(path);
}

// about.html and about/index.html are the same page (GitHub Pages serves both
// /about and /about/); a change to one is made to both.
// The app's main file(s). The editor page updates their wording to match page
// edits (see admin/apptext.js); they can't be edited directly.
export const APP_FILE = /^assets\/index[A-Za-z0-9._-]*\.js$/;
const MAX_APP_FILE = 1_900_000; // D1 keeps rows under 2 MB

export function mirrorOf(path, tree) {
  let m = path.match(/^(.+)\.html$/);
  if (m && !m[1].endsWith("/index") && tree.has(m[1] + "/index.html")) return m[1] + "/index.html";
  m = path.match(/^(.+)\/index\.html$/);
  if (m && tree.has(m[1] + ".html")) return m[1] + ".html";
  return null;
}

// ---------- GitHub ----------
async function gh(env, path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "wellnest-editor",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    let reason = text;
    try { reason = JSON.parse(text).message || text; } catch {}
    const err = new Error(`GitHub ${res.status}: ${reason}`);
    err.reason = reason;
    err.status = res.status === 401 || res.status === 403 ? 502 : res.status === 404 ? 404 : 502;
    err.github = res.status;
    throw err;
  }
  return res.json();
}

function b64decode(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

async function listTree(env) {
  const t = await gh(env, `/git/trees/${BRANCH}?recursive=1`);
  return t.tree.filter(e => e.type === "blob").map(e => ({ path: e.path, sha: e.sha, size: e.size }));
}

export async function readFile(env, path) {
  const f = await gh(env, `/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${BRANCH}`);
  if (Array.isArray(f) || f.type !== "file") throw Object.assign(new Error("Not a file"), { status: 404 });
  if (f.size > MAX_FILE) throw Object.assign(new Error("That file is too large to edit here."), { status: 413 });
  return { path, sha: f.sha, content: b64decode(f.content || "") };
}

// ---------- AI providers ----------
const PROVIDERS = {
  anthropic: { name: "Claude", key: "ANTHROPIC_API_KEY" },
  openai: { name: "ChatGPT", key: "OPENAI_API_KEY" },
  gemini: { name: "Gemini", key: "GEMINI_API_KEY" },
  cloudflare: { name: "Cloudflare AI", binding: "AI", free: true },
};
const connectedTo = (env, p) => Boolean(PROVIDERS[p].binding ? env[PROVIDERS[p].binding] : env[PROVIDERS[p].key]);

// Free-plan Workers AI text models (Cloudflare moved some larger models to Workers Paid on 28 Jul 2026).
export const CF_MODELS = [
  { id: "@cf/nvidia/nemotron-3-120b-a12b", name: "Nemotron 3 120B (free)" },
  { id: "@cf/google/gemma-4-26b-a4b-it", name: "Gemma 4 26B (free)" },
  { id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash (free)" },
];

async function provFetch(url, init, who) {
  const res = await fetch(url, init);
  const body = await res.text();
  let data = null;
  try { data = JSON.parse(body); } catch {}
  if (!res.ok) {
    const msg = data?.error?.message || data?.error?.type || body.slice(0, 200) || res.statusText;
    // Out-of-credit errors are about the API account, not a ChatGPT Plus / Claude Pro subscription.
    const billing = { Claude: "platform.claude.com → Settings → Billing", ChatGPT: "platform.openai.com → Settings → Billing", Gemini: "aistudio.google.com → Billing" }[who];
    const hint = /credit|billing|quota|insufficient|balance|payment/i.test(msg)
      ? ` (API keys are billed separately from a ${who} subscription — add credit at ${billing}, for the same account the key was made in.)` : "";
    throw Object.assign(new Error(`${who} said: ${msg}${hint}`), { status: 502 });
  }
  return data;
}

async function listModels(env, provider) {
  if (provider === "cloudflare") return CF_MODELS;
  if (provider === "anthropic") {
    const d = await provFetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    }, "Claude");
    return d.data.map(m => ({ id: m.id, name: m.display_name || m.id }));
  }
  if (provider === "openai") {
    const d = await provFetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    }, "ChatGPT");
    return d.data.map(m => m.id)
      .filter(id => /^(gpt-|o\d|chatgpt-)/.test(id) && !/audio|realtime|transcribe|tts|image|embedding|search|instruct|moderation|codex|-\d{4}-\d{2}-\d{2}$/.test(id))
      .sort().reverse().map(id => ({ id, name: id }));
  }
  if (provider === "gemini") {
    const d = await provFetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
      headers: { "x-goog-api-key": env.GEMINI_API_KEY },
    }, "Gemini");
    return (d.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes("generateContent") && /gemini/.test(m.name) && !/embedding|tts|image|live|audio|vision/.test(m.name))
      .map(m => ({ id: m.name.replace(/^models\//, ""), name: m.displayName || m.name }));
  }
  throw Object.assign(new Error("Unknown provider"), { status: 400 });
}

// Screenshots the owner adds to the chat: [{ type: "image/png", data: base64 }]
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);
const MAX_IMAGE_B64 = 6_000_000;   // ~4.5 MB each (the page shrinks them well below this)
const MAX_IMAGES = 6;              // across the whole request
export function cleanImages(list, budget) {
  const out = [];
  for (const im of Array.isArray(list) ? list : []) {
    if (budget.left <= 0) break;
    if (!im || !IMAGE_TYPES.has(im.type) || typeof im.data !== "string" || im.data.length > MAX_IMAGE_B64 || !/^[A-Za-z0-9+/=]+$/.test(im.data)) continue;
    out.push({ type: im.type, data: im.data });
    budget.left--;
  }
  return out;
}

// Each provider's message format, with any screenshots before the text.
export function toAnthropic(m) {
  if (!m.images?.length) return { role: m.role, content: m.content };
  return { role: m.role, content: [...m.images.map(i => ({ type: "image", source: { type: "base64", media_type: i.type, data: i.data } })), { type: "text", text: m.content }] };
}
export function toOpenAI(m) {
  if (!m.images?.length) return { role: m.role, content: m.content };
  return { role: m.role, content: [...m.images.map(i => ({ type: "image_url", image_url: { url: `data:${i.type};base64,${i.data}` } })), { type: "text", text: m.content }] };
}
export function toGemini(m) {
  return { role: m.role === "assistant" ? "model" : "user", parts: [...(m.images || []).map(i => ({ inlineData: { mimeType: i.type, data: i.data } })), { text: m.content }] };
}

// messages: [{ role: "user" | "assistant", content: string, images?: [...] }]
export async function callModel(env, provider, model, system, messages) {
  if (provider === "anthropic") {
    const d = await provFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 16000, system, messages: messages.map(toAnthropic) }),
    }, "Claude");
    return (d.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  }
  if (provider === "openai") {
    const d = await provFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_completion_tokens: 16000, messages: [{ role: "system", content: system }, ...messages.map(toOpenAI)] }),
    }, "ChatGPT");
    return d.choices?.[0]?.message?.content || "";
  }
  if (provider === "cloudflare") {
    let out;
    try {
      out = await env.AI.run(model, {
        // These models read text only; a screenshot is mentioned so the reply makes sense.
        messages: [{ role: "system", content: system }, ...messages.map(m => ({ role: m.role, content: m.images?.length ? `${m.content}\n\n(The owner attached ${m.images.length} screenshot(s), which this model can't see.)` : m.content }))],
        max_tokens: 8000,
      });
    } catch (e) {
      const msg = String(e?.message || e);
      const hint = /5035|Workers Paid|403/.test(msg) ? " (This model now needs Cloudflare's Workers Paid plan; pick another free model.)"
        : /3036|neurons|daily|limit|429/i.test(msg) ? " (Today's free Cloudflare AI allowance may be used up; it resets daily.)" : "";
      throw Object.assign(new Error(`Cloudflare AI said: ${msg}${hint}`), { status: 502 });
    }
    return typeof out?.response === "string" ? out.response : out?.choices?.[0]?.message?.content || out?.result?.response || "";
  }
  if (provider === "gemini") {
    const d = await provFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": env.GEMINI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map(toGemini),
        generationConfig: { maxOutputTokens: 16000 },
      }),
    }, "Gemini");
    return (d.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
  }
  throw Object.assign(new Error("Unknown provider"), { status: 400 });
}

// ---------- the conversation ----------
export function systemPrompt(files, focus) {
  return `You are the website editor for WellNest (wellnest.services), a chronic-health tracking service made in Australia. The site owner chats with you to change the website. Reply in plain, friendly language for a non-developer, in Australian English.

HOW THE SITE IS BUILT
- Plain HTML pages in a GitHub repo. Each page has a twin: "about.html" and "about/index.html" are the same page; edit only the .html one and the twin is updated automatically.
- Links and asset paths in these files start with "/wellnest-website/" (for the GitHub Pages copy). Keep that prefix exactly as it is in new links and images; it is removed automatically on wellnest.services.
- The signed-in app (dashboard etc.) is a compiled bundle in assets/ and can't be edited here. Server code, admin pages and build files can't be edited here either. If asked for those, say so briefly.
- Keep each page's structured data, meta tags, analytics tags and the "gh-pages-base" script intact unless asked.

EDITABLE FILES
${files.join("\n")}

The owner is currently previewing: ${focus || "(nothing)"}
The owner may attach screenshots (of this site or others) to show what they mean; use them to understand the request, then change the files as usual.

TO READ A FILE, reply with only lines like:
READ: path/to/file.html
(you'll then be given its current contents, including any unpublished changes).

TO CHANGE A FILE, include one block per change, copying the existing text exactly (enough of it to be unique in the file):
<<<<<<< EDIT path/to/file.html
existing text, copied exactly
=======
replacement text
>>>>>>> END

TO CREATE A NEW FILE:
<<<<<<< CREATE path/to/new-page.html
full contents
>>>>>>> END

IMPORTANT: after a page loads, the app redraws it from its own copy. Changes to wording inside existing elements are carried into the app automatically, so visitors see them. Changes to layout — adding, removing or moving elements, or changing links, images, classes or other attributes — only reach search engines and the moment before the app loads; visitors won't see them. So prefer wording changes, and if a request needs a layout change, do it but say clearly that visitors won't see it until the app itself is updated.

Rules: read a file before editing it unless its contents are already in this conversation. Make the smallest change that does what was asked. Outside the blocks, say in one or two sentences what you changed. Nothing goes live until the owner presses Publish.`;
}

export function readRequests(text) {
  return [...String(text).matchAll(/^\s*READ:\s*(\S+)\s*$/gm)].map(m => m[1]);
}
export function hasEdits(text) {
  return /<<<<<<< (EDIT|CREATE) /.test(text);
}

async function handleChat(request, env) {
  const body = await request.json();
  const provider = String(body.provider || "");
  if (!PROVIDERS[provider]) return fail(400, "Choose an AI provider.");
  if (!connectedTo(env, provider)) return fail(400, `${PROVIDERS[provider].name} isn't connected yet.`);
  const model = String(body.model || "").slice(0, 120);
  if (!model) return fail(400, "Choose a model.");
  const drafts = body.drafts && typeof body.drafts === "object" ? body.drafts : {};
  // Newest screenshots win if there are more than MAX_IMAGES in the conversation.
  const budget = { left: MAX_IMAGES };
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-30).reverse()
    .map(m => ({ role: m.role, content: m.content.slice(0, 200_000) || "(see screenshot)", images: m.role === "user" ? cleanImages(m.images, budget) : [] }))
    .reverse();
  if (!messages.length || messages[messages.length - 1].role !== "user") return fail(400, "Nothing to send.");

  const tree = await listTree(env);
  const names = tree.map(f => f.path).filter(editable)
    .filter(p => !/^(.+)\/index\.html$/.test(p) || !tree.some(f => f.path === p.replace(/\/index\.html$/, ".html")));
  const system = systemPrompt(names, body.focus);

  const reads = [];
  let reply = "";
  for (let round = 0; round <= MAX_READ_ROUNDS; round++) {
    reply = await callModel(env, provider, model, system, messages);
    const want = readRequests(reply).slice(0, 6);
    if (!want.length || hasEdits(reply) || round === MAX_READ_ROUNDS) break;
    const parts = [];
    for (const path of want) {
      if (!editable(path)) { parts.push(`${path}: can't be read or edited here.`); continue; }
      try {
        const content = typeof drafts[path] === "string" ? drafts[path] : (await readFile(env, path)).content;
        parts.push(`=== ${path} ===\n${content}\n=== end of ${path} ===`);
        reads.push(path);
      } catch (e) {
        parts.push(`${path}: not found.`);
      }
    }
    messages.push({ role: "assistant", content: reply });
    messages.push({ role: "user", content: `(Editor) Here are the files you asked for:\n\n${parts.join("\n\n")}` });
  }
  return json({ reply, reads });
}

// ---------- preview ----------
const PREVIEW_TTL = 24 * 3600 * 1000;

async function handlePreviewSave(request, env) {
  const body = await request.json();
  let id = String(body.id || "");
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id)) id = randomToken(24);
  const files = body.files && typeof body.files === "object" ? body.files : {};
  const stmts = [env.DB.prepare("DELETE FROM editor_previews WHERE id = ? OR updated < ?").bind(id, Date.now() - PREVIEW_TTL)];
  for (const [path, content] of Object.entries(files).slice(0, 50)) {
    if (!editable(path) || typeof content !== "string" || content.length > MAX_FILE) continue;
    stmts.push(env.DB.prepare("INSERT INTO editor_previews (id, path, content, updated) VALUES (?, ?, ?, ?)").bind(id, path, content, Date.now()));
  }
  await env.DB.batch(stmts);
  return json({ id });
}

const TYPES = { html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", txt: "text/plain; charset=utf-8", xml: "application/xml", svg: "image/svg+xml", md: "text/plain; charset=utf-8", json: "application/json", webmanifest: "application/manifest+json" };

// Called for page requests carrying ?wn_preview=ID: serve the draft if there is one.
export function previewCookie(request) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)wn_preview=([A-Za-z0-9_-]{20,64})/);
  return m ? m[1] : null;
}

// The preview frame's app file: requested without ?wn_preview, so the page that
// was served as a preview leaves a short-lived cookie naming its preview.
export async function servePreviewApp(request, env, url) {
  const id = previewCookie(request);
  const path = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!id || request.method !== "GET" || !APP_FILE.test(path)) return null;
  const row = await env.DB.prepare("SELECT content FROM editor_previews WHERE id = ? AND path = ? AND updated > ?")
    .bind(id, path, Date.now() - PREVIEW_TTL).first();
  if (!row) return null;
  return new Response(row.content, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store", "X-WellNest-Preview": "draft" } });
}

export async function servePreview(request, env, url) {
  const id = url.searchParams.get("wn_preview") || "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id) || request.method !== "GET") return null;
  const p = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const candidates = p === "" ? ["index.html"] : p.endsWith("/") ? [p + "index.html"] : [p, p + ".html", p + "/index.html"];
  for (const c of candidates) {
    const gp = c; // repo paths have no /wellnest-website prefix
    const row = await env.DB.prepare("SELECT content FROM editor_previews WHERE id = ? AND path = ? AND updated > ?")
      .bind(id, gp, Date.now() - PREVIEW_TTL).first();
    if (row) {
      const ext = (gp.match(/\.([a-z]+)$/i) || [])[1]?.toLowerCase() || "html";
      return new Response(stripBase(row.content), {
        headers: {
          "Content-Type": TYPES[ext] || "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-WellNest-Preview": "draft",
          // lets this page's app file load with the same unpublished wording (15 minutes)
          "Set-Cookie": `wn_preview=${id}; Path=/; Max-Age=900; Secure; HttpOnly; SameSite=Lax`,
        },
      });
    }
  }
  return null;
}

// ---------- the app file (wording carried over from page edits) ----------
// Streams the file straight through, so this stays cheap for a Free-plan Worker.
async function handleAppFile(request, env, url) {
  const path = url.searchParams.get("path") || "";
  if (!APP_FILE.test(path)) return fail(400, "Not an app file.");
  const tree = await listTree(env);
  const entry = tree.find(f => f.path === path);
  if (!entry) return fail(404, "Not found");
  const res = await fetch(`https://api.github.com/repos/${REPO}/git/blobs/${entry.sha}`, {
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github.raw", "User-Agent": "wellnest-editor", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!res.ok) return fail(502, `GitHub ${res.status} reading ${path}`);
  return new Response(res.body, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "private, no-store", "X-Sha": entry.sha } });
}

// Body: the file as base64 (made in the browser). Passed to GitHub as-is.
async function handleBlob(request, env) {
  const b64 = await request.text();
  if (!b64 || b64.length > MAX_APP_FILE * 1.4 || !/^[A-Za-z0-9+/]+=*$/.test(b64)) return fail(400, "Invalid file.");
  const blob = await gh(env, "/git/blobs", { method: "POST", body: `{"encoding":"base64","content":"${b64}"}` });
  return json({ sha: blob.sha });
}

// Body: the patched app file (repo version) for preview ID.
async function handlePreviewApp(request, env, url) {
  const id = url.searchParams.get("id") || "", path = url.searchParams.get("path") || "";
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(id) || !APP_FILE.test(path)) return fail(400, "Invalid request.");
  const content = await request.text();
  if (!content || content.length > MAX_APP_FILE) return fail(413, "That's too large to preview.");
  await env.DB.prepare("INSERT OR REPLACE INTO editor_previews (id, path, content, updated) VALUES (?, ?, ?, ?)")
    .bind(id, path, stripBase(content), Date.now()).run();
  return json({ ok: true });
}

// ---------- publish ----------
async function handlePublish(request, env, user) {
  const body = await request.json();
  const changes = body.files && typeof body.files === "object" ? body.files : {};
  const message = String(body.message || "").trim().slice(0, 200) || "Update website";
  const entries = Object.entries(changes).slice(0, 50);
  if (!entries.length) return fail(400, "There are no changes to publish.");

  const tree = await listTree(env);
  const shas = new Map(tree.map(f => [f.path, f.sha]));
  const paths = new Set(tree.map(f => f.path));
  const writes = new Map();
  for (const [path, change] of entries) {
    if (!editable(path)) return fail(400, `${path} can't be changed from the editor.`);
    if (!change || typeof change.content !== "string" || change.content.length > MAX_FILE) return fail(400, `${path} is too large or empty.`);
    // Someone (or something) changed the file since it was opened here.
    const current = shas.get(path) || null;
    if ((change.sha || null) !== current) {
      return fail(409, `${path} changed on GitHub since you started editing it. Discard your changes to it and ask again.`, { path });
    }
    writes.set(path, change.content);
    const twin = mirrorOf(path, paths);
    if (twin && !(twin in changes)) writes.set(twin, change.content);
    // 404.html is a copy of the home page (it serves the app's other routes).
    if (path === "index.html" && shas.get("404.html") === current && !("404.html" in changes)) writes.set("404.html", change.content);
  }

  // App files with the same wording changes, uploaded beforehand as blobs.
  const blobs = body.blobs && typeof body.blobs === "object" ? Object.entries(body.blobs).slice(0, 5) : [];
  const blobEntries = [];
  for (const [path, b] of blobs) {
    if (!APP_FILE.test(path) || !b || !/^[0-9a-f]{40}$/.test(b.sha || "")) return fail(400, `${path} can't be changed from the editor.`);
    if ((b.base || null) !== (shas.get(path) || null)) return fail(409, `The app changed on GitHub since you started editing. Discard your changes and ask again.`, { path });
    blobEntries.push({ path, mode: "100644", type: "blob", sha: b.sha });
  }

  const ref = await gh(env, `/git/ref/heads/${BRANCH}`);
  const head = await gh(env, `/git/commits/${ref.object.sha}`);
  const newTree = await gh(env, "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: head.tree.sha, tree: [...writes].map(([path, content]) => ({ path, mode: "100644", type: "blob", content })).concat(blobEntries) }),
  });
  const commit = await gh(env, "/git/commits", {
    method: "POST",
    body: JSON.stringify({
      message: `${message}\n\nPublished from Edit WellNest by ${user.email} (${now()}).`,
      tree: newTree.sha,
      parents: [ref.object.sha],
    }),
  });
  await gh(env, `/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
  return json({ commit: commit.sha, url: `https://github.com/${REPO}/commit/${commit.sha}`, files: [...writes.keys(), ...blobEntries.map(e => e.path)] });
}

// ---------- router ----------
export async function handleEditor(request, env, user, sub) {
  if (!(await isAnalyticsAdmin(env, user))) return fail(403, "Only site admins can use the editor.", { signed_in_as: user?.email || null });
  const url = new URL(request.url);
  const GET = request.method === "GET", POST = request.method === "POST";

  if (sub === "status" && GET) {
    return json({
      repo: REPO,
      github: Boolean(env.GITHUB_TOKEN),
      providers: Object.fromEntries(Object.entries(PROVIDERS).map(([k, v]) => [k, { name: v.name, connected: connectedTo(env, k), secret: v.key || null, free: Boolean(v.free) }])),
    });
  }
  if (!env.GITHUB_TOKEN) return fail(503, "GitHub isn't connected yet. Add GITHUB_TOKEN in Cloudflare.");
  try {
    if (sub === "models" && GET) {
      const provider = url.searchParams.get("provider");
      if (!PROVIDERS[provider] || !connectedTo(env, provider)) return fail(400, "That AI isn't connected.");
      return json({ models: await listModels(env, provider) });
    }
    if (sub === "files" && GET) {
      const tree = await listTree(env);
      return json({ files: tree.filter(f => editable(f.path)).map(f => ({ path: f.path, sha: f.sha, size: f.size })) });
    }
    if (sub === "file" && GET) {
      const path = url.searchParams.get("path");
      if (!editable(path)) return fail(400, "That file can't be edited here.");
      return json(await readFile(env, path));
    }
    if (sub === "chat" && POST) return await handleChat(request, env);
    if (sub === "preview" && POST) return await handlePreviewSave(request, env);
    if (sub === "publish" && POST) return await handlePublish(request, env, user);
    if (sub === "appfile" && GET) return await handleAppFile(request, env, url);
    if (sub === "blob" && POST) return await handleBlob(request, env);
    if (sub === "preview-app" && POST) return await handlePreviewApp(request, env, url);
  } catch (e) {
    if (e.github === 401) return fail(502, "GitHub rejected the GITHUB_TOKEN. It may have expired; make a new one and update it in Cloudflare.");
    if (e.github === 403 || e.github === 404 && sub === "publish") {
      return fail(502, `GITHUB_TOKEN can read the repo but isn't allowed to change it. Its settings need Repository access → Only select repositories → ${REPO.split("/")[1]}, and Permissions → Contents → Read and write. (GitHub said: ${e.reason || e.github})`);
    }
    if (e.status && e.status < 500) return fail(e.status, e.message);
    if (e.status === 502) return fail(502, e.message);
    throw e;
  }
  return fail(404, "Not found");
}
