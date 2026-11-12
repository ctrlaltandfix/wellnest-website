import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.js';
test('product facts are publicly readable without JavaScript or account access',async()=>{
 const r=await worker.fetch(new Request('https://wellnest.services/press'),{ASSETS:{fetch:async()=>new Response('missing',{status:404})}});
 assert.equal(r.status,200);const html=await r.text();
 for(const fact of ['WellNest product facts','Chris Greenfield','wellnest.services','No native Android','30 days','AU$4.99','Official WellNest iPhone listing'])assert(html.includes(fact),fact);
 assert(!html.includes('type="module"'));assert(!r.headers.has('X-Robots-Tag'));
});
test('duplicate Worker hostname facts remain noindex and HEAD has no body',async()=>{
 const r=await worker.fetch(new Request('https://wellnest.email-chrisgreenfield.workers.dev/press',{method:'HEAD'}),{});
 assert.equal(r.status,200);assert.equal(await r.text(),'');assert.equal(r.headers.get('X-Robots-Tag'),'noindex');
});
