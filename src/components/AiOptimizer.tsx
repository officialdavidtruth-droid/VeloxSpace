import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "../lib/supabase";
import { AiRecommendation, SocialMetrics } from "../types";
import { Sparkles, CheckCircle2, Flame, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

const FALLBACK: Omit<AiRecommendation, "uid">[] = [
  { id: "rec_1", title: "Meta Budget Reallocation",     platform: "meta",   impact: "high",   description: "Shift $500/week from Q2 Lookalikes (2.1x ROAS) to Retargeting Dynamic Ads (3.78x ROAS). Retargeting outperforms acquisition by 80%.",        recommended_action: "Reduce Q2 Lookalikes daily budget by $71, increase Retargeting by $71 in Meta Ads Manager.", projected_roas_lift: 0.65, implemented: false, type: "budget",   category: "ROAS Maximiser"    },
  { id: "rec_2", title: "Google Keyword Expansion",     platform: "google", impact: "high",   description: "High Intent Search converts at 13% with 3.42x ROAS. Add exact-match variants to capture adjacent searches at the same intent level.",             recommended_action: "Add 'AI campaign builder' and 'ad spend optimizer' as exact-match keywords in your ad group.", projected_roas_lift: 0.45, implemented: false, type: "audience", category: "Bid Optimisation"   },
  { id: "rec_3", title: "TikTok Creative Hook Length",  platform: "tiktok", impact: "medium", description: "UGC Viral CTR is 1.87% vs 5.59% for Meta retargeting. Drop-offs occur during the 5s transition. Shorten to 12s with hook in first 2s.",       recommended_action: "Edit UGC videos to open with the value statement in the first 2 seconds. Target 10–14s total.", projected_roas_lift: 0.28, implemented: false, type: "creative", category: "Creative Insights"  },
];

const PC: Record<string, string> = { meta: "#7c6af7", google: "#00e5c8", tiktok: "#ff6b9d", all: "#f59e0b" };

export function AiOptimizer({ user }: { user: AppUser }) {
  const [recs, setRecs]         = useState<AiRecommendation[]>([]);
  const [loading, setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]       = useState("");

  const fetchRecs = async (reset = false) => {
    const { data } = await supabase.from("recommendations").select("*").eq("uid", user.uid);
    if (!data?.length || reset) {
      const rows = FALLBACK.map((r) => ({ ...r, id: `${user.uid}_${r.id}`, uid: user.uid }));
      await supabase.from("recommendations").upsert(rows);
      setRecs(rows);
    } else {
      setRecs(data as AiRecommendation[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRecs(); }, []);

  const handleImplement = async (id: string) => {
    const rec = recs.find((r) => r.id === id); if (!rec) return;
    const updated = { ...rec, implemented: !rec.implemented };
    setRecs((p) => p.map((r) => r.id === id ? updated : r));
    await supabase.from("recommendations").update({ implemented: updated.implemented }).eq("id", id);
  };

  const runAnalysis = async () => {
    setAnalyzing(true); setError("");
    try {
      const { data: metrics } = await supabase.from("analytics").select("*").eq("uid", user.uid);
      if (!metrics?.length) { await fetchRecs(true); return; }
      const res = await fetch("/api/ai-analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ metrics }) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.recommendations?.length) {
        const rows = data.recommendations.map((r: AiRecommendation) => ({ ...r, id: `${user.uid}_${r.id}`, uid: user.uid }));
        await supabase.from("recommendations").upsert(rows);
        setRecs(rows);
      } else throw new Error();
    } catch { setError("AI analysis incomplete — showing saved recommendations."); await fetchRecs(); }
    finally { setAnalyzing(false); }
  };

  const pendingLift = recs.filter((r) => !r.implemented).reduce((s, r) => s + +r.projected_roas_lift, 0);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-velox-primary border-t-transparent animate-spin" />
      <span className="text-xs text-velox-muted font-mono">Loading recommendations…</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white tracking-tight mb-1">AI optimiser</h2>
          <p className="text-xs text-velox-muted">Powered by Cloudflare Workers AI · analyses your live campaign data</p>
        </div>
        <button onClick={runAnalysis} disabled={analyzing}
          className="flex items-center gap-2 bg-velox-primary hover:bg-velox-primary-dark disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all shrink-0">
          {analyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {analyzing ? "Analysing…" : "Scan & re-optimise"}
        </button>
      </div>
      {error && <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"><AlertCircle size={14} className="shrink-0 mt-0.5" />{error}</div>}
      {pendingLift > 0 && (
        <div className="bg-velox-card border border-velox-primary/20 rounded-2xl p-5 relative overflow-hidden">
          <Flame size={120} className="absolute -right-4 -top-4 opacity-5 text-velox-primary pointer-events-none" />
          <p className="text-[10px] text-velox-primary uppercase tracking-widest font-semibold mb-1 flex items-center gap-1"><Flame size={11} /> Opportunity detected</p>
          <p className="text-lg font-display font-semibold text-white">Unlock up to <span className="text-velox-accent">+{pendingLift.toFixed(2)}x ROAS lift</span> this cycle</p>
          <p className="text-xs text-velox-muted mt-1">{recs.filter((r) => !r.implemented).length} recommendations pending</p>
        </div>
      )}
      <div className="space-y-4">{recs.map((rec) => {
        const pc = PC[rec.platform] ?? "#7c6af7";
        return (
          <div key={rec.id} className={`bg-velox-card border rounded-2xl p-5 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${rec.implemented ? "border-velox-border opacity-50" : "border-velox-border hover:border-velox-primary/20"}`}>
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border bg-velox-surface" style={{ color: pc, borderColor: `${pc}30` }}>{rec.platform}</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border bg-velox-surface border-velox-border text-velox-muted">{rec.category}</span>
                <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded ${rec.impact === "high" ? "bg-velox-pink/10 border border-velox-pink/20 text-velox-pink" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"}`}>{rec.impact} impact</span>
              </div>
              <h4 className="text-sm font-semibold text-white">{rec.title}</h4>
              <p className="text-xs text-velox-muted leading-relaxed">{rec.description}</p>
              <div className="inline-flex items-start gap-1.5 text-xs text-velox-primary/80 bg-velox-primary/5 border border-velox-primary/10 px-3 py-2 rounded-lg">
                <CheckCircle2 size={12} className="shrink-0 mt-0.5" /><span><strong className="text-velox-primary">Action:</strong> {rec.recommended_action}</span>
              </div>
            </div>
            <div className="flex md:flex-col items-center md:items-end gap-4 shrink-0">
              <div className="text-right"><span className="text-[10px] text-velox-muted uppercase block">Projected lift</span><span className="text-sm font-mono font-bold text-velox-accent">+{(+rec.projected_roas_lift).toFixed(2)}x</span></div>
              <button onClick={() => handleImplement(rec.id)}
                className={`text-xs font-semibold py-2 px-3.5 rounded-xl transition-all ${rec.implemented ? "bg-velox-surface border border-velox-border text-velox-muted hover:text-velox-text" : "bg-velox-primary hover:bg-velox-primary-dark text-white"}`}>
                {rec.implemented ? "Revert" : "Implement"}
              </button>
            </div>
          </div>
        );
      })}</div>
      <div className="flex items-start gap-3 bg-velox-surface border border-velox-border rounded-xl p-4">
        <ShieldCheck size={18} className="text-velox-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-velox-muted leading-relaxed"><span className="text-velox-text font-medium">Live AI analysis</span> — connect your ad platform credentials in Settings, then hit Scan to get recommendations based on your real campaign numbers.</p>
      </div>
    </div>
  );
}
