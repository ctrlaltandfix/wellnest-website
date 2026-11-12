import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeRoutineDoseState,projectRoutineDoseFields} from '../cloudflare/worker.js';
const date='2026-11-13',token='med__morning',id=JSON.stringify([date,token]);
const empty={medlog:{[date]:[]},trackerDeleted:{medlog:[id]}};
test('current native snapshot can recheck a previously unmarked dose',()=>{
 const r=mergeRoutineDoseState(empty,{medlog:{[date]:[token]}},[],0,true);
 assert.deepEqual(r.medlog[date],[token]);assert.deepEqual(r.deleted,[]);
});
test('current native snapshot can uncheck a dose and stale positives cannot recheck it',()=>{
 const current={medlog:{[date]:[token]}};
 const r=mergeRoutineDoseState(current,{medlog:{[date]:[]}},[],0,true);
 assert.deepEqual(r.medlog[date],[]);assert.deepEqual(r.deleted,[id]);
 assert.throws(()=>mergeRoutineDoseState({medlog:r.medlog,trackerDeleted:{medlog:r.deleted}},{medlog:{[date]:[token]}},[],0,false),e=>e.status===409);
});
test('alias-only native edits reconcile when the canonical input is unchanged',()=>{
 const r=mergeRoutineDoseState(empty,{medlog:empty.medlog,'wn-medlog':{[date]:[token]}},[],0,true);
 assert.deepEqual(r.medlog[date],[token]);
});
test('web explicit checkoff and tombstone baseline continue to work',()=>{
 const r=mergeRoutineDoseState(empty,{medlog:{}},[{date,token,taken:true,baseTaken:false}],2,false);
 assert.deepEqual(r.medlog[date],[token]);
});
test('responses project one canonical state to native alias without mutating records',()=>{
 const source={...empty,'wn-medlog':{[date]:[token]},tracker_deleted:{medlog:[]}};
 const r=projectRoutineDoseFields(source);assert.deepEqual(r['wn-medlog'],empty.medlog);assert.deepEqual(r.tracker_deleted,r.trackerDeleted);assert.deepEqual(source['wn-medlog'][date],[token]);
});
test('stale unchecked snapshots cannot clear doses and ambiguous fields return conflict',()=>{
 assert.throws(()=>mergeRoutineDoseState({medlog:{[date]:[token]}},{medlog:{[date]:[]}},[],0,false),e=>e.status===409);
 assert.throws(()=>mergeRoutineDoseState(empty,{medlog:{[date]:['one']},'wn-medlog':{[date]:['two']}},[],0,true),e=>e.status===409);
});
