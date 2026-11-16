import { REPORT_DOCUMENT_SOURCE } from './report-document.js';

// "Print …" buttons for the dashboard sections, in the same style and behaviour as
// Care Circle's "Print contact list" (care-circle.js): a db-btn-dark pill with a
// round printer icon beside the section's Add button. It opens a clean printable
// page (with a "Print / save as PDF" button) built from the records on screen.
//
// Like the other dashboard changes, this rewrites the dashboard bundle as it is
// served (worker.js applies printReportsSource last). The browser code below is a
// plain string so deployment bundling can't rename anything in it. It uses the
// bundle's own React (K), JSX runtime ($), date (Y) and time (Ue) helpers.

const PRINTER_ICON = "(0,$.jsx)('span',{className:'db-btn-dark-circle','aria-hidden':true,children:(0,$.jsxs)('svg',{width:16,height:16,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round',children:[(0,$.jsx)('path',{d:'M6 9V3h12v6 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'}),(0,$.jsx)('rect',{x:6,y:14,width:12,height:8}),(0,$.jsx)('path',{d:'M18 12h.01'})]})})";

const SECTION_REPORT_SOURCE = String.raw`
function wnPrintValue(v){if(v==null)return '';if(Array.isArray(v))return v.filter(x=>x!=null&&x!=='').join(', ');if(v===true)return 'Yes';if(v===false)return 'No';return String(v).trim();}
function wnPrintDate(d){try{return d?Y(d):'';}catch(e){return d||'';}}
function wnPrintTime(t){try{return t?Ue(t):'';}catch(e){return t||'';}}
function wnPrintWhen(r){return [wnPrintDate(r.date),wnPrintTime(r.time)].filter(Boolean).join(' · ');}
function wnPrintNewest(list){return [...(list||[])].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.time||'').localeCompare(String(a.time||'')));}
function wnPrintRange(list){const d=(list||[]).map(r=>r.date).filter(Boolean).sort();return d.length?(d.length===1?wnPrintDate(d[0]):wnPrintDate(d[0])+' to '+wnPrintDate(d[d.length-1])):'';}
function wnPrintHtml(r){
 const date=(()=>{try{return Y(J());}catch(x){return new Date().toLocaleDateString('en-AU');}})();
 return wnReportDocument({
   ...r,date,
   items:r.items.map(item=>({...item,fields:item.fields.map(([label,value])=>[label,wnPrintValue(value)]).filter(([,value])=>value)})),
   footer:'Prepared with WellNest from the owner’s own records. Not a medical document.'
 });
}
function wnPainReport(logs){
 const list=wnPrintNewest(logs),sev=list.map(r=>Number(r.severity)).filter(n=>Number.isFinite(n)&&String(n)!=='');
 const avg=sev.length?(sev.reduce((a,b)=>a+b,0)/sev.length).toFixed(1):'';
 return {title:'Pain report',count:list.length+(list.length===1?' entry':' entries'),summary:[wnPrintRange(list)&&'Period: '+wnPrintRange(list),avg&&'Average severity: '+avg+' / 10',sev.length&&'Highest severity: '+Math.max(...sev)+' / 10'],
  items:list.map(r=>({heading:wnPrintWhen(r)||'Pain entry',fields:[['Severity',r.severity==null||r.severity===''?'':String(r.severity)+' / 10'],['Pain type',r.type],['Locations',r.locations],['Duration',r.duration],['Triggers',r.trigger||r.triggers],['Relief',r.relief],['Notes',r.notes]]}))};
}
function wnAsthmaReport(logs){
 const list=wnPrintNewest(logs),peaks=list.map(r=>Number(r.peakFlow??r.peak_flow)).filter(n=>Number.isFinite(n)&&n>0);
 return {title:'Asthma report',count:list.length+(list.length===1?' entry':' entries'),summary:[wnPrintRange(list)&&'Period: '+wnPrintRange(list),peaks.length&&'Peak flow: lowest '+Math.min(...peaks)+', highest '+Math.max(...peaks)+' L/min'],
  items:list.map(r=>({heading:wnPrintWhen(r)||'Asthma entry',fields:[['Peak flow (L/min)',r.peakFlow??r.peak_flow],['Severity',r.severity],['Symptoms',r.symptoms],['Reliever puffs used',r.puffs??r.reliever_puffs],['Triggers',r.trigger??r.triggers],['Notes',r.notes]]}))};
}
function wnSeizureReport(logs){
 const list=wnPrintNewest(logs);
 return {title:'Seizure log',count:list.length+(list.length===1?' event':' events'),summary:[wnPrintRange(list)&&'Period: '+wnPrintRange(list)],
  items:list.map(r=>{const med=r.medTaken??r.took_medication;return {heading:wnPrintWhen(r)||'Seizure event',fields:[['Seizure type',r.type||r.seizure_type],['Duration',r.duration],['Triggers',r.trigger??r.triggers],['Warning signs / Aura',r.aura],['Rescue medication taken',med==null||med===''?'':!!med],['Post-event recovery notes',r.notes]]};})};
}
function wnMedReport(meds){
 const list=[...(meds||[])].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
 const times=r=>Array.isArray(r.routine)?r.routine.map(t=>String(t).charAt(0).toUpperCase()+String(t).slice(1)):r.routine;
 return {title:'Medication list',count:list.length+(list.length===1?' medication':' medications'),summary:[],
  items:list.map(r=>({heading:r.name||'Medication',fields:[['Also known as',r.alsoKnownAs],['Dose',r.dose],['How often',r.freq],['Times',times(r)],['Pharmacy',r.pharmacy],['Repeats remaining',r.repeats],['New script needed',r.needsNewScript?true:''],['Prescriber & instructions',r.notes]]}))};
}
function wnApptReport(appts,contacts){
 const today=new Date().toISOString().slice(0,10),list=[...(appts||[])].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
 const practice=r=>((contacts||[]).find(c=>r.specialist&&c.name?.trim().toLowerCase()===r.specialist.trim().toLowerCase())||(contacts||[]).find(c=>r.loc&&c.address===r.loc))?.businessName||r.businessName||'';
 const upcoming=list.filter(r=>String(r.date||'')>=today);
 return {title:'Appointments',count:list.length+(list.length===1?' appointment':' appointments'),summary:[upcoming.length+' upcoming, '+(list.length-upcoming.length)+' past'],
  items:list.map(r=>({heading:(r.title||'Appointment')+(wnPrintWhen(r)?' — '+wnPrintWhen(r):''),fields:[['When',String(r.date||'')<today?'Past':'Upcoming'],['Specialist / Clinician',r.specialist||r.spec],['Practice',practice(r)],['Clinic / Location',r.loc||r.location],['Questions & Preparation Notes',r.notes]]}))};
}
function wnExerciseReport(list0){
 const list=wnPrintNewest(list0);
 return {title:'Exercise log',count:list.length+(list.length===1?' session':' sessions'),summary:[wnPrintRange(list)&&'Period: '+wnPrintRange(list)],
  items:list.map(r=>({heading:(r.name||'Exercise')+(wnPrintDate(r.date)?' — '+wnPrintDate(r.date):''),fields:[['Type',r.type],['Duration',r.duration],['Intensity',r.intensity],['Distance',r.distance],['Notes',r.notes],['Archived',r.archived?true:'']]}))};
}
function wnExpenseReport(list0){
 const list=wnPrintNewest(list0),money=n=>'A$'+Number(n||0).toFixed(2);
 const active=list.filter(r=>!r.archived),total=active.reduce((a,r)=>a+(Number(r.amount)||0),0);
 return {title:'Expense report',count:list.length+(list.length===1?' expense':' expenses'),summary:[wnPrintRange(list)&&'Period: '+wnPrintRange(list),'Total (excluding archived): '+money(total)],
  items:list.map(r=>({heading:(r.description||r.desc||'Expense')+(wnPrintDate(r.date)?' — '+wnPrintDate(r.date):''),fields:[['Amount (AUD)',r.amount==null||r.amount===''?'':money(r.amount)],['Category',r.category||r.cat],['Claim / Rebate status',r.status],['Notes',r.notes],['Archived',r.archived?true:'']]}))};
}
function WnPrintReport({label,records,build,onPrint}){
 const [status,setStatus]=K.useState('');
 const list=Array.isArray(records)?records:[];
 return (0,$.jsxs)('div',{style:{position:'relative'},children:[(0,$.jsxs)('button',{type:'button',className:'db-btn-dark',disabled:!list.length,title:list.length?undefined:'Nothing to print yet',onClick:()=>{
  if(onPrint){setStatus(onPrint()?'':'Allow the print window, then try again.');return;}
  const popup=window.open('','_blank');
  if(!popup){setStatus('Allow the print window, then try again.');return;}
  popup.opener=null;popup.document.open();popup.document.write(wnPrintHtml(build()));popup.document.close();
  setStatus('');
 },children:[label,${PRINTER_ICON}]}),status&&(0,$.jsx)('p',{role:'status',className:'db-print-status',style:{position:'absolute',top:'100%',right:0,width:260,fontSize:13,zIndex:1},children:status})]});
}
`;

