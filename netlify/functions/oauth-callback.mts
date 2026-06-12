/**
 * GET /api/oauth-callback?code=...&state=...
 *
 * Handles the redirect from each OAuth provider.
 * 1. Decodes the state to get uid + platform
 * 2. Exchanges the auth code for an access token
 * 3. Stores the token in Supabase platform_connections
 * 4. Redirects back to the app with ?connected={platform}
 */

import { createClient } from "@supabase/supabase-js";

async function exchangeMeta(code: string, callbackUrl: string) {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token` +
    `?client_id=${process.env.META_APP_ID}` +
    `&client_secret=${process.env.META_APP_SECRET}` +
    `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
    `&code=${code}`
  );
  return res.json();
}

async function exchangeGoogle(code: string, callbackUrl: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  callbackUrl,
      grant_type:    "authorization_code",
    }),
  });
  return res.json();
}

async function exchangeLinkedIn(code: string, callbackUrl: string) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.LINKEDIN_CLIENT_ID!,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      redirect_uri:  callbackUrl,
      grant_type:    "authorization_code",
    }),
  });
  return res.json();
}

export default async (req: Request) => {
  const url      = new URL(req.url);
  const code     = url.searchParams.get("code");
  const stateStr = url.searchParams.get("state");
  const appUrl   = process.env.APP_URL ?? "";
  const callback = `${appUrl}/api/oauth-callback`;

  if (!code || !stateStr) {
    return Response.redirect(`${appUrl}?oauth_error=missing_params`);
  }

  let uid: string, platform: string;
  try {
    const state = JSON.parse(atob(stateStr));
    uid      = state.uid;
    platform = state.platform;
  } catch {
    return Response.redirect(`${appUrl}?oauth_error=invalid_state`);
  }

  // Exchange code for token
  let tokenData: any;
  try {
    if      (platform === "meta")     tokenData = await exchangeMeta(code, callback);
    else if (platform === "google")   tokenData = await exchangeGoogle(code, callback);
    else if (platform === "linkedin") tokenData = await exchangeLinkedIn(code, callback);
    else return Response.redirect(`${appUrl}?oauth_error=unknown_platform`);
  } catch (e: any) {
    console.error("Token exchange error:", e.message);
    return Response.redirect(`${appUrl}?oauth_error=token_exchange`);
  }

  if (!tokenData?.access_token) {
    console.error("No access_token in response:", tokenData);
    return Response.redirect(`${appUrl}?oauth_error=no_token`);
  }

  // Persist to Supabase using service role key (bypasses RLS)
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // For Google, one connection covers both YouTube and Google Ads
  const platformsToStore = platform === "google" ? ["youtube", "google_ads"] : [platform];
  // For Meta, one connection covers Instagram and Facebook
  const metaPlatforms    = platform === "meta"   ? ["instagram", "facebook"]  : null;
  const storePlatforms   = metaPlatforms ?? platformsToStore;

  for (const p of storePlatforms) {
    await supabase.from("platform_connections").upsert({
      id:            `${uid}_${p}`,
      uid,
      platform:      p,
      access_token:  tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? "",
      connected:     true,
      last_synced_at: null,
    });
  }

  return Response.redirect(`${appUrl}?oauth_success=${platform}`);
};

export const config = { path: "/api/oauth-callback" };
