import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PLATFORMS } from "../lib/platforms";
import { AIInsights } from "./AIInsights";
import { TopPosts } from "./TopPosts";
import type { AppUser } from "../lib/supabase";
import type { Page } from "../App";
import type { SocialMetric, PlatformPost, AIInsight } from "../types";
import { Users, Eye, TrendingUp, Wifi, WifiOff, ArrowRight, RefreshCw, Sparkles, Loader2 } from "lucide-react";

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
const getPlatformEmoji = (id: string) =>
  ({ instagram:"📸",facebook:"👥",linkedin:"💼",twitter:"🐦",tiktok:"🎵",youtube:"▶️" }[id] ?? "📊");

const DEMO_METRICS: SocialMetric[] = [
  { id:"1",uid:"demo_v2",platform:"instagram",followers:12400,following:842,posts:287,likes:4820,comments:340,shares:190,reach:28000,impressions:45000,engagement_rate:4.2,profile_views:1200,synced_at:new Date().toISOString() },
  { id:"2",uid:"demo_v2",platform:"facebook", followers:8900, following:0,  posts:142,likes:2100,comments:180,shares:95, reach:15000,impressions:32000,engagement_rate:2.8,profile_views:780, synced_at:new Date().toISOString() },
  { id:"3",uid:"demo_v2",platform:"tiktok",   followers:28400,following:320,posts:96, likes:48000,comments:2800,shares:6400,reach:142000,impressions:210000,engagement_rate:12.6,profile_views:8400,synced_at:new Date().toISOString() },
  { id:"4",uid:"demo_v2",platform:"youtube",  followers:4200, following:0,  posts:38, likes:3200,comments:840,shares:120,reach:24000,impressions:48000,engagement_rate:6.8,profile_views:3800,synced_at:new Date().toISOString() },
];

const DEMO_POSTS: PlatformPost[] = [
  { id:"dp1",uid:"demo_v2",platform:"tiktok",   post_id:"dp1",caption:"How we grew 10k followers in 30 days 🚀",media_url:"",thumbnail_url:"",post_url:"#",likes:14800,comments:920,shares:3400,reach:84000,impressions:120000,views:98000,engagement_rate:18.4,posted_at:new Date(Date.now()-86400000).toISOString(),synced_at:new Date().toISOString() },
  { id:"dp2",uid:"demo_v2",platform:"instagram",post_id:"dp2",caption:"Behind the scenes at our latest shoot 🎬",media_url:"",thumbnail_url:"",post_url:"#",likes:1240,comments:87,shares:34,reach:8400,impressions:12000,views:0,engagement_rate:6.8,posted_at:new Date(Date.now()-2*86400000).toISOString(),synced_at:new Date().toISOString() },
  { id:"dp3",uid:"demo_v2",platform:"youtube",  post_id:"dp3",caption:"The complete guide to social media analytics in 2025",media_url:"",thumbnail_url:"",post_url:"#",likes:3200,comments:480,shares:0,reach:28000,impressions:48000,views:28000,engagement_rate:9.2,posted_at:new Date(Date.now()-3*86400000).toISOString(),synced_at:new Date().toISOString() },
];

