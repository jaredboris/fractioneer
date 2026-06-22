import { createFileRoute, redirect, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
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

import logo from "@/assets/fractioneer-logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { AdminShell } from "@/components/portal/AdminSidebar";
import { useCompanyName } from "@/hooks/useProfile";

import { getMyRole, ensureMyRole } from "@/lib/portal.functions";
import { useImpersonation, startImpersonation } from "@/lib/impersonation";

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
      location.pathname === "/portal/setup-2fa" ||
      location.pathname === "/portal/verify-2fa"
    ) {
      return;
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/portal/login" });

    // First-time sign-ins (especially via OAuth) may not have a row in
    // user_roles yet — provision a default `client` role server-side.
    try {
      await ensureMyRole();
    } catch {
      // Non-fatal: getMyRole below will surface a null role and the UI
      // handles it gracefully.
    }

    // Enforce TOTP 2FA for every portal user.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal) {
      if (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        throw redirect({ to: "/portal/verify-2fa" });
      }
      if (aal.nextLevel === "aal1" && aal.currentLevel === "aal1") {
        // No verified TOTP factor yet — force enrollment.
        throw redirect({ to: "/portal/setup-2fa" });
      }
    }
    return { user: data.user };
  },
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
  const location = useLocation();
  if (location.pathname !== "/portal") return <Outlet />;
  return <PortalRouter />;
}

