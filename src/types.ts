export type PlatformId = "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok" | "youtube" | "google_ads";

export interface PlatformConnection {
  id: string;
  uid: string;
  platform: PlatformId;
  account_id: string;
  account_name: string;
  access_token: string;
  connected: boolean;
  last_synced_at: string | null;
}

export interface SocialMetric {
  id: string;
  uid: string;
  platform: PlatformId;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  profile_views: number;
  synced_at: string;
}

export interface PlatformPost {
  id: string;
  uid: string;
  platform: PlatformId;
  post_id: string;
  caption: string;
  media_url: string;
  thumbnail_url: string;
  post_url: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  views: number;
  engagement_rate: number;
  posted_at: string;
  synced_at: string;
}

export interface AIInsight {
  id: string;
  uid: string;
  platform: PlatformId | "all";
  overall_score: number;
  top_platform: string;
  key_insight: string;
  recommendations: {
    platform: string;
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    action: string;
  }[];
  best_times: Record<string, string>;
  generated_at: string;
}

export interface AdMetric {
  id: string;
  uid: string;
  platform: PlatformId | "all";
  period_label: string;
  ad_spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  leads: number;
  currency: string;
  recorded_at: string;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
}

export interface MetricDefinition {
  abbr: string;
  full: string;
  formula: string;
  description: string;
  benchmark: string;
  type: "ratio" | "percentage" | "currency" | "number";
  higherIsBetter: boolean;
  color: string;
}

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  handle: string;
  description: string;
}

// extend PlatformId to include google_ads
declare module "./types" {}
