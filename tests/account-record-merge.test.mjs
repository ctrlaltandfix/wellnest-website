import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeAccountRecords,syncMergeFields} from '../cloudflare/worker.js';
const keys=['pain','asthma','ep','meds','appts','contacts','exercises','reflection'];
for(const key of keys){
 test(key+': stale desktop preserves phone additions and edits',()=>{
  const current={[key]:[{id:'one',notes:'phone edit'},{id:'phone',notes:'new'}]};
  const stale={[key]:[{id:'one',notes:'old'}]};
  assert.deepEqual(mergeAccountRecords(current,stale,[],2)[key],current[key]);
 });
 test(key+': unrelated concurrent edits merge by field',()=>{
  const base={id:'one',notes:'old',time:'09:00',_u:'2026-11-12T00:00:00Z'};
  const remote={...base,time:'10:00',_u:'2026-11-12T00:02:00Z'};
  const entry={...base,notes:'desktop note',_u:'2026-11-12T00:01:00Z'};
  const merged=mergeAccountRecords({[key]:[remote]},{[key]:[entry]},[{key,entry,base,deleted:false}],2)[key][0];
  assert.equal(merged.time,'10:00');assert.equal(merged.notes,'desktop note');assert.equal(merged._u,remote._u);
 });
}
test('same-field changes are conflicts instead of silent overwrites',()=>{
 assert.throws(()=>syncMergeFields({time:'09:00'},{time:'10:00'},{time:'11:00'}),e=>e.status===409);
});
test('explicit deletion persists; stale snapshots cannot resurrect records',()=>{
 const record={id:'a',name:'Contact'};
 const removed=mergeAccountRecords({contacts:[record]},{contacts:[]},[{key:'contacts',entry:record,base:record,deleted:true}],2);
 assert.deepEqual(removed.contacts,[]);assert.deepEqual(mergeAccountRecords(removed,{contacts:[record]},[],2).contacts,[]);
 assert.throws(()=>mergeAccountRecords({contacts:[{...record,name:'Phone edit'}]},{},[{key:'contacts',entry:record,base:record,deleted:true}],2),e=>e.status===409);
});
test('several offline edits keep earliest baseline and latest change',()=>{
 const base={id:'a',notes:'original'},first={id:'a',notes:'first'},last={id:'a',notes:'last'};
 const result=mergeAccountRecords({appts:[base]},{appts:[last]},[{key:'appts',entry:first,base,deleted:false},{key:'appts',entry:last,base:first,deleted:false}],2);
 assert.equal(result.appts[0].notes,'last');
});
for(const key of ['emergency','settings','asthmaPlan','emergCheck','hospBag'])test(key+': structured backup fields merge without dropping phone changes',()=>{
 const base={id:'$singleton',value:{one:'old',two:'old'}},entry={id:'$singleton',value:{one:'desktop',two:'old'}};
 const result=mergeAccountRecords({[key]:{one:'old',two:'phone'}},{[key]:entry.value},[{key,entry,base,deleted:false}],2);
 assert.deepEqual({...result[key]},{one:'desktop',two:'phone'});
});
test('legacy snapshots only replace existing fields when timestamp is newer',()=>{
 const current={appts:[{id:'a',time:'10:00'}]},old={appts:[{id:'a',time:'09:00'}]};
 assert.equal(mergeAccountRecords(current,old,[],0,false).appts[0].time,'10:00');
 assert.equal(mergeAccountRecords(current,old,[],0,true).appts[0].time,'09:00');
});