// [section, the header "Add" button exactly as served, the print button to put before it]
const btn = (label, onClick) => "(0,$.jsxs)(`button`,{type:`button`,className:`db-btn-dark`,onClick:" + onClick + ",children:[`" + label + "`,(0,$.jsx)(`span`,{className:`db-btn-dark-circle`,children:(0,$.jsx)(c,{size:15})})]})";
export const PRINT_SECTIONS = [
  ["Chronic Pain", btn("Log pain entry", "n"), "(0,$.jsx)(WnPrintReport,{label:`Print pain report`,records:e,build:()=>wnPainReport(e)})"],
  ["Asthma", btn("Log asthma entry", "i"), "(0,$.jsx)(WnPrintReport,{label:`Print asthma report`,records:e,build:()=>wnAsthmaReport(e)})"],
  ["Epilepsy", btn("Log seizure event", "n"), "(0,$.jsx)(WnPrintReport,{label:`Print seizure log`,records:e,build:()=>wnSeizureReport(e)})"],
  ["Medications", btn("Add medication", "i"), "(0,$.jsx)(WnPrintReport,{label:`Print medication list`,records:e,onPrint:()=>!!re({medications:O(e)}),build:()=>wnMedReport(e)})"],
  ["Appointments", btn("Add appointment", "i"), "(0,$.jsx)(WnPrintReport,{label:`Print appointments`,records:e,build:()=>wnApptReport(e,t)})"],
  ["Exercises", btn("Log exercise", "n"), "(0,$.jsx)(WnPrintReport,{label:`Print exercise log`,records:e,build:()=>wnExerciseReport(e)})"],
  ["Expenses", btn("Add expense", "a"), "(0,$.jsx)(WnPrintReport,{label:`Print expense report`,records:e,build:()=>wnExpenseReport(e)})"],
];
const OLD_MED_PRINT = "(0,$.jsxs)(`button`,{type:`button`,className:`db-btn-outline`,disabled:!e.length,onClick:()=>{let t=re({medications:O(e)});_(t?`Print view opened. Choose Print / save as PDF in that window.`:`Allow the print window, then try again.`)},children:[(0,$.jsx)(l,{size:16}),` Print medication list`]})";
const WRAP = "(0,$.jsxs)(`div`,{className:`db-print-header-actions`,style:{display:`flex`,alignItems:`center`,gap:12,flexWrap:`wrap`},children:[";

// Adds the buttons. A section whose header has changed shape is skipped (never broken).
export const PRINT_CLIENT_SOURCE = REPORT_DOCUMENT_SOURCE + "\n" + SECTION_REPORT_SOURCE;

export function printReportsSource(source) {
  if (source.includes("function WnPrintReport(")) return source;
  let out = source, added = 0;
  for (const [, add, print] of PRINT_SECTIONS) {
    if (out.split(add).length !== 2) continue;
    const i = out.indexOf(add);
    // Asthma's Add button already sits in a flex row (with Edit Action Plan): just add before it.
    const inRow = out.slice(Math.max(0, i - 260), i).includes("` Edit Action Plan`]}),");
    out = out.slice(0, i) + (inRow ? print + "," + add : WRAP + print + "," + add + "]})") + out.slice(i + add.length);
    added++;
  }
  // Medications already had its own print button lower down; the header one now runs it.
  if (out.includes("onPrint:()=>!!re({medications:O(e)})") && out.split(OLD_MED_PRINT).length === 2) out = out.replace("," + OLD_MED_PRINT, "");
  return added ? out + "\n" + (source.includes('const wnReportDocument =') ? SECTION_REPORT_SOURCE : PRINT_CLIENT_SOURCE) : source;
}
