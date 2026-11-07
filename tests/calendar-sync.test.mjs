import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, toGoogle, fromGoogle, eventId } from '../netlify/lib/calendar-sync.mjs';

const local = { id:'local-1', title:'Specialist', date:'2026-11-08', time:'09:30', loc:'Clinic', notes:'Bring results', specialist:'Dr Chen' };
const event = { ...toGoogle(local,'Australia/Sydney'), id:'google-1', etag:'v1' };
const link = { eventId:event.id, etag:event.etag, snapshot:local };
function setup(overrides = {}) {
  const calls = [];
  return { calls, run:()=>reconcile({ owner:'account-1', calendar:'family', timeZone:'Australia/Sydney', appointments:[local], deletedIds:[], links:{ [local.id]:link }, events:[event], api:async(method,id,body,etag)=>{
    calls.push({method,id,body,etag});
    return method==='GET' ? null : { ...body, id:id || body.id, etag:'v2' };
  }, ...overrides }) };
}
test('unchanged appointments cause no Google writes',async()=>{
  const mock=setup(); const result=await mock.run(); assert.equal(mock.calls.length,0);assert.deepEqual(result.appointments,[local]);
});
test('WellNest edits update Google with optimistic concurrency',async()=>{
  const mock=setup({appointments:[{...local,title:'Updated'}]});await mock.run();
  assert.equal(mock.calls[0].method,'PATCH');assert.equal(mock.calls[0].etag,'v1');assert.equal(mock.calls[0].body.summary,'Updated');
  assert.equal(mock.calls[0].body.start,undefined);assert.equal(mock.calls[0].body.end,undefined);
});
test('Google edits win simultaneous changes and preserve local specialist',async()=>{
  const mock=setup({appointments:[{...local,title:'Local edit'}],events:[{...event,summary:'Google edit',etag:'v2'}]});
  const result=await mock.run();assert.equal(result.appointments[0].title,'Google edit');assert.equal(result.appointments[0].specialist,'Dr Chen');assert.equal(mock.calls.length,0);
});
test('WellNest tombstones delete linked Google events',async()=>{
  const mock=setup({appointments:[],deletedIds:[local.id]});const result=await mock.run();
  assert.equal(mock.calls[0].method,'DELETE');assert.equal(result.appointments.length,0);assert.equal(Object.keys(result.links).length,0);
});
test('Google cancellations delete local appointments and add tombstones',async()=>{
  const mock=setup({events:[{id:event.id,status:'cancelled'}]});const result=await mock.run();assert.deepEqual(result.appointments,[]);assert.deepEqual(result.deletedIds,[local.id]);
});
test('missing local records are not interpreted as deletions',async()=>{
  const mock=setup({appointments:[]});await mock.run();assert.equal(mock.calls.length,0);
});
test('new Google events import with stable IDs and no duplicate exports',async()=>{
  const mock=setup({appointments:[],links:{}});const result=await mock.run();assert.equal(result.appointments.length,1);assert.ok(result.appointments[0].id.startsWith('google-'));assert.equal(mock.calls.length,0);
});
test('new WellNest events export with deterministic account and calendar scoped IDs',async()=>{
  const mock=setup({links:{},events:[]});await mock.run();const body=mock.calls[0].body;
  assert.equal(body.id,eventId('account-1','family',local.id));assert.notEqual(body.id,eventId('account-2','family',local.id));assert.notEqual(body.id,eventId('account-1','personal',local.id));
  assert.equal(body.extendedProperties.private.wellnestId,local.id);
});
test('completed writes can recover links by Google private properties after retry',async()=>{
  const mock=setup({links:{},events:[{...event,extendedProperties:{private:{wellnestOwner:'account-1',wellnestId:local.id}}}]});const result=await mock.run();assert.equal(result.appointments.length,1);assert.ok(result.links[local.id]);assert.equal(mock.calls.length,0);
});
test('events outside import range are checked individually before detecting deletion',async()=>{
  const mock=setup({events:[]});const result=await mock.run();assert.equal(mock.calls[0].method,'GET');assert.deepEqual(result.deletedIds,[local.id]);
});
test('all-day events retain exclusive end date across month boundaries',()=>{
  const body=toGoogle({...local,date:'2026-12-31',time:''},'UTC');assert.deepEqual(body.end,{date:'2027-01-01'});
});
test('Google times convert to the selected calendar timezone',()=>{
  const result=fromGoogle({summary:'Visit',start:{dateTime:'2026-11-07T22:30:00Z'}},{},'Australia/Sydney');assert.equal(result.date,'2026-11-08');assert.equal(result.time,'09:30');
});
test('large exports checkpoint progress instead of losing completed links',async()=>{
  const mock=setup({links:{},events:[],appointments:Array.from({length:110},(_,i)=>({...local,id:'local-'+i}))});const result=await mock.run();assert.equal(result.partial,true);assert.equal(Object.keys(result.links).length,100);assert.equal(result.appointments.length,110);
});
