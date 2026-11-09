// Edit WellNest: what can be edited, the AI read loop, previews and publishing,
// with GitHub and the AI providers replaced by fakes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { editable, mirrorOf, handleEditor, servePreview, readRequests, hasEdits } from '../cloudflare/editor.js';
import { ensureSchema } from '../cloudflare/lib.js';
import { createHash } from 'node:crypto';

function d1() {
  const db = new DatabaseSync(':memory:');
  const stmt = (sql, args = []) => ({
    bind: (...a) => stmt(sql, a),
    first: async () => db.prepare(sql).get(...args) ?? null,
    run: async () => { db.prepare(sql).run(...args); return { success: true }; },
    all: async () => ({ results: db.prepare(sql).all(...args) }),
    _exec: () => (/^\s*(SELECT|WITH)/i.test(sql) ? { results: db.prepare(sql).all(...args) } : (db.prepare(sql).run(...args), { results: [] })),
  });
  return { prepare: sql => stmt(sql), batch: async list => list.map(s => s._exec()) };
}

const OWNER = { email: 'owner@example.com', role: 'user' };
const sha = s => createHash('sha1').update(s).digest('hex');

// A tiny fake GitHub repo + AI providers behind globalThis.fetch.
function fakeWorld() {
  const repo = new Map([
    ['index.html', '<h1>Track less.</h1>'],
    ['about.html', '<p>About WellNest</p>'],
    ['about/index.html', '<p>About WellNest</p>'],
    ['cloudflare/worker.js', 'export default {}'],
    ['assets/app.js', 'x'],
  ]);
  const calls = { ai: [], commits: [] };
  let aiScript = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const body = init.body ? JSON.parse(init.body) : null;
    const ok = data => new Response(JSON.stringify(data), { status: 200 });
    if (u.hostname === 'api.github.com') {
      const p = u.pathname.replace('/repos/ctrlaltandfix/wellnest-website', '');
      if (p.startsWith('/git/trees/main')) return ok({ tree: [...repo].map(([path, c]) => ({ path, type: 'blob', sha: sha(c), size: c.length })) });
      if (p.startsWith('/contents/')) {
        const path = decodeURIComponent(p.slice(10));
        if (!repo.has(path)) return new Response('{"message":"Not Found"}', { status: 404 });
        return ok({ type: 'file', sha: sha(repo.get(path)), size: repo.get(path).length, content: Buffer.from(repo.get(path)).toString('base64') });
      }
      if (p === '/git/ref/heads/main') return ok({ object: { sha: 'head1' } });
      if (p === '/git/commits/head1') return ok({ tree: { sha: 'tree1' } });
      if (p === '/git/trees' && init.method === 'POST') { calls.tree = body; return ok({ sha: 'tree2' }); }
      if (p === '/git/commits' && init.method === 'POST') { calls.commits.push(body); return ok({ sha: 'commit2' }); }
      if (p === '/git/refs/heads/main' && init.method === 'PATCH') {
        for (const e of calls.tree.tree) repo.set(e.path, e.content);
        return ok({});
      }
      return new Response('nope', { status: 500 });
    }
    if (u.hostname === 'api.anthropic.com' && u.pathname === '/v1/messages') {
      calls.ai.push(body);
      return ok({ content: [{ type: 'text', text: aiScript.shift() }] });
    }
    if (u.hostname === 'api.anthropic.com' && u.pathname === '/v1/models') return ok({ data: [{ id: 'claude-sonnet-x', display_name: 'Claude Sonnet X' }] });
    if (u.hostname === 'api.openai.com') {
      calls.ai.push(body);
      return ok({ choices: [{ message: { content: aiScript.shift() } }] });
    }
    if (u.hostname === 'generativelanguage.googleapis.com') {
      calls.ai.push(body);
      return ok({ candidates: [{ content: { parts: [{ text: aiScript.shift() }] } }] });
    }
    throw new Error('unexpected fetch ' + url);
  };
  return { repo, calls, say: (...t) => { aiScript = t; } };
}

