import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
const component=source.slice(source.indexOf('function WnRoutineSyncButton('));
function mount(onSync){
 const state=[],setters=[];const K={useState(value){const i=state.length;state.push(value);const set=v=>state[i]=v;setters.push(set);return[value,set]},useRef:()=>({current:false})};
 const jsx=(type,props)=>({type,...props});const render=new Function('K','$',component+';return WnRoutineSyncButton;')(K,{jsx,jsxs:jsx});
 const tree=render({onSync});return{state,run:tree.children[0].onClick};
}
test('manual sync blocks duplicate requests and reports completion',async()=>{
 let finish,count=0;const {run,state}=mount(()=>{count++;return new Promise(r=>finish=r)});
 const pending=run();await run();assert.equal(count,1);assert.equal(state[0],true);finish();await pending;assert.equal(state[0],false);assert.equal(state[1],'Account records synced.');assert.equal(state[2],false);
});
test('failed sync reports an error and allows retry',async()=>{
 let count=0;const {run,state}=mount(async()=>{if(++count===1)throw Error('Offline. Try again.');});
 await run();assert.equal(state[2],true);assert.equal(state[1],'Offline. Try again.');assert.equal(state[0],false);await run();assert.equal(count,2);assert.equal(state[2],false);
});
