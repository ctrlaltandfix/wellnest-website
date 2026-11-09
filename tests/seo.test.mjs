// Discoverability: one address per page, app routes answered properly, IndexNow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import worker, { cleanAddress } from '../cloudflare/worker.js';
import { pageUrl, submitIndexNow, handleIndexNow, INDEXNOW_KEY } from '../cloudflare/seo.js';

// A stand-in for Cloudflare's static files: pages answer 200, the rest 404.
const PAGES = new Set(['/', '/about', '/pricing', '/free-tools', '/guides']);
const assets = { fetch: async req => {
  const p = new URL(req.url).pathname;
  if (p === '/sitemap.xml') return new Response('<urlset><url><loc>https://wellnest.services/</loc></url><url><loc>https://wellnest.services/about</loc></url></urlset>');
  return new Response(PAGES.has(p) ? '<p>page</p>' : '<p>404 app shell</p>', { status: PAGES.has(p) ? 200 : 404, headers: { 'Content-Type': 'text/html' } });
} };
const env = { ASSETS: assets };
const clean = p => cleanAddress(env, new URL('https://wellnest.services' + p));

test('every page has one address: variants redirect to it', async () => {
  assert.equal(await clean('/Pricing'), '/pricing');
  assert.equal(await clean('/PrivacyPolicy'), '/privacypolicy');
  assert.equal(await clean('/TermsOfService.html'), '/termsofservice');
  assert.equal(await clean('/free-tools.html'), '/free-tools');
  assert.equal(await clean('/index.html'), '/');
  assert.equal(await clean('/about/'), '/about');
  assert.equal(await clean('/landing/'), null);        // only served with the slash: left alone
  for (const ok of ['/', '/about', '/pricing', '/assets/index-X.js', '/api/auth/me', '/admin/edit', '/404.html', '/about.html?wn_preview=abcdefghijklmnopqrstu'])
    assert.equal(await clean(ok), null, ok);

  const res = await worker.fetch(new Request('https://wellnest.services/Pricing?utm_source=x'), env);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), 'https://wellnest.services/pricing?utm_source=x');
  const old = await worker.fetch(new Request('https://wellnest.services/wellnest-website/free-tools.html'), env);
  assert.equal(old.headers.get('Location'), 'https://wellnest.services/free-tools'); // one hop, not two
});

test('app-only pages answer 200; private ones stay out of search results', async () => {
  const dash = await worker.fetch(new Request('https://wellnest.services/dashboard'), env);
  assert.equal(dash.status, 200);
  assert.equal(dash.headers.get('X-Robots-Tag'), 'noindex');
  const tpl = await worker.fetch(new Request('https://wellnest.services/free-symptom-diary-template'), env);
  assert.equal(tpl.status, 200);
  assert.equal(tpl.headers.get('X-Robots-Tag'), null);
  assert.equal((await worker.fetch(new Request('https://wellnest.services/no-such-page'), env)).status, 404);
  const dev = await worker.fetch(new Request('https://wellnest.example.workers.dev/about'), env);
  assert.equal(dev.headers.get('X-Robots-Tag'), 'noindex');   // duplicate host kept out of search
});

test('site files use clean, lower-case page addresses', () => {
  const root = new URL('..', import.meta.url).pathname;
  const files = readdirSync(root).filter(f => /\.(html|txt|xml)$/.test(f));
  const bad = /(https:\/\/wellnest\.services\/|\/wellnest-website\/)(?!404\.html)[A-Za-z0-9-]+\.html\b|(https:\/\/wellnest\.services\/|\/wellnest-website\/)(Pricing|PrivacyPolicy|TermsOfService)\b/;
  for (const f of files) assert.doesNotMatch(readFileSync(root + f, 'utf8'), bad, f);
  const sitemap = readFileSync(root + 'sitemap.xml', 'utf8');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(locs).size, locs.length, 'no duplicate sitemap entries');
  assert.equal(readFileSync(root + INDEXNOW_KEY + '.txt', 'utf8').trim(), INDEXNOW_KEY);
});

test('IndexNow: page addresses, submission and the admin endpoint', async () => {
  assert.equal(pageUrl('about.html'), 'https://wellnest.services/about');
  assert.equal(pageUrl('about/index.html'), 'https://wellnest.services/about');
  assert.equal(pageUrl('index.html'), 'https://wellnest.services/');
  assert.equal(pageUrl('admin/edit.html'), null);
  assert.equal(pageUrl('robots.txt'), null);

  const sent = [];
  globalThis.fetch = async (url, init) => { sent.push({ url: String(url), body: JSON.parse(init.body) }); return new Response('', { status: 202 }); };
  const r = await submitIndexNow(['https://wellnest.services/about', 'https://wellnest.services/about', 'https://evil.example/x']);
  assert.deepEqual(r, { submitted: 1, status: 202, ok: true, detail: undefined });
  assert.equal(sent[0].url, 'https://api.indexnow.org/indexnow');
  assert.deepEqual(sent[0].body, { host: 'wellnest.services', key: INDEXNOW_KEY, keyLocation: `https://wellnest.services/${INDEXNOW_KEY}.txt`, urlList: ['https://wellnest.services/about'] });

  const post = body => new Request('https://wellnest.services/api/seo/indexnow', { method: 'POST', body: JSON.stringify(body) });
  assert.equal((await handleIndexNow(post({}), env, { email: 'x@y.z' })).status, 403);
  const all = await (await handleIndexNow(post({}), { ...env, ADMIN_EMAILS: 'owner@example.com' }, { email: 'owner@example.com', role: 'admin' })).json();
  assert.equal(all.submitted, 2);                               // every sitemap page
  assert.deepEqual(sent.at(-1).body.urlList, ['https://wellnest.services/', 'https://wellnest.services/about']);
});
