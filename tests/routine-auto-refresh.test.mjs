import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareMedicationSync,mergeAccountRecords} from '../cloudflare/worker.js';

const source=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
// Evaluate the dashboard's own record normaliser (_e) and the save check together.
const normaliser=source.slice(source.indexOf('_e=(e,t)=>'),source.indexOf(',ve=(e,t)=>'));
const syncKey=source.slice(source.indexOf('function wnSyncKey('));
const wnSyncKey=new Function('Ce',`const ${normaliser};${syncKey};return wnSyncKey;`)(s=>String(s.length));

test('an emptied dose day on the server does not make the idle dashboard save again',()=>{
 assert.equal(wnSyncKey('medlog',{}),wnSyncKey('medlog',{'2026-11-20':[]}));
 assert.equal(wnSyncKey('medlog',{'2026-11-20':['b','a'],'2026-11-19':['c']}),wnSyncKey('medlog',{'2026-11-19':['c'],'2026-11-20':['a','b']}));
});

test('record order and key order do not trigger a save; real differences do',()=>{
 const a={id:'m1',name:'A',routine:['morning']},b={id:'m2',name:'B',routine:['night']};
 assert.equal(wnSyncKey('meds',[a,b]),wnSyncKey('meds',[{routine:['night'],name:'B',id:'m2'},a]));
 assert.notEqual(wnSyncKey('meds',[a,b]),wnSyncKey('meds',[a]));
 assert.notEqual(wnSyncKey('meds',[a]),wnSyncKey('meds',[{...a,routine:['evening']}]));
 assert.notEqual(wnSyncKey('medlog',{'2026-11-20':['m1__morning']}),wnSyncKey('medlog',{}));
 assert.notEqual(wnSyncKey('settings',{}),wnSyncKey('settings',undefined));
});

test('the dashboard saves only when collections differ and syncs when it becomes visible',()=>{
 assert(source.includes('Object.keys(G).some(e=>wnSyncKey(e,d[e])!==wnSyncKey(e,c[e]))'));
 assert(source.includes('document.addEventListener(`visibilitychange`,wnVisibleSync)'));
 assert(source.includes('document.removeEventListener(`visibilitychange`,wnVisibleSync)'));
});

const med=(id,name,routine=['morning'])=>({id,name,dose:'1 tab',routine});
const current={meds:[med('m1','Keep'),med('m2','Remove')],trackerDeleted:{meds:[]}};

test('a current iPhone snapshot that omits a medication deletes it everywhere',()=>{
 const incoming={meds:[med('m1','Keep')]};
 const prepared=prepareMedicationSync(current,incoming,[],undefined,true,true);
 assert.deepEqual(prepared.operations,[{key:'meds',entry:current.meds[1],base:current.meds[1],deleted:true}]);
 const merged=mergeAccountRecords(current,prepared.incoming,prepared.operations,undefined,true);
 assert.deepEqual(merged.meds.map(m=>m.id),['m1']);
 assert.deepEqual(merged.trackerDeleted.meds,['m2']);
});

test('a current iPhone snapshot edit is applied even alongside other operations',()=>{
 const incoming={meds:[med('m1','Keep',['night']),med('m2','Remove')]};
 const prepared=prepareMedicationSync(current,incoming,[{key:'pain',entry:{id:'p1'},deleted:false,base:null}],2,true,true);
 assert.deepEqual(prepared.operations.filter(op=>op.key==='meds'),[{key:'meds',entry:incoming.meds[0],base:current.meds[0],deleted:false}]);
 const merged=mergeAccountRecords(current,prepared.incoming,prepared.operations,2,true);
 assert.deepEqual(merged.meds.find(m=>m.id==='m1').routine,['night']);
});

test('stale, web, explicit and empty-list snapshots never infer deletions',()=>{
 const incoming={meds:[med('m1','Keep')]};
 assert.deepEqual(prepareMedicationSync(current,incoming,[],undefined,false,true).operations,[]);
 assert.deepEqual(prepareMedicationSync(current,incoming,[],undefined,true,false).operations,[]);
 const explicit=[{key:'meds',entry:med('m1','Keep'),base:current.meds[0],deleted:false}];
 assert.equal(prepareMedicationSync(current,incoming,explicit,2,true,true).operations,explicit);
 assert.deepEqual(prepareMedicationSync(current,{meds:[]},[],undefined,true,true).operations,[]);
 assert.deepEqual(prepareMedicationSync(current,{},[],undefined,true,true).operations,[]);
 const one={meds:[med('m1','Only')],trackerDeleted:{meds:[]}};
 assert.equal(prepareMedicationSync(one,{meds:[]},[],undefined,true,true).operations[0].deleted,true);
});
