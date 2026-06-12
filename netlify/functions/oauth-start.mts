/**
 * POST /api/oauth-start
 * Body: { platform: string, uid: string }
 * Returns: { authUrl: string }
 *
 * Generates the OAuth authorization URL for each platform.
 * The uid is encoded in the state parameter so the callback
 * knows which Supabase user to link the token to.
 */

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { platform, uid } = await req.json();
  if (!platform || !uid) return new Response(JSON.stringify({ error: "platform and uid required" }), { status: 400 });

  const appUrl    = process.env.APP_URL ?? "";
  const callback  = `${appUrl}/api/oauth-callback`;
  const state     = btoa(JSON.stringify({ uid, platform, ts: Date.now() }));

  let authUrl = "";

  switch (platform) {
    case "meta":
      // Covers Instagram + Facebook Pages
      authUrl =
        `https://www.facebook.com/v18.0/dialog/oauth` +
        `?client_id=${process.env.META_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(callback)}` +
        `&scope=instagram_basic,instagram_manage_insights,pages_read_engagement,pages_show_list,ads_read` +
        `&state=${state}` +
        `&response_type=code`;
      break;

    case "google":
      // Covers YouTube + Google Ads (both scopes in one OAuth)
      authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(callback)}` +
        `&scope=${encodeURIComponent(
          "https://www.googleapis.com/auth/youtube.readonly " +
          "https://www.googleapis.com/auth/adwords " +
          "https://www.googleapis.com/auth/analytics.readonly"
        )}` +
        `&state=${state}` +
        `&response_type=code` +
        `&access_type=offline` +
        `&prompt=consent`;
      break;

    case "linkedin":
      authUrl =
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?client_id=${process.env.LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(callback)}` +
        `&scope=${encodeURIComponent("r_organization_social r_ads_reporting")}` +
        `&state=${state}` +
        `&response_type=code`;
      break;

    default:
      return new Response(JSON.stringify({ error: `OAuth not supported for ${platform}` }), { status: 400 });
  }

  return new Response(JSON.stringify({ authUrl }), { headers: { "Content-Type": "application/json" } });
};

export const config = { path: "/api/oauth-start" };
