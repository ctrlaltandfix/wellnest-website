import { REPORT_DOCUMENT_SOURCE, wnReportDocument } from './report-document.js';

// Browser helpers are appended to the existing dashboard bundle by the response transform.
export function contactFields(contact) {
 return [['Role',contact.role],['Categories',Array.isArray(contact.contactCategories)?contact.contactCategories.join(', '):''],['Practice / Business',contact.businessName],['Phone',contact.phone],['Email',contact.email],['Address',contact.address],['Emergency contact',contact.emerg||/emergency/i.test(contact.role||'')?'Yes':'No'],['Notes',contact.notes]];
}
function renderContactReport(contacts, contactFields, wnReportDocument) {
 return wnReportDocument({
  title:'Care Circle contact list',
  count:contacts.length+' '+(contacts.length===1?'contact':'contacts'),
  date:new Date().toLocaleDateString('en-AU'),
  items:contacts.map(contact=>({
   heading:contact.name||'Contact',
   fields:contactFields(contact).filter(([,value])=>value)
  }))
 });
}
export function contactReport(contacts) {
 return renderContactReport(contacts,contactFields,wnReportDocument);
}
function WnContactPrint({contacts}) {
 const [status,setStatus]=K.useState('');
 return (0,$.jsxs)('div',{style:{position:'relative'},children:[(0,$.jsxs)('button',{type:'button',className:'db-btn-dark',disabled:!contacts.length,onClick:()=>{
  const popup=window.open('','_blank');
  if(!popup){setStatus('Allow the print window, then try again.');return;}
  popup.opener=null;popup.document.open();popup.document.write(contactReport(contacts));popup.document.close();
  setStatus('');
 },children:['Print contact list',(0,$.jsx)('span',{className:'db-btn-dark-circle','aria-hidden':true,children:(0,$.jsxs)('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round',children:[(0,$.jsx)('path',{d:'M6 9V3h12v6 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'}),(0,$.jsx)('rect',{x:6,y:14,width:12,height:8}),(0,$.jsx)('path',{d:'M18 12h.01'})]})})]}),status&&(0,$.jsx)('p',{role:'status',className:'db-print-status',style:{position:'absolute',top:'100%',right:0,width:260,fontSize:13,zIndex:1},children:status})]});
}
function WnContactView({contact}) {
 const dialog=K.useRef(null),heading=K.useId();
 return (0,$.jsxs)($.Fragment,{children:[(0,$.jsx)('button',{type:'button',className:'db-btn-outline','aria-label':'View '+(contact.name||'contact'),onClick:()=>dialog.current?.showModal(),children:'View'}),(0,$.jsxs)('dialog',{ref:dialog,'aria-labelledby':heading,style:{width:'min(560px, calc(100vw - 32px))',maxHeight:'85vh',overflowY:'auto',padding:24,borderRadius:24,border:'1px solid var(--db-border-strong)',background:'var(--db-paper, #fff)',color:'var(--db-ink, #16392e)'},children:[(0,$.jsx)('h2',{id:heading,style:{marginTop:0,overflowWrap:'anywhere'},children:contact.name||'Contact'}),(0,$.jsx)('dl',{children:contactFields(contact).map(([label,value])=>(0,$.jsxs)('div',{style:{marginBottom:14},children:[(0,$.jsx)('dt',{style:{fontWeight:700},children:label}),(0,$.jsx)('dd',{style:{margin:0,whiteSpace:'pre-wrap',overflowWrap:'anywhere'},children:value||'Not provided'})]},label))}),(0,$.jsx)('button',{type:'button',autoFocus:true,className:'db-btn-outline',onClick:()=>dialog.current?.close(),children:'Close'})]})]});
}
const CONTACT_CLIENT_SOURCE = contactFields.toString().replace(/^function\s+[^ (]+/, 'function contactFields') +
 '\nconst contactReport = contacts => (' + renderContactReport.toString() + ')(contacts,contactFields,wnReportDocument);\n' +
 "function WnContactPrint({contacts}) {\n const [status,setStatus]=K.useState('');\n return (0,$.jsxs)('div',{style:{position:'relative'},children:[(0,$.jsxs)('button',{type:'button',className:'db-btn-dark',disabled:!contacts.length,onClick:()=>{\n  const popup=window.open('','_blank');\n  if(!popup){setStatus('Allow the print window, then try again.');return;}\n  popup.opener=null;popup.document.open();popup.document.write(contactReport(contacts));popup.document.close();\n  setStatus('');\n },children:['Print contact list',(0,$.jsx)('span',{className:'db-btn-dark-circle','aria-hidden':true,children:(0,$.jsxs)('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round',children:[(0,$.jsx)('path',{d:'M6 9V3h12v6 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'}),(0,$.jsx)('rect',{x:6,y:14,width:12,height:8}),(0,$.jsx)('path',{d:'M18 12h.01'})]})})]}),status&&(0,$.jsx)('p',{role:'status',className:'db-print-status',style:{position:'absolute',top:'100%',right:0,width:260,fontSize:13,zIndex:1},children:status})]});\n}\nfunction WnContactView({contact}) {\n const dialog=K.useRef(null),heading=K.useId();\n return (0,$.jsxs)($.Fragment,{children:[(0,$.jsx)('button',{type:'button',className:'db-btn-outline','aria-label':'View '+(contact.name||'contact'),onClick:()=>dialog.current?.showModal(),children:'View'}),(0,$.jsxs)('dialog',{ref:dialog,'aria-labelledby':heading,style:{width:'min(560px, calc(100vw - 32px))',maxHeight:'85vh',overflowY:'auto',padding:24,borderRadius:24,border:'1px solid var(--db-border-strong)',background:'var(--db-paper, #fff)',color:'var(--db-ink, #16392e)'},children:[(0,$.jsx)('h2',{id:heading,style:{marginTop:0,overflowWrap:'anywhere'},children:contact.name||'Contact'}),(0,$.jsx)('dl',{children:contactFields(contact).map(([label,value])=>(0,$.jsxs)('div',{style:{marginBottom:14},children:[(0,$.jsx)('dt',{style:{fontWeight:700},children:label}),(0,$.jsx)('dd',{style:{margin:0,whiteSpace:'pre-wrap',overflowWrap:'anywhere'},children:value||'Not provided'})]},label))}),(0,$.jsx)('button',{type:'button',autoFocus:true,className:'db-btn-outline',onClick:()=>dialog.current?.close(),children:'Close'})]})]});\n}\n";
export function careCircleSource(source) {
 if(source.includes('function WnContactView('))return source;
 const start=source.indexOf('function bt('),end=source.indexOf('var xt=',start);
 if(start<0||end<=start)return source;
 let section=source.slice(start,end);
 const actions='className:`db-record-actions`,children:[';
 const add='(0,$.jsxs)(`button`,{type:`button`,className:`db-btn-dark`,onClick:n,children:[`Add contact`,(0,$.jsx)(`span`,{className:`db-btn-dark-circle`,children:(0,$.jsx)(c,{size:15})})]})';
 if(section.split(actions).length!==2||!section.includes(add))return source;
 section=section.replace(actions,actions+'(0,$.jsx)(WnContactView,{contact:e}),').replace(add,'(0,$.jsxs)(`div`,{className:`db-care-circle-header-actions`,style:{display:`flex`,alignItems:`center`,gap:12,flexWrap:`wrap`},children:[(0,$.jsx)(WnContactPrint,{contacts:e}),'+add+']})');
 return source.slice(0,start)+section+source.slice(end)+'\n'+(source.includes('const wnReportDocument =')?'':REPORT_DOCUMENT_SOURCE+'\n')+CONTACT_CLIENT_SOURCE;
}
