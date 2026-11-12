import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readAccountBackupBody} from '../cloudflare/worker.js';
const request=text=>new Request('https://wellnest.services/api/entities/CloudDataBackup/backup',{method:'PATCH',body:text});
test('native 1.05 MB backup keeps the dose checkoff and image intact',async()=>{
 const input={data:{local_data:{medlog:{'2026-11-12':['med__night']},image:'a'.repeat(1050000)}}};
 assert.deepEqual(await readAccountBackupBody(request(JSON.stringify(input))),input);
});
test('oversized declared and undeclared payloads reject with 413',async()=>{
 await assert.rejects(readAccountBackupBody(request(JSON.stringify({image:'a'.repeat(1800000)}))),e=>e.status===413);
 await assert.rejects(readAccountBackupBody(new Request('https://wellnest.services/',{method:'POST',headers:{'Content-Length':'1800001'},body:'{}'})),e=>e.status===413);
});
test('malformed backup values reject with 400',async()=>{
 for(const text of ['{','[]','null','42'])await assert.rejects(readAccountBackupBody(request(text)),e=>e.status===400);
});
