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
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { useNotesUnread } from "@/hooks/useNotesUnread";

import logoWhite from "@/assets/fractioneer-logo-white.svg";
import { supabase } from "@/integrations/supabase/client";
import { ImpersonationBanner } from "@/components/portal/ImpersonationBanner";

const THEME_KEY = "fractioneer-portal-theme";

function useForceDarkTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    document.body.style.backgroundColor = "#05070D";
    window.localStorage.setItem(THEME_KEY, "dark");
    const t = window.setTimeout(() => root.classList.remove("theme-transition"), 500);
    return () => window.clearTimeout(t);
  }, []);
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
  useForceDarkTheme();
  const [viewerId, setViewerId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setViewerId(data.user?.id ?? null));
  }, []);
  const notesUnread = useNotesUnread(viewerId, "admin");

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }

  const activeTab = (search?.tab as string) || "clients";

  return (
    <aside className="sticky top-0 flex h-screen w-72 shrink-0 flex-col gap-3 p-4 bg-[#080C12] border-r border-[rgba(255,255,255,0.06)]">
      <ImpersonationBanner />
      {/* Brand */}
      <div className="flex items-center px-2 -mt-2 -mb-2">
        <div className="relative h-[90px] w-[90px] shrink-0">
          <img
            src={logoWhite}
            alt="Fractioneer"
            className="h-[90px] w-[90px] object-contain"
          />
        </div>
      </div>

      {/* User card */}
      <div className="rounded-2xl border p-4 bg-[#111827] border-[#1E2A3A]">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-600 text-sm font-semibold text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1E2A3A] text-white">
            <Moon className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
          {todayLabel()}
        </div>
        <div className="mt-1 truncate text-lg font-bold leading-tight text-white">
          Admin Console
        </div>
        {email && (
          <div className="mt-1 truncate text-xs text-[#9CA3AF]">{email}</div>
        )}
        <span className="mt-2 inline-flex items-center rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 rounded-2xl border p-2 bg-[#111827] border-[#1E2A3A]">
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
                      ? "bg-[#1E2A3A] text-white font-medium"
                      : "text-[#9CA3AF] hover:bg-[#1a2335] hover:text-white"
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
          <li className="mt-2 border-t pt-2 border-[#1E2A3A]">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#9CA3AF] transition-colors hover:bg-[#1a2335] hover:text-white"
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
    <div className="flex min-h-screen w-full">
      <AdminSidebar email={email} />
      <main className="nb-app flex-1 min-w-0 p-6 md:p-8">{children}</main>
    </div>
  );
}
