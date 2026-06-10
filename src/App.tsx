import React, { useState, useEffect } from "react";
import { supabase, type AppUser } from "./lib/supabase";
import { PerformanceDashboard } from "./components/PerformanceDashboard";
import { SchedulerSection } from "./components/SchedulerSection";
import { AiOptimizer } from "./components/AiOptimizer";
import { ApiSettings } from "./components/ApiSettings";
import { PricingTiers } from "./components/PricingTiers";
import { LayoutDashboard, CalendarClock, Sparkles, Settings, CreditCard, Zap, LogOut, Loader2, Mail, Lock, UserPlus, LogIn } from "lucide-react";

type Tab = "dashboard" | "scheduler" | "optimizer" | "settings" | "pricing";

const TABS = [
  { id: "dashboard" as Tab, label: "Dashboard",    Icon: LayoutDashboard },
  { id: "scheduler" as Tab, label: "Scheduler",    Icon: CalendarClock   },
  { id: "optimizer" as Tab, label: "AI Optimizer", Icon: Sparkles        },
  { id: "settings"  as Tab, label: "Settings",     Icon: Settings        },
  { id: "pricing"   as Tab, label: "Pricing",      Icon: CreditCard      },
];

export default function App() {
  const [user, setUser]         = useState<AppUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  useEffect(() => {
    // Check for existing session
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

    // Listen for sign-in / sign-out changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    setUser({ uid: "demo_velox", email: "demo@veloxspace.app", name: "Demo User" });
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center star-bg">
      <Loader2 size={28} className="text-velox-primary animate-spin" />
    </div>
  );

  if (!user) return <LoginPage onDemo={handleDemo} />;

  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="h-full flex flex-col bg-velox-bg overflow-hidden">
      <div className="velocity-line shrink-0" />
      <header className="shrink-0 bg-velox-surface border-b border-velox-border px-4 flex items-center justify-between h-14 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-velox-primary flex items-center justify-center">
            <Zap size={14} className="text-white" fill="currentColor" />
          </div>
          <span className="font-display font-semibold text-sm text-white tracking-tight">
            Velox<span className="text-velox-accent">Space</span>
          </span>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-velox-primary/20 text-velox-primary border border-velox-primary/30"
                  : "text-velox-muted hover:text-velox-text hover:bg-white/5"
              }`}>
              <Icon size={13} />{label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-velox-primary/30 border border-velox-primary/40 flex items-center justify-center text-xs font-semibold text-velox-primary">
            {initials}
          </div>
          <button onClick={handleSignOut} className="p-1.5 text-velox-muted hover:text-velox-text hover:bg-white/5 rounded-lg transition-all" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {activeTab === "dashboard"  && <PerformanceDashboard user={user} />}
        {activeTab === "scheduler"  && <SchedulerSection     user={user} />}
        {activeTab === "optimizer"  && <AiOptimizer          user={user} />}
        {activeTab === "settings"   && <ApiSettings          user={user} />}
        {activeTab === "pricing"    && <PricingTiers         user={user} />}
      </main>
    </div>
  );
}

function LoginPage({ onDemo }: { onDemo: () => void }) {
  const [mode, setMode]       = useState<"signin" | "signup">("signin");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [message, setMessage] = useState("");

  const handle = async () => {
    if (!email || !password) { setError("Enter your email and password."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "signup") {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) throw e;
        setMessage("Account created! You can sign in now.");
        setMode("signin");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center star-bg p-4">
      <div className="w-full max-w-sm">
        <div className="bg-velox-surface border border-velox-border rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-velox-primary/20 border border-velox-primary/30 flex items-center justify-center mx-auto mb-4">
              <Zap size={26} className="text-velox-primary" fill="currentColor" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-white tracking-tight mb-1">
              Velox<span className="text-velox-accent">Space</span>
            </h1>
            <p className="text-velox-muted text-sm">Campaign intelligence at velocity</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-velox-muted" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-velox-card border border-velox-border focus:border-velox-primary/60 outline-none text-velox-text text-sm rounded-xl pl-9 pr-3 py-2.5 transition-all placeholder:text-velox-muted" />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-velox-muted" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handle()}
                placeholder="Password"
                className="w-full bg-velox-card border border-velox-border focus:border-velox-primary/60 outline-none text-velox-text text-sm rounded-xl pl-9 pr-3 py-2.5 transition-all placeholder:text-velox-muted" />
            </div>

            {error   && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
            {message && <p className="text-xs text-velox-accent bg-velox-accent/10 border border-velox-accent/20 rounded-lg px-3 py-2">{message}</p>}

            <button onClick={handle} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-velox-primary hover:bg-velox-primary-dark disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-xl transition-all">
              {loading ? <Loader2 size={15} className="animate-spin" /> : mode === "signup" ? <UserPlus size={15} /> : <LogIn size={15} />}
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
              className="w-full text-xs text-velox-muted hover:text-velox-text py-1 transition-all">
              {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-velox-border" />
            <span className="text-velox-muted text-xs">or</span>
            <div className="flex-1 h-px bg-velox-border" />
          </div>

          <button onClick={onDemo}
            className="w-full text-velox-muted hover:text-velox-text border border-velox-border hover:border-velox-primary/30 text-sm py-2.5 px-4 rounded-xl transition-all">
            Continue as demo
          </button>
        </div>
        <p className="text-center text-xs text-velox-muted mt-4">Free plan · No credit card needed</p>
      </div>
    </div>
  );
}
