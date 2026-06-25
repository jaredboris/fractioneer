import { createFileRoute, redirect, useNavigate, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Download,
  Wallet,
  Receipt,
  LogOut,
  Settings,
  ExternalLink,
  AlertTriangle,
  Building2,
  Upload,
  Loader2,
  Eye,
  X,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  WIDGET_BY_ID,
  useWidgetPrefs,
  EditableWidget,
  WidgetOverlay,
  AddWidgetModal,
  mergeRows,
  type PeriodRow,
  type DashboardRow as WidgetDashboardRow,
  type NormalizedRow,
} from "@/lib/dashboard-widgets";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";


import logo from "@/assets/fractioneer-logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { AdminShell } from "@/components/portal/AdminSidebar";
import { BetaBanner } from "@/components/portal/BetaBanner";
import { UrgentAlert } from "@/components/portal/UrgentAlert";
import { useCompanyName } from "@/hooks/useProfile";

import { getMyRole, ensureMyRole } from "@/lib/portal.functions";
import { useImpersonation, startImpersonation, useAdminOverride } from "@/lib/impersonation";
import { getCached, setCached } from "@/lib/portal-cache";
import { DEFAULT_IDS } from "@/lib/dashboard-widgets";
import { useInactivityTimeout, enforceInactivityTimeout } from "@/lib/session-timeout";

let cachedPortalGate: {
  user: { id: string; email?: string | null };
  checkedAt: number;
} | null = null;

const PORTAL_GATE_CACHE_MS = 5 * 60 * 1000;

// Invalidate the portal gate cache on every auth identity transition so a
// fresh sign-in re-runs the AAL/2FA check instead of reusing a prior session.
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
      cachedPortalGate = null;
    }
  });
}

export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Client Portal — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    // These sub-routes manage their own auth bootstrap and must bypass the gate.
    if (
      location.pathname === "/portal/login" ||
      location.pathname === "/portal/forgot-password" ||
      location.pathname === "/portal/reset-password" ||
      location.pathname === "/portal/setup-2fa" ||
      location.pathname === "/portal/verify-2fa"
    ) {
      return;
    }

    // 8-hour inactivity timeout — enforced BEFORE any render or identity lookup.
    if (await enforceInactivityTimeout()) {
      cachedPortalGate = null;
      throw redirect({ to: "/portal/login" });
    }


    // Identity lookup — may be served from the short-lived cache.
    let user: { id: string; email?: string | null };
    if (cachedPortalGate && Date.now() - cachedPortalGate.checkedAt < PORTAL_GATE_CACHE_MS) {
      user = cachedPortalGate.user;
    } else {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        cachedPortalGate = null;
        throw redirect({ to: "/portal/login" });
      }
      user = { id: data.user.id, email: data.user.email ?? null };

      // First-time sign-ins (especially via OAuth) may not have a row in
      // user_roles yet — provision a default `client` role server-side.
      try {
        await ensureMyRole();
      } catch {
        // Non-fatal: getMyRole below will surface a null role and the UI
        // handles it gracefully.
      }
      cachedPortalGate = { user, checkedAt: Date.now() };
    }

    // Enforce TOTP 2FA on every navigation — never cached. AAL is per-session
    // and resets on sign-out, so this must run every time the gate is hit.
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) {
      cachedPortalGate = null;
      throw redirect({ to: "/portal/login" });
    }
    if (aal) {
      if (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        throw redirect({ to: "/portal/verify-2fa" });
      }
      if (aal.nextLevel === "aal1" && aal.currentLevel === "aal1") {
        // No verified TOTP factor yet — force enrollment.
        throw redirect({ to: "/portal/setup-2fa" });
      }
    }
    return { user };
  },
  pendingMs: Infinity,
  component: PortalShell,
});

type Tone = "ok" | "warn" | "info";

function toneForMonthly(v: string): Tone {
  if (v === "Delayed") return "warn";
  return "ok";
}
function toneForApAr(v: string): Tone {
  return v === "Behind" ? "warn" : "ok";
}
function toneClasses(tone: Tone) {
  switch (tone) {
    case "ok":
      return "bg-accent/10 text-accent";
    case "warn":
      return "bg-destructive/10 text-destructive";
    case "info":
      return "bg-primary/10 text-primary";
  }
}

function PortalShell() {
  useInactivityTimeout();
  const pathname = useRouterState({
    select: (s) => s.resolvedLocation?.pathname ?? s.location.pathname,
  });
  return (
    <div
      className="flex flex-col"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at bottom right, #11184c 0%, #040316 60%)",
      }}
    >
      <BetaBanner />
      <div className="flex-1">
        {pathname !== "/portal" ? <Outlet /> : <PortalRouter />}
      </div>
    </div>
  );
}

// Module-level cache so navigating back to /portal doesn't re-flash the
// full-screen loader while we re-fetch a role we already know.
let cachedRole: { userId: string; role: "admin" | "client" | null } | null = null;

