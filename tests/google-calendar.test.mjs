import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import * as crypto from 'node:crypto';
const source = stripTypeScriptTypes(readFileSync(new URL('../netlify/functions/google-calendar.mts',import.meta.url),'utf8'))
  .replace(/^import .*;$/gm,'').replace('export default','return').replace(/export const config[\s\S]*$/,'');
function setup({ identity={id:'identity-1'}, configured=true, account=true, fetch=async()=>{throw Error('Unexpected external request');} }={}) {
  const calls=[];
  const client={ async query(sql,params){calls.push({sql,params});return {rows:sql.startsWith('SELECT id FROM') && account ? [{id:'account-1'}] : []};},release(){calls.push({sql:'release'});} };
  const cryptoNames=['randomBytes','createHash','createCipheriv','createDecipheriv','timingSafeEqual'];
  const names=['getUser','getDatabase','Netlify','fetch',...cryptoNames];
  const values=[async()=>identity,()=>({pool:{connect:async()=>client}}),{env:{get:()=>configured?'test-fixture':undefined}},fetch,...cryptoNames.map(name=>crypto[name])];
  return { calls, handler:new Function(...names,source)(...values) };
}
const request=(action,method='GET')=>new Request('https://wellnest.services/api/calendar/'+action,{method,headers:method==='GET'?{}:{Origin:'https://wellnest.services'}});
test('calendar access rejects unauthenticated requests without database access',async()=>{
  const mock=setup({identity:null});assert.equal((await mock.handler(request('status'))).status,401);assert.equal(mock.calls.length,0);
});
test('cross-origin calendar mutations are rejected',async()=>{
  const mock=setup();assert.equal((await mock.handler(new Request('https://wellnest.services/api/calendar/connect',{method:'POST',headers:{Origin:'https://elsewhere.example'}}))).status,403);assert.equal(mock.calls.length,0);
});
test('missing OAuth configuration returns a safe setup message',async()=>{
  const mock=setup({configured:false});const response=await mock.handler(request('status'));assert.equal(response.status,503);assert.equal((await response.json()).configured,false);assert.equal(mock.calls.length,0);
});
test('status scopes queries to the imported account and exposes no credentials',async()=>{
  const mock=setup();const response=await mock.handler(request('status'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{configured:true,connected:false,calendarId:'',calendarName:'',lastSyncedAt:null});
  assert.ok(mock.calls.some(c=>c.sql==='SET LOCAL ROLE wellnest_runtime'));
  assert.ok(mock.calls.some(c=>c.sql.includes("'wellnest.user_id'") && c.params[0]==='account-1'));
});
test('connection uses account selection, offline calendar scopes and a secure state cookie',async()=>{
  const mock=setup();const response=await mock.handler(request('connect','POST'));assert.equal(response.status,200);
  const consent=new URL((await response.json()).url);assert.equal(consent.origin,'https://accounts.google.com');assert.equal(consent.searchParams.get('prompt'),'consent select_account');assert.equal(consent.searchParams.get('access_type'),'offline');assert.match(consent.searchParams.get('scope'),/calendar.events/);assert.ok(consent.searchParams.get('state'));
  const cookie=response.headers.get('set-cookie');assert.match(cookie,/Secure; HttpOnly; SameSite=Lax/);assert.match(cookie,/Max-Age=600/);
});
test('invalid and expired callbacks never exchange authorization codes',async()=>{
  const mock=setup();const response=await mock.handler(request('callback?state=invalid&code=invalid'));assert.equal(response.status,303);assert.equal(response.headers.get('Location'),'/settings?calendar=invalid-state');assert.equal(mock.calls.length,0);
});
test('unknown routes and incorrect methods do not query the database',async()=>{
  const mock=setup();assert.equal((await mock.handler(request('status','POST'))).status,405);assert.equal((await mock.handler(request('arbitrary'))).status,405);assert.equal(mock.calls.length,0);
});
