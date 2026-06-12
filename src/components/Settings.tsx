import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { CURRENCIES } from "../lib/currency";
import { useTheme } from "../lib/theme";
import type { AppUser } from "../lib/supabase";
import type { PlatformConnection } from "../types";
import { Sun, Moon, Wifi, WifiOff, ExternalLink, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, LogOut } from "lucide-react";

const SITE_URL     = import.meta.env.VITE_SITE_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
const REDIRECT_URI = `${SITE_URL}/api/oauth-callback`;

interface OAuthGroup {
  key: string; label: string; emoji: string; covers: string[];
  color: string; guide: string; setupUrl: string; envVars: string[];
  buildUrl: (uid: string) => string | null;
}

const OAUTH_GROUPS: OAuthGroup[] = [
  {
    key: "meta", label: "Meta", emoji: "📘", covers: ["instagram","facebook"], color: "#1877F2",
    guide: "1. developers.facebook.com → Create App → Business type\n2. Add products: Instagram Graph API + Marketing API\n3. Settings → Basic → copy App ID & App Secret\n4. Add Valid OAuth Redirect URI (see box above)\n5. Permissions used: pages_show_list, pages_read_engagement, business_management, ads_read",
    setupUrl: "https://developers.facebook.com/apps", envVars: ["VITE_META_APP_ID","META_APP_SECRET"],
    buildUrl: (uid) => {
      const id = import.meta.env.VITE_META_APP_ID; if (!id) return null;
      return `https://www.facebook.com/v18.0/dialog/oauth?` + new URLSearchParams({ client_id:id, redirect_uri:REDIRECT_URI, scope:"pages_show_list,pages_read_engagement,business_management,ads_read", state:`meta__${uid}`, response_type:"code" });
    },
  },
  {
    key: "google", label: "Google", emoji: "🔍", covers: ["youtube","google_ads"], color: "#4285F4",
    guide: "1. console.cloud.google.com → Create Project\n2. Enable APIs: YouTube Data API v3 + Google Ads API\n3. Credentials → Create OAuth 2.0 Client ID → Web\n4. Add Authorized Redirect URI (see box above)\n5. Copy Client ID & Client Secret\n6. For Ads: apply for developer token at ads.google.com",
    setupUrl: "https://console.cloud.google.com/apis/credentials", envVars: ["VITE_GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET"],
    buildUrl: (uid) => {
      const id = import.meta.env.VITE_GOOGLE_CLIENT_ID; if (!id) return null;
      return `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({ client_id:id, redirect_uri:REDIRECT_URI, scope:"https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/adwords", state:`google__${uid}`, response_type:"code", access_type:"offline", prompt:"consent" });
    },
  },
  {
    key: "tiktok", label: "TikTok", emoji: "🎵", covers: ["tiktok"], color: "#69C9D0",
    guide: "1. business-api.tiktok.com → My Apps → Create App\n2. Add scopes: user.info.basic, video.list\n3. Add Redirect URI (see box above)\n4. Copy App ID (client key) & App Secret",
    setupUrl: "https://business-api.tiktok.com/portal/apps", envVars: ["VITE_TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET"],
    buildUrl: (uid) => {
      const key = import.meta.env.VITE_TIKTOK_CLIENT_KEY; if (!key) return null;
      return `https://www.tiktok.com/v2/auth/authorize?` + new URLSearchParams({ client_key:key, redirect_uri:REDIRECT_URI, scope:"user.info.basic,video.list", state:`tiktok__${uid}`, response_type:"code" });
    },
  },
  {
    key: "linkedin", label: "LinkedIn", emoji: "💼", covers: ["linkedin"], color: "#0A66C2",
    guide: "1. developer.linkedin.com → Create App\n2. Auth tab → add Redirect URL (see box above)\n3. Products tab → request Marketing Developer Platform\n4. Copy Client ID & Client Secret",
    setupUrl: "https://www.linkedin.com/developers/apps", envVars: ["VITE_LINKEDIN_CLIENT_ID","LINKEDIN_CLIENT_SECRET"],
    buildUrl: (uid) => {
      const id = import.meta.env.VITE_LINKEDIN_CLIENT_ID; if (!id) return null;
      return `https://www.linkedin.com/oauth/v2/authorization?` + new URLSearchParams({ client_id:id, redirect_uri:REDIRECT_URI, scope:"r_organization_social,rw_organization_admin", state:`linkedin__${uid}`, response_type:"code" });
    },
  },
  {
    key: "twitter", label: "X (Twitter)", emoji: "🐦", covers: ["twitter"], color: "#000000",
    guide: "1. developer.twitter.com → Projects & Apps → Create App\n2. User authentication settings → OAuth 2.0 → enable\n3. App permissions: Read | Add Callback URI (see box above)\n4. Copy Client ID & Client Secret\nNote: Full analytics require Basic tier ($100/mo)",
    setupUrl: "https://developer.twitter.com/en/portal/projects-and-apps", envVars: ["VITE_TWITTER_CLIENT_ID","TWITTER_CLIENT_SECRET"],
    buildUrl: (uid) => {
      const id = import.meta.env.VITE_TWITTER_CLIENT_ID; if (!id) return null;
      const v = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,"0")).join("");
      const c = btoa(v).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
      return `https://twitter.com/i/oauth2/authorize?` + new URLSearchParams({ client_id:id, redirect_uri:REDIRECT_URI, scope:"tweet.read users.read offline.access", state:`twitter__${uid}__${btoa(v)}`, response_type:"code", code_challenge:c, code_challenge_method:"plain" });
    },
  },
];

