import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "../lib/supabase";
import { ScheduledPost } from "../types";
import { PenTool, Calendar, Globe, Trash2, CheckCircle2, Sparkles, AlertCircle, Loader2, Clock } from "lucide-react";

type Platform = "meta" | "tiktok" | "x";
const PLATFORMS = [{ id: "meta" as Platform, label: "Meta" }, { id: "tiktok" as Platform, label: "TikTok" }, { id: "x" as Platform, label: "X" }];

export function SchedulerSection({ user }: { user: AppUser }) {
  const [posts, setPosts]           = useState<ScheduledPost[]>([]);
  const [loading, setLoading]       = useState(true);
  const [content, setContent]       = useState("");
  const [platforms, setPlatforms]   = useState<Platform[]>(["meta"]);
  const [schedTime, setSchedTime]   = useState("");
  const [hashtags, setHashtags]     = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [tagError, setTagError]     = useState("");
  const [formError, setFormError]   = useState("");

  useEffect(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 5);
    setSchedTime(d.toISOString().slice(0, 16));
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from("posts").select("*").eq("uid", user.uid).order("scheduled_time");
    setPosts((data as ScheduledPost[]) ?? []);
    setLoading(false);
  };

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const fetchHashtags = async () => {
    if (!content.trim()) { setTagError("Add some post content first."); return; }
    setLoadingTags(true); setTagError("");
    try {
      const res = await fetch("/api/hashtag-suggestions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content.trim() }) });
      const data = await res.json();
      if (data.hashtags?.length) setHashtags(data.hashtags); else throw new Error();
    } catch { setTagError("Could not generate hashtags. Try again."); }
    finally { setLoadingTags(false); }
  };

  const handleSave = async () => {
    if (!content.trim()) { setFormError("Post content is required."); return; }
    if (!platforms.length) { setFormError("Select at least one platform."); return; }
    if (!schedTime) { setFormError("Set a scheduled time."); return; }
    setFormError(""); setSaving(true);
    try {
      await supabase.from("posts").insert({
        uid: user.uid, content: content.trim(), platforms,
        scheduled_time: new Date(schedTime).toISOString(),
        status: "scheduled", caption_length: content.trim().length,
        hashtags, created_at: new Date().toISOString(),
      });
      setContent(""); setHashtags([]);
      await fetchPosts();
    } catch { setFormError("Failed to save. Try again."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  const charLimit = 280; const pct = Math.min((content.length / charLimit) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-white tracking-tight mb-1">Post scheduler</h2>
        <p className="text-xs text-velox-muted">Compose once, publish to Meta, TikTok, and X with AI-optimised hashtags</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-velox-card border border-velox-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-velox-text"><PenTool size={15} className="text-velox-primary" /> Compose post</div>
          <div className="relative">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's your campaign message?" rows={5} maxLength={charLimit}
              className="w-full bg-velox-surface border border-velox-border hover:border-velox-primary/30 focus:border-velox-primary/60 outline-none text-velox-text text-sm rounded-xl p-3 resize-none transition-all placeholder:text-velox-muted" />
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
              <div className="w-14 h-1 rounded-full bg-velox-border overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 90 ? "#ff6b9d" : "#7c6af7" }} /></div>
              <span className={`text-[10px] font-mono ${content.length > charLimit * 0.9 ? "text-velox-pink" : "text-velox-muted"}`}>{content.length}/{charLimit}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-velox-muted font-medium block mb-2 flex items-center gap-1.5"><Globe size={12} /> Publish to</label>
            <div className="flex gap-2">{PLATFORMS.map(({ id, label }) => (
              <button key={id} onClick={() => togglePlatform(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${platforms.includes(id) ? "bg-velox-primary/20 border-velox-primary/40 text-velox-primary" : "bg-transparent border-velox-border text-velox-muted hover:border-velox-primary/20"}`}>
                {label}
              </button>
            ))}</div>
          </div>
          <div>
            <label className="text-xs text-velox-muted font-medium block mb-2 flex items-center gap-1.5"><Calendar size={12} /> Scheduled for</label>
            <input type="datetime-local" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} style={{ colorScheme: "dark" }}
              className="bg-velox-surface border border-velox-border focus:border-velox-primary/60 outline-none text-velox-text text-sm rounded-xl px-3 py-2 w-full transition-all" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-velox-muted font-medium flex items-center gap-1.5"><Sparkles size={12} /> Hashtags</label>
              <button onClick={fetchHashtags} disabled={loadingTags}
                className="flex items-center gap-1.5 text-xs text-velox-primary bg-velox-primary/10 hover:bg-velox-primary/20 border border-velox-primary/20 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50">
                {loadingTags ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {loadingTags ? "Generating…" : "AI suggest"}
              </button>
            </div>
            {tagError && <p className="text-xs text-velox-pink mb-2 flex items-center gap-1"><AlertCircle size={11} />{tagError}</p>}
            {hashtags.length > 0
              ? <div className="flex flex-wrap gap-1.5">{hashtags.map((t) => <span key={t} className="flex items-center gap-1 text-xs bg-velox-primary/10 border border-velox-primary/20 text-velox-primary px-2 py-0.5 rounded-full">{t}<button onClick={() => setHashtags((p) => p.filter((x) => x !== t))} className="hover:text-white ml-0.5">×</button></span>)}</div>
              : <p className="text-xs text-velox-muted italic">Click "AI suggest" to generate hashtags</p>
            }
          </div>
          {formError && <p className="text-xs text-velox-pink bg-velox-pink/10 border border-velox-pink/20 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertCircle size={11} />{formError}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-velox-primary hover:bg-velox-primary-dark disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-xl transition-all">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? "Saving…" : "Schedule post"}
          </button>
        </div>

        <div className="lg:col-span-2 bg-velox-card border border-velox-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-velox-text flex items-center gap-2"><Clock size={14} className="text-velox-primary" /> Upcoming</div>
            <span className="text-xs font-mono bg-velox-surface border border-velox-border text-velox-muted px-2 py-0.5 rounded-full">{posts.length}</span>
          </div>
          {loading ? <div className="flex justify-center py-8"><Loader2 size={18} className="animate-spin text-velox-muted" /></div>
           : posts.length === 0
            ? <div className="text-center py-10"><PenTool size={28} className="text-velox-muted mx-auto mb-3" /><p className="text-xs text-velox-muted">No posts scheduled yet.</p></div>
            : <div className="space-y-3 max-h-96 overflow-y-auto pr-1">{posts.map((post) => (
                <div key={post.id} className="bg-velox-surface border border-velox-border rounded-xl p-3 hover:border-velox-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-velox-text line-clamp-2 flex-1">{post.content}</p>
                    <button onClick={() => handleDelete(post.id)} className="text-velox-muted hover:text-velox-pink transition-colors shrink-0"><Trash2 size={13} /></button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">{post.platforms.map((p) => <span key={p} className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-velox-card border border-velox-border text-velox-muted">{p}</span>)}</div>
                    <span className="text-[10px] font-mono text-velox-muted">{new Date(post.scheduled_time).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                </div>
              ))}</div>
          }
        </div>
      </div>
    </div>
  );
}
