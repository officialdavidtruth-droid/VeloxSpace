import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SITE_URL = process.env.SITE_URL || process.env.VITE_SITE_URL || "https://velox-space.netlify.app";
const REDIRECT_URI = `${SITE_URL}/api/oauth-callback`;

async function exchangeMeta(code: string) {
  const shortRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=authorization_code` +
    `&client_id=${process.env.META_APP_ID || process.env.VITE_META_APP_ID}&client_secret=${process.env.META_APP_SECRET}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&code=${code}`
  );
  const short = await shortRes.json();
  if (short.error) throw new Error(short.error.message);

  const longRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${process.env.META_APP_ID || process.env.VITE_META_APP_ID}&client_secret=${process.env.META_APP_SECRET}` +
    `&fb_exchange_token=${short.access_token}`
  );
  const long = await longRes.json();
  const token = long.access_token || short.access_token;

  const meRes = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${token}`);
  const me = await meRes.json();

  return { token, account_id: me.id ?? "", account_name: me.name ?? "Meta Account" };
}

async function exchangeGoogle(code: string) {
  const body = new URLSearchParams({
    code, grant_type: "authorization_code",
    client_id: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);

  const chRes = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );
  const chData = await chRes.json();
  const ch = chData.items?.[0];

  const tokenPayload = JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    expiry: Date.now() + (data.expires_in ?? 3600) * 1000,
  });

  return { token: tokenPayload, account_id: ch?.id ?? "", account_name: ch?.snippet?.title ?? "Google Account" };
}

async function exchangeTikTok(code: string) {
  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_CLIENT_KEY || process.env.VITE_TIKTOK_CLIENT_KEY || "",
      secret: process.env.TIKTOK_CLIENT_SECRET || "",
      auth_code: code,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.message);

  const token = data.data?.access_token ?? "";
  const advertisers = data.data?.advertiser_ids ?? [];
  return { token, account_id: advertisers[0] ?? "", account_name: data.data?.display_name ?? "TikTok Account" };
}

async function exchangeLinkedIn(code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code", code,
    client_id: process.env.LINKEDIN_CLIENT_ID || process.env.VITE_LINKEDIN_CLIENT_ID || "",
    client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description);

  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const profile = await profileRes.json();

  return { token: data.access_token, account_id: profile.sub ?? "", account_name: profile.name ?? "LinkedIn Account" };
}

async function exchangeTwitter(code: string, verifier: string) {
  const creds = Buffer.from(`${process.env.TWITTER_CLIENT_ID || process.env.VITE_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    code, grant_type: "authorization_code",
    client_id: process.env.TWITTER_CLIENT_ID || process.env.VITE_TWITTER_CLIENT_ID || "",
    redirect_uri: REDIRECT_URI, code_verifier: verifier,
  });
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${creds}` },
    body: body.toString(),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);

  const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=name,username", {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const me = await meRes.json();

  return { token: data.access_token, account_id: me.data?.username ?? "", account_name: me.data?.name ?? "X Account" };
}

export default async (req: Request) => {
  const url   = new URL(req.url);
  const code  = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(`${SITE_URL}/?oauth_error=${encodeURIComponent(error)}`, 302);
  }
  if (!code || !state) {
    return Response.redirect(`${SITE_URL}/?oauth_error=missing_params`, 302);
  }

  const parts    = state.split("__");
  const platform = parts[0];
  const uid      = parts[1];
  const pkceB64  = parts[2] ?? "";

  if (!platform || !uid) {
    return Response.redirect(`${SITE_URL}/?oauth_error=${encodeURIComponent("invalid_state:" + state)}`, 302);
  }

  try {
    let result: { token: string; account_id: string; account_name: string };

    if (platform === "meta")     result = await exchangeMeta(code);
    else if (platform === "google")  result = await exchangeGoogle(code);
    else if (platform === "tiktok")  result = await exchangeTikTok(code);
    else if (platform === "linkedin") result = await exchangeLinkedIn(code);
    else if (platform === "twitter") {
      const verifier = pkceB64 ? Buffer.from(pkceB64, "base64").toString() : "";
      result = await exchangeTwitter(code, verifier);
    } else {
      throw new Error(`Unknown platform: ${platform}`);
    }

    const platformMap: Record<string, string[]> = {
      meta: ["instagram", "facebook"],
      google: ["youtube", "google_ads"],
      tiktok: ["tiktok"],
      linkedin: ["linkedin"],
      twitter: ["twitter"],
    };
    const dbPlatforms = platformMap[platform] ?? [platform];

    for (const dbPlatform of dbPlatforms) {
      await supabase.from("platform_connections").upsert({
        id: `${uid}_${dbPlatform}`,
        uid,
        platform: dbPlatform,
        account_id: result.account_id,
        account_name: result.account_name,
        access_token: result.token,
        connected: true,
        last_synced_at: new Date().toISOString(),
      });
    }

    return Response.redirect(`${SITE_URL}/?connected=${platform}`, 302);
  } catch (err: any) {
    console.error(`OAuth error [${platform}]:`, err.message);
    return Response.redirect(`${SITE_URL}/?oauth_error=${encodeURIComponent(err.message)}`, 302);
  }
};

export const config = { path: "/api/oauth-callback" };