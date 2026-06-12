import React from "react";
import type { PlatformPost, PlatformId } from "../types";
import { getPlatform } from "../lib/platforms";
import { ExternalLink, Heart, MessageCircle, Share2, Eye, TrendingUp } from "lucide-react";

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}k`;
  return n.toString();
}
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days/7)}w ago`;
  return `${Math.floor(days/30)}mo ago`;
}
const getPlatformEmoji = (id: string) =>
  ({ instagram:"📸",facebook:"👥",linkedin:"💼",twitter:"🐦",tiktok:"🎵",youtube:"▶️" }[id] ?? "📊");

interface Props {
  posts: PlatformPost[];
  platformId?: PlatformId;
  title?: string;
}

export function TopPosts({ posts, platformId, title = "Top performing posts" }: Props) {
  if (!posts.length) {
    return (
      <div className="glow-card rounded-2xl p-8 text-center">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No post data yet — sync your platform to see your top performing content
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
          <div className="p-1.5 rounded-lg" style={{ background: "var(--primary-soft)" }}>
            <TrendingUp size={14} style={{ color: "var(--primary)" }} />
          </div>
          {title}
        </h3>
        <span className="pill pill-neutral">Sorted by engagement</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.slice(0, 6).map((post, index) => {
          const platform = platformId ? getPlatform(platformId) : getPlatform(post.platform as PlatformId);
          const isTopPost = index === 0;

          return (
            <div key={post.id ?? post.post_id}
              className="glow-card rounded-2xl overflow-hidden group"
              style={isTopPost ? { borderColor: platform.color, boxShadow: `var(--shadow-glow)` } : {}}>

              <div className="relative h-36 overflow-hidden" style={{ background: `${platform.color}12` }}>
                {post.thumbnail_url || post.media_url ? (
                  <img src={post.thumbnail_url || post.media_url}
                    alt={post.caption.slice(0, 40)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    {getPlatformEmoji(post.platform as PlatformId)}
                  </div>
                )}

                <div className="absolute top-2 left-2 flex gap-1.5">
                  {isTopPost && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: platform.color }}>
                      🏆 TOP POST
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
                    {post.engagement_rate.toFixed(1)}% ER
                  </span>
                </div>

                <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "rgba(0,0,0,0.55)" }}>
                  {getPlatformEmoji(post.platform as PlatformId)}
                </div>
              </div>

              <div className="p-4">
                {post.caption && (
                  <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--text)" }}>{post.caption}</p>
                )}

                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { Icon: Heart,         value: fmtNum(post.likes),               label: "Likes"    },
                    { Icon: MessageCircle, value: fmtNum(post.comments),            label: "Comments" },
                    { Icon: Share2,        value: fmtNum(post.shares),              label: "Shares"   },
                    { Icon: Eye,           value: fmtNum(post.reach || post.views), label: "Reach"    },
                  ].filter(({ value }) => value !== "0").slice(0, 4).map(({ Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon size={11} style={{ color: "var(--muted)" }} />
                      <span className="text-xs font-mono font-medium tabular-nums" style={{ color: "var(--text)" }}>{value}</span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>{post.posted_at ? timeAgo(post.posted_at) : ""}</span>
                  {post.post_url && (
                    <a href={post.post_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:opacity-80" style={{ color: platform.color }}>
                      View post <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}