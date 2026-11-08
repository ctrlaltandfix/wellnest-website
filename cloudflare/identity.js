// WellNest sign-in on Cloudflare. Speaks the same API as Netlify Identity
// (GoTrue), which the WellNest app already uses, at /api/_identity/*, plus
// Google sign-in (/api/_identity/authorize -> /api/auth/google/callback).
import {
  SITE, ALLOWED_ORIGINS, json, fail, now, uuid, randomToken, sha256, hashPassword, verifyPassword,
  signJwt, verifyJwt, bearer, rateLimited, sendEmail, emailLayout, ACCESS_TOKEN_TTL,
} from "./lib.js";

const REFRESH_TTL = 60 * 60 * 24 * 60; // 60 days
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_CALLBACK = `${SITE}/api/auth/google/callback`;

function gotrueUser(u) {
  let meta = {};
  try { meta = JSON.parse(u.data || "{}"); } catch { /* ignore */ }
  return {
    id: u.id, aud: "", role: "", email: u.email,
    confirmed_at: u.confirmed_at, confirmation_sent_at: u.confirmation_sent_at,
    app_metadata: { provider: u.provider, roles: [u.role] },
    user_metadata: { full_name: u.full_name || meta.full_name || "", avatar_url: meta.avatar_url },
    created_at: u.created_date, updated_at: u.updated_date,
  };
}

async function storeToken(env, userId, kind, ttlSeconds) {
  const token = randomToken(32);
  await env.DB.prepare("INSERT INTO tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, kind, Date.now() + ttlSeconds * 1000).run();
  return token;
}
async function consumeToken(env, token, kind) {
  if (!token) return null;
  const row = await env.DB.prepare("DELETE FROM tokens WHERE token_hash = ? AND kind = ? RETURNING user_id, expires_at")
    .bind(await sha256(token), kind).first();
  if (!row || row.expires_at < Date.now()) return null;
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row.user_id).first();
}

export async function issueSession(env, user) {
  const g = gotrueUser(user);
  const access = await signJwt(env, { sub: user.id, email: user.email, aud: "", app_metadata: g.app_metadata, user_metadata: g.user_metadata });
  const refresh = await storeToken(env, user.id, "refresh", REFRESH_TTL);
  return { access_token: access, token_type: "bearer", expires_in: ACCESS_TOKEN_TTL, refresh_token: refresh };
}

async function readBody(request) {
  const type = request.headers.get("Content-Type") || "";
  if (type.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(await request.text()));
  try { return await request.json(); } catch { return {}; }
}

// Where email links land: the site's login page, which reads the #token.
function linkFor(kind, token) {
  return `${SITE}/login#${kind}=${encodeURIComponent(token)}`;
}

async function sendConfirmation(env, user) {
  const token = await storeToken(env, user.id, "confirm", 60 * 60 * 24);
  await env.DB.prepare("UPDATE users SET confirmation_sent_at = ? WHERE id = ?").bind(now(), user.id).run();
  const link = linkFor("confirmation_token", token);
  return sendEmail(env, {
    to: user.email,
    subject: "Confirm your WellNest account",
    html: emailLayout("Confirm your email", "Tap the button below to confirm your email and finish setting up your WellNest account.", "Confirm my email", link),
    text: `Confirm your WellNest account: ${link}`,
  });
}

function safeRedirect(target) {
  try {
    const u = new URL(target);
    if (ALLOWED_ORIGINS.has(u.origin)) return u.origin + u.pathname;
  } catch { /* fall through */ }
  return `${SITE}/login`;
}

