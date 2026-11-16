import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { printReportsSource, PRINT_CLIENT_SOURCE, PRINT_SECTIONS } from '../cloudflare/print-reports.js';
import worker from '../cloudflare/worker.js';

const original = readFileSync(new URL('../assets/dashboardbeta-calendar-20261107-wn2.js', import.meta.url), 'utf8');
const env = { ASSETS: { fetch: async request => new Response(new URL(request.url).pathname.includes('dashboardbeta') ? original : '&dosemerge=20261112', { headers: { 'Content-Type': 'application/javascript' } }) } };

// The browser helpers, run here with stand-ins for the bundle's date/time helpers.
const client = new Function('Y', 'Ue', 'J', 'K', '$', PRINT_CLIENT_SOURCE + '; return {wnPrintHtml, wnPainReport, wnAsthmaReport, wnSeizureReport, wnMedReport, wnApptReport, wnExerciseReport, wnExpenseReport};')(
  d => 'D:' + d, t => 'T:' + t, () => '2026-11-16', {}, {});

test('every section gets a print button beside its Add button, in the served dashboard', async () => {
  const res = await worker.fetch(new Request('https://wellnest.services/assets/dashboardbeta-calendar-20261107-wn2.js'), env);
  const source = await res.text();
  for (const label of ['Print pain report', 'Print asthma report', 'Print seizure log', 'Print medication list', 'Print appointments', 'Print exercise log', 'Print expense report'])
    assert.ok(source.includes('WnPrintReport,{label:`' + label + '`'), label);
  for (const [, add] of PRINT_SECTIONS) assert.equal(source.split(add).length, 2, 'Add button kept once');
  assert.ok(source.includes('WnContactPrint,{contacts:e}'), 'Care Circle unchanged');
  assert.equal((source.match(/Print medication list/g) || []).length, 1, 'no second Medications print button');
  assert.ok(source.includes('onPrint:()=>!!re({medications:O(e)})'), 'Medications uses the app\'s own print');
  execFileSync(process.execPath, ['--check', '--input-type=module'], { input: source });
  assert.equal(printReportsSource(source), source);                          // safe to run twice
  const entry = await worker.fetch(new Request('https://wellnest.services/assets/index-calendar-20261107-wn2.js'), env);
  assert.match(await entry.text(), /printreports=20261116/);                   // browsers fetch the new version
});

test('a section whose header changed shape is skipped, not broken', () => {
  assert.equal(printReportsSource('function x(){return 1}'), 'function x(){return 1}');
});

test('reports: newest first, summaries, and user text kept as text', () => {
  const pain = client.wnPainReport([{ date: '2026-11-13', severity: 4, type: 'Aching' }, { date: '2026-11-15', time: '08:30', severity: 7, locations: ['Hand', 'Wrist'], notes: '<img src=x onerror=alert(1)>' }]);
  assert.equal(pain.items[0].heading, 'D:2026-11-15 · T:08:30');
  assert.ok(pain.summary.includes('Average severity: 5.5 / 10'));
  const html = client.wnPrintHtml(pain);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;') && !html.includes('<img'));
  assert.ok(html.includes('Hand, Wrist') && html.includes('Print / save as PDF') && html.includes('Prepared D:2026-11-16'));
  assert.ok(!html.includes('<dt>Relief</dt>'), 'empty fields left out');

  const exp = client.wnExpenseReport([{ date: '2026-11-12', description: 'Physio', amount: 95 }, { date: '2026-10-01', description: 'Old', amount: 10, archived: true }, { date: '2026-11-01', amount: '32.5' }]);
  assert.ok(exp.summary.includes('Total (excluding archived): A$127.50'));
  const appts = client.wnApptReport([{ title: 'Review', date: '2099-01-01', specialist: 'Dr Lee' }, { title: 'Old', date: '2000-01-01' }], [{ name: 'dr lee', businessName: 'Pain Clinic' }]);
  assert.deepEqual(appts.summary, ['1 upcoming, 1 past']);
  assert.ok(appts.items[1].fields.some(([k, v]) => k === 'Practice' && v === 'Pain Clinic'));
  const meds = client.wnMedReport([{ name: 'Ventolin' }, { name: 'Gabapentin', routine: ['morning', 'evening'], needsNewScript: true }]);
  assert.equal(meds.items[0].heading, 'Gabapentin');
  assert.ok(client.wnPrintHtml(meds).includes('Morning, Evening'));
  assert.equal(client.wnSeizureReport([{ date: '2026-11-11', medTaken: false }]).items[0].fields.find(f => f[0] === 'Rescue medication taken')[1], false);
});
