import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarize,shouldLog} from '../cloudflare/synclog.js';

const req=(method,path,ua='Mozilla/5.0')=>[new Request('https://wellnest.services'+path,{method,headers:{'User-Agent':ua}}),new URL('https://wellnest.services'+path)];

test('logs every iPhone API call and only web backup saves',()=>{
 assert.equal(shouldLog(...req('GET','/api/entities/CloudDataBackup','WellNest/24 CFNetwork')),true);
 assert.equal(shouldLog(...req('PATCH','/api/entities/CloudDataBackup/abc')),true);
 assert.equal(shouldLog(...req('GET','/api/entities/CloudDataBackup')),false);
 assert.equal(shouldLog(...req('POST','/api/entities/WorkDocument')),false);
 assert.equal(shouldLog(...req('GET','/api/admin/sync-log','WellNest/24')),false);
 assert.equal(shouldLog(...req('GET','/dashboard','WellNest/24')),false);
});

test('summaries keep shapes and counts, never record contents',()=>{
 const s=summarize({data:{sync_revision:7,local_data:{meds:[{id:'m1',name:'Secret med',notes:'private'}],medlog:{'2026-11-18':['a'],'2026-11-19':['a','b'],'2026-11-20':[]},'wn-medlog':{'2026-11-20':['m1__morning']},trackerDeleted:{meds:['m0']}}}});
 assert.equal(s.revision,7);
 assert.deepEqual(s.counts,{meds:1});
 assert.deepEqual(s.dose_days.medlog,{'2026-11-18':1,'2026-11-19':2,'2026-11-20':0});
 assert.deepEqual(s.dose_days['wn-medlog'],{'2026-11-20':1});
 assert.deepEqual(s.tombstones,{meds:1});
 const text=JSON.stringify(s);
 assert(!text.includes('Secret med')&&!text.includes('private')&&!text.includes('m1__morning'));
});
