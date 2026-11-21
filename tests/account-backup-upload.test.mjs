import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAccountBackupBody} from '../cloudflare/worker.js';
const request=text=>new Request('https://wellnest.services/api/entities/CloudDataBackup/backup',{method:'PATCH',body:text});
test('native 2.09 MB backup keeps the dose checkoff and image intact',async()=>{
 const input={data:{local_data:{medlog:{'2026-11-12':['med__night']},image:'a'.repeat(2090573)}}};
 assert.deepEqual(await readAccountBackupBody(request(JSON.stringify(input))),input);
});
test('oversized declared and undeclared payloads reject with 413',async()=>{
 await assert.rejects(readAccountBackupBody(request(JSON.stringify({image:'a'.repeat(8388608)}))),e=>e.status===413);
 await assert.rejects(readAccountBackupBody(new Request('https://wellnest.services/',{method:'POST',headers:{'Content-Length':'8388609'},body:'{}'})),e=>e.status===413);
});
test('malformed backup values reject with 400',async()=>{
 for(const text of ['{','[]','null','42'])await assert.rejects(readAccountBackupBody(request(text)),e=>e.status===400);
});

import {DatabaseSync} from 'node:sqlite';
import {saveBackup,unpackBackup} from '../cloudflare/account-backup-storage.js';
test('large backups round trip across storage limits, concurrent retries and deletion',async()=>{
 const sqlite=new DatabaseSync(':memory:');
 sqlite.exec('CREATE TABLE records(entity TEXT,id TEXT,owner_id TEXT,created_date TEXT,updated_date TEXT,data TEXT)');
 const db={prepare(sql){return{run:()=>sqlite.exec(sql),bind(...args){const stmt=sqlite.prepare(sql);return{
  first:()=>stmt.get(...args),all:()=>({results:stmt.all(...args)})};}};},
 batch(stmts){sqlite.exec('BEGIN');try{const results=stmts.map(stmt=>stmt.all());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 const small={backup_key:'wellnest-local-data',data:{local_data:{}}};
 const big={...small,data:{local_data:{image:'😀'.repeat(550000),medlog:{'2026-11-21':['m__evening']}}}};
 const put=(old,value)=>saveBackup(db,'owner','backup',old,value,'now');
 const initial=await put(null,small);
 const row=await put(initial,big);
 assert.deepEqual(await unpackBackup(db,row,'owner'),big);
 assert.equal(await put(initial,big),null);
 const chunks=()=>sqlite.prepare('SELECT count(*) AS n FROM account_backup_chunks').get().n;
 assert(chunks()>1);
 const compact=await put(row,small);
 assert.deepEqual(await unpackBackup(db,compact,'owner'),small);
 assert.equal(chunks(),0);
 await put(compact,big);
 sqlite.exec('DELETE FROM records');
 assert.equal(chunks(),0);
});
