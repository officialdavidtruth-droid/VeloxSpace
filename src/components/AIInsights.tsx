import React, { useState } from "react";
import type { AIInsight } from "../types";
import { Sparkles, TrendingUp, Clock, Loader2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

const PRIORITY_COLORS = { high: "#dc2626", medium: "#d97706", low: "#059669" };
const PRIORITY_BG     = { high: "#fef2f2", medium: "#fffbeb", low: "#f0fdf4" };
const PRIORITY_BG_DARK= { high: "#1a0000", medium: "#1a0e00", low: "#001a00" };

interface Props {
  insight: AIInsight | null;
  loading: boolean;
  onRefresh: () => void;
  isDark?: boolean;
}

export function AIInsights({ insight, loading, onRefresh, isDark = false }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (loading) {
    return (
      <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>AI Insights</h3>
        </div>
        <div className="flex items-center gap-3 py-4">
          <Loader2 size={16} className="animate-spin text-brand" />
          <span className="text-sm" style={{ color: "var(--muted)" }}>Analysing your data with Cloudflare AI…</span>
        </div>
      </div>
    );
  }

  if (!insight || insight.overall_score === 0) {
    return (
      <div className="rounded-2xl border p-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>AI Insights</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Sync at least one platform to get AI-powered recommendations for your content strategy.
        </p>
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand hover:opacity-90 transition-all">
          <Sparkles size={13} /> Generate insights
        </button>
      </div>
    );
  }

  const scoreColor = insight.overall_score >= 7 ? "#059669" : insight.overall_score >= 5 ? "#d97706" : "#dc2626";

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>AI Insights</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Powered by Cloudflare Workers AI · {new Date(insight.generated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-mono font-bold" style={{ color: scoreColor }}>
              {insight.overall_score.toFixed(1)}
            </div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--muted)" }}>/ 10</div>
          </div>
        </div>

        {/* Key insight */}
        <div className="mt-4 p-3 rounded-xl" style={{ background: "var(--surface)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{insight.key_insight}</p>
        </div>

        {insight.content_insight && (
          <p className="text-xs mt-2 italic" style={{ color: "var(--muted)" }}>{insight.content_insight}</p>
        )}
      </div>

      {/* Recommendations */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {insight.recommendations.map((rec, i) => {
          const isOpen   = expanded === i;
          const pc       = PRIORITY_COLORS[rec.priority];
          const bg       = isDark ? PRIORITY_BG_DARK[rec.priority] : PRIORITY_BG[rec.priority];

          return (
            <div key={i}>
              <button className="w-full flex items-center justify-between p-4 text-left hover:opacity-80 transition-all"
                onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="flex items-start gap-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 uppercase"
                    style={{ background: bg, color: pc }}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{rec.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {rec.platform === "all" ? "All platforms" : rec.platform.charAt(0).toUpperCase() + rec.platform.slice(1)}
                    </p>
                  </div>
                </div>
                {isOpen
                  ? <ChevronUp size={14} style={{ color: "var(--muted)" }} className="shrink-0" />
                  : <ChevronDown size={14} style={{ color: "var(--muted)" }} className="shrink-0" />
                }
              </button>

              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text)" }}>{rec.description}</p>
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                    style={{ background: bg, color: pc }}>
                    <TrendingUp size={12} className="shrink-0 mt-0.5" />
                    <span><strong>Action this week:</strong> {rec.action}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Best posting times */}
      {Object.keys(insight.best_times ?? {}).length > 0 && (
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-brand" />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Best times to post</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(insight.best_times).map(([platform, time]) => (
              <div key={platform} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <span className="text-xs">{getPlatformEmoji(platform)}</span>
                <span className="text-xs font-medium" style={{ color: "var(--text)" }}>{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-xl transition-all hover:opacity-80"
          style={{ color: "var(--muted)", background: "var(--surface)" }}>
          <Sparkles size={12} /> Regenerate insights
        </button>
      </div>
    </div>
  );
}

function getPlatformEmoji(id: string): string {
  const m: Record<string, string> = { instagram:"📸",facebook:"👥",linkedin:"💼",twitter:"🐦",tiktok:"🎵",youtube:"▶️",all:"🌐" };
  return m[id] ?? "📊";
}