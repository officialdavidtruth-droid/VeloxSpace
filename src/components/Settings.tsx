import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PLATFORMS } from "../lib/platforms";
import { CURRENCIES } from "../lib/currency";
import { useTheme } from "../lib/theme";
import type { AppUser } from "../lib/supabase";
import type { PlatformConnection } from "../types";
import { Save, CheckCircle2, Loader2, Eye, EyeOff, ExternalLink, Sun, Moon, Wifi, WifiOff } from "lucide-react";

const PLATFORM_DOCS: Record<string, { guide: string; url: string }> = {
  instagram: { guide: "Get your Access Token from Meta for Developers → Your App → Marketing API. Use the Graph API Explorer to get a User Token, then convert to a Page Token with pages_read_engagement permission.", url: "https://developers.facebook.com/docs/instagram-api" },
  facebook:  { guide: "Create a Facebook App at developers.facebook.com. Get a Page Access Token with pages_read_engagement and read_insights permissions from the Graph API Explorer.", url: "https://developers.facebook.com/docs/pages" },
  linkedin:  { guide: "Create an app at linkedin.com/developers. Enable the Marketing Developer Platform product. Use OAuth 2.0 to get an access token with r_organization_social permission.", url: "https://learn.microsoft.com/en-us/linkedin/marketing/" },
  twitter:   { guide: "Create an app at developer.twitter.com. Get a Bearer Token from App Keys & Tokens. Note: Full analytics requires the Basic plan ($100/month) on the Twitter API v2.", url: "https://developer.twitter.com/en/docs/twitter-api" },
  tiktok:    { guide: "Create an app at business-api.tiktok.com. Enable the Research API or Marketing API. Your Advertiser ID is in TikTok Ads Manager under Account Info.", url: "https://business-api.tiktok.com/portal/docs" },
  youtube:   { guide: "Enable the YouTube Data API v3 in Google Cloud Console. Create OAuth 2.0 credentials. Use the OAuth Playground to get an access token with youtube.readonly scope.", url: "https://developers.google.com/youtube/v3" },
};

export function Settings({ user }: { user: AppUser }) {
  const { isDark, toggle } = useTheme();
  const [connections, setConnections] = useState<Record<string, PlatformConnection>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved,  setSaved]  = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [currency, setCurrency] = useState("USD");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (user.uid === "demo_v2") return;
    supabase.from("platform_connections").select("*").eq("uid", user.uid)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, PlatformConnection> = {};
        data.forEach((c: PlatformConnection) => { map[c.platform] = c; });
        setConnections(map);
      });
  }, [user.uid]);

  const saveConnection = async (platformId: string) => {
    const conn = connections[platformId];
    if (!conn) return;
    setSaving(platformId);
    try {
      if (user.uid !== "demo_v2") {
        await supabase.from("platform_connections").upsert({
          ...conn, uid: user.uid, platform: platformId,
          connected: !!(conn.account_id && conn.access_token),
        });
      }
      setSaved(platformId);
      setTimeout(() => setSaved(null), 2500);
    } catch (e) { console.error(e); }
    finally { setSaving(null); }
  };

  const updateConn = (platform: string, field: string, value: string) => {
    setConnections((prev) => ({
      ...prev,
      [platform]: { ...prev[platform] ?? { id: "", uid: user.uid, platform, account_id: "", account_name: "", access_token: "", connected: false, last_synced_at: null }, [field]: value },
    }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1" style={{ color: "var(--text)" }}>Settings</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Connect your social media accounts and manage preferences</p>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-5 border shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h2 className="font-display text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Theme</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Switch between light and dark mode</p>
          </div>
          <button onClick={toggle}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
            style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            {isDark ? "Switch to Light" : "Switch to Dark"}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Default currency</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Used across all financial metrics</p>
          </div>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}
            className="text-sm rounded-xl px-3 py-2 border outline-none cursor-pointer"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Platform connections */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-display text-sm font-semibold" style={{ color: "var(--text)" }}>Platform Connections</h2>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Connect your accounts to enable automatic metric sync</p>
        </div>

        {PLATFORMS.map((platform) => {
          const conn = connections[platform.id];
          const isConnected = conn?.connected ?? false;
          const isExpanded  = expanded === platform.id;
          const docs = PLATFORM_DOCS[platform.id];

          return (
            <div key={platform.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
              <button className="w-full flex items-center justify-between p-4 text-left hover:opacity-80 transition-all"
                onClick={() => setExpanded(isExpanded ? null : platform.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${platform.color}15` }}>
                    {getPlatformEmoji(platform.id)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{platform.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {isConnected
                        ? <><Wifi size={10} className="text-green-500" /><span className="text-xs text-green-600 font-medium">Connected</span></>
                        : <><WifiOff size={10} style={{ color: "var(--muted)" }} /><span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Not connected</span></>
                      }
                    </div>
                  </div>
                </div>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{isExpanded ? "Close" : "Configure →"}</span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="pt-4 space-y-4">
                    {/* Guide */}
                    <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: "var(--surface)", color: "var(--muted)" }}>
                      <strong style={{ color: "var(--text)" }}>How to get credentials: </strong>{docs.guide}
                      <a href={docs.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-2 text-brand font-medium">
                        <ExternalLink size={11} /> View {platform.name} API docs
                      </a>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Account / Page ID</label>
                        <input type="text" value={conn?.account_id ?? ""}
                          onChange={(e) => updateConn(platform.id, "account_id", e.target.value)}
                          placeholder="e.g. act_123456789"
                          className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none font-mono"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Account name (optional)</label>
                        <input type="text" value={conn?.account_name ?? ""}
                          onChange={(e) => updateConn(platform.id, "account_name", e.target.value)}
                          placeholder="e.g. My Business Page"
                          className="w-full text-sm rounded-xl px-3 py-2.5 border outline-none"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Access Token</label>
                      <div className="relative">
                        <input
                          type={revealed[platform.id] ? "text" : "password"}
                          value={conn?.access_token ?? ""}
                          onChange={(e) => updateConn(platform.id, "access_token", e.target.value)}
                          placeholder="Paste your access token here"
                          className="w-full text-sm rounded-xl px-3 py-2.5 pr-10 border outline-none font-mono"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }} />
                        <button onClick={() => setRevealed((p) => ({ ...p, [platform.id]: !p[platform.id] }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "var(--muted)" }}>
                          {revealed[platform.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <button onClick={() => saveConnection(platform.id)} disabled={saving === platform.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand hover:opacity-90 transition-all disabled:opacity-50">
                      {saving === platform.id ? <Loader2 size={13} className="animate-spin" /> : saved === platform.id ? <CheckCircle2 size={13} /> : <Save size={13} />}
                      {saving === platform.id ? "Saving…" : saved === platform.id ? "Saved!" : "Save connection"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getPlatformEmoji(id: string): string {
  const m: Record<string, string> = { instagram:"📸",facebook:"👥",linkedin:"💼",twitter:"🐦",tiktok:"🎵",youtube:"▶️" };
  return m[id] ?? "📊";
}
