import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, FileText, Settings as SettingsIcon, LogOut, Mail, Moon, Sun, Sparkles, BarChart3, TrendingUp, MessageSquare } from "lucide-react";
import { useNotesUnread } from "@/hooks/useNotesUnread";

import logoDark from "@/assets/fractioneer-logo-dark.svg";
import logoWhite from "@/assets/fractioneer-logo-white.svg";
import { supabase } from "@/integrations/supabase/client";
import { ImpersonationBanner } from "@/components/portal/ImpersonationBanner";

const THEME_KEY = "fractioneer-portal-theme";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "dark" ? "dark" : "light";
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    // Paint the body to match the portal background so nothing flashes white
    // (or navy) between route transitions.
    document.body.style.backgroundColor = theme === "dark" ? "#070B1A" : "#EEF2FA";
    window.localStorage.setItem(THEME_KEY, theme);
    const t = window.setTimeout(() => root.classList.remove("theme-transition"), 500);
    return () => window.clearTimeout(t);
  }, [theme]);
  return { theme, setTheme };
}

const NAV = [
  { label: "Dashboard", to: "/portal", icon: LayoutGrid },
  { label: "Reports", to: "/portal/reports", icon: BarChart3 },
  { label: "Cash Flow", to: "/portal/cashflow", icon: TrendingUp },
  { label: "Documents", to: "/portal/documents", icon: FileText },
  { label: "Notes", to: "/portal/notes", icon: MessageSquare },
  { label: "Settings", to: "/portal/settings", icon: SettingsIcon },
] as const;

function todayLabel() {
  return new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

export function PortalSidebar({
  companyName,
  email,
  role,
}: {
  companyName: string | null;
  email: string | null;
  role: string | null;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme } = useTheme();
  const [viewerId, setViewerId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null));
  }, []);
  const notesUnread = useNotesUnread(viewerId, role === "admin" ? "admin" : "client");

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }

  const displayName = companyName || email || "Welcome";

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col gap-3 p-4 bg-[#EEF2FA] dark:bg-[#080C12] dark:border-r dark:border-[rgba(255,255,255,0.06)]">
      <ImpersonationBanner />
      {/* Brand */}
      <div className="flex items-center px-2 -mt-2 -mb-2">
        <div className="relative h-[90px] w-[90px] shrink-0">
          <img
            src={logoDark}
            alt="Fractioneer"
            className="absolute inset-0 h-[90px] w-[90px] object-contain transition-opacity duration-500 ease-in-out opacity-100 dark:opacity-0"
          />
          <img
            src={logoWhite}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-[90px] w-[90px] object-contain transition-opacity duration-500 ease-in-out opacity-0 dark:opacity-100"
          />
        </div>
      </div>

      {/* User card */}
      <div className="rounded-2xl border p-4 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
            {(companyName || email || "?").trim().charAt(0).toUpperCase()}
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-full border p-0.5 bg-slate-50 border-[#E5E9F1] dark:bg-[#0F1729] dark:border-[#1E2A3A]">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Dark mode"
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                theme === "dark"
                  ? "bg-[#1E2A3A] text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Moon className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Light mode"
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                theme === "light"
                  ? "bg-white text-amber-500 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sun className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
          {todayLabel()}
        </div>
        <div className="mt-1 truncate text-lg font-bold leading-tight text-slate-900 dark:text-white">
          {displayName}
        </div>
        {email && (
          <div className="mt-1 truncate text-xs text-slate-500 dark:text-[#9CA3AF]">{email}</div>
        )}
        {role && (
          <span className="mt-2 inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
            {role}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 rounded-2xl border p-2 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.to === "/portal" ? pathname === "/portal" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  preload="render"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-slate-100 text-slate-900 font-medium dark:bg-[#1E2A3A] dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-[#9CA3AF] dark:hover:bg-[#1a2335] dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.to === "/portal/notes" && notesUnread && (
                    <span
                      aria-label="Unread notes"
                      title="Unread notes"
                      className="ml-auto h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
          <li className="mt-2 border-t pt-2 border-[#E5E9F1] dark:border-[#1E2A3A]">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-[#9CA3AF] dark:hover:bg-[#1a2335] dark:hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* CTA */}
      <a
        href="mailto:team@fractioneer.co"
        className="group relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-white shadow-lg transition-transform hover:scale-[1.01]"
        style={{
          background:
            "linear-gradient(135deg, #2563EB 0%, #4F46E5 55%, #7C3AED 100%)",
        }}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-semibold">
            Contact your team
            <Sparkles className="h-3 w-3 opacity-80" />
          </div>
          <div className="truncate text-[11px] opacity-80">team@fractioneer.co</div>
        </div>
      </a>
    </aside>
  );
}