function PortalRouter() {
  const { user } = Route.useRouteContext() as { user?: { id: string; email?: string | null } };
  const impersonation = useImpersonation();
  const [role, setRole] = useState<"admin" | "client" | null | undefined>(() =>
    user ? (getCached<"admin" | "client" | null>("role", user.id) ?? (cachedRole?.userId === user.id ? cachedRole.role : undefined)) : undefined,
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getMyRole();
        if (cancelled) return;
        cachedRole = { userId: user.id, role: result.role };
        setCached("role", user.id, result.role);
        setRole(result.role);
      } catch {
        if (!cancelled) setRole(null);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user || role === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Admin viewing a client in spy mode → render the real client dashboard.
  if (role === "admin" && impersonation) return <ClientDashboard role="client" />;
  return role === "admin" ? <AdminOverview role={role} /> : <ClientDashboard role={role} />;
}

function PortalHeader({
  displayName,
  email,
  role,
  showAdminLink,
}: {
  displayName: string;
  email: string | null;
  role: string | null;
  showAdminLink: boolean;
}) {
  const navigate = useNavigate();
  async function handleLogout() {
    
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
            {role === "admin" ? "Operations Console" : "Client Portal"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-semibold text-foreground">{displayName}</div>
            <div className="text-xs text-muted-foreground">
              {email}
              {role && (
                <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                  {role}
                </span>
              )}
            </div>
          </div>
          <ThemeToggle />
          {showAdminLink && (
            <Link
              to="/portal/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              Manage data
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

/* ----------------------------- ADMIN OVERVIEW ----------------------------- */

type ClientRow = {
  id: string;
  company_name: string | null;
  full_name: string | null;
  dashboard_updated_at: string | null;
  document_count: number;
  period_count: number;
  last_upload_at: string | null;
};

type ActivityItem = {
  id: string;
  kind: "upload" | "extraction";
  client_id: string;
  client_name: string;
  label: string;
  created_at: string;
};



function AdminOverview({ role: _role }: { role: string }) {
  const { user } = Route.useRouteContext() as { user: { id: string; email?: string | null } };
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [previewId, setPreviewId] = useState<string>("");
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [periodsThisMonth, setPeriodsThisMonth] = useState<number>(0);
  const [, setUploadsThisMonth] = useState<number>(0);
  const [aiSpendThisMonth, setAiSpendThisMonth] = useState<number>(0);
  const [aiCallsThisMonth, setAiCallsThisMonth] = useState<number>(0);
  const [aiSpendOpen, setAiSpendOpen] = useState(false);


  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        if (!cancelled) {
          setRows([]);
          setActivity([]);
        }
        return;
      }
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [{ data: profiles }, { data: dashboards }, { data: documents }, { data: periods }, { count: periodsMonthCount }] = await Promise.all([
        supabase.from("profiles").select("id, company_name, full_name").in("id", ids),
        supabase.from("dashboard_data").select("client_id, updated_at").in("client_id", ids),
        supabase.from("documents").select("id, client_id, file_name, created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(200),
        supabase.from("periods").select("id, client_id, period_end, created_at, updated_at").in("client_id", ids).order("updated_at", { ascending: false }).limit(500),
        supabase.from("periods").select("id", { count: "exact", head: true }).in("client_id", ids).gte("created_at", monthStart.toISOString()),
      ]);
      if (cancelled) return;

      const nameMap = new Map<string, string>(
        (profiles ?? []).map((p) => [p.id, p.company_name || p.full_name || p.id.slice(0, 8)]),
      );

      const dashMap = new Map<string, string | null>((dashboards ?? []).map((d) => [d.client_id, d.updated_at]));
      const perMap = new Map<string, { count: number; last: string | null }>();
      for (const p of periods ?? []) {
        const cur = perMap.get(p.client_id) ?? { count: 0, last: null };
        cur.count += 1;
        const lastTouched = p.updated_at ?? p.created_at;
        if (!cur.last || new Date(lastTouched) > new Date(cur.last)) cur.last = lastTouched;
        perMap.set(p.client_id, cur);
      }

      const merged: ClientRow[] = (profiles ?? []).map((p) => ({
        id: p.id,
        company_name: p.company_name,
        full_name: p.full_name,
        dashboard_updated_at: dashMap.get(p.id) ?? null,
        document_count: perMap.get(p.id)?.count ?? 0,
        period_count: perMap.get(p.id)?.count ?? 0,
        last_upload_at: perMap.get(p.id)?.last ?? null,
      }));
      merged.sort((a, b) => {
        const aNeeds = a.period_count === 0 ? 0 : 1;
        const bNeeds = b.period_count === 0 ? 0 : 1;
        if (aNeeds !== bNeeds) return aNeeds - bNeeds;
        return (a.company_name || a.full_name || "").localeCompare(b.company_name || b.full_name || "");
      });
      setRows(merged);

      // This-month counts: period rows are the source of truth for processed uploads.
      const uploadsMonth = (documents ?? []).filter((d) => new Date(d.created_at) >= monthStart).length;
      const periodsMonth = periodsMonthCount ?? (periods ?? []).filter((p) => new Date(p.created_at) >= monthStart).length;
      setUploadsThisMonth(uploadsMonth);
      setPeriodsThisMonth(periodsMonth);

      // Real AI spend for the current month from the ai_usage log table.
      const { data: aiRows } = await supabase
        .from("ai_usage")
        .select("estimated_cost_usd, total_tokens, created_at")
        .gte("created_at", monthStart.toISOString());
      if (!cancelled) {
        const spend = (aiRows ?? []).reduce((sum, r) => sum + Number(r.estimated_cost_usd ?? 0), 0);
        setAiSpendThisMonth(spend);
        setAiCallsThisMonth((aiRows ?? []).length);
      }

      // Recent activity: combine documents + periods
      const docItems: ActivityItem[] = (documents ?? []).map((d) => ({
        id: `doc-${d.id}`,
        kind: "upload",
        client_id: d.client_id,
        client_name: nameMap.get(d.client_id) ?? "Unknown",
        label: d.file_name,
        created_at: d.created_at,
      }));
      const perItems: ActivityItem[] = (periods ?? []).map((p) => ({
        id: `per-${p.id}`,
        kind: "extraction",
        client_id: p.client_id,
        client_name: nameMap.get(p.client_id) ?? "Unknown",
        label: `Period ${p.period_end}`,
        created_at: p.created_at,
      }));
      const combined = [...docItems, ...perItems]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 10);
      setActivity(combined);
    })();
    return () => { cancelled = true; };
  }, []);

  const totals = (() => {
    const list = rows ?? [];
    const needsData = list.filter((r) => r.period_count === 0).length;
    const needsDocs = list.filter((r) => r.period_count === 0).length;
    return { total: list.length, needsData, needsDocs };
  })();

  

  return (
    <AdminShell email={user.email ?? null}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Operations overview
          </h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            Status of every client portal at a glance.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#6B7280]">
              View as client (spy mode)
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative">
                <Eye className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={previewId}
                  onChange={(e) => setPreviewId(e.target.value)}
                  disabled={!rows || rows.length === 0}
                  className="block min-w-[16rem] rounded-md border border-[#E5E9F1] bg-white py-2 pl-8 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-[#1E2A3A] dark:bg-[#111827] dark:text-white"
                >
                  <option value="">— Select client —</option>
                  {(rows ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.company_name || r.full_name || r.id}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!previewId}
                onClick={() => {
                  const r = (rows ?? []).find((x) => x.id === previewId);
                  if (!r) return;
                  startImpersonation(r.id, r.company_name || r.full_name || "Client");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Eye className="h-3.5 w-3.5" />
                Enter spy mode
              </button>
            </div>
          </div>
        </div>
      </div>

      <>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <DarkStatCard
              label="Clients"
              value={String(totals.total)}
              detail="Active client portals"
              tone="info"
              icon={<Building2 className="h-5 w-5" />}
            />
            <DarkStatCard
              label="Need dashboard data"
              value={String(totals.needsData)}
              detail={totals.needsData === 0 ? "All set" : "Values to set"}
              tone={totals.needsData === 0 ? "ok" : "warn"}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
            <DarkStatCard
              label="Need documents"
              value={String(totals.needsDocs)}
              detail={totals.needsDocs === 0 ? "All have files" : "No files yet"}
              tone={totals.needsDocs === 0 ? "ok" : "warn"}
              icon={<Upload className="h-5 w-5" />}
            />
            <button
              type="button"
              onClick={() => setAiSpendOpen(true)}
              className="block h-full text-left transition hover:-translate-y-0.5"
            >
              <DarkStatCard
                label="AI spend (month)"
                value={`$${aiSpendThisMonth.toFixed(2)}`}
                detail={`${aiCallsThisMonth} operation${aiCallsThisMonth === 1 ? "" : "s"} · click for breakdown`}
                tone="info"
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </button>

            <DarkStatCard
              label="Periods (month)"
              value={String(periodsThisMonth)}
              detail="Processed this month"
              tone="info"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2 overflow-hidden rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827]">
              <div className="flex items-center justify-between border-b border-[#E5E9F1] px-5 py-4 dark:border-[#1E2A3A]">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Clients</h2>
                  <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                    Flagged rows need data set or documents uploaded.
                  </p>
                </div>
                <Link
                  to="/portal/admin"
                  search={{ tab: "clients" } as never}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage data
                </Link>
              </div>

              {rows === null ? (
                <div className="flex items-center justify-center px-5 py-12 text-sm text-slate-500 dark:text-[#9CA3AF]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : rows.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">
                  No clients yet. Use <strong>Manage data</strong> to add your first client.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-[#0F1729] dark:text-[#6B7280]">
                      <tr>
                        <th className="px-5 py-3">Client</th>
                        <th className="px-5 py-3">Dashboard</th>
                        <th className="px-5 py-3">Docs</th>
                        <th className="px-5 py-3">Last upload</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A]">
                      {rows.map((r) => {
                        const noData = r.period_count === 0;
                        const noDocs = r.period_count === 0;
                        const needsAttention = noDocs;
                        const dashboardUpdatedAt = r.dashboard_updated_at ?? r.last_upload_at;
                        return (
                          <tr key={r.id} className={needsAttention ? "bg-rose-50/40 dark:bg-rose-500/[0.04]" : ""}>
                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-900 dark:text-white">
                                {r.company_name || r.full_name || "—"}
                              </div>
                              <div className="text-xs text-slate-400">{r.id.slice(0, 8)}…</div>
                            </td>
                            <td className="px-5 py-4">
                              {noData ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Not set
                                </span>
                              ) : (
                                <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                                  Updated {dashboardUpdatedAt ? new Date(dashboardUpdatedAt).toLocaleDateString() : "—"}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-white">
                                {r.document_count}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500 dark:text-[#9CA3AF]">
                              {r.last_upload_at ? new Date(r.last_upload_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {needsAttention ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-300">
                                    <AlertTriangle className="h-3 w-3" />
                                    {noData && noDocs ? "Needs data & docs" : "Needs docs"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Ready
                                  </span>
                                )}
                                <button
                                  onClick={() => setPreviewId(r.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#E5E9F1] bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#1E2A3A] dark:bg-[#0F1729] dark:text-white dark:hover:bg-[#1a2335]"
                                  aria-label={`Preview as ${r.company_name || r.full_name || "client"}`}
                                >
                                  <Eye className="h-3 w-3" />
                                  Preview
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent activity */}
            <section className="rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827]">
              <div className="border-b border-[#E5E9F1] px-5 py-4 dark:border-[#1E2A3A]">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Recent activity</h2>
                <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">Last 10 uploads & extractions.</p>
              </div>
              {activity.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">No activity yet.</div>
              ) : (
                <ul className="divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A]">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          a.kind === "upload"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                        }`}
                      >
                        {a.kind === "upload" ? <Upload className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium text-slate-900 dark:text-white">
                          {a.client_name}
                        </div>
                        <div className="truncate text-xs text-slate-500 dark:text-[#9CA3AF]">
                          {a.kind === "upload" ? "Upload" : "Extraction"} · {a.label}
                        </div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
      </>
      <AiSpendDialog open={aiSpendOpen} onOpenChange={setAiSpendOpen} />
    </AdminShell>
  );
}

type AiUsageRow = {
  id: string;
  client_id: string | null;
  operation: string | null;
  estimated_cost_usd: number | null;
  total_tokens: number | null;
  created_at: string;
};

function bucketOp(op: string | null): "Extraction" | "Insights" | "Other" {
  if (!op) return "Other";
  if (op === "generate_ai_insights") return "Insights";
  if (op === "extract_financials" || op === "save_extracted_financials") return "Extraction";
  return "Other";
}

function AiSpendDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [rows, setRows] = useState<AiUsageRow[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRows(null);
    (async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const { data } = await supabase
        .from("ai_usage")
        .select("id, client_id, operation, estimated_cost_usd, total_tokens, created_at")
        .gte("created_at", monthStart.toISOString())
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const list = (data ?? []) as AiUsageRow[];
      setRows(list);
      const ids = Array.from(new Set(list.map((r) => r.client_id).filter((x): x is string => !!x)));
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, company_name, full_name")
          .in("id", ids);
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const p of profs ?? []) {
          map[p.id] = (p.company_name || p.full_name || p.id.slice(0, 8)) as string;
        }
        setNames(map);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  const byOp = useMemo(() => {
    const m = new Map<string, { count: number; cost: number }>();
    for (const r of rows ?? []) {
      const k = bucketOp(r.operation);
      const cur = m.get(k) ?? { count: 0, cost: 0 };
      cur.count += 1;
      cur.cost += Number(r.estimated_cost_usd ?? 0);
      m.set(k, cur);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].cost - a[1].cost);
  }, [rows]);

  const byClient = useMemo(() => {
    const m = new Map<string, { count: number; cost: number }>();
    for (const r of rows ?? []) {
      const k = r.client_id ?? "—";
      const cur = m.get(k) ?? { count: 0, cost: 0 };
      cur.count += 1;
      cur.cost += Number(r.estimated_cost_usd ?? 0);
      m.set(k, cur);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].cost - a[1].cost);
  }, [rows]);

  const total = (rows ?? []).reduce((s, r) => s + Number(r.estimated_cost_usd ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI spend — this month</DialogTitle>
          <DialogDescription>
            Total: <span className="font-medium text-foreground">${total.toFixed(2)}</span> across {rows?.length ?? 0} operations.
          </DialogDescription>
        </DialogHeader>

        {rows === null ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No AI operations this month.</div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">By operation</h3>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Operation</th>
                      <th className="px-3 py-2 text-right font-medium">Count</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {byOp.map(([op, v]) => (
                      <tr key={op}>
                        <td className="px-3 py-2">{op}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">${v.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">By client</h3>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Client</th>
                      <th className="px-3 py-2 text-right font-medium">Count</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {byClient.map(([cid, v]) => (
                      <tr key={cid}>
                        <td className="px-3 py-2">{names[cid] ?? cid.slice(0, 8)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.count}</td>
                        <td className="px-3 py-2 text-right tabular-nums">${v.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</h3>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">When</th>
                      <th className="px-3 py-2 text-left font-medium">Client</th>
                      <th className="px-3 py-2 text-left font-medium">Operation</th>
                      <th className="px-3 py-2 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 50).map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="px-3 py-2">{r.client_id ? (names[r.client_id] ?? r.client_id.slice(0, 8)) : "—"}</td>
                        <td className="px-3 py-2">{bucketOp(r.operation)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">${Number(r.estimated_cost_usd ?? 0).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}






function DarkStatCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: React.ReactNode;
}) {
  const iconColor = tone === "ok" ? "#10B981" : tone === "warn" ? "#EF4444" : "#3B82F6";
  return (
    <div className="nb-card nb-card-glow rounded-2xl p-5 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#6B7280]">
            {label}
          </span>
          <div className="mt-2 flex items-center gap-1.5" style={{ color: iconColor }}>
            <span className="opacity-80">{icon}</span>
          </div>
        </div>
        <span className="nb-arrow shrink-0" aria-hidden>
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-[11px] text-[#6B7280]">{detail}</div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(10,31,68,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses(tone)}`}>
          {icon}
        </span>
      </div>
      <div className="mt-4 text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

/* ---------------------------- CLIENT DASHBOARD ---------------------------- */

/* ----------------------------- CLIENT PREVIEW ----------------------------- */

type DashboardRow = {
  monthly_close: string;
  monthly_close_detail: string | null;
  cash_position: string;
  cash_position_detail: string | null;
  ap_ar_status: string;
  ap_ar_detail: string | null;
};
type DocRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
};

function ClientPreview({ clientId, clientLabel }: { clientId: string; clientLabel: string }) {
  const [dashboard, setDashboard] = useState<DashboardRow | null>(null);
  const [docs, setDocs] = useState<DocRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDashboard(null);
    setDocs(null);
    (async () => {
      const [{ data: dash }, { data: documents }] = await Promise.all([
        supabase.from("dashboard_data").select("*").eq("client_id", clientId).maybeSingle(),
        supabase
          .from("documents")
          .select("id, file_name, file_path, file_size, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setDashboard(dash ?? null);
      setDocs(documents ?? []);
    })();
    return () => { cancelled = true; };
  }, [clientId]);

  async function getSignedUrl(path: string, download?: string) {
    const { data, error } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(path, 60, download ? { download } : undefined);
    if (error || !data) return null;
    return data.signedUrl;
  }
  async function handleView(path: string) {
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }
  async function handleDownload(path: string, name: string) {
    const url = await getSignedUrl(path, name);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  const cards = dashboard
    ? [
        {
          label: "Monthly Close",
          value: dashboard.monthly_close,
          detail: dashboard.monthly_close_detail ?? "",
          tone: toneForMonthly(dashboard.monthly_close),
          icon: <CheckCircle2 className="h-5 w-5" />,
        },
        {
          label: "Cash Position",
          value: dashboard.cash_position,
          detail: dashboard.cash_position_detail ?? "",
          tone: "info" as Tone,
          icon: <Wallet className="h-5 w-5" />,
        },
        {
          label: "AP / AR Status",
          value: dashboard.ap_ar_status,
          detail: dashboard.ap_ar_detail ?? "",
          tone: toneForApAr(dashboard.ap_ar_status),
          icon: <Receipt className="h-5 w-5" />,
        },
      ]
    : [
        { label: "Monthly Close", value: "—", detail: "Not set yet", tone: "info" as Tone, icon: <CheckCircle2 className="h-5 w-5" /> },
        { label: "Cash Position", value: "—", detail: "Not set yet", tone: "info" as Tone, icon: <Wallet className="h-5 w-5" /> },
        { label: "AP / AR Status", value: "—", detail: "Not set yet", tone: "info" as Tone, icon: <Receipt className="h-5 w-5" /> },
      ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 rounded-md border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent">
        <Eye className="h-4 w-4" />
        <span>
          Previewing as: <strong className="font-semibold">{clientLabel}</strong> — read-only
        </span>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(10,31,68,0.04)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{c.label}</span>
              <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses(c.tone)}`}>
                {c.icon}
              </span>
            </div>
            <div className="mt-4 text-2xl font-semibold text-foreground">{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.detail}</div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground">Files shared with this client.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {docs === null && (
              <li className="flex items-center justify-center px-5 py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </li>
            )}
            {docs && docs.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                No documents shared yet.
              </li>
            )}
            {(docs ?? []).map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{doc.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(doc.file_path)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

/* ---------------------------- CLIENT DASHBOARD ---------------------------- */

function ClientDashboard({ role }: { role: string | null }) {
  const { user } = Route.useRouteContext() as { user: { id: string; email?: string | null } };
  const impersonation = useImpersonation();
  const effectiveId = impersonation?.clientId ?? user.id;
  const companyName = useCompanyName(effectiveId);
  const [dashboardRows, setDashboardRows] = useState<DashboardFinancialRow[]>([]);
  const [docs, setDocs] = useState<
    { id: string; file_name: string; file_path: string; file_size: number | null; created_at: string }[]
  >([]);

  const [periodsRows, setPeriodsRows] = useState<PeriodRow[]>([]);
  const [aiInsights, setAiInsights] = useState<{ insight_text: string; category: string; period_end: string | null }[]>([]);
  const [activeAlert, setActiveAlert] = useState<{ id: string; message: string; created_at: string } | null>(null);

  const [override] = useAdminOverride();
  const widgets = useWidgetPrefs(effectiveId, {
    readOnly: !!impersonation && !override,
  });
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );


  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDashboardRows([]);
    setPeriodsRows([]);
    setDocs([]);
    setAiInsights([]);
    async function loadAll() {
      const [{ data: dash }, { data: pers }, { data: documents }, { data: insights }] = await Promise.all([
        supabase
          .from("dashboard_data")
          .select("*")
          .eq("client_id", effectiveId)
          .order("period", { ascending: true }),
        supabase
          .from("periods")
          .select("period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap")
          .eq("client_id", effectiveId)
          .order("period_end", { ascending: true }),
        supabase.from("documents").select("*").eq("client_id", effectiveId).order("created_at", { ascending: false }),
        supabase
          .from("ai_insights")
          .select("insight_text, category, period_end, created_at")
          .eq("client_id", effectiveId)
          .order("period_end", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: true }),
      ]);


      if (cancelled) return;
      setDashboardRows((dash ?? []) as DashboardFinancialRow[]);
      setPeriodsRows((pers ?? []) as PeriodRow[]);
      setDocs(documents ?? []);
      setAiInsights((insights ?? []) as { insight_text: string; category: string; period_end: string | null }[]);
      const { data: alertRow } = await supabase
        .from("client_alerts")
        .select("id, message, created_at")
        .eq("client_id", effectiveId)
        .is("cleared_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setActiveAlert(alertRow ?? null);
    }
    void loadAll();
    // Realtime: refresh insights when admin regenerates them, plus listen for
    // a "generating" broadcast so we can show a shimmer on the AI card.
    const channel = supabase
      .channel(`ai_insights:${effectiveId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_insights", filter: `client_id=eq.${effectiveId}` },
        () => { setGeneratingInsights(false); void loadAll(); },
      )
      .on("broadcast", { event: "generating" }, (msg) => {
        const state = (msg.payload as { state?: string } | undefined)?.state;
        setGeneratingInsights(state === "start");
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [effectiveId, impersonation, role, user.id]);



  async function getSignedUrl(path: string, download?: string) {
    const { data, error } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(path, 60, download ? { download } : undefined);
    if (error || !data) return null;
    return data.signedUrl;
  }
  async function handleView(path: string) {
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }
  async function handleDownload(path: string, name: string) {
    const url = await getSignedUrl(path, name);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  }

  const displayName = companyName || (impersonation ? impersonation.label : user.email) || "Welcome";

  // Normalized timeline merging periods (preferred) + dashboard_data (fallback).
  const mergedRows = useMemo(
    () =>
      mergeRows(
        periodsRows,
        (dashboardRows as unknown as DashboardFinancialRow[]).map((r) => ({
          period: r.period,
          net_revenue: r.net_revenue,
          net_income: r.net_income,
          cash_balance: r.cash_balance,
          total_ar: r.total_ar,
          total_ap: r.total_ap,
          monthly_close_status: r.monthly_close_status,
          monthly_close: r.monthly_close,
        })),
      ),
    [periodsRows, dashboardRows],
  );
  // Period selector — drives the locked stat cards and AI Insights card on the dashboard.
  const periodOptions = useMemo(
    () =>
      mergedRows
        .filter((r) => !!r.period)
        .map((r) => r.period as string)
        .reverse(), // newest first for the dropdown
    [mergedRows],
  );
  const [selectedPeriodEnd, setSelectedPeriodEnd] = useState<string | null>(null);
  useEffect(() => {
    if (periodOptions.length === 0) {
      setSelectedPeriodEnd(null);
      return;
    }
    if (!selectedPeriodEnd || !periodOptions.includes(selectedPeriodEnd)) {
      setSelectedPeriodEnd(periodOptions[0]);
    }
  }, [periodOptions, selectedPeriodEnd]);

  const selectedIndex = selectedPeriodEnd
    ? mergedRows.findIndex((r) => r.period === selectedPeriodEnd)
    : mergedRows.length - 1;
  const latest: NormalizedRow | null =
    selectedIndex >= 0 ? mergedRows[selectedIndex] : (mergedRows[mergedRows.length - 1] ?? null);
  const prev: NormalizedRow | null = selectedIndex > 0 ? mergedRows[selectedIndex - 1] : null;
  const periodLabel = formatAsOf(latest?.period ?? null);

  function trendFor(curr: number | null | undefined, previous: number | null | undefined) {
    if (!prev) return undefined;
    if (curr == null || previous == null || previous === 0) return undefined;
    const pct = ((Number(curr) - Number(previous)) / Math.abs(Number(previous))) * 100;
    if (!Number.isFinite(pct)) return undefined;
    return { dir: pct >= 0 ? ("up" as const) : ("down" as const), pct: Math.abs(pct) };
  }

  // Most recent Excel upload for the "download source" link in the disclaimer.
  const latestExcel = useMemo(
    () => docs.find((d) => /\.xlsx?$/i.test(d.file_name)) ?? null,
    [docs],
  );
  // "Last upload" stat reflects the currently selected period.
  const lastUploadAt = latest?.period ?? null;

  // Net margin for the (non-widget) Period Summary panel.
  const netMarginPct = (() => {
    const rev = latest?.net_revenue;
    const ni = latest?.net_income;
    if (rev == null || ni == null || Number(rev) === 0) return null;
    return (Number(ni) / Number(rev)) * 100;
  })();

  const isDark = useIsDark();

  // Insights tied to the selected period.
  const selectedInsights = useMemo(
    () =>
      aiInsights
        .filter((i) => (selectedPeriodEnd ? i.period_end === selectedPeriodEnd : i.period_end == null))
        .map(({ insight_text, category }) => ({ insight_text, category })),
    [aiInsights, selectedPeriodEnd],
  );


  const widgetCtx = useMemo(
    () => ({
      rows: mergedRows,
      latest,
      prev,
      lastUploadAt,
      isDark,
      clientId: effectiveId,
      viewerId: user.id,
      viewerRole: (impersonation ? "admin" : (role === "admin" ? "admin" : "client")) as
        | "admin"
        | "client",
      aiInsights: selectedInsights,
      generatingInsights,
    }),
    [mergedRows, latest, prev, lastUploadAt, isDark, effectiveId, user.id, impersonation, role, selectedInsights, generatingInsights],
  );




  return (
    <div className="relative flex min-h-screen bg-[#EEF2FA] dark:bg-transparent">
      <style>{`
        @keyframes nb-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .nb-rise { animation: nb-rise 0.5s ease-out backwards; }
      `}</style>

      <PortalSidebar companyName={companyName || null} email={user.email ?? null} role={role} />

      <main className="flex-1 px-8 py-8">

        <div className="mb-4 nb-rise" style={{ animationDelay: "0ms" }}>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Welcome back{companyName ? `, ${companyName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Here's the latest snapshot of your finance operations.
          </p>
        </div>

        {activeAlert && (
          <UrgentAlert message={activeAlert.message} createdAt={activeAlert.created_at} />
        )}

        {periodOptions.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border bg-white px-6 py-16 text-center nb-rise border-[#E5E9F1] dark:bg-[#0A0E18] dark:border-[#1E2A3A]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
              Your dashboard is being prepared
            </h2>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-[#9CA3AF]">
              Your financials are being prepared by your Fractioneer team.
              You&apos;ll be notified when your dashboard is ready.
            </p>
          </div>
        ) : (
        <>
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium nb-rise bg-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300"
          style={{ animationDelay: "60ms" }}
        >
          <CheckCircle2 className="h-3 w-3" />
          Reviewed by your Fractioneer team
        </div>

        <div className="mb-3 flex items-center justify-between gap-2 nb-rise" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-2">
            <label htmlFor="dashboard-period" className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Period
            </label>
            <select
              id="dashboard-period"
              value={selectedPeriodEnd ?? ""}
              onChange={(e) => setSelectedPeriodEnd(e.target.value || null)}
              disabled={periodOptions.length === 0}
              className="rounded-md border border-[#E5E9F1] bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-[#1E2A3A] dark:bg-[#111827] dark:text-white"
            >
              {periodOptions.length === 0 ? (
                <option value="">No periods</option>
              ) : (
                periodOptions.map((p) => (
                  <option key={p} value={p}>
                    {formatAsOf(p)}
                  </option>
                ))
              )}
            </select>
          </div>
          {!widgets.readOnly && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditMode((v) => !v);
                  setActiveId(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  editMode
                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-500"
                    : "bg-white border-[#E5E9F1] text-slate-700 hover:bg-slate-50 dark:bg-[#111827] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
                }`}
              >
                {editMode ? null : <SlidersHorizontal className="h-3.5 w-3.5" />}
                {editMode ? "Done" : "Manage Widgets"}
              </button>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors bg-blue-600 hover:bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Widget
              </button>
              {impersonation && override && (
                <button
                  onClick={() => setResetConfirmOpen(true)}
                  title="Wipe this client's saved layout back to the 4 default cards"
                  className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-300"
                >
                  Reset to default layout
                </button>
              )}
            </div>
          )}
        </div>



        {addOpen && (
          <AddWidgetModal
            ids={widgets.ids}
            onAdd={widgets.add}
            onClose={() => setAddOpen(false)}
          />
        )}

        {resetConfirmOpen && (
          <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset client layout to default?</DialogTitle>
                <DialogDescription>
                  This wipes <strong>{companyName ?? "this client"}</strong>&apos;s saved widget layout and
                  replaces it with the 4 default cards. The change saves immediately to their
                  account and is visible to them on next refresh.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={() => setResetConfirmOpen(false)}
                  className="rounded-md border border-[#E5E9F1] bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:bg-[#111827] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    widgets.setIds(DEFAULT_IDS);
                    setResetConfirmOpen(false);
                  }}
                  className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
                >
                  Reset layout
                </button>
              </div>
            </DialogContent>
          </Dialog>
        )}


        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={(e: DragEndEvent) => {
            setActiveId(null);
            const { active, over } = e;
            if (!over || active.id === over.id) return;
            const from = widgets.ids.indexOf(String(active.id));
            const to = widgets.ids.indexOf(String(over.id));
            if (from < 0 || to < 0) return;
            widgets.setIds(arrayMove(widgets.ids, from, to));
          }}
        >
          <SortableContext items={widgets.ids} strategy={rectSortingStrategy}>
            {(() => {
              const statIds = widgets.ids.filter((id) => WIDGET_BY_ID[id]?.kind === "stat");
              const chartIds = widgets.ids.filter((id) => WIDGET_BY_ID[id]?.kind === "chart");
              const wideIds = widgets.ids.filter((id) => WIDGET_BY_ID[id]?.kind === "wide");
              const renderItem = (id: string, idx: number) => {
                const def = WIDGET_BY_ID[id];
                if (!def) return null;
                const isRemoving = removingId === id;
                return (
                  <EditableWidget
                    key={id}
                    id={id}
                    index={idx}
                    editMode={editMode}
                    removing={isRemoving}
                    onRemove={(rid) => setRemovingId(rid)}
                    onAnimationEnd={() => {
                      if (isRemoving) {
                        widgets.remove(id);
                        setRemovingId(null);
                      }
                    }}
                  >
                    {def.render(widgetCtx)}
                  </EditableWidget>
                );
              };
              const ordered = [...statIds, ...chartIds, ...wideIds];
              const spanClass = (kind: string | undefined) =>
                kind === "stat"
                  ? "col-span-12 sm:col-span-6 lg:col-span-3"
                  : kind === "chart"
                    ? "col-span-12 lg:col-span-6"
                    : "col-span-12";
              return (
                <section className="grid grid-cols-12 gap-4 pt-2">
                  {ordered.map((id, i) => {
                    const def = WIDGET_BY_ID[id];
                    return (
                      <div key={id} className={spanClass(def?.kind)}>
                        {renderItem(id, i)}
                      </div>
                    );
                  })}
                </section>
              );
            })()}
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 320, easing: "cubic-bezier(0.22, 1.2, 0.36, 1)" }}>
            {activeId && WIDGET_BY_ID[activeId] ? (
              <WidgetOverlay>{WIDGET_BY_ID[activeId].render(widgetCtx)}</WidgetOverlay>
            ) : null}
          </DragOverlay>
        </DndContext>







        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent documents</h2>
              <p className="text-sm text-muted-foreground">
                Reports and reconciliations shared by your Fractioneer team.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {docs.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No documents shared yet.
                </li>
              )}
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  onClick={() => handleView(doc.file_path)}
                  className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{doc.file_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleView(doc.file_path)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label={`View ${doc.file_name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(doc.file_path, doc.file_name)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label={`Download ${doc.file_name}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
        </>
        )}

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Need something? Email your Fractioneer team at{" "}
          <a href="mailto:team@fractioneer.co" className="text-accent hover:underline">
            team@fractioneer.co
          </a>
        </footer>
      </main>
    </div>
  );
}

/* --------------------------- Dashboard helpers --------------------------- */

type DashboardFinancialRow = {
  client_id: string;
  monthly_close: string;
  monthly_close_detail: string | null;
  monthly_close_status: string | null;
  cash_position: string;
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
  net_revenue: number | null;
  net_income: number | null;
  period: string | null;
};

function formatCurrencyOrDash(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(v));
}

function compactCurrency(v: number): string {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

function parsePeriod(period: string): Date {
  // period is YYYY-MM-DD; build as local date to avoid TZ shifts
  const [y, m, d] = period.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatAsOf(period: string | null): string {
  if (!period) return "";
  return `As of ${parsePeriod(period).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatMonthShort(period: string): string {
  return parsePeriod(period).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function formatMonthYear(period: string): string {
  return parsePeriod(period).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function useIsDark() {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

function StatCard({
  label,
  value,
  numericValue,
  tone,
  icon,
  periodLabel,
  trend,
}: {
  label: string;
  value: string;
  numericValue?: number | null;
  tone: Tone;
  icon: React.ReactNode;
  periodLabel: string;
  trend?: { dir: "up" | "down"; pct: number };
}) {
  const iconBg =
    tone === "ok"
      ? "rgba(16, 185, 129, 0.12)"
      : tone === "warn"
        ? "rgba(248, 113, 113, 0.12)"
        : "rgba(59, 130, 246, 0.12)";
  const iconColor =
    tone === "ok" ? "#10B981" : tone === "warn" ? "#EF4444" : "#3B82F6";
  return (
    <div className="rounded-xl p-5 nb-card">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-[#6B7280]">
          {label}
        </span>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            backgroundColor: iconBg,
            color: iconColor,
            boxShadow: `0 0 12px ${iconBg}`,
          }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {numericValue != null && Number.isFinite(numericValue) ? (
          <CountUpValue value={numericValue} format={(n) => formatCurrencyOrDash(n)} fallback={value} />
        ) : (
          value
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 dark:text-[#6B7280]">
          {periodLabel || "—"}
        </span>
        {trend && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-medium"
            style={{ color: trend.dir === "up" ? "#10B981" : "#EF4444" }}
          >
            {trend.dir === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.pct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function CountUpValue({
  value,
  format,
  fallback,
  duration = 1200,
}: {
  value: number | null | undefined;
  format: (n: number) => string;
  fallback: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState<number | null>(value == null ? null : 0);
  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      setDisplay(null);
      return;
    }
    const target = Number(value);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  if (display == null) return <>{fallback}</>;
  return <>{format(display)}</>;
}

function LockedToggle({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-slate-50 border-[#E5E9F1] dark:bg-[#0F1729] dark:border-[#1E2A3A]">
      <span className="text-sm text-slate-700 dark:text-[#E5E7EB]">{label}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">Always on</span>
    </div>
  );
}

function PrefToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 bg-slate-50 border-[#E5E9F1] dark:bg-[#0F1729] dark:border-[#1E2A3A]">
      <span className="text-sm text-slate-700 dark:text-[#E5E7EB]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-blue-500"
      />
    </label>
  );
}

function ArApBar({ ar, ap }: { ar: number | null; ap: number | null }) {
  const arVal = ar ?? 0;
  const apVal = ap ?? 0;
  const total = arVal + apVal;
  const arPct = total > 0 ? (arVal / total) * 100 : 0;
  const apPct = total > 0 ? (apVal / total) * 100 : 0;
  return (
    <div className="mt-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1E2A3A]">
        {total > 0 && (
          <>
            <div
              style={{ width: `${arPct}%`, backgroundColor: "#3B82F6", boxShadow: "0 0 8px rgba(59,130,246,0.6)" }}
              className="h-full"
            />
            <div style={{ width: `${apPct}%` }} className="h-full bg-slate-400 dark:bg-[#475569]" />
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-[#9CA3AF]">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: "#3B82F6" }} />
          AR <span className="font-medium text-slate-900 dark:text-white">{formatCurrencyOrDash(ar)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-slate-500 dark:text-[#9CA3AF]">
          <span className="inline-block h-2 w-2 rounded-sm bg-slate-400 dark:bg-[#475569]" />
          AP <span className="font-medium text-slate-900 dark:text-white">{formatCurrencyOrDash(ap)}</span>

        </span>
      </div>
    </div>
  );
}




