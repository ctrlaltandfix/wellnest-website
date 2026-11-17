import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {contactFields,contactReport,careCircleSource} from '../cloudflare/care-circle.js';
import worker from '../cloudflare/worker.js';
const original=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
test('report includes full details and safely renders user text',()=>{
 const contact={name:'<script>alert(1)</script>',phone:'123',email:'a@example.test',address:'First\nSecond',notes:'<img onerror=alert(1)>',emerg:true,contactCategories:['GP','Family']};
 const html=contactReport([contact]);
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
 for(const value of ['123','a@example.test','First\nSecond','GP, Family','Yes','Print / save as PDF'])assert.ok(html.includes(value));
 assert.equal(contactFields({})[6][1],'No');
});
test('production injects both controls, preserves other views and refreshes cache',async()=>{
 const env={ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname.includes('dashboardbeta')?original:'&dosemerge=20261112',{headers:{'Content-Type':'application/javascript'}})}};
 const response=await worker.fetch(new Request('https://wellnest.services/assets/dashboardbeta-calendar-20261107-wn2.js'),env);
 const source=await response.text();
 for(const text of ['WnContactView,{contact:e}','WnContactPrint,{contacts:e}','function WnAppointmentView(','function WnContactView(','disabled:!contacts.length'])assert.ok(source.includes(text),text);
 execFileSync(process.execPath,['--check','--input-type=module'],{input:source});
 assert.equal(careCircleSource(source),source);
 const entry=await worker.fetch(new Request('https://wellnest.services/assets/index-calendar-20261117-wn3.js'),env);
 assert.match(await entry.text(),/carecircle=20261116/);
});
