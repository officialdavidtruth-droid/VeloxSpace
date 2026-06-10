import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "../lib/supabase";
import { SocialMetrics } from "../types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Percent, DollarSign, MousePointerClick, RefreshCw, Layers } from "lucide-react";

const SEEDS: Omit<SocialMetrics, "uid">[] = [
  { id: "m_1",  platform: "meta",   campaign_name: "Ecomm Lookalikes Q2",      status: "active", spend: 1450.5, clicks: 12020, impressions: 480000, conversions: 840,  revenue: 4350, ctr: 2.5,  roas: 3.0,  timestamp: new Date(Date.now()-3.6e7).toISOString() },
  { id: "g_1",  platform: "google", campaign_name: "High Intent Search – Core", status: "active", spend: 2100,  clicks: 8600,  impressions: 120000, conversions: 1120, revenue: 7200, ctr: 7.16, roas: 3.42, timestamp: new Date(Date.now()-7.2e7).toISOString() },
  { id: "t_1",  platform: "tiktok", campaign_name: "Viral Creative UGC",        status: "active", spend: 920,   clicks: 18400, impressions: 980000, conversions: 550,  revenue: 3100, ctr: 1.87, roas: 3.37, timestamp: new Date(Date.now()-1.08e8).toISOString() },
  { id: "m_2",  platform: "meta",   campaign_name: "Retargeting – Dynamic Ads", status: "active", spend: 780,   clicks: 6150,  impressions: 110000, conversions: 490,  revenue: 2950, ctr: 5.59, roas: 3.78, timestamp: new Date(Date.now()-1.44e8).toISOString() },
];

const PC = { meta: "#7c6af7", google: "#00e5c8", tiktok: "#ff6b9d" };
const f$ = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PerformanceDashboard({ user }: { user: AppUser }) {
  const [metrics, setMetrics]   = useState<SocialMetrics[]>([]);
  const [filter, setFilter]     = useState<"all"|"meta"|"google"|"tiktok">("all");
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async (forceSync = false) => {
    setRefreshing(true);
    try {
      const { data } = await supabase.from("analytics").select("*").eq("uid", user.uid);
      if (!data?.length || forceSync) {
        const rows = SEEDS.map(({ id, ...rest }) => ({ ...rest, id: `${user.uid}_${id}`, uid: user.uid }));
        await supabase.from("analytics").upsert(rows);
        setMetrics(rows);
      } else {
        setMetrics(data as SocialMetrics[]);
      }
    } catch { setMetrics(SEEDS.map(({ id, ...rest }) => ({ ...rest, id: `${user.uid}_${id}`, uid: user.uid }))); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = metrics.filter((m) => filter === "all" || m.platform === filter);
  const spend  = filtered.reduce((s, m) => s + +m.spend, 0);
  const rev    = filtered.reduce((s, m) => s + +m.revenue, 0);
  const conv   = filtered.reduce((s, m) => s + m.conversions, 0);
  const impr   = filtered.reduce((s, m) => s + m.impressions, 0);
  const clicks = filtered.reduce((s, m) => s + m.clicks, 0);
  const roas   = spend > 0 ? rev / spend : 0;
  const ctr    = impr  > 0 ? (clicks / impr) * 100 : 0;

  const chart = filtered.map((m) => ({
    name: m.campaign_name.length > 16 ? m.campaign_name.slice(0, 16) + "…" : m.campaign_name,
    "Spend ($)":   +m.spend,
    "Revenue ($)": +m.revenue,
  }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-velox-primary border-t-transparent animate-spin" />
      <span className="text-xs text-velox-muted font-mono">Syncing campaign data…</span>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white tracking-tight mb-1">Campaign metrics</h2>
          <p className="text-xs text-velox-muted">Aggregated from your connected Meta, Google, and TikTok ad accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 gap-1 bg-velox-surface border border-velox-border rounded-xl">
            {(["all","meta","google","tiktok"] as const).map((p) => (
              <button key={p} onClick={() => setFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filter === p ? "bg-velox-primary/20 text-velox-primary" : "text-velox-muted hover:text-velox-text"}`}>
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
          <button onClick={() => fetch(true)} disabled={refreshing}
            className="p-2 bg-velox-surface border border-velox-border hover:border-velox-primary/30 text-velox-muted hover:text-velox-text rounded-xl transition-all disabled:opacity-40">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ad Spend",    value: `$${f$(spend)}`,          Icon: DollarSign,        color: "#7c6af7" },
          { label: "Avg ROAS",    value: `${roas.toFixed(2)}x`,    Icon: TrendingUp,        color: "#00e5c8" },
          { label: "CTR",         value: `${ctr.toFixed(2)}%`,     Icon: Percent,           color: "#ff6b9d" },
          { label: "Conversions", value: conv.toLocaleString(),     Icon: MousePointerClick, color: "#f59e0b" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-velox-card border border-velox-border rounded-2xl p-5 flex items-center justify-between hover:border-velox-primary/30 transition-all">
            <div>
              <p className="text-xs text-velox-muted font-medium uppercase tracking-wider mb-2">{label}</p>
              <p className="text-xl font-mono font-semibold text-white">{value}</p>
            </div>
            <div className="p-2.5 rounded-xl border" style={{ background: `${color}15`, borderColor: `${color}30`, color }}>
              <Icon size={18} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-velox-card border border-velox-border rounded-2xl p-5">
          <h4 className="text-sm font-medium text-velox-text mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-velox-primary animate-pulse" /> Spend vs revenue
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c6af7" stopOpacity={0.25}/><stop offset="95%" stopColor="#7c6af7" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e5c8" stopOpacity={0.25}/><stop offset="95%" stopColor="#00e5c8" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2240" />
                <XAxis dataKey="name" stroke="#4e5880" fontSize={10} />
                <YAxis stroke="#4e5880" fontSize={10} />
                <Tooltip contentStyle={{ background: "#0c0f1e", border: "1px solid #1e2240", borderRadius: "8px", color: "#c8ceeb", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ color: "#4e5880", fontSize: "11px" }} />
                <Area type="monotone" dataKey="Spend ($)"   stroke="#7c6af7" strokeWidth={2} fill="url(#gS)" />
                <Area type="monotone" dataKey="Revenue ($)" stroke="#00e5c8" strokeWidth={2} fill="url(#gR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-velox-card border border-velox-border rounded-2xl p-5">
          <h4 className="text-sm font-medium text-velox-text mb-4 flex items-center gap-2">
            <Layers size={15} className="text-velox-primary" /> Campaigns
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {filtered.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-velox-surface border border-velox-border rounded-xl hover:border-velox-primary/20 transition-all">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PC[m.platform] }} />
                    <span className="text-xs font-medium text-velox-text truncate">{m.campaign_name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-velox-muted uppercase">{m.platform}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <span className="text-xs font-mono text-velox-text block">${(+m.spend).toLocaleString()}</span>
                  <span className="text-[10px] font-mono font-semibold" style={{ color: "#00e5c8" }}>{(+m.roas).toFixed(2)}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
