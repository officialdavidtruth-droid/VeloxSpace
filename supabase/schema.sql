-- ============================================================
-- Velox Space — Supabase Schema
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- Users (subscription + usage)
create table public.users (
  id        text primary key,  -- = auth.uid()
  uid       text not null,
  plan      text not null default 'starter',
  billing_cycle text not null default 'monthly',
  updated_at timestamptz default now(),
  posts_created_this_month integer default 0
);

-- Posts (scheduled social media posts)
create table public.posts (
  id              uuid default gen_random_uuid() primary key,
  uid             text not null,
  content         text not null,
  platforms       text[] not null default '{}',
  scheduled_time  timestamptz not null,
  status          text not null default 'scheduled',
  caption_length  integer default 0,
  hashtags        text[] default '{}',
  created_at      timestamptz default now()
);
create index posts_uid_idx on public.posts (uid);

-- Analytics (campaign performance metrics)
create table public.analytics (
  id            text primary key,  -- custom: '{uid}_m_1' etc.
  uid           text not null,
  platform      text not null,
  campaign_name text not null,
  status        text not null default 'active',
  spend         decimal(12,2) default 0,
  clicks        integer default 0,
  impressions   integer default 0,
  conversions   integer default 0,
  revenue       decimal(12,2) default 0,
  ctr           decimal(8,4) default 0,
  roas          decimal(8,4) default 0,
  timestamp     timestamptz default now()
);
create index analytics_uid_idx on public.analytics (uid);

-- Recommendations (AI optimisation suggestions)
create table public.recommendations (
  id                    text primary key,  -- custom: '{uid}_rec_1' etc.
  uid                   text not null,
  title                 text not null,
  platform              text not null,
  impact                text not null,
  description           text,
  recommended_action    text,
  projected_roas_lift   decimal(8,4) default 0,
  implemented           boolean default false,
  type                  text not null,
  category              text not null
);
create index recommendations_uid_idx on public.recommendations (uid);

-- Credentials (ad platform API keys)
create table public.credentials (
  id              text primary key,  -- = auth.uid()
  uid             text not null,
  meta_ads_id     text default '',
  meta_api_key    text default '',
  google_ads_id   text default '',
  google_api_key  text default '',
  tiktok_ads_id   text default '',
  tiktok_api_key  text default '',
  updated_at      timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────────────
-- Each user can only read/write their own rows.

alter table public.users          enable row level security;
alter table public.posts          enable row level security;
alter table public.analytics      enable row level security;
alter table public.recommendations enable row level security;
alter table public.credentials    enable row level security;

create policy "users: own"           on public.users           for all using (uid = auth.uid()::text);
create policy "posts: own"           on public.posts           for all using (uid = auth.uid()::text);
create policy "analytics: own"       on public.analytics       for all using (uid = auth.uid()::text);
create policy "recommendations: own" on public.recommendations for all using (uid = auth.uid()::text);
create policy "credentials: own"     on public.credentials     for all using (uid = auth.uid()::text);
