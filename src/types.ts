export type PlanTier = "starter" | "growth" | "pro";

export interface UserSubscription {
  id: string;
  uid: string;
  plan: PlanTier;
  billing_cycle: "monthly" | "yearly";
  updated_at: string;
  posts_created_this_month: number;
}

export interface SocialMetrics {
  id: string;
  uid: string;
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

export interface ScheduledPost {
  id: string;
  uid: string;
  content: string;
  platforms: ("meta" | "tiktok" | "x")[];
  scheduled_time: string;
  status: "draft" | "scheduled" | "published" | "failed";
  caption_length: number;
  hashtags: string[];
  created_at: string;
}

export interface ApiCredentials {
  id: string;
  uid: string;
  meta_ads_id: string;
  meta_api_key: string;
  google_ads_id: string;
  google_api_key: string;
  tiktok_ads_id: string;
  tiktok_api_key: string;
  updated_at: string;
}

export interface AiRecommendation {
  id: string;
  uid: string;
  title: string;
  platform: "meta" | "google" | "tiktok" | "all";
  impact: "high" | "medium" | "low";
  description: string;
  recommended_action: string;
  projected_roas_lift: number;
  implemented: boolean;
  type: "budget" | "audience" | "creative";
  category: string;
}
