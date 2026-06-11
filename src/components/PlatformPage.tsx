import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getPlatform } from "../lib/platforms";
import { TopPosts } from "./TopPosts";
import { AIInsights } from "./AIInsights";
import type { AppUser } from "../lib/supabase";
import type { PlatformId, SocialMetric, PlatformPost, AIInsight } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { RefreshCw, Wifi, WifiOff, AlertCircle, TrendingUp, Users, Eye, Heart, Loader2 } from "lucide-react";

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
function genTrend(base: number, label: string) {
  return Array.from({ length: 7 }, (_, i) => ({
    day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i],
    [label]: Math.round(base * (0.88 + Math.random() * 0.24)),
  }));
}
const getPlatformEmoji = (id: string) =>
  ({ instagram:"📸",facebook:"👥",linkedin:"💼",twitter:"🐦",tiktok:"🎵",youtube:"▶️" }[id] ?? "📊");

const DEMO_METRICS: Partial<Record<PlatformId, SocialMetric>> = {
  instagram: { id:"dm_ig",uid:"demo_v2",platform:"instagram",followers:12400,following:842,posts:287,likes:4820,comments:340,shares:190,reach:28000,impressions:45000,engagement_rate:4.2,profile_views:1200,synced_at:new Date().toISOString() },
  facebook:  { id:"dm_fb",uid:"demo_v2",platform:"facebook", followers:8900, following:0,  posts:142,likes:2100,comments:180,shares:95, reach:15000,impressions:32000,engagement_rate:2.8,profile_views:780, synced_at:new Date().toISOString() },
  tiktok:    { id:"dm_tk",uid:"demo_v2",platform:"tiktok",   followers:28400,following:320,posts:96, likes:48000,comments:2800,shares:6400,reach:142000,impressions:210000,engagement_rate:12.6,profile_views:8400,synced_at:new Date().toISOString() },
  youtube:   { id:"dm_yt",uid:"demo_v2",platform:"youtube",  followers:4200, following:0,  posts:38, likes:3200,comments:840,shares:120,reach:24000,impressions:48000,engagement_rate:6.8,profile_views:3800,synced_at:new Date().toISOString() },
};
const DEMO_POSTS: Partial<Record<PlatformId, PlatformPost[]>> = {
  instagram: [
    { id:"p1",uid:"demo_v2",platform:"instagram",post_id:"p1",caption:"Behind the scenes at our latest product shoot 🎬",media_url:"",thumbnail_url:"",post_url:"#",likes:1240,comments:87,shares:34,reach:8400,impressions:12000,views:0,engagement_rate:6.8,posted_at:new Date(Date.now()-2*86400000).toISOString(),synced_at:new Date().toISOString()},
    { id:"p2",uid:"demo_v2",platform:"instagram",post_id:"p2",caption:"5 things we learned in our first year 💡",media_url:"",thumbnail_url:"",post_url:"#",likes:920,comments:143,shares:28,reach:6200,impressions:9800,views:0,engagement_rate:5.4,posted_at:new Date(Date.now()-5*86400000).toISOString(),synced_at:new Date().toISOString()},
    { id:"p3",uid:"demo_v2",platform:"instagram",post_id:"p3",caption:"Client success story: 3× growth in 60 days",media_url:"",thumbnail_url:"",post_url:"#",likes:780,comments:62,shares:19,reach:4900,impressions:7400,views:0,engagement_rate:4.9,posted_at:new Date(Date.now()-8*86400000).toISOString(),synced_at:new Date().toISOString()},
  ],
};

