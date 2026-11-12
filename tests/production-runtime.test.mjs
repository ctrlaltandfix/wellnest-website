import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../cloudflare/worker.js';
const env={ASSETS:{fetch:async req=>{
 const p=new URL(req.url).pathname;
 if(p==='/chronic-pain-diary')return new Response('<html><head></head><body><h1>Your story,<br/><em>a little clearer.</em></h1></body></html>',{headers:{'Content-Type':'text/html'}});
 return new Response('missing',{status:404});
}}};
test('production entry preserves calendar workaround pages',async()=>{
 for(const path of ['/calendar-quick-add','/calendar-download']){
  const r=await worker.fetch(new Request('https://wellnest.services'+path),env);
  assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/text\/html/);
 }
});
test('production entry serves matching SEO copy and canonical alias',async()=>{
 const r=await worker.fetch(new Request('https://wellnest.services/chronic-pain-diary'),env);
 assert.match(await r.text(),/Free pain diary\.<br\/><em>Your PDF report/);
 const alias=await worker.fetch(new Request('https://wellnest.services/chronic-health-tracker'),env);
 assert.equal(alias.status,301);assert.equal(alias.headers.get('Location'),'https://wellnest.services/chronic-illness-tracker');
});
test('sensitive account and calendar integrations remain in the production entry',()=>{
 const source=readFileSync(new URL('../cloudflare/worker.js',import.meta.url),'utf8');
 for(const fn of ['handleCalendarSubscription','handleCalendarFeed','calendarQuickAddData','searchContentResponse','discoveryResponse'])assert(source.includes('function '+fn+'('),fn);
});
