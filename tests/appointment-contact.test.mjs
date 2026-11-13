import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../cloudflare/worker.js',import.meta.url),'utf8');
const source=readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js',import.meta.url),'utf8');
const transform=new Function(worker.slice(worker.indexOf('function appointmentContactSource('))+';return appointmentContactSource;')();
const patched=transform(source);
const jsx=(type,props)=>({type,...props});
function mount(contacts,onSelect){const state=[];const K={useState:()=>['',value=>state.push(value)]};const component=patched.slice(patched.indexOf('function WnAppointmentContactPicker('));return {state,tree:new Function('K','$',component+';return WnAppointmentContactPicker;')(K,{jsx,jsxs:jsx})({contacts,onSelect})};}
test('contact picker is wired to account contacts and preserves existing save flow',()=>{
 assert.notEqual(patched,source);assert.equal(transform(patched),patched);assert.equal(transform('unknown bundle'),'unknown bundle');
 assert.ok(patched.includes('onSaveRecord:j,contacts:a.contacts'));
 assert.ok(patched.includes('specialist:contact.name||``'));
 assert.ok(patched.includes('...current,specialist:'));
 assert.ok(patched.includes('notes:t.notes||``},i=e.findIndex'));
});
test('selects saved contacts by ID, filters invalid entries, sorts, and leaves manual details untouched',()=>{
 const selected=[];const {tree,state}=mount([{id:2,name:'Zoe',address:'Clinic'},{id:1,name:'Ada'},{id:3,name:'Removed',deleted:true},null],contact=>selected.push(contact));
 const select=tree.children[1];assert.equal(select.children.length,3);assert.equal(select.children[1].value,'1');
 select.onChange({target:{value:'2'}});assert.equal(selected[0].address,'Clinic');
 select.onChange({target:{value:''}});assert.equal(selected.length,1);assert.deepEqual(state,['2','']);
});
test('empty contact list still allows manual entry',()=>{const {tree}=mount([],()=>{});assert.equal(tree.children[1].children.length,1);assert.match(tree.children[2].children,/No saved contacts/);});
