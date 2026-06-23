import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  Upload,
  ScrollText,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
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
    document.body.style.backgroundColor = theme === "dark" ? "#0A0F1E" : "#EEF2FA";
    window.localStorage.setItem(THEME_KEY, theme);
    const t = window.setTimeout(() => root.classList.remove("theme-transition"), 500);
    return () => window.clearTimeout(t);
  }, [theme]);
  return { theme, setTheme };
}

type NavItem = {
  label: string;
  to: string;
  search?: Record<string, string>;
  icon: typeof LayoutGrid;
  matchTab?: string; // when set, active requires search.tab === matchTab on /portal/admin
};

const NAV: ReadonlyArray<NavItem> = [
  { label: "Dashboard", to: "/portal", icon: LayoutGrid },
  { label: "Clients", to: "/portal/admin", search: { tab: "clients" }, icon: Users, matchTab: "clients" },
  { label: "Upload Financials", to: "/portal/admin", search: { tab: "upload" }, icon: Upload, matchTab: "upload" },
  { label: "Activity Log", to: "/portal/admin", search: { tab: "activity" }, icon: ScrollText, matchTab: "activity" },
  { label: "Notes", to: "/portal/notes", icon: MessageSquare },
  { label: "Settings", to: "/portal/settings", icon: SettingsIcon },
];

function todayLabel() {
  return new Date()
    .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

export function AdminSidebar({ email }: { email: string | null }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search as Record<string, string> });
  const { theme, setTheme } = useTheme();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }

  const activeTab = (search?.tab as string) || "clients";

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col gap-3 p-4 bg-[#EEF2FA] dark:bg-[#0A0F1E]">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-sm font-semibold text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-full border p-0.5 bg-slate-50 border-[#E5E9F1] dark:bg-[#0F1729] dark:border-[#1E2A3A]">
            <button
              type="button"
              onClick={() => setTheme("dark")}
              aria-label="Dark mode"
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                theme === "dark" ? "bg-[#1E2A3A] text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Moon className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("light")}
              aria-label="Light mode"
              className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                theme === "light" ? "bg-white text-amber-500 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-200"
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
          Admin Console
        </div>
        {email && (
          <div className="mt-1 truncate text-xs text-slate-500 dark:text-[#9CA3AF]">{email}</div>
        )}
        <span className="mt-2 inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 rounded-2xl border p-2 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
        <ul className="space-y-1">
          {NAV.map((item) => {
            let active = false;
            if (item.to === "/portal") active = pathname === "/portal";
            else if (item.to === "/portal/admin") {
              active = pathname === "/portal/admin" && activeTab === item.matchTab;
            } else active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  search={item.search as never}
                  preload="render"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-slate-100 text-slate-900 font-medium dark:bg-[#1E2A3A] dark:text-white"
                      : "text-slate-600 hover:bg-slate-50 dark:text-[#9CA3AF] dark:hover:bg-[#1a2335] dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
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
    </aside>
  );
}

export function AdminShell({ email, children }: { email: string | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-[#EEF2FA] dark:bg-[#0A0F1E]">
      <AdminSidebar email={email} />
      <main className="flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}
