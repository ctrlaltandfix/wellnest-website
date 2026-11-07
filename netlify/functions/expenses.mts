import { getUser } from "@netlify/identity";
import { getDatabase } from "@netlify/database";
import { randomUUID } from "node:crypto";
import type { Config } from "@netlify/functions";

// Serve the entities used by the Expenses page with the existing browser contract.
export default async (request: Request) => {
  const headers = { "Cache-Control": "private, no-store" };
  const respond = (body: unknown, status = 200) => Response.json(body, { status, headers });
  const url = new URL(request.url);
  const entity = url.pathname.split("/")[3];
  if (!["Expense", "WorkDocument"].includes(entity)) return respond({ error: "Not found" }, 404);
  const id = url.pathname.split("/")[4];
  if (!["GET", "POST", "PATCH", "DELETE"].includes(request.method) ||
      (request.method === "POST" && id) || (["PATCH", "DELETE"].includes(request.method) && !id)) {
    return respond({ error: "Method not allowed" }, 405);
  }
  let data: Record<string, unknown> = {};
  let filter: Record<string, unknown> = {};
  try {
    if (["POST", "PATCH"].includes(request.method)) {
      data = await request.json();
      if (!data || Array.isArray(data) || typeof data !== "object") throw Error();
      // Metadata and ownership always come from the server.
      for (const key of ["id", "created_by_id", "created_by", "owner_id", "created_date", "updated_date"]) delete data[key];
    }
    filter = JSON.parse(url.searchParams.get("filter") || "{}");
    if (!filter || Array.isArray(filter) || typeof filter !== "object" ||
        Object.keys(filter).some(key => !["legacy_id", "document_key", "kind", "created_by_id"].includes(key)) ||
        Object.values(filter).some(value => typeof value !== "string")) throw Error();
  } catch {
    return respond({ error: "Invalid expense request" }, 400);
  }
  try {
    const identity = await getUser();
    if (!identity?.id) return respond({ error: "Authentication required" }, 401);
    const client = await getDatabase().pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE wellnest_runtime");
      // Resolve the verified Identity ID to the original imported account ID.
      await client.query("SELECT set_config('wellnest.service', 'true', true)");
      const account = (await client.query("SELECT id FROM wellnest_users WHERE auth_id = $1", [identity.id])).rows[0];
      await client.query("SELECT set_config('wellnest.service', 'false', true)");
      if (!account) {
        await client.query("ROLLBACK");
        return respond({ error: "Sign in again to load your account" }, 403);
      }
      await client.query("SELECT set_config('wellnest.user_id', $1, true)", [account.id]);
      const serialize = (row: any) => ({ ...row.data, id: row.id, created_by_id: row.owner_id, created_date: row.created_date, updated_date: row.updated_date });
      let result;
      if (request.method === "GET" && !id) {
        const limit = Math.min(2000, Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 100)));
        const offset = Math.max(0, Math.floor(Number(url.searchParams.get("skip")) || 0));
        const sort = url.searchParams.get("sort") || "-created_date";
        if (!["created_date", "-created_date", "updated_date", "-updated_date"].includes(sort)) {
          await client.query("ROLLBACK");
          return respond({ error: "Invalid sort" }, 400);
        }
        const column = sort.replace(/^-/, "");
        const direction = sort.startsWith("-") ? "DESC" : "ASC";
        const { created_by_id: owner, ...fields } = filter;
        const params = [entity, account.id, owner ?? null, JSON.stringify(fields)];
        const where = "entity = $1 AND owner_id = $2 AND ($3::text IS NULL OR owner_id = $3) AND data @> $4::jsonb";
        if (url.searchParams.get("count") === "true") {
          const rows = await client.query(`SELECT count(*)::int AS count FROM wellnest_records WHERE ${where}`, params);
          result = { count: rows.rows[0].count };
        } else {
          const rows = await client.query(`SELECT * FROM wellnest_records WHERE ${where} ORDER BY ${column} ${direction}, id LIMIT $5 OFFSET $6`, [...params, limit, offset]);
          result = { items: rows.rows.map(serialize), next_cursor: rows.rows.length === limit ? String(offset + limit) : null };
        }
      } else {
        let rows;
        if (request.method === "POST") {
          rows = await client.query(`INSERT INTO wellnest_records (entity, id, owner_id, data) VALUES ('${entity}', $1, $2, $3::jsonb) RETURNING *`, [randomUUID(), account.id, JSON.stringify(data)]);
        } else if (request.method === "PATCH") {
          rows = await client.query(`UPDATE wellnest_records SET data = data || $3::jsonb, updated_date = now() WHERE entity = '${entity}' AND id = $1 AND owner_id = $2 RETURNING *`, [id, account.id, JSON.stringify(data)]);
        } else if (request.method === "DELETE") {
          rows = await client.query(`DELETE FROM wellnest_records WHERE entity = '${entity}' AND id = $1 AND owner_id = $2 RETURNING *`, [id, account.id]);
        } else {
          rows = await client.query(`SELECT * FROM wellnest_records WHERE entity = '${entity}' AND id = $1 AND owner_id = $2`, [id, account.id]);
        }
        if (!rows.rows[0]) {
          await client.query("ROLLBACK");
          return respond({ error: "Record not found" }, 404);
        }
        result = serialize(rows.rows[0]);
      }
      await client.query("COMMIT");
      return respond(result, request.method === "POST" ? 201 : 200);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    return respond({ error: "Unable to load your expenses. Please try again." }, 503);
  }
};

export const config: Config = {
  path: ["/api/entities/Expense", "/api/entities/Expense/:id", "/api/entities/WorkDocument", "/api/entities/WorkDocument/:id"],
};
