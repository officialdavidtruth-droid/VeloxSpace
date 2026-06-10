/**
 * POST /api/hashtag-suggestions
 * Body: { content: string }
 * Returns: { hashtags: string[] }
 *
 * Uses Cloudflare Workers AI REST API — no SDK required.
 * Falls back to generic hashtags if credentials are missing.
 */

const FALLBACK_HASHTAGS = [
  "#digitalmarketing",
  "#campaign",
  "#marketingstrategy",
  "#growyourbrand",
  "#socialmedia",
];

async function callCloudflareAI(accountId: string, token: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct-fast`,
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
              "You are a social media marketing expert. Respond ONLY with a raw JSON object — no markdown, no code fences, no explanation. The object must have exactly one key: \"hashtags\", containing an array of 5 strings.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 256,
        temperature: 0.7,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Cloudflare AI responded with ${res.status}`);
  }

  const data = await res.json();
  return (data as any)?.result?.response ?? "";
}

function extractHashtags(raw: string): string[] | null {
  try {
    // Strip markdown fences if model ignores the instruction
    const cleaned = raw.replace(/```json|```/g, "").trim();
    // Extract the first JSON object found
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed.hashtags) && parsed.hashtags.length > 0) {
      return parsed.hashtags.map((h: string) =>
        h.startsWith("#") ? h : `#${h}`
      );
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

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.content?.trim()) {
    return new Response(JSON.stringify({ error: "content field is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    console.warn("Cloudflare credentials not set — returning fallback hashtags");
    return new Response(JSON.stringify({ hashtags: FALLBACK_HASHTAGS }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = `Analyze this advertising copy and generate 5 highly optimised, viral hashtags for it. Return ONLY a JSON object: {"hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]}\n\nCopy: "${body.content.trim()}"`;

  try {
    const raw = await callCloudflareAI(accountId, token, prompt);
    const hashtags = extractHashtags(raw);

    if (!hashtags) throw new Error("Could not parse hashtags from AI response");

    return new Response(JSON.stringify({ hashtags }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Hashtag function error:", err.message);
    return new Response(JSON.stringify({ hashtags: FALLBACK_HASHTAGS }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/hashtag-suggestions" };