const env = () => ({ DB: d1(), GITHUB_TOKEN: 'gh', ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o', GEMINI_API_KEY: 'g', ADMIN_EMAILS: 'owner@example.com' });
const req = (path, body) => new Request('https://wellnest.services/api/editor/' + path, body ? { method: 'POST', body: JSON.stringify(body) } : {});

test('only website files are editable', () => {
  for (const ok of ['index.html', 'about.html', 'guides/index.html', 'robots.txt', 'sitemap.xml', 'llms.txt']) assert.ok(editable(ok), ok);
  for (const no of ['cloudflare/worker.js', 'admin/edit.html', 'wrangler.jsonc', 'assets/index.js', 'tools/x.html', '../x.html', '/index.html', 'a\\b.html', 'package.json', 'logo.png'])
    assert.ok(!editable(no), no);
  const tree = new Set(['about.html', 'about/index.html', 'guides.html']);
  assert.equal(mirrorOf('about.html', tree), 'about/index.html');
  assert.equal(mirrorOf('about/index.html', tree), 'about.html');
  assert.equal(mirrorOf('guides.html', tree), null);
  assert.deepEqual(readRequests('READ: about.html\n  READ: index.html  \nnot READ: x'), ['about.html', 'index.html']);
  assert.ok(hasEdits('<<<<<<< EDIT about.html\na\n=======\nb\n>>>>>>> END'));
});

test('non-admins are turned away; status reports what is connected', async () => {
  fakeWorld();
  const e = env();
  assert.equal((await handleEditor(req('status'), e, { email: 'x@y.z' }, 'status')).status, 403);
  const s = await (await handleEditor(req('status'), { ...e, GEMINI_API_KEY: '' }, OWNER, 'status')).json();
  assert.equal(s.github, true);
  assert.equal(s.providers.anthropic.connected, true);
  assert.equal(s.providers.gemini.connected, false);
  const files = (await (await handleEditor(req('files'), e, OWNER, 'files')).json()).files.map(f => f.path);
  assert.deepEqual(files.sort(), ['about.html', 'about/index.html', 'index.html']);
  assert.equal((await handleEditor(req('file?path=cloudflare/worker.js'), e, OWNER, 'file')).status, 400);
});

for (const provider of ['anthropic', 'openai', 'gemini']) {
  test(`chat with ${provider}: the AI reads a file, then proposes an edit`, async () => {
    const w = fakeWorld();
    w.say('READ: about.html', 'Updated the intro.\n<<<<<<< EDIT about.html\n<p>About WellNest</p>\n=======\n<p>About us</p>\n>>>>>>> END');
    const res = await handleEditor(req('chat', { provider, model: 'm1', focus: 'about.html', messages: [{ role: 'user', content: 'Rename about intro' }] }), env(), OWNER, 'chat');
    assert.equal(res.status, 200);
    const r = await res.json();
    assert.deepEqual(r.reads, ['about.html']);
    assert.match(r.reply, /EDIT about\.html/);
    assert.equal(w.calls.ai.length, 2);
    assert.match(JSON.stringify(w.calls.ai[1]), /=== about.html ===/); // file contents were handed back
    assert.match(JSON.stringify(w.calls.ai[0]), /about.html/);        // file list in the system prompt
    const list = JSON.stringify(w.calls.ai[0]).split('EDITABLE FILES')[1].split('The owner is')[0];
    assert.match(list, /index\.html\\nabout\.html/);
    assert.doesNotMatch(list, /about\/index\.html|worker\.js|assets/); // no twins, no server code
  });
}

test('drafts are served at ?wn_preview=ID, with the GitHub Pages prefix removed', async () => {
  fakeWorld();
  const e = env();
  await ensureSchema(e);
  const { id } = await (await handleEditor(req('preview', { files: { 'about.html': '<a href="/wellnest-website/pricing">x</a>', 'cloudflare/worker.js': 'evil' } }), e, OWNER, 'preview')).json();
  const get = async path => servePreview(new Request('https://wellnest.services' + path), e, new URL('https://wellnest.services' + path));
  const hit = await get('/about?wn_preview=' + id);
  assert.equal(await hit.text(), '<a href="/pricing">x</a>');
  assert.equal(hit.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(await get('/cloudflare/worker.js?wn_preview=' + id), null); // blocked files never stored
  assert.equal(await get('/about?wn_preview=wrong-id-0000000000000'), null);
});

test('publish commits the change and its twin; stale edits are refused', async () => {
  const w = fakeWorld();
  const e = env();
  const oldSha = sha('<p>About WellNest</p>');
  const stale = await handleEditor(req('publish', { message: 'x', files: { 'about.html': { content: 'new', sha: 'not-current' } } }), e, OWNER, 'publish');
  assert.equal(stale.status, 409);
  const blocked = await handleEditor(req('publish', { files: { 'cloudflare/worker.js': { content: 'x', sha: sha('export default {}') } } }), e, OWNER, 'publish');
  assert.equal(blocked.status, 400);

  const ok = await handleEditor(req('publish', { message: 'Rename about intro', files: { 'about.html': { content: '<p>About us</p>', sha: oldSha } } }), e, OWNER, 'publish');
  assert.equal(ok.status, 200);
  const r = await ok.json();
  assert.deepEqual(r.files.sort(), ['about.html', 'about/index.html']);
  assert.equal(w.repo.get('about/index.html'), '<p>About us</p>');
  assert.match(w.calls.commits[0].message, /^Rename about intro\n\nPublished from Edit WellNest by owner@example.com/);
});

test('missing GitHub token is explained', async () => {
  fakeWorld();
  const res = await handleEditor(req('files'), { ...env(), GITHUB_TOKEN: '' }, OWNER, 'files');
  assert.equal(res.status, 503);
});

test('screenshots reach each AI in its own format; bad or excess images are dropped', async () => {
  const png = Buffer.from('fake-png').toString('base64');
  for (const provider of ['anthropic', 'openai', 'gemini']) {
    const w = fakeWorld();
    w.say('Thanks, I can see it.');
    const res = await handleEditor(req('chat', { provider, model: 'm1', messages: [
      { role: 'user', content: 'old', images: [{ type: 'image/png', data: png }] },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: '', images: [
        { type: 'image/png', data: png }, { type: 'text/html', data: png }, { type: 'image/jpeg', data: 'not base64!' },
        ...Array(7).fill({ type: 'image/jpeg', data: png })] },
    ] }), env(), OWNER, 'chat');
    assert.equal(res.status, 200, provider);
    const sent = JSON.stringify(w.calls.ai[0]);
    const count = (sent.match(/ZmFrZS1wbmc=/g) || []).length;
    assert.equal(count, 6, `${provider}: newest 6 valid images only`);
    if (provider === 'anthropic') assert.match(sent, /"type":"image","source":\{"type":"base64","media_type":"image\/png"/);
    if (provider === 'openai') assert.match(sent, /"image_url":\{"url":"data:image\/png;base64,/);
    if (provider === 'gemini') assert.match(sent, /"inlineData":\{"mimeType":"image\/png"/);
    assert.match(sent, /\(see screenshot\)/);
  }
});

test('Cloudflare AI: free models through the Worker binding, no key needed', async () => {
  const w = fakeWorld();
  const calls = [];
  const AI = { run: async (model, input) => { calls.push({ model, input }); return calls.length === 1 ? { response: 'READ: about.html' } : { choices: [{ message: { content: 'Done.\n<<<<<<< EDIT about.html\n<p>About WellNest</p>\n=======\n<p>Hi</p>\n>>>>>>> END' } }] }; } };
  const e = { ...env(), ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '', GEMINI_API_KEY: '', AI };
  const s = await (await handleEditor(req('status'), e, OWNER, 'status')).json();
  assert.equal(s.providers.cloudflare.connected, true);
  assert.equal(s.providers.cloudflare.free, true);
  const models = (await (await handleEditor(req('models?provider=cloudflare'), e, OWNER, 'models')).json()).models;
  assert.ok(models.length >= 2 && models.every(m => m.id.startsWith('@cf/')));
  const r = await (await handleEditor(req('chat', { provider: 'cloudflare', model: models[0].id, messages: [{ role: 'user', content: 'hi', images: [{ type: 'image/png', data: 'AAAA' }] }] }), e, OWNER, 'chat')).json();
  assert.match(r.reply, /EDIT about\.html/);
  assert.equal(calls[0].input.messages[0].role, 'system');
  assert.match(calls[0].input.messages[1].content, /can't see/);       // screenshot mentioned, not sent
  assert.equal(w.calls.ai.length, 0);                                   // no outside AI was called

  const off = await (await handleEditor(req('status'), { ...e, AI: undefined }, OWNER, 'status')).json();
  assert.equal(off.providers.cloudflare.connected, false);
  const paid = { ...e, AI: { run: async () => { throw new Error('5035: requires Workers Paid'); } } };
  const err = await (await handleEditor(req('chat', { provider: 'cloudflare', model: 'x', messages: [{ role: 'user', content: 'hi' }] }), paid, OWNER, 'chat')).json();
  assert.match(err.error, /Workers Paid plan; pick another free model/);
});
