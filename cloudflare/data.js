// WellNest data APIs on Cloudflare (same contract the app used on Netlify):
// /api/auth/me, /api/entities/*, uploads and private files, /api/functions/*.
import { SITE, json, fail, now, uuid, currentUser, hmac, hmacVerify, rateLimited, sendEmail, emailLayout } from "./lib.js";

const ENTITY_RE = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const FIELD_RE = /^[A-Za-z_][A-Za-z0-9_.]{0,63}$/;
const META = ["id", "created_by_id", "created_by", "owner_id", "created_date", "updated_date"];
const MAX_RECORD_BYTES = 1024 * 1024;
const CHUNK_SIZE = 1024 * 1024; // 1 MiB per stored chunk
const MAX_UPLOAD = 50 * 1024 * 1024;

async function body(request) {
  const text = await request.text();
  if (text.length > MAX_RECORD_BYTES) throw Object.assign(new Error("too large"), { status: 413 });
  if (!text) return {};
  const data = JSON.parse(text);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("bad body");
  return data;
}

// ---------- account ----------
function account(u) {
  let data = {};
  try { data = JSON.parse(u.data || "{}"); } catch { /* ignore */ }
  return { ...data, id: u.id, email: u.email, full_name: u.full_name, role: u.role, created_date: u.created_date, updated_date: u.updated_date };
}
const PROTECTED_ACCOUNT = new Set([...META, "email", "role", "subscription_tier", "complimentary_full_access", "password", "password_hash"]);

export async function handleMe(request, env, user) {
  if (request.method === "GET") return json(account(user));
  if (request.method === "PATCH") {
    const patch = await body(request);
    for (const k of Object.keys(patch)) if (PROTECTED_ACCOUNT.has(k)) delete patch[k];
    const fullName = typeof patch.full_name === "string" ? patch.full_name.slice(0, 120) : null;
    await env.DB.prepare("UPDATE users SET data = json_patch(data, ?), full_name = COALESCE(?, full_name), updated_date = ? WHERE id = ?")
      .bind(JSON.stringify(patch), fullName, now(), user.id).run();
    const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
    return json(account(fresh));
  }
  return fail(405, "Method not allowed");
}

// ---------- records ----------
function serialize(row, user) {
  let data = {};
  try { data = JSON.parse(row.data); } catch { /* ignore */ }
  return { ...data, id: row.id, created_by_id: row.owner_id, created_by: user.email, created_date: row.created_date, updated_date: row.updated_date };
}

// Column or JSON field for filters and sorting.
function fieldExpr(field) {
  if (field === "id") return "id";
  if (field === "created_date" || field === "updated_date") return field;
  if (field === "created_by_id" || field === "created_by" || field === "owner_id") return null; // always the caller
  if (!FIELD_RE.test(field)) throw Object.assign(new Error("bad field"), { status: 400 });
  return `json_extract(data, '$.${field}')`;
}
const sqlValue = v => (typeof v === "boolean" ? (v ? 1 : 0) : v);

function buildFilter(filter, where, params) {
  for (const [field, cond] of Object.entries(filter || {})) {
    const expr = fieldExpr(field);
    if (expr === null) continue;
    if (cond && typeof cond === "object" && !Array.isArray(cond)) {
      for (const [op, v] of Object.entries(cond)) {
        const map = { $eq: "=", $ne: "!=", $gt: ">", $gte: ">=", $lt: "<", $lte: "<=" };
        if (map[op]) { where.push(`${expr} ${map[op]} ?`); params.push(sqlValue(v)); }
        else if ((op === "$in" || op === "$nin") && Array.isArray(v)) {
          if (!v.length) { where.push(op === "$in" ? "0" : "1"); continue; }
          where.push(`${expr} ${op === "$in" ? "IN" : "NOT IN"} (${v.map(() => "?").join(",")})`);
          params.push(...v.map(sqlValue));
        } else throw Object.assign(new Error("bad operator"), { status: 400 });
      }
    } else if (cond === null) {
      where.push(`${expr} IS NULL`);
    } else if (Array.isArray(cond)) {
      where.push(`${expr} IN (${cond.map(() => "?").join(",") || "NULL"})`);
      params.push(...cond.map(sqlValue));
    } else {
      where.push(`${expr} = ?`);
      params.push(sqlValue(cond));
    }
  }
}

