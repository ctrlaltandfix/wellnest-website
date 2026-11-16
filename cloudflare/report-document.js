import { reportBrand, reportBrandStyles, reportFont } from '../assets/wellnest-report-brand.js';

const styles = `
  @page{size:A4;margin:12mm 14mm}
  *{box-sizing:border-box}
  body{font:14px/1.4 system-ui,sans-serif;color:#16392e;background:#f7f8f3;max-width:880px;margin:22px auto;padding:0 20px}
  header{border-bottom:2px solid #315b4e;padding-bottom:9px;margin-bottom:12px}
  .report-top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
  h1,h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;letter-spacing:-.025em}
  h1{font-size:30px;line-height:1.05;margin:6px 0 4px;overflow-wrap:anywhere}
  header p,.none{margin:0;color:#4f675d}
  button{font:700 12px/1.2 system-ui,sans-serif;padding:9px 14px;border:1px solid #315b4e;border-radius:999px;background:#d8fa8d;color:#16392e;cursor:pointer}
  .summary{display:flex;flex-wrap:wrap;gap:5px 14px;margin:0 0 10px;padding:7px 10px;border:1px solid #cbdcd1;border-radius:7px;background:#edf5ee;list-style:none;font-size:.9em;font-weight:600}
  article{border:1px solid #cbdcd1;border-radius:8px;background:#fff;padding:8px 11px;margin:0 0 7px;break-inside:avoid}
  h2{margin:0 0 4px;font-size:16px;overflow-wrap:anywhere}
  dl{display:grid;grid-template-columns:minmax(0,27%) minmax(0,1fr);gap:2px 10px;margin:0}
  dt{font-weight:700;overflow-wrap:anywhere}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
  .foot{border-top:1px solid #cbdcd1;margin:10px 0 0;padding-top:6px;font-size:11px;color:#4f675d}
  @media print{body{background:#fff;margin:0;padding:0;max-width:none;font-size:10pt}button{display:none}h1{font-size:24pt}h2{font-size:12pt;break-after:avoid}.summary{background:none}.foot{break-inside:avoid}}
`;

function escapeReportText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function renderReportDocument(report, reportFont, reportBrandStyles, styles, brand, escape) {
  const summary = (report.summary || []).filter(Boolean);
  const items = report.items.map(item => {
    const rows = item.fields.map(([label, value]) => '<dt>' + escape(label) + '</dt><dd>' + escape(value) + '</dd>');
    return '<article><h2>' + escape(item.heading) + '</h2>' +
      (rows.length ? '<dl>' + rows.join('') + '</dl>' : '<p class="none">No details recorded.</p>') + '</article>';
  });
  return '<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' +
    escape(report.title) + ' | WellNest</title>' + reportFont + '<style>' + reportBrandStyles + styles +
    '</style></head><body><header><div class="report-top">' + brand +
    '<button type="button" onclick="window.print()">Print / save as PDF</button></div><h1>' + escape(report.title) +
    '</h1><p>' + escape(report.count) + ' · Prepared ' + escape(report.date) + '</p></header><main>' +
    (summary.length ? '<ul class="summary">' + summary.map(item => '<li>' + escape(item) + '</li>').join('') + '</ul>' : '') +
    items.join('') + '</main>' +
    (report.footer ? '<p class="foot">' + escape(report.footer) + '</p>' : '') + '</body></html>';
}

const brand = reportBrand('/landing/report-wordmark.png');

export function wnReportDocument(report) {
  return renderReportDocument(report, reportFont, reportBrandStyles, styles, brand, escapeReportText);
}

const presentation = [reportFont, reportBrandStyles, styles, brand].map(value => JSON.stringify(value)).concat(escapeReportText.toString()).join(',');
export const REPORT_DOCUMENT_SOURCE = 'const wnReportDocument = report => (' +
  renderReportDocument.toString() + ')(report,' + presentation + ');';
