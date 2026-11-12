import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleMedicationBackup,mergeDoseState} from '../cloudflare/worker.js';
const owner={id:'owner'};
function fixture(){
 let stored={backup_key:'wellnest-local-data',data:{sync_revision:7,local_data:{appts:[{id:'a',time:'phone'}],medlog:{}}}},writes=0;
 const env={DB:{prepare(sql){return {bind(...args){return {async first(){
  assert(args.includes(owner.id));
  const row={id:'backup',owner_id:owner.id,data:JSON.stringify(stored)};
  if(sql.startsWith('SELECT'))return row;
  assert.equal(args[4],row.data);stored=JSON.parse(args[0]);writes++;return {...row,data:JSON.stringify(stored)};
 }}}}}}};
 return {env,get:()=>stored,writes:()=>writes,send:input=>handleMedicationBackup(new Request('https://wellnest.services/api/entities/CloudDataBackup/backup',{method:'PATCH',body:JSON.stringify(input)}),env,owner,'backup')};
}
test('future desktop clock cannot overwrite phone data; matching revision can update once',async()=>{
 const f=fixture(),payload={backup_key:'wellnest-local-data',data:{sync_revision:6,saved_at:'2099-01-01',local_data:{appts:[{id:'a',time:'desktop'}]}}};
 assert.equal((await f.send(payload)).status,409);assert.equal(f.writes(),0);assert.equal(f.get().data.local_data.appts[0].time,'phone');
 payload.data.sync_revision=7;assert.equal((await f.send(payload)).status,200);assert.equal(f.get().data.sync_revision,8);
 payload.data.local_data.appts[0].time='another stale edit';assert.equal((await f.send(payload)).status,409);assert.equal(f.writes(),1);
});
test('partial, null and renamed account backups cannot bypass merge protection',async()=>{
 const f=fixture();for(const payload of [{data:null},{data:{local_data:null}},{backup_key:'different',data:{}}])assert.equal((await f.send(payload)).status,400);
 assert.equal(f.writes(),0);
});
test('old desktop uncheck without baseline is rejected; explicit user uncheck succeeds',()=>{
 const date='2026-11-12',token='dose',current={medlog:{[date]:[token]}};
 assert.throws(()=>mergeDoseState(current,{},[{date,token,taken:false}]),e=>e.status===409);
 assert.deepEqual(mergeDoseState(current,{},[{date,token,taken:false,baseTaken:true}]).medlog[date],[]);
});
const source=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
test('storage mutations publish the pre-edit snapshot',()=>{
 const events=[],storage=new Map([['contacts',JSON.stringify([{id:'one',name:'old'}])]]);
 const code=source.slice(source.indexOf('function Z('),source.indexOf('function Ve('));
 const write=new Function('localStorage','window','CustomEvent',code+';return Z;')({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},{dispatchEvent:e=>events.push(e)},class {constructor(type,{detail}){this.type=type;this.detail=detail;}});
 write('contacts',[{id:'one',name:'new'}]);assert.deepEqual(JSON.parse(events[0].detail.previous),[{id:'one',name:'old'}]);
});
test('editing one local record does not manufacture deletions for phone-only records',()=>{
 const start=source.indexOf('i=n=>{let i=Object.keys(G).find');const end=source.indexOf(';const dosePoll=',start);
 assert(start>=0&&end>start);const changes=[];
 const old=[{id:'a',time:'old'}],updated=[{id:'a',time:'desktop'}];
 const engine={read:()=>({appts:updated}),baseline:()=>({appts:[...old,{id:'phone',time:'new'}]}),change:(...args)=>changes.push(args)};
 const listener=new Function('G','_e','ye','e','r','let t={};return '+source.slice(start+2,end)+';')({appts:'wn-appts'},(k,v)=>v,(v,f)=>v?JSON.parse(v):f,engine,()=>{});
 listener({detail:{key:'wn-appts',previous:JSON.stringify(old)}});
 assert.equal(changes.length,1);assert.equal(changes[0][1].id,'a');assert.deepEqual(changes[0][3],old[0]);
});