function PortalRouter() {
  const { user } = Route.useRouteContext() as { user?: { id: string; email?: string | null } };
  const impersonation = useImpersonation();
  const [role, setRole] = useState<"admin" | "client" | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await getMyRole();
        if (cancelled) return;
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
  const [uploadsThisMonth, setUploadsThisMonth] = useState<number>(0);
  const [aiSpendThisMonth, setAiSpendThisMonth] = useState<number>(0);
  const [aiCallsThisMonth, setAiCallsThisMonth] = useState<number>(0);

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
      const [{ data: profiles }, { data: dashboards }, { data: documents }, { data: periods }] = await Promise.all([
        supabase.from("profiles").select("id, company_name, full_name").in("id", ids),
        supabase.from("dashboard_data").select("client_id, updated_at").in("client_id", ids),
        supabase.from("documents").select("id, client_id, file_name, created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(50),
        supabase.from("periods").select("id, client_id, period_end, created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(50),
      ]);
      if (cancelled) return;

      const nameMap = new Map<string, string>(
        (profiles ?? []).map((p) => [p.id, p.company_name || p.full_name || p.id.slice(0, 8)]),
      );

      const dashMap = new Map<string, string | null>((dashboards ?? []).map((d) => [d.client_id, d.updated_at]));
      const docMap = new Map<string, { count: number; last: string | null }>();
      for (const d of documents ?? []) {
        const cur = docMap.get(d.client_id) ?? { count: 0, last: null };
        cur.count += 1;
        if (!cur.last || new Date(d.created_at) > new Date(cur.last)) cur.last = d.created_at;
        docMap.set(d.client_id, cur);
      }

      const merged: ClientRow[] = (profiles ?? []).map((p) => ({
        id: p.id,
        company_name: p.company_name,
        full_name: p.full_name,
        dashboard_updated_at: dashMap.get(p.id) ?? null,
        document_count: docMap.get(p.id)?.count ?? 0,
        last_upload_at: docMap.get(p.id)?.last ?? null,
      }));
      merged.sort((a, b) => {
        const aNeeds = !a.dashboard_updated_at || a.document_count === 0 ? 0 : 1;
        const bNeeds = !b.dashboard_updated_at || b.document_count === 0 ? 0 : 1;
        if (aNeeds !== bNeeds) return aNeeds - bNeeds;
        return (a.company_name || a.full_name || "").localeCompare(b.company_name || b.full_name || "");
      });
      setRows(merged);

      // This-month counts
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const uploadsMonth = (documents ?? []).filter((d) => new Date(d.created_at) >= monthStart).length;
      const periodsMonth = (periods ?? []).filter((p) => new Date(p.created_at) >= monthStart).length;
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
    const needsData = list.filter((r) => !r.dashboard_updated_at).length;
    const needsDocs = list.filter((r) => r.document_count === 0).length;
    return { total: list.length, needsData, needsDocs };
  })();

  

  return (
    <AdminShell email={user.email ?? null}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Operations overview
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
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
            <DarkStatCard
              label="AI spend (month)"
              value={`$${aiSpendThisMonth.toFixed(aiSpendThisMonth < 1 ? 4 : 2)}`}
              detail={`${aiCallsThisMonth} extraction${aiCallsThisMonth === 1 ? "" : "s"}`}
              tone="info"
              icon={<TrendingUp className="h-5 w-5" />}
            />
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
                        const noData = !r.dashboard_updated_at;
                        const noDocs = r.document_count === 0;
                        const needsAttention = noData || noDocs;
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
                                  Updated {new Date(r.dashboard_updated_at!).toLocaleDateString()}
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
                                    {noData && noDocs ? "Needs data & docs" : noData ? "Needs data" : "Needs docs"}
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

    </AdminShell>
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
  const toneBg =
    tone === "ok"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : tone === "warn"
        ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
        : "bg-blue-500/10 text-blue-600 dark:text-blue-300";
  return (
    <div className="rounded-2xl border border-[#E5E9F1] bg-white p-5 dark:border-[#1E2A3A] dark:bg-[#111827]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#6B7280]">{label}</span>
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${toneBg}`}>{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500 dark:text-[#9CA3AF]">{detail}</div>
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

  // Customization prefs (persisted in localStorage). Monthly Close + Cash are locked on.
  const [prefs, setPrefs] = useState<{ ar: boolean; ap: boolean }>(() => {
    if (typeof window === "undefined") return { ar: true, ap: true };
    try {
      const raw = window.localStorage.getItem("portal.statCardPrefs");
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ar: parsed.ar !== false, ap: parsed.ap !== false };
      }
    } catch {}
    return { ar: true, ap: true };
  });
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("portal.statCardPrefs", JSON.stringify(prefs));
    } catch {}
  }, [prefs]);

  useEffect(() => {
    let cancelled = false;
    setDashboardRows([]);
    setDocs([]);
    (async () => {
      const [{ data: dash }, { data: documents }] = await Promise.all([
        supabase
          .from("dashboard_data")
          .select("*")
          .eq("client_id", effectiveId)
          .order("period", { ascending: true }),
        supabase.from("documents").select("*").eq("client_id", effectiveId).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setDashboardRows((dash ?? []) as DashboardFinancialRow[]);
      setDocs(documents ?? []);
    })();
    return () => { cancelled = true; };
  }, [effectiveId]);

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

  // Latest row drives the stat cards + period summary
  const latest = dashboardRows[dashboardRows.length - 1] ?? null;
  const prev = dashboardRows.length >= 2 ? dashboardRows[dashboardRows.length - 2] : null;
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

  const chartData = useMemo(() => {
    return dashboardRows
      .filter((r) => r.period)
      .map((r) => {
        const rev = r.net_revenue ?? 0;
        const ni = r.net_income ?? 0;
        return {
          month: formatMonthShort(r.period!),
          Revenue: rev,
          Expenses: Math.max(0, rev - ni),
        };
      });
  }, [dashboardRows]);

  // Gross margin for period summary
  const grossMarginPct = (() => {
    const rev = latest?.net_revenue;
    const ni = latest?.net_income;
    if (rev == null || ni == null || rev === 0) return null;
    const expenses = Math.max(0, Number(rev) - Number(ni));
    return ((Number(rev) - expenses) / Number(rev)) * 100;
  })();

  const isDark = useIsDark();
  const axisStroke = isDark ? "#6B7280" : "#94A3B8";
  const gridStroke = isDark ? "#1E2A3A" : "#E5E9F1";
  const expensesFill = isDark ? "#374151" : "#E2E8F0";
  const tooltipBg = isDark ? "#111827" : "#FFFFFF";
  const tooltipBorder = isDark ? "#1E2A3A" : "#E5E9F1";
  const tooltipText = isDark ? "#E5E7EB" : "#0F172A";
  const legendColor = isDark ? "#9CA3AF" : "#475569";

  return (
    <div className="flex min-h-screen bg-[#EEF2FA] dark:bg-[#0A0F1E]">
      <style>{`
        @keyframes nb-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .nb-rise { animation: nb-rise 0.5s ease-out both; }
        .nb-card { background-color: #FFFFFF; border: 1px solid #E5E9F1; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .nb-card:hover { transform: scale(1.01); box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06); }
        .dark .nb-card { background-color: #111827; border-color: #1E2A3A; }
        .dark .nb-card:hover { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
        .nb-chart-bar { filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.45)); }
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

        <div
          className="mb-4 flex items-start gap-2 rounded-md border px-3 py-2 text-xs nb-rise bg-amber-50 border-amber-200 text-amber-900 dark:bg-[#1C1500] dark:border-[#92400E] dark:text-[#FCD34D]"
          style={{ animationDelay: "60ms" }}
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-[#F59E0B]" />
          <p>
            These figures are AI-extracted from your uploaded financials and may contain errors. For
            verified data,{" "}
            {latestExcel ? (
              <button
                type="button"
                onClick={() => handleDownload(latestExcel.file_path, latestExcel.file_name)}
                className="font-medium underline underline-offset-2 text-amber-800 dark:text-[#FDE68A]"
              >
                download the source file
              </button>
            ) : (
              <span className="font-medium opacity-60">download the source file</span>
            )}
            .
          </p>
        </div>

        <div className="mb-3 flex items-center justify-end nb-rise" style={{ animationDelay: "120ms" }}>
          <button
            onClick={() => setCustomizeOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors bg-white border-[#E5E9F1] text-slate-700 hover:bg-slate-50 dark:bg-[#111827] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Manage Widgets
          </button>
        </div>

        {customizeOpen && (
          <div className="mb-3 rounded-xl p-4 nb-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Customize stat cards</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">
                  Choose which cards to display. Monthly Close and Cash Position are always shown.
                </p>
              </div>
              <button
                onClick={() => setCustomizeOpen(false)}
                className="rounded p-1 text-slate-500 dark:text-[#9CA3AF]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <LockedToggle label="Monthly Close Status" />
              <LockedToggle label="Cash Position" />
              <PrefToggle
                label="Accounts Receivable"
                checked={prefs.ar}
                onChange={(v) => setPrefs({ ...prefs, ar: v })}
              />
              <PrefToggle
                label="Accounts Payable"
                checked={prefs.ap}
                onChange={(v) => setPrefs({ ...prefs, ap: v })}
              />
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="nb-rise" style={{ animationDelay: "180ms" }}>
            <StatCard
              label="Monthly Close"
              value={latest?.monthly_close_status ?? latest?.monthly_close ?? "—"}
              tone={
                latest?.monthly_close_status === "closed"
                  ? "ok"
                  : latest?.monthly_close
                    ? toneForMonthly(latest.monthly_close)
                    : "info"
              }
              icon={<CheckCircle2 className="h-5 w-5" />}
              periodLabel={periodLabel}
            />
          </div>
          <div className="nb-rise" style={{ animationDelay: "280ms" }}>
            <StatCard
              label="Cash Position"
              value={formatCurrencyOrDash(latest?.cash_balance ?? null)}
              numericValue={latest?.cash_balance ?? null}
              tone="info"
              icon={<Wallet className="h-5 w-5" />}
              periodLabel={periodLabel}
              trend={trendFor(latest?.cash_balance, prev?.cash_balance)}
            />
          </div>
          {prefs.ar && (
            <div className="nb-rise" style={{ animationDelay: "380ms" }}>
              <StatCard
                label="Accounts Receivable"
                value={formatCurrencyOrDash(latest?.total_ar ?? null)}
                numericValue={latest?.total_ar ?? null}
                tone="info"
                icon={<Receipt className="h-5 w-5" />}
                periodLabel={periodLabel}
                trend={trendFor(latest?.total_ar, prev?.total_ar)}
              />
            </div>
          )}
          {prefs.ap && (
            <div className="nb-rise" style={{ animationDelay: "480ms" }}>
              <StatCard
                label="Accounts Payable"
                value={formatCurrencyOrDash(latest?.total_ap ?? null)}
                numericValue={latest?.total_ap ?? null}
                tone="info"
                icon={<Receipt className="h-5 w-5" />}
                periodLabel={periodLabel}
                trend={trendFor(latest?.total_ap, prev?.total_ap)}
              />
            </div>
          )}
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div
            className="flex min-h-[360px] flex-col rounded-xl p-5 nb-card nb-rise lg:col-span-3"
            style={{ animationDelay: "560ms" }}
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
                Revenue vs Expenses
              </h2>
              <p className="text-xs text-slate-400 dark:text-[#6B7280]">By month, based on submitted financials.</p>
            </div>
            {chartData.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400 dark:text-[#6B7280]">
                No financial data available yet.
              </div>
            ) : (
              <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="nbRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="month" stroke={axisStroke} fontSize={12} />
                    <YAxis
                      stroke={axisStroke}
                      fontSize={12}
                      tickFormatter={(v) => compactCurrency(Number(v))}
                    />
                    <RTooltip
                      formatter={(v: number) => formatCurrencyOrDash(v)}
                      contentStyle={{
                        background: tooltipBg,
                        border: `1px solid ${tooltipBorder}`,
                        borderRadius: 8,
                        fontSize: 12,
                        color: tooltipText,
                      }}
                      cursor={{ fill: "rgba(59,130,246,0.08)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: legendColor }} />
                    <Bar
                      dataKey="Revenue"
                      fill="url(#nbRevenue)"
                      radius={[4, 4, 0, 0]}
                      className="nb-chart-bar"
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Bar
                      dataKey="Expenses"
                      fill={expensesFill}
                      radius={[4, 4, 0, 0]}
                      animationDuration={1100}
                      animationBegin={150}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div
            className="relative flex min-h-[360px] flex-col overflow-hidden rounded-xl p-5 nb-card nb-rise lg:col-span-2"
            style={{ animationDelay: "660ms" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Period Summary
            </h2>
            <p className="text-xs text-slate-400 dark:text-[#6B7280]">
              {latest?.period ? formatMonthYear(latest.period) : "No period set"}
            </p>

            <div className="relative mt-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
                Net Revenue
              </div>
              <div className="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                <CountUpValue value={latest?.net_revenue ?? null} format={(n) => formatCurrencyOrDash(n)} fallback="—" />
              </div>
              <svg
                aria-hidden
                className="pointer-events-none absolute -bottom-4 left-0 right-0 h-12 w-full opacity-70"
                viewBox="0 0 200 40"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="nbSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,30 C30,22 50,28 75,18 C100,8 125,22 150,14 C175,8 190,18 200,12 L200,40 L0,40 Z"
                  fill="url(#nbSpark)"
                />
                <path
                  d="M0,30 C30,22 50,28 75,18 C100,8 125,22 150,14 C175,8 190,18 200,12"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  fill="none"
                  style={{ filter: "drop-shadow(0 0 4px rgba(59,130,246,0.7))" }}
                />
              </svg>
            </div>

            <dl className="mt-10 space-y-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
                  Net Income
                </dt>
                <dd
                  className="mt-1 inline-flex items-center gap-1.5 text-xl font-semibold"
                  style={{
                    color:
                      latest?.net_income == null
                        ? undefined
                        : latest.net_income < 0
                          ? "#F87171"
                          : "#10B981",
                  }}
                >
                  {latest?.net_income == null && (
                    <span className="text-slate-900 dark:text-[#E5E7EB]">—</span>
                  )}
                  {latest?.net_income != null && (
                    <>
                      {latest.net_income < 0 ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                      {formatCurrencyOrDash(latest.net_income)}
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
                  Gross Margin
                </dt>
                <dd
                  className="mt-1 text-xl font-semibold"
                  style={{
                    color:
                      grossMarginPct == null
                        ? undefined
                        : grossMarginPct < 0
                          ? "#F87171"
                          : "#10B981",
                  }}
                >
                  {grossMarginPct == null ? (
                    <span className="text-slate-900 dark:text-[#E5E7EB]">—</span>
                  ) : (
                    `${grossMarginPct.toFixed(1)}%`
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
                  AR vs AP
                </dt>
                <ArApBar ar={latest?.total_ar ?? null} ap={latest?.total_ap ?? null} />
              </div>
            </dl>
          </div>
        </section>





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