export function Overview({ user, onNavigate }: { user: AppUser; onNavigate: (p: Page) => void }) {
  const [metrics,    setMetrics]    = useState<SocialMetric[]>([]);
  const [topPosts,   setTopPosts]   = useState<PlatformPost[]>([]);
  const [insight,    setInsight]    = useState<AIInsight | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [aiLoading,  setAiLoading]  = useState(false);

  useEffect(() => { loadData(); }, [user.uid]);

  const loadData = async () => {
    if (user.uid === "demo_v2") {
      setMetrics(DEMO_METRICS);
      setTopPosts(DEMO_POSTS);
      setLoading(false);
      return;
    }
    const [mRes, pRes, iRes] = await Promise.all([
      supabase.from("social_metrics").select("*").eq("uid", user.uid),
      supabase.from("platform_posts").select("*").eq("uid", user.uid).order("engagement_rate",{ascending:false}).limit(9),
      supabase.from("ai_insights").select("*").eq("uid", user.uid).eq("platform","all").order("generated_at",{ascending:false}).limit(1).maybeSingle(),
    ]);
    setMetrics((mRes.data as SocialMetric[]) ?? []);
    setTopPosts((pRes.data as PlatformPost[]) ?? []);
    setInsight(iRes.data as AIInsight ?? null);
    setLoading(false);
  };

  const syncAll = async () => {
    setSyncing(true);
    // Get all connections with tokens
    const { data: conns } = await supabase.from("platform_connections").select("*").eq("uid", user.uid).eq("connected", true);
    if (!conns?.length) { setSyncing(false); return; }

    for (const conn of conns) {
      try {
        const res = await fetch("/api/sync-platform", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ platform: conn.platform, account_id: conn.account_id, access_token: conn.access_token }),
        });
        const data = await res.json();
        if (data.metrics) {
          const row = { uid: user.uid, platform: conn.platform, ...data.metrics, synced_at: new Date().toISOString() };
          await supabase.from("social_metrics").upsert({ ...row, id: `${user.uid}_${conn.platform}` });
        }
        if (data.posts?.length) {
          const rows = data.posts.map((p: any, i: number) => ({ ...p, id:`${user.uid}_${conn.platform}_${p.post_id ?? i}`, uid:user.uid, platform:conn.platform, synced_at:new Date().toISOString() }));
          await supabase.from("platform_posts").delete().eq("uid",user.uid).eq("platform",conn.platform);
          await supabase.from("platform_posts").upsert(rows);
        }
      } catch {}
    }
    await loadData();
    await generateOverallInsights();
    setSyncing(false);
  };

  const generateOverallInsights = async () => {
    setAiLoading(true);
    try {
      const { data: m } = await supabase.from("social_metrics").select("*").eq("uid", user.uid);
      const { data: p } = await supabase.from("platform_posts").select("*").eq("uid", user.uid).order("engagement_rate",{ascending:false}).limit(12);
      if (!m?.length) return;
      const res = await fetch("/api/ai-insights", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ metrics: m, posts: p ?? [] }),
      });
      const data = await res.json();
      if (data.overall_score !== undefined) {
        const row = { id:`${user.uid}_all`, uid:user.uid, platform:"all", ...data };
        await supabase.from("ai_insights").upsert(row);
        setInsight(row as AIInsight);
      }
    } catch {}
    finally { setAiLoading(false); }
  };

  const totalFollowers  = metrics.reduce((s, m) => s + m.followers, 0);
  const totalReach      = metrics.reduce((s, m) => s + m.reach, 0);
  const totalImpressions= metrics.reduce((s, m) => s + m.impressions, 0);
  const avgEngagement   = metrics.length ? metrics.reduce((s, m) => s + m.engagement_rate, 0) / metrics.length : 0;
  const connectedCount  = metrics.length;

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={22} className="animate-spin text-brand"/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold mb-1" style={{ color:"var(--text)" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm" style={{ color:"var(--muted)" }}>Real-time performance across all your social platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1.5 rounded-full border font-medium flex items-center gap-1.5" style={{ color:"var(--muted)", borderColor:"var(--border)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
            {connectedCount} platform{connectedCount !== 1 ? "s" : ""} synced
          </div>
          <button onClick={syncAll} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand hover:opacity-90 transition-all disabled:opacity-60">
            {syncing ? <Loader2 size={13} className="animate-spin"/> : <RefreshCw size={13}/>}
            {syncing ? "Syncing all…" : "Sync all"}
          </button>
          <button onClick={generateOverallInsights} disabled={aiLoading || !metrics.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-50"
            style={{ borderColor:"var(--border)", color:"var(--text)", background:"var(--card)" }}>
            {aiLoading ? <Loader2 size={13} className="animate-spin"/> : <Sparkles size={13} className="text-brand"/>}
            AI insights
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Followers",   value:fmtNum(totalFollowers),           Icon:Users,      color:"#4f46e5" },
          { label:"Avg Engagement",    value:`${avgEngagement.toFixed(1)}%`,   Icon:TrendingUp, color:"#059669" },
          { label:"Monthly Reach",     value:fmtNum(totalReach),               Icon:Eye,        color:"#0891b2" },
          { label:"Total Impressions", value:fmtNum(totalImpressions),         Icon:BarChartIcon,color:"#9333ea"},
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-2xl p-5 border shadow-sm" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color:"var(--muted)" }}>{label}</p>
              <div className="p-2 rounded-xl" style={{ background:`${color}15`, color }}><Icon size={15}/></div>
            </div>
            <p className="text-2xl font-mono font-semibold" style={{ color:"var(--text)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Platform cards */}
      <div>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3" style={{ color:"var(--muted)" }}>Platform status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORMS.map((platform) => {
            const m = metrics.find((x) => x.platform === platform.id);
            return (
              <div key={platform.id}
                className="rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer group"
                style={{ background:"var(--card)", borderColor:"var(--border)" }}
                onClick={() => onNavigate(platform.id as Page)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:`${platform.color}15` }}>
                      {getPlatformEmoji(platform.id)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>{platform.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {m ? <><Wifi size={10} className="text-green-500"/><span className="text-[10px] text-green-600 font-medium">Live data</span></>
                           : <><WifiOff size={10} style={{ color:"var(--muted)" }}/><span className="text-[10px] font-medium" style={{ color:"var(--muted)" }}>Not connected</span></>}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" style={{ color:"var(--muted)" }}/>
                </div>
                {m ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[["Followers",fmtNum(m.followers)],["Reach",fmtNum(m.reach)],[`${m.engagement_rate.toFixed(1)}%`,"ER"]].map(([v,l]) => (
                      <div key={l}><p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color:"var(--muted)" }}>{l}</p><p className="text-sm font-semibold font-mono" style={{ color:"var(--text)" }}>{v}</p></div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color:"var(--muted)" }}>Connect in Settings → Sync to see live metrics</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights + Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIInsights insight={insight} loading={aiLoading} onRefresh={generateOverallInsights}/>
        <div>
          <TopPosts posts={topPosts} title="Top posts across all platforms"/>
        </div>
      </div>
    </div>
  );
}

function BarChartIcon({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}