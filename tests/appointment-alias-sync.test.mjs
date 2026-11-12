import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareAppointmentSync,projectAppointmentFields,mergeAccountRecords} from '../cloudflare/worker.js';
const base={id:'a',title:'Test',loc:'Old',location:'Old',spec:'',specialist:''};
const current={appts:[base]};
function save(incoming,revision=true,protocol=0,ops=[]){const p=prepareAppointmentSync(current,incoming,ops,protocol,revision);return projectAppointmentFields(mergeAccountRecords(current,p.incoming,p.operations,protocol,revision));}
test('native alias-only appointment edit updates every read alias',()=>{
 const r=save({appts:[base],appointments:[{...base,title:'Updated'}]});
 for(const key of ['appts','appointments','appointment','wn-appts'])assert.equal(r[key][0].title,'Updated');
});
test('current native deletion creates a tombstone across aliases',()=>{
 const r=save({appointments:[]});assert.deepEqual(r.appts,[]);assert.deepEqual(r.trackerDeleted.appointments,['a']);
});
test('stale native edits and deletes return conflict',()=>{
 for(const incoming of [{appointments:[]},{appointments:[{...base,title:'Stale'}]}])assert.throws(()=>save(incoming,false),e=>e.status===409);
});
test('location and specialist field aliases reconcile intended edits',()=>{
 const r=save({appointments:[{...base,location:'New',specialist:'Specialist'}]});
 assert.equal(r.appts[0].loc,'New');assert.equal(r.appts[0].spec,'Specialist');
});
test('different changed lists and ambiguous field changes return conflict',()=>{
 assert.throws(()=>save({appts:[{...base,title:'One'}],appointments:[{...base,title:'Two'}]}),e=>e.status===409);
 assert.throws(()=>save({appointments:[{...base,loc:'One',location:'Two'}]}),e=>e.status===409);
});
test('explicit web edits ignore old snapshot aliases and retain conflict protection',()=>{
 const edited={...base,title:'Web'};
 const r=save({appts:[edited],appointments:[base]},false,2,[{key:'appts',entry:edited,base,deleted:false}]);
 assert.equal(r.appointments[0].title,'Web');
});
test('projection preserves dose state and does not mutate stored data',()=>{
 const local={appts:[base],appointments:[],medlog:{day:['dose']}};const r=projectAppointmentFields(local);
 assert.deepEqual(r.medlog,local.medlog);assert.deepEqual(local.appointments,[]);
});
