// The record remains the compare-and-swap anchor. Oversized snapshots live in
// chunks tied to that exact revision, all committed in the same D1 transaction.
const table = 'account_backup_chunks';
const marker = '_wn_chunk_revision';
const chunkSize = 180000;
const inlineLimit = 1500000;

export async function unpackBackup(db, row, owner) {
  const stored = JSON.parse(row.data);
  if (!Object.hasOwn(stored, marker)) return stored;
  const chunks = await db.prepare(
    'SELECT content FROM account_backup_chunks WHERE owner_id=? AND record_id=? AND revision=? ORDER BY idx'
  ).bind(owner, row.id, stored[marker]).all();
  if (!chunks.results.length) {
    // A concurrent save may have retired this revision between the two reads.
    const latest = await db.prepare("SELECT id,data FROM records WHERE entity='CloudDataBackup' AND owner_id=? AND id=?").bind(owner,row.id).first();
    if (latest && latest.data !== row.data) return unpackBackup(db, latest, owner);
    throw Error('Account backup is unavailable');
  }
  return JSON.parse(chunks.results.map(part => part.content).join(''));
}

export async function saveBackup(db, owner, id, old, value, time, prerequisite) {
  const json = JSON.stringify(value);
  const large = new TextEncoder().encode(json).length > inlineLimit;
  const oldRevision = old && JSON.parse(old.data)[marker];
  const revision = large ? crypto.randomUUID() : null;
  const stored = large ? JSON.stringify({backup_key:value.backup_key,[marker]:revision}) : json;
  const write = old
    ? db.prepare("UPDATE records SET data=?,updated_date=? WHERE entity='CloudDataBackup' AND id=? AND owner_id = ? AND data = ?" + (prerequisite ? ' AND changes()=1' : '') + ' RETURNING *').bind(stored,time,id,owner,old.data)
    : db.prepare("INSERT INTO records(entity,id,owner_id,created_date,updated_date,data) SELECT 'CloudDataBackup',?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM records WHERE entity='CloudDataBackup' AND owner_id=? AND json_extract(data,'$.backup_key')='wellnest-local-data') RETURNING *").bind(id,owner,time,time,stored,owner);
  if (!large && !oldRevision && !prerequisite) return write.first();
  await db.prepare('CREATE TABLE IF NOT EXISTS account_backup_chunks(owner_id TEXT,record_id TEXT,revision TEXT,idx INTEGER,content TEXT NOT NULL,PRIMARY KEY(owner_id,record_id,revision,idx))').run();
  await db.prepare("CREATE TRIGGER IF NOT EXISTS clean_account_backup_chunks AFTER DELETE ON records WHEN OLD.entity='CloudDataBackup' BEGIN DELETE FROM account_backup_chunks WHERE owner_id=OLD.owner_id AND record_id=OLD.id; END").run();
  const batch = prerequisite ? [prerequisite,write] : [write];
  const guard = "EXISTS(SELECT 1 FROM records WHERE entity='CloudDataBackup' AND id=? AND owner_id=? AND data=?)";
  if (large) {
    let index = 0;
    for (let start=0; start<json.length;) {
      let end=Math.min(start+chunkSize,json.length);
      if (end<json.length && /[\uD800-\uDBFF]/.test(json[end-1])) end--;
      batch.push(db.prepare('INSERT INTO '+table+' SELECT ?,?,?,?,? WHERE '+guard).bind(owner,id,revision,index++,json.slice(start,end),id,owner,stored));
      start=end;
    }
  }
  if (oldRevision) batch.push(db.prepare('DELETE FROM '+table+' WHERE owner_id=? AND record_id=? AND revision=? AND '+guard).bind(owner,id,oldRevision,id,owner,stored));
  const results=await db.batch(batch);
  return results[prerequisite ? 1 : 0].results[0] || null;
}