export async function handleEntities(request, env, user, entity, id) {
  if (!ENTITY_RE.test(entity)) return fail(400, "Invalid record type");
  const url = new URL(request.url);
  const m = request.method;

  if (m === "GET" && !id) {
    let filter = {};
    try { filter = JSON.parse(url.searchParams.get("filter") || "{}"); } catch { return fail(400, "Invalid filter"); }
    const where = ["entity = ?", "owner_id = ?"], params = [entity, user.id];
    buildFilter(filter, where, params);
    if (url.searchParams.get("count") === "true") {
      const r = await env.DB.prepare(`SELECT count(*) AS count FROM records WHERE ${where.join(" AND ")}`).bind(...params).first();
      return json({ count: r.count });
    }
    let sort = url.searchParams.get("sort") || "-created_date";
    const desc = sort.startsWith("-");
    sort = sort.replace(/^[-+]/, "");
    const sortExpr = fieldExpr(sort) || "created_date";
    const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit"), 10) || 100));
    const skip = Math.max(0, parseInt(url.searchParams.get("skip"), 10) || 0);
    const rows = await env.DB.prepare(
      `SELECT * FROM records WHERE ${where.join(" AND ")} ORDER BY ${sortExpr} ${desc ? "DESC" : "ASC"}, id LIMIT ? OFFSET ?`,
    ).bind(...params, limit, skip).all();
    const items = rows.results.map(r => serialize(r, user));
    return json({ items, next_cursor: items.length === limit ? String(skip + limit) : null });
  }

  if (m === "POST" && !id) {
    const data = await body(request);
    for (const k of META) delete data[k];
    const t = now();
    const row = await env.DB.prepare(
      "INSERT INTO records (entity, id, owner_id, created_date, updated_date, data) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    ).bind(entity, uuid(), user.id, t, t, JSON.stringify(data)).first();
    return json(serialize(row, user), 201);
  }

  if (!id) return fail(405, "Method not allowed");
  let row;
  if (m === "GET") {
    row = await env.DB.prepare("SELECT * FROM records WHERE entity = ? AND id = ? AND owner_id = ?").bind(entity, id, user.id).first();
  } else if (m === "PATCH" || m === "PUT") {
    const data = await body(request);
    for (const k of META) delete data[k];
    row = await env.DB.prepare(
      "UPDATE records SET data = json_patch(data, ?), updated_date = ? WHERE entity = ? AND id = ? AND owner_id = ? RETURNING *",
    ).bind(JSON.stringify(data), now(), entity, id, user.id).first();
  } else if (m === "DELETE") {
    row = await env.DB.prepare("DELETE FROM records WHERE entity = ? AND id = ? AND owner_id = ? RETURNING *").bind(entity, id, user.id).first();
  } else {
    return fail(405, "Method not allowed");
  }
  return row ? json(serialize(row, user)) : fail(404, "Record not found");
}

// ---------- uploads and private files ----------
export async function handleUploads(request, env, user, parts) {
  // POST /api/uploads | PUT /api/uploads/:id/chunks/:n | POST /api/uploads/:id/complete
  if (request.method === "POST" && parts.length === 0) {
    const b = await body(request);
    const size = Number(b.size);
    if (!Number.isFinite(size) || size < 1 || size > MAX_UPLOAD) return fail(413, "Files must be between 1 byte and 50 MB.");
    const id = uuid();
    const chunkCount = Math.ceil(size / CHUNK_SIZE);
    await env.DB.prepare(`INSERT INTO uploads (id, owner_id, name, content_type, size_bytes, chunk_size, chunk_count, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, user.id, String(b.name || "document").slice(0, 200), String(b.type || "application/octet-stream").slice(0, 100), size, CHUNK_SIZE, chunkCount, now()).run();
    return json({ upload_id: id, chunk_size: CHUNK_SIZE, chunk_count: chunkCount }, 201);
  }
  const [id, action, n] = parts;
  const up = await env.DB.prepare("SELECT * FROM uploads WHERE id = ? AND owner_id = ?").bind(id, user.id).first();
  if (!up) return fail(404, "Upload not found");
  if (request.method === "PUT" && action === "chunks") {
    const idx = Number(n);
    if (!Number.isInteger(idx) || idx < 0 || idx >= up.chunk_count) return fail(400, "Invalid chunk");
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength < 1 || bytes.byteLength > up.chunk_size) return fail(413, "Chunk too large");
    await env.DB.prepare("INSERT OR REPLACE INTO upload_chunks (upload_id, idx, data) VALUES (?, ?, ?)").bind(id, idx, bytes).run();
    return json({ received: idx });
  }
  if (request.method === "POST" && action === "complete") {
    const r = await env.DB.prepare("SELECT count(*) AS c, sum(length(data)) AS s FROM upload_chunks WHERE upload_id = ?").bind(id).first();
    if (r.c !== up.chunk_count || r.s !== up.size_bytes) return fail(400, "The upload is incomplete. Please try again.");
    const fileId = uuid();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO files (id, owner_id, name, content_type, size_bytes, chunk_count, created_date) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(fileId, user.id, up.name, up.content_type, up.size_bytes, up.chunk_count, now()),
      env.DB.prepare("INSERT INTO file_chunks (file_id, idx, data) SELECT ?, idx, data FROM upload_chunks WHERE upload_id = ?").bind(fileId, id),
      env.DB.prepare("DELETE FROM uploads WHERE id = ?").bind(id),
    ]);
    return json({ file_uri: `wellnest-file://${fileId}`, file_id: fileId, name: up.name, size: up.size_bytes, content_type: up.content_type });
  }
  return fail(405, "Method not allowed");
}

export async function handleFileSign(request, env, user) {
  const b = await body(request);
  const m = String(b.file_uri || "").match(/^wellnest-file:\/\/([0-9a-f-]{36})$/);
  if (!m) return fail(404, "File not found");
  const file = await env.DB.prepare("SELECT id FROM files WHERE id = ? AND owner_id = ?").bind(m[1], user.id).first();
  if (!file) return fail(404, "File not found");
  const ttl = Math.min(3600, Math.max(60, Number(b.expires_in) || 900));
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = await hmac(env, "file", `${file.id}.${exp}`);
  return json({ signed_url: `${SITE}/api/files/raw/${file.id}?exp=${exp}&sig=${sig}` });
}

export async function handleFileRaw(request, env, fileId) {
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("exp"));
  if (!exp || exp * 1000 < Date.now() || !(await hmacVerify(env, "file", `${fileId}.${exp}`, url.searchParams.get("sig") || ""))) {
    return new Response("This link has expired.", { status: 403 });
  }
  const file = await env.DB.prepare("SELECT * FROM files WHERE id = ?").bind(fileId).first();
  if (!file) return new Response("Not found", { status: 404 });
  const { readable, writable } = new TransformStream();
  (async () => {
    const w = writable.getWriter();
    for (let i = 0; i < file.chunk_count; i++) {
      const c = await env.DB.prepare("SELECT data FROM file_chunks WHERE file_id = ? AND idx = ?").bind(fileId, i).first();
      await w.write(new Uint8Array(c.data));
    }
    await w.close();
  })();
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
  return new Response(readable, {
    headers: {
      "Content-Type": file.content_type,
      "Content-Length": String(file.size_bytes),
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'",
    },
  });
}

// ---------- app functions ----------
const UNAVAILABLE = "This feature is temporarily unavailable.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleFunction(request, env, name) {
  let b = {};
  try { b = await body(request); } catch { /* empty */ }
  switch (name) {
    case "growthAccess":
      // Payments are not set up on Cloudflare yet, so everyone has full access.
      return json({ premium: true, plan: "full", referralApplied: false });
    case "syncSubscription":
      return json({ synced: false });
    case "onNewUserSignup":
    case "emailPreferences":
      return json({ success: true });
    case "emberWaitlist":
    case "freeKit": {
      if (b.website) return json({ success: true }); // spam trap
      const email = String(b.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) return json({ success: false, error: "Please enter a valid email address." }, 400);
      if (await rateLimited(env, request, name, 5)) return json({ success: false, error: "Too many attempts. Please try again later." }, 429);
      const existing = await env.DB.prepare("SELECT 1 FROM waitlist WHERE email = ? AND list = ?").bind(email, name).first();
      if (!existing) {
        await env.DB.prepare("INSERT OR IGNORE INTO waitlist (email, name, list, created_date) VALUES (?, ?, ?, ?)")
          .bind(email, String(b.name || "").slice(0, 120), name, now()).run();
      }
      if (name === "freeKit") {
        const link = `${SITE}/free-tools`;
        await sendEmail(env, {
          to: email, subject: "Your free WellNest kit",
          html: emailLayout("Your free WellNest kit", "Here are WellNest's free printable trackers and tools: symptom summaries, medication lists, pain diaries and more.", "Open the free kit", link),
          text: `Your free WellNest kit: ${link}`,
        });
      }
      return json({ success: true, already_registered: !!existing });
    }
    case "emergencyPlanShare":
      if (b.action === "get") return json({ error: "This link is not valid or has been turned off." }, 404);
      return json({ error: UNAVAILABLE }, 503);
    default:
      return json({ error: UNAVAILABLE }, 503);
  }
}

export { currentUser };
