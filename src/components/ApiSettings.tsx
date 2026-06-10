import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "../lib/supabase";
import { Save, KeyRound, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

const EMPTY = { meta_ads_id: "", meta_api_key: "", google_ads_id: "", google_api_key: "", tiktok_ads_id: "", tiktok_api_key: "" };

export function ApiSettings({ user }: { user: AppUser }) {
  const [creds, setCreds]   = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saveError, setSaveError] = useState("");
  const [revealed, setRevealed]   = useState<Record<string,boolean>>({});

  useEffect(() => {
    supabase.from("credentials").select("*").eq("id", user.uid).single()
      .then(({ data }) => { if (data) { const { id, uid, updated_at, ...rest } = data; setCreds(rest); } });
  }, [user.uid]);

  const handleSave = async () => {
    setSaving(true); setSaveError(""); setSaved(false);
    const { error } = await supabase.from("credentials").upsert({ id: user.uid, uid: user.uid, ...creds, updated_at: new Date().toISOString() });
    if (error) setSaveError("Save failed. Check your connection.");
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  type Key = keyof typeof EMPTY;
  const Field = ({ label, k, ph, secret }: { label: string; k: Key; ph: string; secret?: boolean }) => (
    <div>
      <label className="block text-xs text-velox-muted font-medium mb-1.5">{label}</label>
      <div className="relative">
        <input type={secret && !revealed[k] ? "password" : "text"} value={creds[k]} onChange={(e) => setCreds((p) => ({ ...p, [k]: e.target.value }))} placeholder={ph}
          className="w-full bg-velox-surface border border-velox-border focus:border-velox-primary/60 hover:border-velox-primary/30 outline-none text-velox-text text-sm rounded-xl px-3 py-2.5 pr-10 transition-all placeholder:text-velox-muted font-mono" />
        {secret && <button onClick={() => setRevealed((p) => ({ ...p, [k]: !p[k] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-velox-muted hover:text-velox-text">{revealed[k] ? <EyeOff size={14}/> : <Eye size={14}/>}</button>}
      </div>
    </div>
  );

  const Section = ({ title, color, ik, kk, iph, kph }: { title:string; color:string; ik:Key; kk:Key; iph:string; kph:string }) => (
    <div className="bg-velox-card border border-velox-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4"><div className="w-2 h-2 rounded-full" style={{ background: color }} /><h3 className="text-sm font-semibold text-velox-text">{title}</h3></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Ad Account ID" k={ik} ph={iph} />
        <Field label="API Key / Access Token" k={kk} ph={kph} secret />
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div><h2 className="font-display text-xl font-semibold text-white tracking-tight mb-1">Platform credentials</h2><p className="text-xs text-velox-muted">Stored in your private Supabase row, scoped to your account only</p></div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-velox-primary hover:bg-velox-primary-dark disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all shrink-0">
          {saving ? <Loader2 size={13} className="animate-spin"/> : saved ? <CheckCircle2 size={13}/> : <Save size={13}/>}
          {saving ? "Saving…" : saved ? "Saved!" : "Save credentials"}
        </button>
      </div>
      <Section title="Meta Ads"   color="#7c6af7" ik="meta_ads_id"    kk="meta_api_key"    iph="act_123456789"       kph="EAABsbCS0..." />
      <Section title="Google Ads" color="#00e5c8" ik="google_ads_id"  kk="google_api_key"  iph="123-456-7890"        kph="ya29.a0AfH6..." />
      <Section title="TikTok Ads" color="#ff6b9d" ik="tiktok_ads_id"  kk="tiktok_api_key"  iph="7012345678901234"    kph="6b621cb2-d46f..." />
      {saveError && <p className="text-xs text-velox-pink bg-velox-pink/10 border border-velox-pink/20 rounded-xl px-4 py-3 flex items-center gap-2"><AlertCircle size={13}/>{saveError}</p>}
      <div className="flex items-start gap-3 bg-velox-surface border border-velox-border rounded-xl p-4">
        <KeyRound size={16} className="text-velox-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-velox-muted leading-relaxed">Credentials are stored in your private Supabase row and never shared. Row Level Security ensures only your account can read or write this data.</p>
      </div>
    </div>
  );
}