export function Settings({ user }: { user: AppUser }) {
  const { isDark, toggle } = useTheme();
  const [connections, setConnections] = useState<Record<string, PlatformConnection>>({});
  const [currency,    setCurrency]    = useState("USD");
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [oauthMsg,    setOauthMsg]    = useState("");
  const [oauthError,  setOauthError]  = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const connected = p.get("connected"); const err = p.get("oauth_error");
    if (connected) { setOauthMsg(`${connected} connected! Now sync that platform to load your data.`); window.history.replaceState({},"","/"); }
    if (err)       { setOauthError(decodeURIComponent(err)); window.history.replaceState({},"","/"); }
    loadConnections();
  }, []);

  const loadConnections = async () => {
    if (user.uid === "demo_v2") return;
    const { data } = await supabase.from("platform_connections").select("*").eq("uid", user.uid);
    if (!data) return;
    const map: Record<string, PlatformConnection> = {};
    data.forEach((c: PlatformConnection) => { map[c.platform] = c; });
    setConnections(map);
  };

  const isConnected    = (g: OAuthGroup) => g.covers.some(p => connections[p]?.connected);
  const getAccountName = (g: OAuthGroup) => g.covers.map(p => connections[p]).find(c => c?.connected)?.account_name ?? "";

  const handleConnect = (g: OAuthGroup) => {
    const url = g.buildUrl(user.uid);
    if (!url) { setOauthError(`${g.label} env vars not configured. Add them to Netlify and redeploy.`); return; }
    window.location.href = url;
  };

  const handleDisconnect = async (g: OAuthGroup) => {
    for (const p of g.covers) {
      await supabase.from("platform_connections").update({ connected: false, access_token: "" }).eq("uid", user.uid).eq("platform", p);
      setConnections(prev => ({ ...prev, [p]: { ...prev[p], connected: false, access_token: "" } }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold mb-1" style={{ color:"var(--text)" }}>Settings</h1>
        <p className="text-sm" style={{ color:"var(--muted)" }}>Connect your platforms and manage preferences</p>
      </div>

      {oauthMsg   && <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3"><CheckCircle2 size={15} className="shrink-0 mt-0.5"/>{oauthMsg}</div>}
      {oauthError && <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3"><AlertCircle size={15} className="shrink-0 mt-0.5"/>{oauthError}</div>}

      {/* Appearance */}
      <div className="rounded-2xl p-5 border shadow-sm" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
        <h2 className="font-display text-sm font-semibold mb-4" style={{ color:"var(--text)" }}>Appearance</h2>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium" style={{ color:"var(--text)" }}>Theme</p>
            <button onClick={toggle} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all" style={{ borderColor:"var(--border)", color:"var(--text)", background:"var(--surface)" }}>
              {isDark ? <Sun size={14}/> : <Moon size={14}/>}{isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium" style={{ color:"var(--text)" }}>Currency</p>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="text-sm rounded-xl px-3 py-2 border outline-none cursor-pointer" style={{ background:"var(--surface)", borderColor:"var(--border)", color:"var(--text)" }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Redirect URI */}
      <div className="rounded-xl p-4 border" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
        <p className="text-xs font-semibold mb-1" style={{ color:"var(--text)" }}>Your OAuth Redirect URI</p>
        <p className="text-xs mb-2" style={{ color:"var(--muted)" }}>Paste this into every platform's developer app as the authorized callback/redirect URI:</p>
        <code className="text-xs font-mono px-3 py-2 rounded-lg block break-all" style={{ background:"var(--card)", color:"#4f46e5", border:"1px solid var(--border)" }}>{REDIRECT_URI}</code>
      </div>

      {/* Platform connections */}
      <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ background:"var(--card)", borderColor:"var(--border)" }}>
        <div className="p-5 border-b" style={{ borderColor:"var(--border)" }}>
          <h2 className="font-display text-sm font-semibold" style={{ color:"var(--text)" }}>Platform Connections</h2>
          <p className="text-xs mt-1" style={{ color:"var(--muted)" }}>One-click OAuth login — no token pasting. Each button opens the platform's official login page.</p>
        </div>

        {OAUTH_GROUPS.map(group => {
          const connected = isConnected(group);
          const name      = getAccountName(group);
          const open      = expanded === group.key;
          return (
            <div key={group.key} className="border-b last:border-b-0" style={{ borderColor:"var(--border)" }}>
              <div className="flex items-center justify-between p-4 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border" style={{ background:`${group.color}12`, borderColor:`${group.color}20` }}>{group.emoji}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color:"var(--text)" }}>{group.label}</p>
                      <span className="text-[10px]" style={{ color:"var(--muted)" }}>· {group.covers.join(" + ")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {connected
                        ? <><Wifi size={10} className="text-green-500"/><span className="text-xs text-green-600 font-medium">Connected{name ? ` · ${name}` : ""}</span></>
                        : <><WifiOff size={10} style={{ color:"var(--muted)" }}/><span className="text-xs" style={{ color:"var(--muted)" }}>Not connected</span></>
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpanded(open ? null : group.key)} className="p-1.5 rounded-lg" style={{ color:"var(--muted)" }}>
                    {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                  {connected
                    ? <button onClick={() => handleDisconnect(group)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border text-red-500 border-red-200 hover:bg-red-50 transition-all"><LogOut size={12}/>Disconnect</button>
                    : <button onClick={() => handleConnect(group)} className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-all" style={{ background:group.color }}>{group.emoji} Connect with {group.label}</button>
                  }
                </div>
              </div>
              {open && (
                <div className="px-4 pb-4 border-t pt-4 space-y-3" style={{ borderColor:"var(--border)" }}>
                  <div className="rounded-xl p-4" style={{ background:"var(--surface)" }}>
                    <p className="text-xs font-semibold mb-2" style={{ color:"var(--text)" }}>Setup guide</p>
                    <pre className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color:"var(--muted)", fontFamily:"inherit" }}>{group.guide}</pre>
                    <a href={group.setupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium mt-3 hover:opacity-80 transition-colors" style={{ color:group.color }}>
                      <ExternalLink size={11}/> Open {group.label} Developer Portal
                    </a>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ background:"var(--surface)", borderColor:"var(--border)" }}>
                    <p className="text-xs font-semibold mb-1.5" style={{ color:"var(--text)" }}>Netlify env vars to add</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.envVars.map(v => <code key={v} className="text-[10px] font-mono px-2 py-0.5 rounded" style={{ background:"var(--card)", color:"#4f46e5" }}>{v}</code>)}
                    </div>
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