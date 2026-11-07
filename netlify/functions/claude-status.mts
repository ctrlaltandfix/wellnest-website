import type { Config } from "@netlify/functions";

// Verifies the site's connection to the owner's Anthropic account.
// Uses the free model-listing endpoint, so checking status never spends API credits.
export default async () => {
  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return Response.json({ connected: false, reason: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }

  // Always call Anthropic directly so usage bills to the owner's account, never the AI Gateway.
  const baseUrl = "https://api.anthropic.com";

  try {
    const res = await fetch(`${baseUrl}/v1/models?limit=100`, {
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    });
    if (!res.ok) {
      const reason =
        res.status === 401 ? "API key was rejected (invalid or revoked)" :
        res.status === 403 ? "API key lacks permission" :
        `Anthropic API returned ${res.status}`;
      return Response.json({ connected: false, reason }, { status: 502 });
    }
    const body = (await res.json()) as { data?: { id: string }[] };
    return Response.json({
      connected: true,
      billing: "your Anthropic account",
      models: (body.data ?? []).map((m) => m.id),
    });
  } catch {
    return Response.json({ connected: false, reason: "Could not reach the Anthropic API" }, { status: 502 });
  }
};

export const config: Config = { path: "/api/claude/status" };
