import type { PlatformId, PlatformConfig, MetricDefinition } from "../types";

export const PLATFORMS: PlatformConfig[] = [
  { id: "instagram", name: "Instagram", color: "#E1306C", bgColor: "#fce4ec", darkBgColor: "#2d0a16", handle: "@handle", description: "Photo & video sharing" },
  { id: "facebook",  name: "Facebook",  color: "#1877F2", bgColor: "#e3f2fd", darkBgColor: "#0a1929", handle: "Page name", description: "Social networking" },
  { id: "linkedin",  name: "LinkedIn",  color: "#0A66C2", bgColor: "#e1f0fa", darkBgColor: "#031629", handle: "Company page", description: "Professional network" },
  { id: "twitter",   name: "X (Twitter)", color: "#000000", bgColor: "#f5f5f5", darkBgColor: "#111111", handle: "@handle", description: "Real-time microblogging" },
  { id: "tiktok",    name: "TikTok",    color: "#69C9D0", bgColor: "#e0f7fa", darkBgColor: "#001a1c", handle: "@handle", description: "Short-form video" },
  { id: "youtube",   name: "YouTube",   color: "#FF0000", bgColor: "#ffebee", darkBgColor: "#1a0000", handle: "Channel name", description: "Video hosting" },
];

export const getPlatform = (id: PlatformId): PlatformConfig =>
  PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    abbr: "ROAS", full: "Return on Ad Spend",
    formula: "Revenue ÷ Ad Spend",
    description: "How much revenue you earn for every dollar spent on advertising. A ROAS of 4× means you made $4 for every $1 spent on ads.",
    benchmark: "Good: 4× or above | Great: 8×+",
    type: "ratio", higherIsBetter: true, color: "#4f46e5",
  },
  {
    abbr: "ROI", full: "Return on Investment",
    formula: "(Revenue − Cost) ÷ Cost × 100",
    description: "Net profit percentage relative to your total investment. Measures the overall profitability of all your marketing efforts combined.",
    benchmark: "Profitable: above 0% | Good: 100%+",
    type: "percentage", higherIsBetter: true, color: "#059669",
  },
  {
    abbr: "CTR", full: "Click Through Rate",
    formula: "Clicks ÷ Impressions × 100",
    description: "The percentage of people who clicked your ad or content after seeing it. A high CTR means your creative is relevant and compelling.",
    benchmark: "Social average: 0.9% | Good: 2%+",
    type: "percentage", higherIsBetter: true, color: "#0891b2",
  },
  {
    abbr: "CPA", full: "Cost Per Acquisition",
    formula: "Ad Spend ÷ Conversions",
    description: "Average amount spent to acquire one paying customer or conversion. Always compare against customer lifetime value (LTV) for context.",
    benchmark: "Should be lower than LTV",
    type: "currency", higherIsBetter: false, color: "#dc2626",
  },
  {
    abbr: "CPM", full: "Cost Per Mille",
    formula: "Ad Spend ÷ Impressions × 1,000",
    description: "The cost to show your ad 1,000 times. Used to compare reach efficiency across different platforms and campaigns.",
    benchmark: "Social media: $5–$15 avg",
    type: "currency", higherIsBetter: false, color: "#9333ea",
  },
  {
    abbr: "CPC", full: "Cost Per Click",
    formula: "Ad Spend ÷ Clicks",
    description: "Average cost each time someone clicks your ad. Lower CPC means more website traffic for your budget.",
    benchmark: "Social: under $1 | Search: under $2",
    type: "currency", higherIsBetter: false, color: "#ea580c",
  },
  {
    abbr: "CPL", full: "Cost Per Lead",
    formula: "Ad Spend ÷ Leads Generated",
    description: "Average cost to generate one qualified lead. Different from CPA — a lead hasn't necessarily made a purchase yet.",
    benchmark: "Varies heavily by industry",
    type: "currency", higherIsBetter: false, color: "#0d9488",
  },
  {
    abbr: "CAC", full: "Customer Acquisition Cost",
    formula: "Total Marketing Spend ÷ New Customers",
    description: "Total cost to acquire one new customer, including all marketing and sales expenses. Must always stay below LTV for a healthy business.",
    benchmark: "LTV:CAC ratio should be 3:1 or higher",
    type: "currency", higherIsBetter: false, color: "#b45309",
  },
  {
    abbr: "LTV", full: "Customer Lifetime Value",
    formula: "Avg Order × Purchase Frequency × Customer Lifespan",
    description: "Predicted total revenue from one customer over their entire relationship with your brand. Higher LTV justifies higher CAC.",
    benchmark: "Should be 3× your CAC minimum",
    type: "currency", higherIsBetter: true, color: "#065f46",
  },
  {
    abbr: "ER", full: "Engagement Rate",
    formula: "(Likes + Comments + Shares) ÷ Followers × 100",
    description: "The percentage of your audience actively engaging with your content. A strong ER signals a loyal, interested community.",
    benchmark: "Instagram: 1–5% | TikTok: 4–18%",
    type: "percentage", higherIsBetter: true, color: "#7c3aed",
  },
];
