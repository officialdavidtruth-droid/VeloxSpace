import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { ThemeProvider } from "./lib/theme";
import { Layout } from "./components/Layout";
import { Overview } from "./components/Overview";
import { PlatformPage } from "./components/PlatformPage";
import { Analytics } from "./components/Analytics";
import { Reports } from "./components/Reports";
import { Settings } from "./components/Settings";
import { Composer } from "./components/Composer";
import type { AppUser } from "./lib/supabase";
import type { PlatformId } from "./types";
import { Loader2, Zap, Mail, Lock, UserPlus, LogIn } from "lucide-react";

export type Page =
  | "overview"
  | "composer"
  | PlatformId
  | "analytics"
  | "reports"
  | "settings";

export default function App() {
  const [user, setUser]     = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState<Page>("overview");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          uid:   session.user.id,
          email: session.user.email ?? "",
          name:  session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "User",
        });
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser({
          uid:   session.user.id,
          email: session.user.email ?? "",
          name:  session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "User",
        });
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleDemo = () => {
    setUser({ uid: "demo_v2", email: "demo@veloxspace.app", name: "Demo User" });
  };

  if (loading) return (
    <ThemeProvider>
      <div className="h-full flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 size={28} className="text-brand animate-spin" />
      </div>
    </ThemeProvider>
  );

  if (!user) return (
    <ThemeProvider>
      <LoginPage onDemo={handleDemo} />
    </ThemeProvider>
  );

  function renderPage() {
    if (!user) return null;
    if (page === "overview")   return <Overview   user={user} onNavigate={setPage} />;
    if (page === "composer")   return <Composer   user={user} />;
    if (page === "analytics")  return <Analytics  user={user} />;
    if (page === "reports")    return <Reports    user={user} />;
    if (page === "settings")   return <Settings   user={user} />;
    // Platform pages
    const platforms: PlatformId[] = ["instagram","facebook","linkedin","twitter","tiktok","youtube","google_ads"];
    if (platforms.includes(page as PlatformId)) {
      return <PlatformPage user={user} platformId={page as PlatformId} />;
    }
    return <Overview user={user} onNavigate={setPage} />;
  }

  return (
    <ThemeProvider>
      <Layout user={user} page={page} onNavigate={setPage} onSignOut={handleSignOut}>
        {renderPage()}
      </Layout>
    </ThemeProvider>
  );
}

function LoginPage({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode]       = useState<"signin"|"signup">("signin");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [msg, setMsg]         = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError(""); setMsg("");
    try {
      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        setMsg("Account created! Sign in now.");
        setMode("signin");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="rounded-2xl p-8 shadow-lg border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 gradient-primary shadow-lg">
              <Zap size={26} className="text-white" fill="currentColor" />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight mb-1" style={{ color: "var(--text)" }}>
              Velox<span className="gradient-text">Space</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>The marketing command center for social & ads</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                placeholder="Password"
                className="w-full text-sm rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>

            {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            {msg   && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{msg}</p>}

            <button onClick={handle} disabled={loading}
              className="w-full flex items-center justify-center gap-2 gradient-primary hover:opacity-90 disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-md">
              {loading ? <Loader2 size={15} className="animate-spin" /> : mode === "signup" ? <UserPlus size={15} /> : <LogIn size={15} />}
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(""); setMsg(""); }}
              className="w-full text-xs py-1 transition-all" style={{ color: "var(--muted)" }}>
              {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <button onClick={onDemo}
            className="w-full text-sm py-2.5 px-4 rounded-xl transition-all border"
            style={{ color: "var(--muted)", borderColor: "var(--border)", background: "transparent" }}>
            Continue as demo
          </button>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "var(--muted)" }}>Free plan · No credit card needed</p>
      </div>
    </div>
  );
}
