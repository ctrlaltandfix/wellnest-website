import { createHash } from 'node:crypto';

export function appointmentFields(a) {
  return { title: a.title || '', date: a.date || '', time: a.time || '', loc: a.loc || '', notes: a.notes || '', specialist: a.specialist || '' };
}
export function sameAppointment(a, b) {
  return JSON.stringify(appointmentFields(a)) === JSON.stringify(appointmentFields(b));
}
export function eventId(owner, calendar, id) {
  return createHash('sha256').update(JSON.stringify([owner, calendar, id])).digest('hex');
}
export function toGoogle(a, timeZone) {
  let start, end;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date || '')) throw Error('An appointment has an invalid date. Update it before syncing.');
  if (a.time) {
    if (!/^\d{2}:\d{2}$/.test(a.time)) throw Error('An appointment has an invalid time. Update it before syncing.');
    const startDate = new Date(`${a.date}T${a.time}:00Z`);
    const endDate = new Date(startDate.getTime() + 3600000);
    start = { dateTime: `${a.date}T${a.time}:00`, timeZone };
    end = { dateTime: endDate.toISOString().slice(0,19), timeZone };
  } else {
    start = { date: a.date };
    end = { date: new Date(new Date(`${a.date}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0,10) };
  }
  return { summary: a.title || 'Appointment', location: a.loc || '', description: a.notes || '', start, end };
}
export function fromGoogle(event, existing = {}, timeZone = 'UTC') {
  const start = event.start || {};
  let date = start.date, time = '';
  if (start.dateTime) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).formatToParts(new Date(start.dateTime));
    const p = Object.fromEntries(parts.map(p => [p.type, p.value]));
    date = `${p.year}-${p.month}-${p.day}`;
    time = `${p.hour}:${p.minute}`;
  }
  return { ...existing, title: event.summary || 'Untitled appointment', date, time, loc: event.location || '', notes: event.description || '', specialist: existing.specialist || '' };
}

// Google wins simultaneous edits; explicit deletion on either side wins over edits.
// Missing local rows are never interpreted as deletions (another device may not have loaded them).
export async function reconcile({ owner, calendar, timeZone, appointments, deletedIds, links, events, api }) {
  const records = new Map(appointments.map(a => [String(a.id), a]));
  const deleted = new Set(deletedIds.map(String));
  const remote = new Map(events.map(e => [e.id, e]));
  const next = { ...links };
  const seen = new Set();
  let operations = 0, partial = false;
  const deadline = Date.now() + 35000;
  const available = () => { const ready = operations < 100 && Date.now() < deadline; if (!ready) partial = true; return ready; };
  const call = async (...args) => {
    operations++;
    return api(...args);
  };
  for (const link of Object.values(links)) seen.add(link.eventId);
  for (const [id, link] of Object.entries(links)) {
    if (!available()) break;
    let event = remote.get(link.eventId);
    if (!event) {
      event = await call('GET', link.eventId);
      if (!event) event = { id: link.eventId, status: 'cancelled' };
    }
    seen.add(link.eventId);
    const local = records.get(id);
    if (deleted.has(id) || event.status === 'cancelled') {
      if (deleted.has(id) && event.status !== 'cancelled') await call('DELETE', event.id, undefined, event.etag);
      records.delete(id); deleted.add(id); delete next[id];
    } else if (event.etag !== link.etag) {
      const value = fromGoogle(event, local || link.snapshot, timeZone);
      records.set(id, { ...value, id });
      next[id] = { eventId: event.id, etag: event.etag, snapshot: { ...value, id } };
    } else if (local && !sameAppointment(local, link.snapshot)) {
      // Patch only editable fields: preserve guests, recurrence, reminders, and original duration.
      const body = toGoogle(local, timeZone);
      if (local.date === link.snapshot.date && local.time === link.snapshot.time) { delete body.start; delete body.end; }
      else if (event.start?.dateTime && event.end?.dateTime && body.start.dateTime) {
        const duration = new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime();
        const wallStart = new Date(body.start.dateTime + 'Z');
        body.end.dateTime = new Date(wallStart.getTime() + duration).toISOString().slice(0,19);
      }
      const updated = await call('PATCH', event.id, body, event.etag);
      next[id] = { eventId: event.id, etag: updated.etag, snapshot: local };
    }
  }
  for (const event of events) {
    if (seen.has(event.id) || event.status === 'cancelled' || !event.start) continue;
    const id = event.extendedProperties?.private?.wellnestOwner === owner
      ? event.extendedProperties.private.wellnestId : `google-${eventId(owner, calendar, event.id)}`;
    if (!id) continue;
    if (deleted.has(id)) { if (!available()) continue; await call('DELETE', event.id, undefined, event.etag); continue; }
    const local = records.get(id);
    const value = fromGoogle(event, local, timeZone);
    records.set(id, { ...value, id });
    next[id] = { eventId: event.id, etag: event.etag, snapshot: { ...value, id } };
    seen.add(event.id);
  }
  for (const [id, local] of records) {
    if (next[id] || deleted.has(id)) continue;
    if (!available()) break;
    const googleId = eventId(owner, calendar, id);
    const event = await call('POST', '', { ...toGoogle(local, timeZone), id: googleId,
      extendedProperties: { private: { wellnestOwner: owner, wellnestId: id } } });
    next[id] = { eventId: event.id, etag: event.etag, snapshot: local };
  }
  return { partial, appointments: [...records.values()].filter(a => !deleted.has(String(a.id))), deletedIds: [...deleted], links: next };
}
