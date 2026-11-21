// Keep the prerendered comparison and its React table in sync at build time.
const additions = [
  { name: 'Visible', suited: 'Wearable-assisted activity pacing', notes: 'The Visible band and app use biometric signals to show a daily energy budget for people with energy-limiting conditions.' },
  { name: 'Human Health', suited: 'Keeping symptoms and treatments in one timeline', notes: 'Log symptoms and treatments over time and review the record when preparing for a care appointment.' },
];
const sources = [
  ['WellNest', '/chronic-illness-tracker'], ['Visible', 'https://www.makevisible.com/'],
  ['Human Health', 'https://www.human.health/'], ['Bearable', 'https://bearable.app/'],
];
const summary = 'Choose a chronic health tracker by the record you want to keep. WellNest combines condition-specific diaries, medication check-offs and appointments on iPhone and the web, with dated PDF reports for care visits. Visible focuses on wearable-assisted pacing, Human Health on symptoms and treatments, and Bearable on patterns across symptoms, mood and daily factors.';
function insert(text, anchor, replacement) {
  if (text.split(anchor).length !== 2) throw Error('Comparison template changed: ' + anchor);
  return text.replace(anchor, replacement);
}
export function trackerComparison(text, path) {
  const pages = ['best-chronic-illness-tracker-apps.html', 'best-chronic-illness-tracker-apps/index.html'];
  const app = path === 'assets/index-calendar-20261117-wn3.js';
  if (!app && !pages.includes(path)) return text;
  text = insert(text, 'Descriptions of other apps are based on their own published information as of September 2026.', 'The four linked product descriptions were checked on 21 November 2026. Other listings were reviewed in September 2026.');
  if (pages.includes(path)) {
    const row = '<tr><td>Bearable</td>';
    const card = '<div class="gp-card"><b>Bearable</b>';
    text = insert(text, row, additions.map(a => '<tr><td>'+a.name+'</td><td>'+a.suited+'</td><td>'+a.notes+'</td></tr>').join('')+row);
    text = insert(text, card, additions.map(a => '<div class="gp-card"><b>'+a.name+'</b><span>'+a.suited+'</span><p>'+a.notes+'</p></div>').join('')+card);
    const anchor = '<div class="gp-table-wrap">';
    const references = sources.map(([name,url]) => '<a href="'+url+'">'+name+'</a>').join(' · ');
    return insert(text, anchor, '<p class="gp-p">'+summary+'</p><p class="gp-small">Official product descriptions · '+references+'</p>'+anchor);
  }
  if (path === 'assets/index-calendar-20261117-wn3.js') {
    const anchor = '},{name:`Bearable`,suited:`Broad, customisable tracking across many symptoms and factors`';
    text = insert(text, anchor, '},'+additions.map(item => JSON.stringify(item)).join(',')+anchor.slice(1));
    const table = 'function by(){let e=(0,R.jsxs)(`div`,{children:[';
    const links = sources.map(([name,url]) => '(0,R.jsx)(`a`,{href:'+JSON.stringify(url)+',children:'+JSON.stringify(name)+'})').join(',` · `,');
    return insert(text, table, table+'(0,R.jsx)(`p`,{className:`gp-p`,children:'+JSON.stringify(summary)+'}),(0,R.jsxs)(`p`,{className:`gp-small`,children:[`Official product descriptions · `,'+links+']}),');
  }
  return text;
}
