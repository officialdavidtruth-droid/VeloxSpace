/**
 * POST /api/ai-analyze
 * Body: { metrics: SocialMetrics[] }
 * Returns: { recommendations: AiRecommendation[] }
 *
 * Uses Cloudflare Workers AI REST API with llama-3.3-70b for better
 * analytical quality on complex campaign data.
 */

async function callCloudflareAI(accountId: string, token: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.3-70b-instruct-fp8-fast`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are a senior performance marketing analyst with 10 years of experience optimising Meta, Google, and TikTok campaigns. Respond ONLY with a raw JSON object — no markdown, no code fences, no explanation before or after the JSON.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudflare AI ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data as any)?.result?.response ?? "";
}

function extractRecommendations(raw: string): any[] | null {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      return parsed.recommendations;
    }
    return null;
  } catch {
    return null;
  }
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: { metrics?: any[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.metrics?.length) {
    return new Response(JSON.stringify({ recommendations: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    console.warn("Cloudflare credentials not set");
    return new Response(JSON.stringify({ recommendations: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = `Analyse these ad campaign metrics and return exactly 3 specific, data-driven optimisation recommendations. Reference actual numbers from the data in your descriptions.

Campaign Data:
${JSON.stringify(body.metrics, null, 2)}

Return ONLY a JSON object with this exact structure:
{
  "recommendations": [
    {
      "id": "rec_1",
      "title": "Short action-oriented title (max 8 words)",
      "platform": "meta",
      "impact": "high",
      "description": "2-3 sentences referencing specific numbers (spend, ROAS, CTR) from the data",
      "recommendedAction": "Exact step the marketer should take right now (1 sentence)",
      "projectedRoasLift": 0.45,
      "implemented": false,
      "type": "budget",
      "category": "ROAS Maximiser"
    }
  ]
}

Rules:
- platform: one of meta, google, tiktok, all
- impact: one of high, medium, low
- type: one of budget, audience, creative
- projectedRoasLift: realistic positive number (0.1 to 1.5)
- Base recommendations on the actual campaign performance numbers provided
- Exactly 3 recommendations, no more, no less`;

  try {
    const raw = await callCloudflareAI(accountId, token, prompt);
    const recommendations = extractRecommendations(raw);

    if (!recommendations) throw new Error("Could not parse recommendations from AI response");

    return new Response(JSON.stringify({ recommendations }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("AI analyze error:", err.message);
    return new Response(
      JSON.stringify({ error: "Analysis failed", recommendations: [] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config = { path: "/api/ai-analyze" };
