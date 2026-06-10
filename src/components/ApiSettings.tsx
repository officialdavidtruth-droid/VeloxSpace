import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "../lib/supabase";
import { Save, KeyRound, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";

const EMPTY = { meta_ads_id: "", meta_api_key: "", google_ads_id: "", google_api_key: "", tiktok_ads_id: "", tiktok_api_key: "" };

const PLATFORM_HELP = {
  meta: {
    color: "#7c6af7",
    name: "Meta Ads",
    id_label: "Ad Account ID",
    id_placeholder: "act_123456789",
    id_help: "Found in Meta Business Manager → Business Settings → Ad Accounts. Format: act_XXXXXXXXX",
    key_label: "Access Token",
    key_placeholder: "EAABsbCS0...",
    key_help: "Generate a System User access token at developers.facebook.com → Your App → Marketing API. Needs ads_read permission.",
    docs: "https://developers.facebook.com/docs/marketing-api/get-started",
  },
  google: {
    color: "#00e5c8",
    name: "Google Ads",
    id_label: "Customer ID",
    id_placeholder: "123-456-7890",
    id_help: "Found in Google Ads at the top of the page (e.g. 123-456-7890). Remove dashes when entering.",
    key_label: "OAuth2 Access Token",
    key_placeholder: "ya29.a0AfH6SMB...",
    key_help: "Generate from Google OAuth Playground (developers.google.com/oauthplayground) with scope: https://www.googleapis.com/auth/adwords. Note: expires every hour.",
    docs: "https://developers.google.com/google-ads/api/docs/oauth/overview",
  },
  tiktok: {
    color: "#ff6b9d",
    name: "TikTok Ads",
    id_label: "Advertiser ID",
    id_placeholder: "7012345678901234",
    id_help: "Found in TikTok Ads Manager → top-right dropdown → Account Info → Advertiser ID.",
    key_label: "Access Token",
    key_placeholder: "6b621cb2-d46f...",
    key_help: "Create an app at business.tiktok.com → Apps → Create App → get the Long-term Access Token from the app credentials.",
    docs: "https://business-api.tiktok.com/portal/docs",
  },
};

export function ApiSettings({ user }: { user: AppUser }) {
  const [creds, setCreds]         = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");
  const [revealed, setRevealed]   = useState<Record<string, boolean>>({});
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.from("credentials").select("*").eq("id", user.uid).single()
      .then(({ data }) => {
        if (data) {
          const { id, uid, updated_at, ...rest } = data as any;
          setCreds(rest);
        }
      });
  }, [user.uid]);

  const handleSave = async () => {
    setSaving(true); setSaveError(""); setSaved(false);
    const { error } = await supabase.from("credentials").upsert({
      id: user.uid, uid: user.uid, ...creds, updated_at: new Date().toISOString(),
    });
    if (error) setSaveError("Save failed. Check your connection.");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  type Key = keyof typeof EMPTY;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white tracking-tight mb-1">Platform credentials</h2>
          <p className="text-xs text-velox-muted">Add your ad account credentials to enable live data sync in the Dashboard</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-velox-primary hover:bg-velox-primary-dark disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all shrink-0">
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save credentials"}
        </button>
      </div>

      {(["meta", "google", "tiktok"] as const).map((platform) => {
        const h = PLATFORM_HELP[platform];
        const idKey  = `${platform}_ads_id`  as Key;
        const keyKey = `${platform}_api_key` as Key;
        const isOpen = expanded[platform];

        return (
          <div key={platform} className="bg-velox-card border border-velox-border rounded-2xl overflow-hidden">
            {/* Platform header */}
            <div className="flex items-center justify-between p-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: h.color }} />
                <h3 className="text-sm font-semibold text-velox-text">{h.name}</h3>
                {creds[idKey] && creds[keyKey] && (
                  <span className="text-[10px] font-semibold text-velox-accent bg-velox-accent/10 border border-velox-accent/20 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                )}
              </div>
              <button onClick={() => setExpanded((p) => ({ ...p, [platform]: !p[platform] }))}
                className="text-xs text-velox-muted hover:text-velox-text transition-colors">
                {isOpen ? "Hide" : "Configure →"}
              </button>
            </div>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-velox-border pt-4">
                {/* ID field */}
                <div>
                  <label className="block text-xs text-velox-muted font-medium mb-1.5">{h.id_label}</label>
                  <input type="text" value={creds[idKey]}
                    onChange={(e) => setCreds((p) => ({ ...p, [idKey]: e.target.value }))}
                    placeholder={h.id_placeholder}
                    className="w-full bg-velox-surface border border-velox-border focus:border-velox-primary/60 hover:border-velox-primary/30 outline-none text-velox-text text-sm rounded-xl px-3 py-2.5 transition-all placeholder:text-velox-muted font-mono" />
                  <p className="text-[11px] text-velox-muted mt-1.5 leading-relaxed">{h.id_help}</p>
                </div>

                {/* Key field */}
                <div>
                  <label className="block text-xs text-velox-muted font-medium mb-1.5">{h.key_label}</label>
                  <div className="relative">
                    <input
                      type={revealed[keyKey] ? "text" : "password"}
                      value={creds[keyKey]}
                      onChange={(e) => setCreds((p) => ({ ...p, [keyKey]: e.target.value }))}
                      placeholder={h.key_placeholder}
                      className="w-full bg-velox-surface border border-velox-border focus:border-velox-primary/60 hover:border-velox-primary/30 outline-none text-velox-text text-sm rounded-xl px-3 py-2.5 pr-10 transition-all placeholder:text-velox-muted font-mono" />
                    <button onClick={() => setRevealed((p) => ({ ...p, [keyKey]: !p[keyKey] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-velox-muted hover:text-velox-text">
                      {revealed[keyKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-velox-muted mt-1.5 leading-relaxed">{h.key_help}</p>
                </div>

                {/* Docs link */}
                <a href={h.docs} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-velox-primary hover:text-white transition-colors">
                  <ExternalLink size={12} /> View {h.name} API docs
                </a>
              </div>
            )}
          </div>
        );
      })}

      {saveError && (
        <p className="text-xs text-velox-pink bg-velox-pink/10 border border-velox-pink/20 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle size={13} />{saveError}
        </p>
      )}

      <div className="flex items-start gap-3 bg-velox-surface border border-velox-border rounded-xl p-4">
        <KeyRound size={16} className="text-velox-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-velox-muted leading-relaxed">
          Credentials are stored encrypted in your private Supabase row. Once saved, go to the
          <span className="text-velox-text font-medium"> Dashboard</span> and click
          <span className="text-velox-text font-medium"> "Sync live data"</span> to pull your real campaign metrics.
        </p>
      </div>
    </div>
  );
}