export async function handleIdentity(request, env, path) {
  const method = request.method;

  if (path === "/settings" && method === "GET") {
    return json({
      external: { google: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET), github: false, gitlab: false, bitbucket: false, facebook: false, email: true, saml: false },
      external_labels: {}, disable_signup: false, autoconfirm: false,
    });
  }

  if (path === "/signup" && method === "POST") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (await rateLimited(env, request, "signup", 10)) return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    if (!EMAIL_RE.test(email)) return fail(422, "Please enter a valid email address.");
    if (password.length < 8) return fail(422, "Password should be at least 8 characters.");
    const fullName = String(body.data?.full_name || body.data?.name || "").slice(0, 120);
    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (user?.confirmed_at) return fail(422, "A user with this email address has already been registered");
    const t = now();
    if (user) {
      await env.DB.prepare("UPDATE users SET password_hash = ?, full_name = COALESCE(NULLIF(?, ''), full_name), updated_date = ? WHERE id = ?")
        .bind(await hashPassword(password), fullName, t, user.id).run();
    } else {
      await env.DB.prepare(`INSERT INTO users (id, email, password_hash, provider, full_name, data, created_date, updated_date)
        VALUES (?, ?, ?, 'email', ?, ?, ?, ?)`)
        .bind(uuid(), email, await hashPassword(password), fullName, JSON.stringify({ full_name: fullName }), t, t).run();
    }
    user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!(await sendConfirmation(env, user))) return fail(500, "We couldn't send your confirmation email. Please try again shortly.");
    user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
    return json(gotrueUser(user));
  }

  if (path === "/verify" && method === "POST") {
    const body = await readBody(request);
    const type = body.type || "signup";
    if (await rateLimited(env, request, "verify", 20)) return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    if (type === "signup") {
      const user = await consumeToken(env, body.token, "confirm");
      if (!user) return fail(404, "This confirmation link is invalid or has expired. Please sign up again to get a new one.");
      await env.DB.prepare("UPDATE users SET confirmed_at = COALESCE(confirmed_at, ?), updated_date = ? WHERE id = ?").bind(now(), now(), user.id).run();
      const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
      return json(await issueSession(env, fresh));
    }
    if (type === "recovery") {
      const user = await consumeToken(env, body.token, "recovery");
      if (!user) return fail(404, "This reset link is invalid or has expired. Please request a new one.");
      // Following a reset link proves the email address.
      await env.DB.prepare("UPDATE users SET confirmed_at = COALESCE(confirmed_at, ?) WHERE id = ?").bind(now(), user.id).run();
      const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
      return json(await issueSession(env, fresh));
    }
    return fail(400, "Unsupported verification type.");
  }

  if (path === "/token" && method === "POST") {
    const body = await readBody(request);
    if (body.grant_type === "password") {
      const email = String(body.username || "").trim().toLowerCase();
      if (await rateLimited(env, request, "login", 10, 600, email)) {
        return json({ error: "too_many_requests", error_description: "Too many sign-in attempts. Please wait a few minutes and try again." }, 429);
      }
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
      if (!user || !(await verifyPassword(String(body.password || ""), user.password_hash))) {
        return json({ error: "invalid_grant", error_description: "No user found with that email, or password invalid." }, 400);
      }
      if (!user.confirmed_at) {
        return json({ error: "invalid_grant", error_description: "Email not confirmed" }, 400);
      }
      return json(await issueSession(env, user));
    }
    if (body.grant_type === "refresh_token") {
      const user = await consumeToken(env, body.refresh_token, "refresh");
      if (!user || !user.confirmed_at) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
      return json(await issueSession(env, user));
    }
    return json({ error: "unsupported_grant_type", error_description: "Unsupported grant type" }, 400);
  }

  if (path === "/user") {
    const claims = await verifyJwt(env, bearer(request));
    const user = claims && await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(claims.sub).first();
    if (!user) return fail(401, "Invalid token");
    if (method === "GET") return json(gotrueUser(user));
    if (method === "PUT") {
      const body = await readBody(request);
      const t = now();
      if (body.password !== undefined) {
        if (String(body.password).length < 8) return fail(422, "Password should be at least 8 characters.");
        await env.DB.prepare("UPDATE users SET password_hash = ?, updated_date = ? WHERE id = ?").bind(await hashPassword(String(body.password)), t, user.id).run();
        // Sign out other devices after a password change.
        await env.DB.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = 'refresh'").bind(user.id).run();
      }
      if (body.data && typeof body.data === "object") {
        const fullName = body.data.full_name !== undefined ? String(body.data.full_name).slice(0, 120) : null;
        await env.DB.prepare("UPDATE users SET full_name = COALESCE(?, full_name), data = json_patch(data, ?), updated_date = ? WHERE id = ?")
          .bind(fullName, JSON.stringify({ full_name: fullName ?? undefined, avatar_url: body.data.avatar_url }), t, user.id).run();
      }
      const fresh = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(user.id).first();
      return json(gotrueUser(fresh));
    }
  }

  if (path === "/logout" && method === "POST") {
    const claims = await verifyJwt(env, bearer(request));
    if (claims?.sub) await env.DB.prepare("DELETE FROM tokens WHERE user_id = ? AND kind = 'refresh'").bind(claims.sub).run();
    return new Response(null, { status: 204 });
  }

  if (path === "/recover" && method === "POST") {
    const body = await readBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    if (await rateLimited(env, request, "recover", 5, 600, email)) return fail(429, "Too many attempts. Please wait a few minutes and try again.");
    const user = EMAIL_RE.test(email) && await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (user) {
      const token = await storeToken(env, user.id, "recovery", 60 * 60);
      const link = linkFor("recovery_token", token);
      await sendEmail(env, {
        to: user.email,
        subject: "Reset your WellNest password",
        html: emailLayout("Reset your password", "Tap the button below to choose a new password for your WellNest account. The link works for one hour.", "Choose a new password", link),
        text: `Reset your WellNest password: ${link}`,
      });
    }
    return json({}); // Same answer whether or not the account exists.
  }

  if (path === "/authorize" && method === "GET") {
    const url = new URL(request.url);
    if (url.searchParams.get("provider") !== "google" || !env.GOOGLE_CLIENT_ID) return fail(400, "Unsupported sign-in provider.");
    const state = await signJwt(env, { purpose: "google", rt: safeRedirect(url.searchParams.get("redirect_to") || ""), n: randomToken(8) }, 600);
    const consent = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    consent.search = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_CALLBACK, response_type: "code",
      scope: "openid email profile", prompt: "select_account", state,
    }).toString();
    return Response.redirect(consent.toString(), 302);
  }

  return fail(404, "Not found");
}

