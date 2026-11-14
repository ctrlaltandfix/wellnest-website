import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import worker,{medicationScriptSource,wnMedicationScripts,mergeAccountRecords} from '../cloudflare/worker.js';

const original=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
const source=medicationScriptSource(original);
const legacy={id:'med-1',name:'Test medication',escriptCode:'old-token',escriptPhoto:'old-image',escriptPhotoUri:'private-old',escriptPhotoUrl:'https://example.test/old.png',routine:['morning'],doseByTime:{morning:'1'},notes:'Keep these instructions'};
const init=vm.runInNewContext('('+source.slice(source.indexOf('function Jt('),source.indexOf('function Yt('))+')');
function save(previous,form){
 const start=source.indexOf('else if(e===`med`){')+'else if(e===`med`){'.length;
 const end=source.indexOf('}else if(e===`appt`)',start);
 let stored;
 new Function('a','t','r','Z','q','A','T',source.slice(start,end))({meds:[previous]},form,previous.id,(_key,records)=>{stored=records[0]},{meds:'wn-meds'},()=>{},()=>{});
 return stored;
}
test('empty list suppresses all legacy attachments in edit and display',()=>{
 assert.equal(init(legacy).length,1);
 assert.equal(wnMedicationScripts(legacy).length,1);
 const removed={...legacy,escripts:[]};
 assert.equal(init(removed).length,0);
 assert.equal(wnMedicationScripts(removed).length,0);
 assert.equal(wnMedicationScripts({escripts:[{label:'Label only'},{code:'  '},null]}).length,0);
});
test('saving removal clears legacy fields, preserves unrelated data, and stays removed through sync',()=>{
 const saved=save(legacy,{...legacy,escripts:[],needsNewScript:true});
 for(const field of ['escriptCode','escriptPhoto','escriptPhotoUri','escriptPhotoUrl'])assert.equal(saved[field],'');
 assert.deepEqual(saved.escripts,[]);
 assert.deepEqual(saved.doseByTime,legacy.doseByTime);
 assert.equal(saved.notes,legacy.notes);
 assert.equal(saved.needsNewScript,true);
 const merged=mergeAccountRecords({meds:[legacy]},{meds:[saved]},[{key:'meds',entry:saved,base:legacy,deleted:false}],3,true);
 assert.equal(wnMedicationScripts(merged.meds[0]).length,0);
 assert.equal(merged.meds[0].needsNewScript,true);
 const stale=mergeAccountRecords(merged,{meds:[legacy]},[],3,false);
 assert.equal(wnMedicationScripts(stale.meds[0]).length,0);
 assert.equal(stale.meds[0].needsNewScript,true);
});
test('partial removal preserves remaining image, replacing scripts works, and flag can be cleared',()=>{
 const keep={id:'keep',photoUri:'private-keep'};
 const saved=save({...legacy,escripts:[{code:'remove'},keep],needsNewScript:true},{...legacy,escripts:[keep],needsNewScript:false});
 assert.deepEqual(wnMedicationScripts(saved),[keep]);
 assert.equal(saved.needsNewScript,false);
 const replaced=save(saved,{...saved,escripts:[{code:'new-token'}]});
 assert.equal(wnMedicationScripts(replaced)[0].code,'new-token');
 assert.equal(init(replaced)[0].code,'new-token');
});
test('flag merges alongside another device changing dosage',()=>{
 const base={...legacy,escripts:[],needsNewScript:false};
 const remote={...base,dose:'Updated dose'};
 const local={...base,needsNewScript:true};
 const merged=mergeAccountRecords({meds:[remote]},{meds:[local]},[{key:'meds',entry:local,base,deleted:false}],3,false);
 assert.equal(merged.meds[0].dose,'Updated dose');
 assert.equal(merged.meds[0].needsNewScript,true);
});
test('medication editor checkbox loads the flag and saves changes',()=>{
 const jsx=(type,props)=>({type,...props});
 const start=source.indexOf('function Xt('),end=source.indexOf('function ',start+9);
 let slots=[],cursor=0,saved;
 const K={useState:initial=>{const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value}];}};
 const context={K,$:{jsx,jsxs:jsx,Fragment:'fragment'},J:()=> '2026-11-14',Se:()=>[],Jt:init,qt:['morning'],Kt:[],s:'icon'};
 const component=vm.runInNewContext('('+source.slice(start,end)+')',context);
 const props={kind:'med',initialData:{...legacy,escripts:[],needsNewScript:true},onClose(){},onSaveRecord:(_kind,form)=>{saved=form;}};
 const find=(node,predicate)=>{if(!node||typeof node!=='object')return; if(predicate(node))return node;for(const child of [node.children].flat(Infinity)){const found=find(child,predicate);if(found)return found;}};
 let tree=component(props);
 let checkbox=find(tree,n=>n.id==='wn-new-script-needed');
 assert.equal(checkbox.type,'checkbox');
 assert.equal(checkbox.checked,true);
 checkbox.onChange({target:{checked:false}});
 cursor=0;tree=component(props);
 assert.equal(find(tree,n=>n.id==='wn-new-script-needed').checked,false);
 tree.onSubmit({preventDefault(){}});
 assert.equal(saved.needsNewScript,false);
 assert.equal(saved.escripts.length,0);
});
test('production response contains the controls, status, and cache refresh',async()=>{
 const env={ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname.includes('dashboardbeta')?original:'&dosemerge=20261112',{headers:{'Content-Type':'application/javascript'}})}};
 const response=await worker.fetch(new Request('https://wellnest.services/assets/dashboardbeta-calendar-20261107-wn2.js'),env);
 const live=await response.text();
 assert.equal(response.status,200);
 assert.match(live,/checked:l.needsNewScript/);
 assert.match(live,/New script needed/);
 assert.match(live,/No eScript attached/);
 assert.match(live,/function WnAppointmentView\(/);
 assert.match(live,/function WnPainView\(/);
 assert.equal(response.headers.get('Cache-Control'),'no-cache');
 execFileSync(process.execPath,['--check','--input-type=module'],{input:live});
 const entry=await worker.fetch(new Request('https://wellnest.services/assets/index-calendar-20261107-wn2.js'),env);
 assert.match(await entry.text(),/medscripts=20261114/);
 assert.equal(medicationScriptSource(source),source);
});