export function PlatformPage({ user, platformId }: { user: AppUser; platformId: PlatformId }) {
  const platform   = getPlatform(platformId);
  const [metric,   setMetric]   = useState<SocialMetric | null>(null);
  const [posts,    setPosts]    = useState<PlatformPost[]>([]);
  const [insight,  setInsight]  = useState<AIInsight | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState(false);
  const [aiLoading,setAiLoading]= useState(false);
  const [syncError,setSyncError]= useState("");
  const [connection,setConn]    = useState<{ account_id: string; access_token: string } | null>(null);

  useEffect(() => { loadData(); }, [user.uid, platformId]);

  const loadData = async () => {
    if (user.uid === "demo_v2") {
      setMetric(DEMO_METRICS[platformId] ?? null);
      setPosts(DEMO_POSTS[platformId] ?? []);
      setLoading(false);
      return;
    }
    const [mRes, pRes, cRes, iRes] = await Promise.all([
      supabase.from("social_metrics").select("*").eq("uid",user.uid).eq("platform",platformId).maybeSingle(),
      supabase.from("platform_posts").select("*").eq("uid",user.uid).eq("platform",platformId).order("engagement_rate",{ascending:false}).limit(10),
      supabase.from("platform_connections").select("account_id,access_token").eq("uid",user.uid).eq("platform",platformId).maybeSingle(),
      supabase.from("ai_insights").select("*").eq("uid",user.uid).eq("platform",platformId).order("generated_at",{ascending:false}).limit(1).maybeSingle(),
    ]);
    setMetric(mRes.data as SocialMetric ?? null);
    setPosts((pRes.data as PlatformPost[]) ?? []);
    setInsight(iRes.data as AIInsight ?? null);
    if (cRes.data?.access_token) setConn(cRes.data);
    setLoading(false);
  };

  const syncPlatform = async () => {
    if (!connection?.access_token) { setSyncError("No credentials found. Connect this platform in Settings first."); return; }
    setSyncing(true); setSyncError("");
    try {
      const res = await fetch("/api/sync-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platformId, account_id: connection.account_id, access_token: connection.access_token }),
      });
      const data = await res.json();
      if (data.error && !data.metrics) throw new Error(data.error);

      if (data.metrics) {
        const row = { uid: user.uid, platform: platformId, ...data.metrics, synced_at: new Date().toISOString() };
        await supabase.from("social_metrics").upsert({ ...row, id: `${user.uid}_${platformId}` });
        setMetric({ id: `${user.uid}_${platformId}`, ...row } as SocialMetric);
      }
      if (data.posts?.length) {
        const rows = data.posts.map((p: any, i: number) => ({ ...p, id: `${user.uid}_${platformId}_${p.post_id ?? i}`, uid: user.uid, platform: platformId, synced_at: new Date().toISOString() }));
        await supabase.from("platform_posts").delete().eq("uid",user.uid).eq("platform",platformId);
        await supabase.from("platform_posts").upsert(rows);
        setPosts(rows);
      }
      if (data.metrics) await generateInsights(data.metrics, data.posts ?? []);
    } catch (e: any) { setSyncError(e.message); }
    finally { setSyncing(false); }
  };

  const generateInsights = async (m?: any, rawPosts?: any[]) => {
    setAiLoading(true);
    try {
      const payload = m ? [{ platform: platformId, ...m }] : metric ? [metric] : [];
      if (!payload.length) return;
      const res = await fetch("/api/ai-insights", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ metrics: payload, posts: rawPosts ?? posts }) });
      const data = await res.json();
      if (data.overall_score !== undefined) {
        const row = { id: `${user.uid}_${platformId}`, uid: user.uid, platform: platformId, ...data };
        if (user.uid !== "demo_v2") await supabase.from("ai_insights").upsert(row);
        setInsight(row);
      }
    } catch {}
    finally { setAiLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 size={22} className="animate-spin text-brand" /></div>;

  const isConnected = !!(connection?.access_token) || user.uid === "demo_v2";
  const trendData   = metric ? genTrend(metric.followers, "Followers") : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-6 border shadow-sm" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border" style={{ background:`${platform.color}12`, borderColor:`${platform.color}25` }}>
              {getPlatformEmoji(platformId)}
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold" style={{ color:"var(--text)" }}>{platform.name}</h1>
              <p className="text-sm" style={{ color:"var(--muted)" }}>{platform.description}</p>
              <div className="flex items-center gap-2 mt-1">
                {isConnected && metric
                  ? <><Wifi size={11} className="text-green-500"/><span className="text-xs text-green-600 font-medium">Live · {new Date(metric.synced_at).toLocaleDateString()}</span></>
                  : <><WifiOff size={11} style={{ color:"var(--muted)" }}/><span className="text-xs font-medium" style={{ color:"var(--muted)" }}>Connect in Settings</span></>
                }
              </div>
            </div>
          </div>
          <button onClick={syncPlatform} disabled={syncing || !isConnected}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:opacity-90 transition-all disabled:opacity-50">
            {syncing ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        </div>
        {syncError && (
          <div className="mt-3 flex items-start gap-2 text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-xl px-3 py-2.5">
            <AlertCircle size={13} className="shrink-0 mt-0.5"/> {syncError}
          </div>
        )}
      </div>

      {metric ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"Followers",       value:fmtNum(metric.followers),             Icon:Users,      color:platform.color },
              { label:"Total Reach",     value:fmtNum(metric.reach),                 Icon:Eye,        color:"#0891b2"      },
              { label:"Engagement Rate", value:`${metric.engagement_rate.toFixed(2)}%`, Icon:TrendingUp, color:"#059669"   },
              { label:"Total Likes",     value:fmtNum(metric.likes),                 Icon:Heart,      color:"#dc2626"      },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="rounded-2xl p-5 border shadow-sm" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color:"var(--muted)" }}>{label}</p>
                  <div className="p-2 rounded-xl" style={{ background:`${color}15`, color }}><Icon size={14}/></div>
                </div>
                <p className="text-xl font-mono font-semibold" style={{ color:"var(--text)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Secondary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[["Impressions",fmtNum(metric.impressions)],["Posts",fmtNum(metric.posts)],["Comments",fmtNum(metric.comments)],["Shares",fmtNum(metric.shares)]].map(([l,v]) => (
              <div key={l} className="rounded-xl p-4 border" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color:"var(--muted)" }}>{l}</p>
                <p className="text-lg font-mono font-semibold" style={{ color:"var(--text)" }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Trend chart */}
          <div className="rounded-2xl p-5 border shadow-sm" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
            <h4 className="text-sm font-medium mb-4" style={{ color:"var(--text)" }}>Follower trend (7 days)</h4>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top:5, right:5, left:-30, bottom:0 }}>
                  <defs><linearGradient id={`g_${platformId}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={platform.color} stopOpacity={0.2}/><stop offset="95%" stopColor={platform.color} stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="day" stroke="var(--muted)" fontSize={10}/>
                  <YAxis stroke="var(--muted)" fontSize={10}/>
                  <Tooltip contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"8px", color:"var(--text)", fontSize:"12px" }}/>
                  <Area type="monotone" dataKey="Followers" stroke={platform.color} strokeWidth={2} fill={`url(#g_${platformId})`}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI + Top Posts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AIInsights insight={insight} loading={aiLoading} onRefresh={() => generateInsights()}/>
            <TopPosts posts={posts} platformId={platformId} title={`Top ${platform.name} posts`}/>
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-10 border text-center" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
          <div className="text-5xl mb-4">{getPlatformEmoji(platformId)}</div>
          <h3 className="font-display text-lg font-semibold mb-2" style={{ color:"var(--text)" }}>No {platform.name} data yet</h3>
          <p className="text-sm mb-4 max-w-xs mx-auto" style={{ color:"var(--muted)" }}>Add your credentials in Settings, then click Sync to pull live data, top posts, and AI insights.</p>
          <div className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl border" style={{ borderColor:"var(--border)", color:"var(--muted)" }}>
            <WifiOff size={12}/> Settings → connect → sync here
          </div>
        </div>
      )}
    </div>
  );
}
