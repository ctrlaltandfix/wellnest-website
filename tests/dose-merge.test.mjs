import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeDoseState,handleMedicationBackup} from '../cloudflare/worker.js';
const day='2026-11-12',token='med-1__afternoon';
const local=(tokens)=>({medlog:{[day]:tokens}});
test('stale desktop snapshot cannot erase a dose marked on phone',()=>{
 assert.deepEqual(mergeDoseState(local([token]),local([])).medlog[day],[token]);
});
test('independent check-offs merge and repeat snapshots do not duplicate',()=>{
 const first=mergeDoseState(local([token]),local(['med-2__morning']));
 assert.equal(first.medlog[day].length,2);assert.deepEqual(mergeDoseState(first,local([token])).medlog,first.medlog);
});
test('explicit uncheck is retained through stale snapshots; explicit recheck works',()=>{
 const removed=mergeDoseState(local([token]),local([token]),[{date:day,token,taken:false,baseTaken:true}]);
 const stale=mergeDoseState({medlog:removed.medlog,trackerDeleted:{medlog:removed.deleted}},local([token]));assert.deepEqual(stale.medlog[day],[]);
 assert.deepEqual(mergeDoseState({medlog:stale.medlog,trackerDeleted:{medlog:stale.deleted}},local([]),[{date:day,token,taken:true,baseTaken:false}]).medlog[day],[token]);
});
function mock({conflict=false,missing=false,never=false}={}){
 let row={entity:'CloudDataBackup',id:'backup',owner_id:'owner',created_date:'old',updated_date:'old',data:JSON.stringify({backup_key:'wellnest-local-data',data:{local_data:local([])}})},updates=0,reads=0;
 const env={DB:{prepare(sql){return{bind(...args){return{async first(){
  assert(sql.includes('owner_id = ?'));assert(args.includes('owner'));
  if(sql.startsWith('SELECT')){reads++;return missing?null:{...row};}
  assert(sql.includes('AND data = ?'));updates++;
  if(never)return null;
  if(conflict&&updates===1){row.data=JSON.stringify({backup_key:'wellnest-local-data',data:{local_data:local([token])}});return null;}
  assert.equal(args[4],row.data);row={...row,data:JSON.stringify(JSON.parse(args[0]))};return row;
 }}}}}}};
 const request=()=>new Request('https://wellnest.services/api/entities/CloudDataBackup/backup',{method:'PATCH',body:JSON.stringify({backup_key:'wellnest-local-data',data:{local_data:local([])}}),headers:{'Content-Type':'application/json'}});
 return{env,request,getRow:()=>JSON.parse(row.data),getUpdates:()=>updates,getReads:()=>reads};
}
test('concurrent phone update rejects a stale legacy uncheck without overwriting phone state',async()=>{
 const m=mock({conflict:true});const r=await handleMedicationBackup(m.request(),m.env,{id:'owner'},'backup');assert.equal(r.status,409);assert.equal(m.getUpdates(),1);assert.deepEqual(m.getRow().data.local_data.medlog[day],[token]);
});
test('inaccessible backup is not written and repeated conflicts are retryable',async()=>{
 const a=mock({missing:true});assert.equal((await handleMedicationBackup(a.request(),a.env,{id:'owner'},'backup')).status,404);assert.equal(a.getUpdates(),0);
 const b=mock({never:true});assert.equal((await handleMedicationBackup(b.request(),b.env,{id:'owner'},'backup')).status,409);assert.equal(b.getUpdates(),6);
});
const dashboard= (await import('node:fs')).readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
const trackerCode=dashboard.slice(dashboard.indexOf('function be('),dashboard.indexOf('var K=',dashboard.indexOf('function be(')));
const flatten=(key,log)=>Object.entries(log||{}).flatMap(([date,tokens])=>tokens.map(token=>({id:JSON.stringify([date,token]),date,token})));
const group=(key,entries)=>entries.reduce((a,e)=>{(a[e.date]||=[]).push(e.token);return a},{});
const makeTracker=new Function('G','_e','ve','ye',trackerCode+';return be;')({medlog:'wn-medlog'},flatten,group,(value,fallback)=>value?JSON.parse(value):fallback);
test('desktop applies server-confirmed phone check-offs after uploading its change',async()=>{
 const values=new Map([['wn-medlog','{}']]);const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const phone='phone-med__morning',desktop='desktop-med__morning';let payload;
 const client={entities:{CloudDataBackup:{
  filter:async()=>[{id:'backup',created_by_id:'owner',data:{local_data:local([])}}],
  update:async(id,data)=>{
   payload=data;
   return {data:{local_data:{medlog:{[day]:[phone,desktop]},trackerDeleted:{medlog:[]}}}};
  }
 }}};
 const tracker=makeTracker({client,storage,userId:'owner'});tracker.change('medlog',{id:JSON.stringify([day,desktop]),date:day,token:desktop});await tracker.sync();
 assert.deepEqual(JSON.parse(storage.getItem('wn-medlog'))[day],[phone,desktop]);assert.deepEqual(payload._dose_ops,[{date:day,token:desktop,taken:true,baseTaken:false}]);
});
test('repeated uncheck without baseline is safe when the dose is already untaken',()=>{
 const result=mergeDoseState(local([]),local([]),[{date:day,token,taken:false}]);
 assert.deepEqual(result.medlog[day],[]);
 assert.deepEqual(result.deleted,[JSON.stringify([day,token])]);
});
test('uncheck without baseline cannot overwrite an existing taken status',()=>{
 assert.throws(()=>mergeDoseState(local([token]),local([token]),[{date:day,token,taken:false}]),error=>error.status===409);
});
