/**
 * POST /api/fetch-metrics
 * Body: { uid: string, credentials: ApiCredentials }
 * Returns: { metrics: MetricRow[], errors: string[] }
 *
 * Calls Meta, TikTok, and Google Ads APIs using the user's saved credentials.
 * Each platform is attempted independently — if one fails the others still run.
 */

interface MetricRow {
  platform: "meta" | "google" | "tiktok";
  campaign_name: string;
  status: "active" | "paused" | "completed";
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  revenue: number;
  ctr: number;
  roas: number;
  timestamp: string;
}

// ── Meta Ads ─────────────────────────────────────────────────────────────────
async function fetchMeta(adsId: string, token: string): Promise<MetricRow[]> {
  const accountId = adsId.startsWith("act_") ? adsId : `act_${adsId}`;
  const url = new URL(`https://graph.facebook.com/v18.0/${accountId}/insights`);
  url.searchParams.set(
    "fields",
    "campaign_name,spend,clicks,impressions,actions,action_values,ctr"
  );
  url.searchParams.set("date_preset", "last_30_days");
  url.searchParams.set("level", "campaign");
  url.searchParams.set("limit", "10");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(`Meta: ${data.error.message}`);

  return (data.data ?? []).map((c: any): MetricRow => {
    const conv = parseFloat(
      c.actions?.find((a: any) =>
        ["purchase", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type)
      )?.value ?? "0"
    );
    const rev = parseFloat(
      c.action_values?.find((a: any) =>
        ["purchase", "offsite_conversion.fb_pixel_purchase"].includes(a.action_type)
      )?.value ?? "0"
    );
    const spend = parseFloat(c.spend ?? "0");
    return {
      platform: "meta",
      campaign_name: c.campaign_name ?? "Meta Campaign",
      status: "active",
      spend,
      clicks: parseInt(c.clicks ?? "0"),
      impressions: parseInt(c.impressions ?? "0"),
      conversions: conv,
      revenue: rev,
      ctr: parseFloat(c.ctr ?? "0"),
      roas: spend > 0 ? rev / spend : 0,
      timestamp: new Date().toISOString(),
    };
  });
}

// ── TikTok Ads ───────────────────────────────────────────────────────────────
async function fetchTikTok(advertiserId: string, token: string): Promise<MetricRow[]> {
  const end   = new Date().toISOString().split("T")[0];
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const res = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/",
    {
      method: "POST",
      headers: { "Access-Token": token, "Content-Type": "application/json" },
      body: JSON.stringify({
        advertiser_id: advertiserId,
        report_type: "BASIC",
        dimensions: ["campaign_id"],
        metrics: [
          "campaign_name", "spend", "clicks", "impressions",
          "conversion", "value", "ctr",
        ],
        data_level: "AUCTION_CAMPAIGN",
        start_date: start,
        end_date: end,
        page_size: 10,
      }),
    }
  );

  const data = await res.json();
  if (data.code !== 0) throw new Error(`TikTok: ${data.message}`);

  return (data.data?.list ?? []).map((item: any): MetricRow => {
    const m = item.metrics ?? {};
    const spend   = parseFloat(m.spend ?? "0");
    const revenue = parseFloat(m.value ?? "0");
    return {
      platform: "tiktok",
      campaign_name: m.campaign_name ?? "TikTok Campaign",
      status: "active",
      spend,
      clicks:      parseInt(m.clicks ?? "0"),
      impressions: parseInt(m.impressions ?? "0"),
      conversions: parseInt(m.conversion ?? "0"),
      revenue,
      ctr:  parseFloat(m.ctr ?? "0"),
      roas: spend > 0 ? revenue / spend : 0,
      timestamp: new Date().toISOString(),
    };
  });
}

// ── Google Ads ───────────────────────────────────────────────────────────────
// Requires: Customer ID + OAuth2 access token (from Google Ads API Center).
// Note: Google Ads access tokens expire every hour. For production, store a
// refresh token and exchange it here. For now, paste a fresh token in Settings.
async function fetchGoogle(customerId: string, accessToken: string): Promise<MetricRow[]> {
  const cleanId = customerId.replace(/-/g, "");
  const query = `
    SELECT
      campaign.name,
      campaign.status,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 10
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${cleanId}/googleAds:search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google Ads: ${(err as any).error?.message ?? res.statusText}`);
  }

  const data = await res.json();

  return ((data as any).results ?? []).map((r: any): MetricRow => {
    const spend   = (r.metrics.costMicros ?? 0) / 1_000_000;
    const revenue = r.metrics.conversionsValue ?? 0;
    return {
      platform: "google",
      campaign_name: r.campaign.name ?? "Google Campaign",
      status: r.campaign.status === "ENABLED" ? "active" : "paused",
      spend,
      clicks:      r.metrics.clicks      ?? 0,
      impressions: r.metrics.impressions ?? 0,
      conversions: Math.round(r.metrics.conversions ?? 0),
      revenue,
      ctr:  (r.metrics.ctr ?? 0) * 100,
      roas: spend > 0 ? revenue / spend : 0,
      timestamp: new Date().toISOString(),
    };
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { uid?: string; credentials?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { uid, credentials } = body;
  if (!uid || !credentials) {
    return new Response(JSON.stringify({ error: "Missing uid or credentials" }), { status: 400 });
  }

  const metrics: MetricRow[] = [];
  const errors:  string[]    = [];

  // Attempt each platform independently
  if (credentials.meta_ads_id && credentials.meta_api_key) {
    try {
      metrics.push(...await fetchMeta(credentials.meta_ads_id, credentials.meta_api_key));
    } catch (e: any) {
      console.error(e.message);
      errors.push(e.message);
    }
  }

  if (credentials.tiktok_ads_id && credentials.tiktok_api_key) {
    try {
      metrics.push(...await fetchTikTok(credentials.tiktok_ads_id, credentials.tiktok_api_key));
    } catch (e: any) {
      console.error(e.message);
      errors.push(e.message);
    }
  }

  if (credentials.google_ads_id && credentials.google_api_key) {
    try {
      metrics.push(...await fetchGoogle(credentials.google_ads_id, credentials.google_api_key));
    } catch (e: any) {
      console.error(e.message);
      errors.push(e.message);
    }
  }

  return new Response(JSON.stringify({ metrics, errors }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/fetch-metrics" };
