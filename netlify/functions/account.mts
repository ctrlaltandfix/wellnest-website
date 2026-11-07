import { getUser } from "@netlify/identity";
import { getDatabase } from "@netlify/database";
import type { Config } from "@netlify/functions";

export default async (request: Request) => {
  const headers = { "Cache-Control": "private, no-store" };
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers });
  }
  try {
    const identity = await getUser();
    if (!identity?.id || !identity.email) {
      return Response.json({ error: "Authentication required" }, { status: 401, headers });
    }
    const client = await getDatabase().pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE wellnest_runtime");
      // Account lookup runs only after Identity verifies the session. Service
      // access permits linking an existing profile without changing its ID.
      await client.query("SELECT set_config('wellnest.service', 'true', true)");
      const existing = await client.query(
        "SELECT * FROM wellnest_users WHERE auth_id = $1 FOR UPDATE",
        [identity.id],
      );
      let account = existing.rows[0];
      if (!account) {
        // Link imported profiles by verified email only. Never take profile
        // ownership or privileges from browser-supplied metadata.
        if (!identity.confirmedAt) {
          await client.query("ROLLBACK");
          return Response.json({ error: "Confirm your email before signing in" }, { status: 403, headers });
        }
        const result = await client.query(
          `INSERT INTO wellnest_users (id, auth_id, email, full_name)
           VALUES ($1, $1, $2, $3)
           ON CONFLICT (lower(email)) DO UPDATE
             SET auth_id = EXCLUDED.auth_id, updated_date = now()
             WHERE wellnest_users.auth_id IS NULL OR wellnest_users.auth_id = EXCLUDED.auth_id
           RETURNING *`,
          [identity.id, identity.email, identity.name || ""],
        );
        account = result.rows[0];
      }
      if (!account) {
        await client.query("ROLLBACK");
        return Response.json({ error: "This account is linked to another sign-in" }, { status: 409, headers });
      }
      await client.query("COMMIT");
      return Response.json({
        ...account.data,
        id: account.id,
        email: account.email,
        full_name: account.full_name,
        role: account.role,
        created_date: account.created_date,
        updated_date: account.updated_date,
      }, { headers });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch {
    return Response.json({ error: "Unable to load your account. Please try again." }, { status: 503, headers });
  }
};

export const config: Config = { path: "/api/auth/me" };
