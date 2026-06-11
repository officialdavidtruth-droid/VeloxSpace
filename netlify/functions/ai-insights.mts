/**
 * POST /api/ai-insights
 * Body: { metrics: SocialMetric[], posts: PlatformPost[] }
 * Returns: AIInsight object with recommendations, scores, and best posting times
 */

async function callCloudflareAI(prompt: string): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token     = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) throw new Error("Cloudflare credentials not configured");

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an expert social media analyst. Respond ONLY with valid JSON — no markdown, no code fences, no extra text before or after the JSON object." },
          { role: "user",   content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    }
  );
  if (!res.ok) throw new Error(`Cloudflare AI ${res.status}`);
  const data = await res.json();
  return (data as any)?.result?.response ?? "";
}

function extractJSON(raw: string): any {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in AI response");
  return JSON.parse(match[0]);
}

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  let body: { metrics?: any[]; posts?: any[] };
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  if (!body.metrics?.length) {
    return new Response(JSON.stringify({ error: "No metrics to analyse" }), { status: 400 });
  }

  const prompt = `Analyse this social media data for a brand and generate actionable AI insights.

Platform Metrics (each platform's aggregate stats):
${JSON.stringify(body.metrics, null, 2)}

Top Posts per Platform (sorted by engagement):
${JSON.stringify((body.posts ?? []).slice(0, 20), null, 2)}

Return ONLY a JSON object with exactly this structure:
{
  "overall_score": 7.2,
  "top_platform": "instagram",
  "key_insight": "2-3 sentence insight referencing actual numbers from the data",
  "recommendations": [
    {
      "platform": "instagram",
      "priority": "high",
      "title": "Short action title (max 6 words)",
      "description": "Specific insight referencing actual engagement numbers from the data provided",
      "action": "Exact single step the user should take this week"
    },
    {
      "platform": "tiktok",
      "priority": "medium",
      "title": "Another title",
      "description": "Description with real numbers",
      "action": "Specific action step"
    },
    {
      "platform": "all",
      "priority": "high",
      "title": "Cross-platform opportunity",
      "description": "Cross-platform insight referencing the data",
      "action": "What to do across all platforms"
    }
  ],
  "best_times": {
    "instagram": "6–8 PM weekdays",
    "facebook": "12–3 PM Wednesday",
    "tiktok": "7–9 PM daily",
    "youtube": "2–4 PM Saturday"
  },
  "content_insight": "One sentence about what type of content is performing best based on the top posts data"
}

Rules:
- overall_score: 0–10 based on the actual engagement rates in the data
- top_platform: whichever platform has the highest engagement_rate
- Generate exactly 3 recommendations
- priority: one of high, medium, low
- Reference actual numbers (follower counts, engagement %, post counts) from the data`;

  try {
    const raw  = await callCloudflareAI(prompt);
    const json = extractJSON(raw);
    json.generated_at = new Date().toISOString();
    return new Response(JSON.stringify(json), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("AI insights error:", err.message);
    // Return a sensible fallback so the app doesn't break
    return new Response(JSON.stringify({
      overall_score: 0,
      top_platform: "unknown",
      key_insight: "AI analysis is unavailable right now. Connect your platforms and try again.",
      recommendations: [],
      best_times: {},
      content_insight: "",
      generated_at: new Date().toISOString(),
      error: err.message,
    }), { headers: { "Content-Type": "application/json" } });
  }
};

export const config = { path: "/api/ai-insights" };
