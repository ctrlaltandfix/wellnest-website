import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeAppointmentNotes,prepareAppointmentSync,mergeAccountRecords,projectAppointmentFields} from '../cloudflare/worker.js';
test('notes preserve independent additions and replay without duplication',()=>{
 assert.equal(mergeAppointmentNotes('Prep','Prep\nBring referral','Prep\nAsk questions'),'Prep\nBring referral\nAsk questions');
 assert.equal(mergeAppointmentNotes('Prep','Prep\nBring referral\nAsk questions','Prep\nBring referral'),'Prep\nBring referral\nAsk questions');
 assert.equal(mergeAppointmentNotes('Prep','Prep\nBring referral\nAsk questions','Prep\nAsk questions'),'Prep\nBring referral\nAsk questions');
 assert.equal(mergeAppointmentNotes('ABC DEF','AXC DEF','ABC DEZ'),'AXC DEZ');
});
test('conflicting replacements and deletions remain conflicts',()=>{
 assert.equal(mergeAppointmentNotes('Original','Replacement A','Replacement B'),null);
 assert.equal(mergeAppointmentNotes('Original','New original',''),null);
 assert.equal(mergeAppointmentNotes(undefined,'server','phone'),null);
});
test('title edits pass with compatible notes while dose data stays unchanged',()=>{
 const base={id:'a',title:'Old',notes:'Prep',loc:'',location:'',spec:'',specialist:''};
 const current={appts:[{...base,notes:'Prep\nBring referral'}],medlog:{day:['dose']}};
 const entry={...base,title:'New',notes:'Prep\nAsk questions'};
 const prepared=prepareAppointmentSync(current,{appts:[entry]},[{key:'appts',base,entry,deleted:false}],2,false,true);
 const saved=projectAppointmentFields(mergeAccountRecords(current,prepared.incoming,prepared.operations,2,false));
 assert.equal(saved.appts[0].title,'New');assert.equal(saved.appts[0].notes,'Prep\nBring referral\nAsk questions');assert.deepEqual(saved.medlog,current.medlog);
});
test('concurrent title replacements still conflict',()=>{
 const base={id:'a',title:'Old',notes:'Prep'};const current={appts:[{...base,title:'Desktop'}]};const entry={...base,title:'Phone'};
 const p=prepareAppointmentSync(current,{appts:[entry]},[{key:'appts',base,entry,deleted:false}],2,false,true);
 assert.throws(()=>mergeAccountRecords(current,p.incoming,p.operations,2,false),e=>e.status===409);
});
