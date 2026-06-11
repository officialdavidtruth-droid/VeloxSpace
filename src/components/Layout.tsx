import React, { useState } from "react";
import type { Page } from "../App";
import type { AppUser } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import { PLATFORMS } from "../lib/platforms";
import {
  LayoutDashboard, BarChart3, FileText, Settings,
  Sun, Moon, LogOut, Zap, ChevronRight, Menu, X,
} from "lucide-react";

const PLATFORM_ICONS: Record<string, string> = {
  instagram: "📸", facebook: "👥", linkedin: "💼",
  twitter: "🐦", tiktok: "🎵", youtube: "▶️",
};

interface Props {
  user: AppUser;
  page: Page;
  onNavigate: (p: Page) => void;
  onSignOut: () => void;
  children: React.ReactNode;
}

export function Layout({ user, page, onNavigate, onSignOut, children }: Props) {
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const NavItem = ({ id, label, icon }: { id: Page; label: string; icon: React.ReactNode }) => {
    const active = page === id;
    return (
      <button onClick={() => { onNavigate(id); setMobileOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${
          active ? "bg-brand text-white shadow-sm" : "hover:bg-opacity-10"
        }`}
        style={active ? {} : { color: "var(--muted)" }}
        onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
        onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
        {icon}
        <span>{label}</span>
        {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
      </button>
    );
  };

  const Sidebar = () => (
    <aside className="w-60 shrink-0 flex flex-col h-full border-r"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="px-4 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" fill="currentColor" />
          </div>
          <div>
            <div className="font-display font-semibold text-sm leading-none" style={{ color: "var(--text)" }}>
              Velox<span className="text-brand">Space</span>
            </div>
            <div className="text-[10px] mt-0.5 uppercase tracking-widest font-medium" style={{ color: "var(--muted)" }}>
              Analytics
            </div>
          </div>
        </div>
        <button className="lg:hidden p-1" onClick={() => setMobileOpen(false)}>
          <X size={16} style={{ color: "var(--muted)" }} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <NavItem id="overview"  label="Overview"  icon={<LayoutDashboard size={16} />} />

        {/* Platforms */}
        <div className="pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "var(--muted)" }}>
            Platforms
          </p>
          {PLATFORMS.map((p) => (
            <NavItem key={p.id} id={p.id as Page} label={p.name}
              icon={<span className="text-sm">{PLATFORM_ICONS[p.id]}</span>} />
          ))}
        </div>

        {/* Tools */}
        <div className="pt-3 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "var(--muted)" }}>
            Tools
          </p>
          <NavItem id="analytics" label="Analytics" icon={<BarChart3 size={16} />} />
          <NavItem id="reports"   label="Reports"   icon={<FileText size={16} />} />
          <NavItem id="settings"  label="Settings"  icon={<Settings size={16} />} />
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
        {/* Theme toggle */}
        <button onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--surface)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface)" }}>
          <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--text)" }}>{user.name}</p>
            <p className="text-[10px] truncate" style={{ color: "var(--muted)" }}>{user.email}</p>
          </div>
          <button onClick={onSignOut} title="Sign out"
            className="shrink-0 p-1 rounded-lg transition-all hover:text-red-500"
            style={{ color: "var(--muted)" }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="h-full flex" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex flex-col w-60">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={20} style={{ color: "var(--text)" }} />
          </button>
          <span className="font-display font-semibold text-sm" style={{ color: "var(--text)" }}>
            Velox<span className="text-brand">Space</span>
          </span>
          <button onClick={toggle}>
            {isDark ? <Sun size={18} style={{ color: "var(--muted)" }} /> : <Moon size={18} style={{ color: "var(--muted)" }} />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}