// Google returns here after the person picks their account.
export async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const state = await verifyJwt(env, url.searchParams.get("state"));
  const back = (target, hash) => Response.redirect(`${target}#${hash}`, 302);
  const target = state?.purpose === "google" ? state.rt : `${SITE}/login`;
  if (!state || state.purpose !== "google") return back(target, "error=access_denied&error_description=" + encodeURIComponent("Sign-in expired. Please try again."));
  if (url.searchParams.get("error")) return back(target, "error=access_denied&error_description=" + encodeURIComponent("Google sign-in was cancelled."));
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: url.searchParams.get("code") || "", client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_CALLBACK, grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.id_token) throw new Error("token exchange failed");
    // The ID token comes straight from Google over TLS in exchange for our secret.
    const profile = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(atob(tokens.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0))));
    if (profile.aud !== env.GOOGLE_CLIENT_ID || !profile.email || profile.email_verified !== true) throw new Error("unverified email");
    const email = String(profile.email).toLowerCase();
    const t = now();
    let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    if (!user) {
      await env.DB.prepare(`INSERT INTO users (id, email, provider, confirmed_at, full_name, data, created_date, updated_date)
        VALUES (?, ?, 'google', ?, ?, ?, ?, ?)`)
        .bind(uuid(), email, t, String(profile.name || "").slice(0, 120), JSON.stringify({ full_name: profile.name || "", avatar_url: profile.picture }), t, t).run();
    } else if (!user.confirmed_at) {
      // Google verified the address; any unconfirmed password set earlier is dropped.
      await env.DB.prepare("UPDATE users SET confirmed_at = ?, password_hash = NULL, updated_date = ? WHERE id = ?").bind(t, t, user.id).run();
    }
    user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    const s = await issueSession(env, user);
    return back(state.rt, new URLSearchParams({ access_token: s.access_token, token_type: "bearer", expires_in: String(s.expires_in), refresh_token: s.refresh_token }).toString());
  } catch (e) {
    console.error("Google sign-in failed", e?.message);
    return back(target, "error=server_error&error_description=" + encodeURIComponent("Google sign-in didn't work. Please try again."));
  }
}
