// Calendar UI shares the dashboard's React instance and existing account-sync engine.
export function createCalendarIntegration(React) {
  const h = React.createElement;
  const listeners = new Set();
  let engine = null;
  const notify = () => { for (const listener of listeners) listener(); };
  async function request(action, method = 'GET', data) {
    const response = await fetch('/api/calendar/' + action, { method, credentials:'same-origin',
      headers: data ? { 'Content-Type':'application/json' } : {}, ...(data ? { body:JSON.stringify(data) } : {}) });
    const body = await response.json().catch(()=>({}));
    if (!response.ok) throw Error(body.error || 'Calendar connection could not be loaded. Try again.');
    return body;
  }
  function CalendarSync({ userId, ready, getTracker, refresh }) {
    const latest = React.useRef({ getTracker, refresh });
    latest.current = { getTracker, refresh };
    React.useEffect(() => {
      if (!userId || !ready) return;
      let stopped = false, busy = false, timer, active = null, error = '', message = '';
      const current = {
        userId,
        snapshot:()=>({ status:active, busy, error, message }),
        async load() {
          try { const result = await request('status'); if (!stopped) { active = result; error = ''; notify(); } return result; }
          catch (e) { if (!stopped) { error = e.message; notify(); } throw e; }
        },
        async run() {
          if (busy || stopped) return;
          const tracker = latest.current.getTracker();
          if (!tracker) return;
          busy = true; error = ''; message = ''; notify();
          try {
            const status = active || await current.load();
            if (!status.connected || !status.calendarId) return;
            // Flush edits first. Pull Google changes through the same cloud merge afterwards.
            await tracker.sync();
            const result = await request('sync', 'POST', {});
            await tracker.sync();
            if (!stopped) {
              latest.current.refresh();
              active = { ...status, lastSyncedAt:result.lastSyncedAt };
              message = result.partial ? 'Changes saved. More appointments are syncing; select Sync now to continue.' : 'Appointments are up to date.';
            }
          } catch (e) { if (!stopped) error = e.message; }
          finally { busy = false; if (!stopped) notify(); }
        }
      };
      engine = current;
      notify();
      const schedule = event => {
        if (event?.type === 'wn-tracker-change' && event.detail?.key !== 'wn-appts') return;
        clearTimeout(timer);
        timer = setTimeout(()=>current.run(), 1800);
      };
      current.load().then(status=>{ if (status.connected && status.calendarId) schedule(); }).catch(()=>{});
      const interval = setInterval(()=>{ if (document.visibilityState === 'visible') current.run(); }, 300000);
      window.addEventListener('wn-tracker-change', schedule);
      window.addEventListener('online', schedule);
      window.addEventListener('focus', schedule);
      return () => {
        stopped = true; clearTimeout(timer); clearInterval(interval);
        window.removeEventListener('wn-tracker-change', schedule); window.removeEventListener('online', schedule); window.removeEventListener('focus', schedule);
        if (engine === current) engine = null;
      };
    }, [userId, ready]);
    return null;
  }
  function CalendarSettings({ userId }) {
    const [, update] = React.useReducer(n=>n+1, 0);
    const [calendars, setCalendars] = React.useState([]);
    const [selected, setSelected] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [localError, setLocalError] = React.useState('');
    const [status, setStatus] = React.useState(null);
    const current = engine?.userId === userId ? engine : null;
    const snapshot = current?.snapshot() || {};
    const value = snapshot.status || status;
    const busy = loading || snapshot.busy;
    const error = localError || snapshot.error;
    async function load() {
      setLoading(true); setLocalError('');
      try {
        const next = current ? await current.load() : await request('status');
        setStatus(next); setSelected(next.calendarId || '');
        if (next.connected) setCalendars((await request('calendars')).items);
      } catch(e) { setLocalError(e.message); }
      finally { setLoading(false); }
    }
    React.useEffect(()=>{ listeners.add(update); return ()=>listeners.delete(update); }, []);
    React.useEffect(()=>{ load(); }, [userId]);
    async function perform(action) {
      setLoading(true); setLocalError('');
      try {
        if (action === 'connect') { const data = await request('connect','POST',{}); window.location.assign(data.url); return; }
        if (action === 'select') {
          await request('select','POST',{ calendarId:selected });
          await load(); await engine?.run();
        }
        if (action === 'disconnect') { await request('disconnect','DELETE'); setCalendars([]); setSelected(''); await load(); }
      } catch(e) { setLocalError(e.message); }
      finally { setLoading(false); }
    }
    const callback = new URLSearchParams(window.location.search).get('calendar');
    const callbackMessage = { connected:'Google connected. Choose the calendar you want to sync.', cancelled:'Google Calendar connection was cancelled. Your appointments were kept.', failed:'Google could not connect. Try again and allow calendar access.', 'invalid-state':'The connection request expired. Connect Google Calendar again.', 'setup-required':'Google Calendar connection is awaiting setup.' }[callback];
    const button = (label, click, disabled = false, primary = false) => h('button',{ type:'button', className:primary?'db-btn-dark':'db-btn-soft', onClick:click, disabled:busy || disabled },label);
    return h('section',{ className:'db-bento-card db-surface-white db-google-calendar', 'aria-labelledby':'google-calendar-title', 'aria-busy':!!busy, style:{ marginBottom:24, gap:16, alignItems:'stretch' } },
      h('div',null,
        h('span',{ className:'db-kicker' },'CONNECTED CALENDARS'),
        h('h2',{ id:'google-calendar-title', className:'db-card-title', style:{ marginTop:10 } },'Google Calendar'),
        h('p',{ className:'db-card-desc' },'Choose your personal calendar or a shared calendar, such as Family. Appointments sync in both directions while WellNest is open.')),
      callbackMessage && h('p',{ role:'status' },callbackMessage),
      !value && !error && h('p',{ role:'status' },'Loading calendar connection…'),
      value?.connected ? h(React.Fragment,null,
        h('label',{ htmlFor:'google-calendar-choice', style:{ fontWeight:600 } },'Calendar to sync'),
        h('select',{ id:'google-calendar-choice', value:selected, disabled:!!busy, onChange:e=>setSelected(e.target.value), style:{ width:'100%', maxWidth:520, padding:12, border:'1px solid #c7d6ca', borderRadius:10, background:'var(--db-paper, #fff)', color:'var(--db-ink)', font:'inherit' } },
          h('option',{ value:'' },'Choose a calendar…'),
          value.calendarId && !calendars.some(c=>c.id===value.calendarId) && h('option',{ value:value.calendarId },value.calendarName || 'Selected calendar'),
          ...calendars.map(c=>h('option',{ key:c.id, value:c.id },c.name + (c.primary?' (primary)':'')))),
        !loading && calendars.length===0 && h('p',null,'No editable calendars are available. Ask the calendar owner for permission to make changes, then refresh.'),
        h('div',{ style:{ display:'flex', flexWrap:'wrap', gap:10 } },
          button('Save calendar',()=>perform('select'),!selected || selected===value.calendarId,true),
          button(snapshot.busy?'Syncing…':'Sync now',()=>current?.run(),!value.calendarId || !current),
          button('Refresh calendars',load), button('Connect a different Google account',()=>perform('connect')),
          button('Disconnect',()=>perform('disconnect'))),
        h('p',{ className:'db-card-desc' },value.calendarId ? `Syncing with ${value.calendarName || 'your selected calendar'}. ${value.lastSyncedAt ? 'Last synced ' + new Date(value.lastSyncedAt).toLocaleString() + '.' : 'Ready for the first sync.'}` : 'Select a writable calendar to start syncing.'),
        h('p',{ className:'db-card-desc', style:{ fontSize:13 } },'Google events from the past year and next two years appear in WellNest. Deleting a synced appointment deletes it in both places. Google changes take priority if both copies are edited before syncing. Changing calendars copies your WellNest appointments to the new calendar; disconnecting keeps existing events.')
      ) : button('Connect Google Calendar',()=>perform('connect'),!userId,true),
      error && h('div',{ role:'alert' },h('p',null,error),button('Retry',load)),
      snapshot.message && h('p',{ role:'status' },snapshot.message));
  }
  return { CalendarSettings, CalendarSync };
}
