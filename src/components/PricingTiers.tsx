import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "../lib/supabase";
import { PlanTier } from "../types";
import { Check, Zap, TrendingUp, Crown, Loader2 } from "lucide-react";

const PLANS = [
  { id: "starter" as PlanTier, name: "Starter", price: "$0",  tagline: "Build in public. Ship fast.",       Icon: Zap,        color: "#7c6af7", features: ["10 scheduled posts / month","1 connected ad account","Performance dashboard","AI hashtag suggestions","Community support"],                                                          cta: "Get started free"    },
  { id: "growth"  as PlanTier, name: "Growth",  price: "$29", tagline: "For teams finding traction.",        Icon: TrendingUp, color: "#00e5c8", features: ["100 scheduled posts / month","3 connected ad accounts","AI campaign optimiser","ROAS recommendations","CSV export","Email support"],                                                   cta: "Start 14-day trial"  },
  { id: "pro"     as PlanTier, name: "Pro",      price: "$79", tagline: "Maximum velocity. Zero limits.",    Icon: Crown,      color: "#ff6b9d", features: ["Unlimited scheduled posts","Unlimited ad accounts","Priority AI analysis","Custom ROAS goals","Webhook integrations","Dedicated Slack support","White-label reports"],                  cta: "Go Pro"              },
];

export function PricingTiers({ user }: { user: AppUser }) {
  const [plan, setPlan]         = useState<PlanTier>("starter");
  const [billing, setBilling]   = useState<"monthly"|"yearly">("monthly");
  const [loading, setLoading]   = useState(true);
  const [upgrading, setUpgrading] = useState<PlanTier | null>(null);

  useEffect(() => {
    supabase.from("users").select("plan,billing_cycle").eq("id", user.uid).single()
      .then(({ data }) => { if (data) { setPlan(data.plan as PlanTier); setBilling(data.billing_cycle as "monthly"|"yearly"); } })
      .catch(async () => { await supabase.from("users").upsert({ id: user.uid, uid: user.uid, plan: "starter", billing_cycle: "monthly", updated_at: new Date().toISOString(), posts_created_this_month: 0 }); })
      .finally(() => setLoading(false));
  }, [user.uid]);

  const handleSelect = async (p: PlanTier) => {
    if (p === plan) return;
    setUpgrading(p);
    await new Promise((r) => setTimeout(r, 700));
    await supabase.from("users").upsert({ id: user.uid, uid: user.uid, plan: p, billing_cycle: billing, updated_at: new Date().toISOString() });
    setPlan(p);
    setUpgrading(null);
  };

  const dp = (price: string) => price === "$0" ? price : `$${Math.round(parseInt(price.replace("$","")) * 0.8)}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="font-display text-2xl font-semibold text-white tracking-tight mb-2">Simple, honest pricing</h2>
        <p className="text-sm text-velox-muted mb-6">Start free. Upgrade when you need more.</p>
        <div className="inline-flex items-center bg-velox-surface border border-velox-border rounded-xl p-1 gap-1">
          {(["monthly","yearly"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${billing === b ? "bg-velox-primary/20 text-velox-primary" : "text-velox-muted hover:text-velox-text"}`}>
              <span className="capitalize">{b}</span>
              {b === "yearly" && <span className="text-[10px] bg-velox-accent/10 text-velox-accent border border-velox-accent/20 px-1.5 py-0.5 rounded-full">−20%</span>}
            </button>
          ))}
        </div>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-velox-muted"/></div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{PLANS.map((p) => {
          const active = p.id === plan;
          const price  = billing === "yearly" ? dp(p.price) : p.price;
          return (
            <div key={p.id} className={`rounded-2xl p-6 border flex flex-col transition-all ${active ? "border-velox-primary/40 bg-velox-primary/5" : "border-velox-border bg-velox-card hover:border-velox-primary/20"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: `${p.color}15`, borderColor: `${p.color}30` }}><p.Icon size={16} style={{ color: p.color }} /></div>
                  <span className="font-display font-semibold text-white text-sm">{p.name}</span>
                </div>
                {active && <span className="text-[10px] font-semibold text-velox-primary bg-velox-primary/10 border border-velox-primary/20 px-2 py-0.5 rounded-full">Current</span>}
              </div>
              <p className="text-xs text-velox-muted mb-4">{p.tagline}</p>
              <div className="flex items-baseline gap-1 mb-5"><span className="font-display text-3xl font-semibold text-white">{price}</span><span className="text-xs text-velox-muted">/ month</span>{billing==="yearly"&&p.price!=="$0"&&<span className="text-xs text-velox-muted line-through ml-1">{p.price}</span>}</div>
              <ul className="space-y-2.5 mb-6 flex-1">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-xs text-velox-muted"><Check size={12} className="mt-0.5 shrink-0" style={{ color: p.color }}/>{f}</li>)}</ul>
              <button onClick={() => handleSelect(p.id)} disabled={active||upgrading===p.id}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${active ? "bg-velox-primary/10 border border-velox-primary/20 text-velox-primary cursor-default" : "text-white border border-transparent hover:opacity-90"}`}
                style={!active ? { background: p.color } : undefined}>
                {upgrading===p.id ? <Loader2 size={13} className="animate-spin"/> : active ? "Current plan" : p.cta}
              </button>
            </div>
          );
        })}</div>
      )}
      <p className="text-center text-xs text-velox-muted">All plans include SSL, 99.9% uptime, and GDPR-compliant data handling. Cancel anytime.</p>
    </div>
  );
}
