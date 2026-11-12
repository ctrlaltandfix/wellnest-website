import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
const fn=src.slice(src.indexOf('async function wnSyncAllAccountData('),src.indexOf('function WnAccountSyncButton('));
const sync=new Function(fn+';return wnSyncAllAccountData;')();
function setup(){
 const values=new Map([['wn-cloud-sync-enabled','1'],['wn-settings',JSON.stringify({name:'Chris'})]]);
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 let row={id:'backup',created_by_id:'owner',data:{local_data:{settings:{language:'en'},meds:[{id:'med'}],expenses:[{id:'expense'}]}}};
 let writes=0,confirmed=true;
 const client={entities:{CloudDataBackup:{filter:async()=>confirmed?[row]:[],update:async(id,data)=>{writes++;row={...row,...data};return row;}}}};
 return{storage,client,tracker:{syncAll:task=>task()},user:{id:'owner'},keys:{settings:'wn-settings'},merge:(a,b)=>({...a,...b}),values,getRow:()=>row,getWrites:()=>writes,deny:()=>confirmed=false};
}
test('full backup merges supplemental records and preserves other cloud sections',async()=>{
 const x=setup();const stamp=await sync(x);assert.equal(x.getWrites(),1);assert.deepEqual(x.getRow().data.local_data.settings,{language:'en',name:'Chris'});assert.deepEqual(x.getRow().data.local_data.meds,[{id:'med'}]);assert.deepEqual(x.getRow().data.local_data.expenses,[{id:'expense'}]);assert.equal(x.storage.getItem('wn-cloud-last-synced-at'),stamp);
});
test('signed-out, disabled and malformed local data do not upload',async()=>{
 const x=setup();await assert.rejects(sync({...x,user:null}),/Sign in/);x.values.set('wn-cloud-sync-enabled','0');await assert.rejects(sync(x),/Enable/);x.values.set('wn-cloud-sync-enabled','1');x.values.set('wn-settings','invalid');await assert.rejects(sync(x),/local record/);assert.equal(x.getWrites(),0);
});
test('missing owner backup fails without writing a success timestamp',async()=>{
 const x=setup();x.deny();await assert.rejects(sync(x),/not ready/);assert.equal(x.getWrites(),0);assert.equal(x.storage.getItem('wn-cloud-last-synced-at'),null);
});
