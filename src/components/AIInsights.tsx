import React, { useState } from "react";
import type { AIInsight } from "../types";
import { Sparkles, TrendingUp, TrendingDown, Clock, Loader2, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";

const PRIORITY_COLOR: Record<string, string> = { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" };
const PRIORITY_BG:    Record<string, string> = { high: "var(--danger-bg)", medium: "var(--warning-bg)", low: "var(--success-bg)" };

interface Props {
  insight: AIInsight | null;
  loading: boolean;
  onRefresh: () => void;
}

export function AIInsights({ insight, loading, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<number | null>(0);

  if (loading) {
    return (
      <div className="glow-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>AI Marketing Analysis</h3>
        </div>
        <div className="flex items-center gap-3 py-6">
          <Loader2 size={16} className="animate-spin" style={{ color: "var(--primary)" }} />
          <span className="text-sm" style={{ color: "var(--muted)" }}>Analysing your data with Cloudflare AI…</span>
        </div>
      </div>
    );
  }

  if (!insight || insight.overall_score === 0) {
    return (
      <div className="glow-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>AI Marketing Analysis</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Sync at least one platform to get AI-powered analysis of what's working, what's not, and exactly what to do next.
        </p>
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 gradient-primary">
          <Sparkles size={13} /> Generate analysis
        </button>
      </div>
    );
  }

  const scoreColor = insight.overall_score >= 7 ? "var(--success)" : insight.overall_score >= 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="glow-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-md">
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-semibold" style={{ color: "var(--text)" }}>AI Marketing Analysis</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Cloudflare AI · {new Date(insight.generated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-mono font-bold tabular-nums" style={{ color: scoreColor }}>
              {insight.overall_score.toFixed(1)}
            </div>
            <div className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--muted)" }}>Score / 10</div>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-xl" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{insight.key_insight}</p>
        </div>
      </div>

      {/* Working / Not Working */}
      {(insight.working?.length > 0 || insight.not_working?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: "var(--border)" }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg pill-success"><TrendingUp size={13} /></div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--success)" }}>What's working</span>
            </div>
            <ul className="space-y-2.5">
              {insight.working.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: "var(--success)" }} />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg pill-danger"><TrendingDown size={13} /></div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--danger)" }}>Needs attention</span>
            </div>
            <ul className="space-y-2.5">
              {insight.not_working.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
                  <XCircle size={14} className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }} />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {insight.recommendations.map((rec, i) => {
          const isOpen = expanded === i;
          return (
            <div key={i}>
              <button className="w-full flex items-center justify-between p-4 text-left transition-colors hover:opacity-90"
                onClick={() => setExpanded(isOpen ? null : i)}>
                <div className="flex items-start gap-3">
                  <span className="pill shrink-0 mt-0.5" style={{ background: PRIORITY_BG[rec.priority], color: PRIORITY_COLOR[rec.priority] }}>
                    {rec.priority}
                  </span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{rec.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {rec.platform === "all" ? "All platforms" : rec.platform.charAt(0).toUpperCase() + rec.platform.slice(1)}
                    </p>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={14} style={{ color: "var(--muted)" }} className="shrink-0" /> : <ChevronDown size={14} style={{ color: "var(--muted)" }} className="shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4">
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-soft)" }}>{rec.description}</p>
                  <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{ background: PRIORITY_BG[rec.priority], color: PRIORITY_COLOR[rec.priority] }}>
                    <TrendingUp size={12} className="shrink-0 mt-0.5" />
                    <span><strong>This week:</strong> {rec.action}</span>
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
            <Clock size={13} style={{ color: "var(--primary)" }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Best times to post</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(insight.best_times).map(([platform, time]) => (
              <div key={platform} className="pill pill-neutral">
                <span>{getPlatformEmoji(platform)}</span><span>{time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={onRefresh}
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all hover:opacity-80"
          style={{ color: "var(--primary)", background: "var(--primary-soft)" }}>
          <Sparkles size={12} /> Regenerate analysis
        </button>
      </div>
    </div>
  );
}

function getPlatformEmoji(id: string): string {
  const m: Record<string, string> = { instagram:"📸",facebook:"👥",linkedin:"💼",twitter:"🐦",tiktok:"🎵",youtube:"▶️",all:"🌐" };
  return m[id] ?? "📊";
}