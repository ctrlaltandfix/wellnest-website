import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../admin/outreach.html', import.meta.url), 'utf8');
const index = JSON.parse(html.match(/<script type="application\/json" id="public-post-data">([\s\S]*?)<\/script>/)[1]);
const source = html.slice(html.indexOf('  function filterPublicPosts('), html.indexOf('  function requests()'));
const filter = vm.runInNewContext(source + '\nfilterPublicPosts');
const defaults = { query: '', platform: '', community: '', from: '', to: '', oldest: false };
test('index contains real source links and only post-level product-request metadata', () => {
 assert.ok(index.posts.length >= 10);
 assert.equal(new Set(index.posts.map(p => p.id)).size, index.posts.length);
 for (const p of index.posts) {
  assert.deepEqual(Object.keys(p).sort(), ['availability','community','date','id','platform','summary','url']);
  assert.equal(new Date(p.date).toISOString().slice(0,10), p.date);
  assert.ok(p.date <= index.researched_on);
  const url = new URL(p.url);
  assert.equal(url.hostname, 'www.reddit.com');
  assert.ok(url.pathname.includes('/' + p.community + '/comments/'));
  assert.ok(p.summary.length > 30 && p.summary.length < 250);
 }
});
test('search, community, platform and inclusive date filters combine correctly', () => {
 assert.equal(filter(index.posts, defaults)[0].date, '2026-11-14');
 assert.equal(filter(index.posts, {...defaults, oldest:true})[0].date, '2024-04-23');
 const free = filter(index.posts, {...defaults, query:' FREE ', platform:'Reddit', community:'r/dysautonomia', from:'2025-07-16', to:'2025-07-16'});
 assert.equal(free.length, 1);
 assert.equal(filter(index.posts, {...defaults, query:'not-a-match'}).length, 0);
 assert.equal(filter(index.posts, {...defaults, platform:'Other'}).length, 0);
 assert.equal(filter(index.posts, {...defaults, from:'2026-11-01'}).length, 1);
 assert.equal(index.posts[0].date, '2026-11-14');
});
test('all inline executable scripts parse', () => {
 for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
});
