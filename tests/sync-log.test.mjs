import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scan,shouldLog,objectAt,tokenShape,doseSummary} from '../cloudflare/synclog.js';

const req=(method,path,ua='Mozilla/5.0')=>[new Request('https://wellnest.services'+path,{method,headers:{'User-Agent':ua}}),new URL('https://wellnest.services'+path)];

test('logs every iPhone API call and only web backup saves',()=>{
 assert.equal(shouldLog(...req('GET','/api/entities/CloudDataBackup','WellNest/24 CFNetwork')),true);
 assert.equal(shouldLog(...req('PATCH','/api/entities/CloudDataBackup/abc')),true);
 assert.equal(shouldLog(...req('GET','/api/entities/CloudDataBackup')),false);
 assert.equal(shouldLog(...req('POST','/api/entities/WorkDocument')),false);
 assert.equal(shouldLog(...req('GET','/api/admin/sync-log','WellNest/24')),false);
 assert.equal(shouldLog(...req('GET','/dashboard','WellNest/24')),false);
});

test('finds the dose log object, skipping the tombstone list of the same name',()=>{
 const text=JSON.stringify({data:{local_data:{trackerDeleted:{medlog:['["2026-11-19","a__night"]']},meds:[{id:'m',escriptPhoto:'x'.repeat(5000),note:'say "medlog": {'}],medlog:{'2026-11-20':['a__morning']}}}});
 assert.deepEqual(objectAt(text,'medlog'),{'2026-11-20':['a__morning']});
 assert.equal(objectAt(text,'wn-medlog'),undefined);
});

test('scans revision, dose dates and token formats without record contents',()=>{
 const body={data:{sync_revision:7,local_data:{meds:[{id:'wn_m3k9x2a_ab12c',name:'Secret med',notes:'private'}],medlog:{'2026-11-17':['x__night'],'2026-11-18':['a'],'2026-11-19':['wn_m3k9x2a_ab12c__morning','3f2a9c1e-1111-2222-3333-444455556666__evening'],'2026-11-20':[]},'wn-medlog':{'2026-11-20':['wn_m3k9x2a_ab12c__08:00']}}}};
 const s=scan(JSON.stringify(body));
 assert.equal(s.revision,7);
 assert.deepEqual(s.dose_log.medlog.dates,{'2026-11-18':1,'2026-11-19':2,'2026-11-20':0});
 assert.equal(s.dose_log.medlog.total_dates,4);
 assert.deepEqual(s.dose_log.medlog.formats,['a','<wn-id>__morning','<uuid>__evening']);
 assert.deepEqual(s.dose_log['wn-medlog'].formats,['<wn-id>__08:00']);
 const text=JSON.stringify(s);
 assert(!text.includes('Secret med')&&!text.includes('private')&&!text.includes('m3k9x2a'));
});

test('token formats mask IDs and names',()=>{
 assert.equal(tokenShape('med-1__morning'),'<med-id>__morning');
 assert.equal(tokenShape('12345__night'),'<number>__night');
 assert.equal(tokenShape('Panadol morning'),'<id> <id>');
 assert.equal(doseSummary(null),null);
});
