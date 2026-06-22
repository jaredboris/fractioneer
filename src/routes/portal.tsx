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
import { getMyRole, ensureMyRole } from "@/lib/portal.functions";

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
  const [role, setRole] = useState<"admin" | "client" | null | undefined>(undefined);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      // Server-verified role: requireSupabaseAuth middleware re-validates the
      // JWT and queries user_roles server-side. Cannot be spoofed by editing
      // client state or DevTools.
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

function AdminOverview({ role }: { role: string }) {
  const { user } = Route.useRouteContext() as { user: { id: string; email?: string | null } };
  const [rows, setRows] = useState<ClientRow[] | null>(null);
  const [previewId, setPreviewId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        if (!cancelled) setRows([]);
        return;
      }
      const [{ data: profiles }, { data: dashboards }, { data: documents }] = await Promise.all([
        supabase.from("profiles").select("id, company_name, full_name").in("id", ids),
        supabase.from("dashboard_data").select("client_id, updated_at").in("client_id", ids),
        supabase.from("documents").select("client_id, created_at").in("client_id", ids),
      ]);
      if (cancelled) return;

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
      // Sort: needs attention first, then alphabetical
      merged.sort((a, b) => {
        const aNeeds = !a.dashboard_updated_at || a.document_count === 0 ? 0 : 1;
        const bNeeds = !b.dashboard_updated_at || b.document_count === 0 ? 0 : 1;
        if (aNeeds !== bNeeds) return aNeeds - bNeeds;
        return (a.company_name || a.full_name || "").localeCompare(b.company_name || b.full_name || "");
      });
      setRows(merged);
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
    <div className="min-h-screen bg-muted/40">
      <PortalHeader
        displayName="Fractioneer"
        email={user.email ?? null}
        role={role}
        showAdminLink={true}
      />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {previewId ? "Client preview" : "Operations overview"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {previewId
                ? "Read-only view of what this client sees when they log in."
                : "Status of every client portal at a glance."}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                View as client
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative">
                  <Eye className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={previewId}
                    onChange={(e) => setPreviewId(e.target.value)}
                    disabled={!rows || rows.length === 0}
                    className="block min-w-[16rem] rounded-md border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  >
                    <option value="">— Admin overview —</option>
                    {(rows ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.company_name || r.full_name || r.id}
                      </option>
                    ))}
                  </select>
                </div>
                {previewId && (
                  <button
                    onClick={() => setPreviewId("")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label="Exit preview"
                  >
                    <X className="h-3.5 w-3.5" />
                    Exit preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {previewId ? (
          <ClientPreview
            clientId={previewId}
            clientLabel={
              (rows ?? []).find((r) => r.id === previewId)?.company_name ||
              (rows ?? []).find((r) => r.id === previewId)?.full_name ||
              "Client"
            }
          />
        ) : (
          <>
            <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Clients"
                value={String(totals.total)}
                detail="Active client portals"
                tone="info"
                icon={<Building2 className="h-5 w-5" />}
              />
              <SummaryCard
                label="Need dashboard data"
                value={String(totals.needsData)}
                detail={totals.needsData === 0 ? "All set" : "Set values to share with client"}
                tone={totals.needsData === 0 ? "ok" : "warn"}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <SummaryCard
                label="Need documents"
                value={String(totals.needsDocs)}
                detail={totals.needsDocs === 0 ? "All have files" : "No files uploaded yet"}
                tone={totals.needsDocs === 0 ? "ok" : "warn"}
                icon={<Upload className="h-5 w-5" />}
              />
            </section>

            <section className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Clients</h2>
                  <p className="text-xs text-muted-foreground">
                    Flagged rows need data set or documents uploaded.
                  </p>
                </div>
                <Link
                  to="/portal/admin"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage data
                </Link>
              </div>

              {rows === null ? (
                <div className="flex items-center justify-center px-5 py-12 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : rows.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No clients yet. Use <strong>Manage data</strong> to add your first client.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-5 py-3">Client</th>
                        <th className="px-5 py-3">Dashboard</th>
                        <th className="px-5 py-3">Documents</th>
                        <th className="px-5 py-3">Last upload</th>
                        <th className="px-5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((r) => {
                        const noData = !r.dashboard_updated_at;
                        const noDocs = r.document_count === 0;
                        const needsAttention = noData || noDocs;
                        return (
                          <tr key={r.id} className={needsAttention ? "bg-destructive/[0.03]" : ""}>
                            <td className="px-5 py-4">
                              <div className="font-medium text-foreground">
                                {r.company_name || r.full_name || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">{r.id.slice(0, 8)}…</div>
                            </td>
                            <td className="px-5 py-4">
                              {noData ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  Not set
                                </span>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  Updated {new Date(r.dashboard_updated_at!).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm font-medium text-foreground">
                                {r.document_count}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-muted-foreground">
                              {r.last_upload_at ? new Date(r.last_upload_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {needsAttention ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive">
                                    <AlertTriangle className="h-3 w-3" />
                                    {noData && noDocs
                                      ? "Needs data & docs"
                                      : noData
                                        ? "Needs data"
                                        : "Needs docs"}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Ready
                                  </span>
                                )}
                                <button
                                  onClick={() => setPreviewId(r.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
          </>
        )}
      </main>
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
  const [companyName, setCompanyName] = useState<string>("");
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
    (async () => {
      const [{ data: profile }, { data: dash }, { data: documents }] = await Promise.all([
        supabase.from("profiles").select("company_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("dashboard_data")
          .select("*")
          .eq("client_id", user.id)
          .order("period", { ascending: true }),
        supabase.from("documents").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setCompanyName(profile?.company_name ?? "");
      setDashboardRows((dash ?? []) as DashboardFinancialRow[]);
      setDocs(documents ?? []);
    })();
    return () => { cancelled = true; };
  }, [user.id]);

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

  const displayName = companyName || user.email || "Welcome";

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F8FAFC" }}>
      <PortalHeader displayName={displayName} email={user.email ?? null} role={role} showAdminLink={false} />

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back{companyName ? `, ${companyName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's the latest snapshot of your finance operations.
          </p>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p>
            These figures are AI-extracted from your uploaded financials and may contain errors. For
            verified data,{" "}
            {latestExcel ? (
              <button
                type="button"
                onClick={() => handleDownload(latestExcel.file_path, latestExcel.file_name)}
                className="font-medium text-amber-900 underline underline-offset-2 hover:text-amber-950"
              >
                download the source file
              </button>
            ) : (
              <span className="font-medium opacity-70">download the source file</span>
            )}
            .
          </p>
        </div>

        <div className="my-4 h-px w-full bg-slate-200" />

        <div className="mb-3 flex items-center justify-end">
          <button
            onClick={() => setCustomizeOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Customize
          </button>
        </div>

        {customizeOpen && (
          <div className="mb-3 rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(10,31,68,0.04)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Customize stat cards</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choose which cards to display. Monthly Close and Cash Position are always shown.
                </p>
              </div>
              <button
                onClick={() => setCustomizeOpen(false)}
                className="rounded p-1 text-muted-foreground hover:bg-muted"
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
          <StatCard
            label="Cash Position"
            value={formatCurrencyOrDash(latest?.cash_balance ?? null)}
            tone="info"
            icon={<Wallet className="h-5 w-5" />}
            periodLabel={periodLabel}
            trend={trendFor(latest?.cash_balance, prev?.cash_balance)}
          />
          {prefs.ar && (
            <StatCard
              label="Accounts Receivable"
              value={formatCurrencyOrDash(latest?.total_ar ?? null)}
              tone="info"
              icon={<Receipt className="h-5 w-5" />}
              periodLabel={periodLabel}
              trend={trendFor(latest?.total_ar, prev?.total_ar)}
            />
          )}
          {prefs.ap && (
            <StatCard
              label="Accounts Payable"
              value={formatCurrencyOrDash(latest?.total_ap ?? null)}
              tone="info"
              icon={<Receipt className="h-5 w-5" />}
              periodLabel={periodLabel}
              trend={trendFor(latest?.total_ap, prev?.total_ap)}
            />
          )}
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="flex min-h-[360px] flex-col rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(10,31,68,0.04)] lg:col-span-3">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Revenue vs Expenses
              </h2>
              <p className="text-xs text-muted-foreground">By month, based on submitted financials.</p>
            </div>
            {chartData.length === 0 ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                No financial data available yet.
              </div>
            ) : (
              <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={12}
                      tickFormatter={(v) => compactCurrency(Number(v))}
                    />
                    <RTooltip
                      formatter={(v: number) => formatCurrencyOrDash(v)}
                      contentStyle={{
                        background: "#ffffff",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="flex min-h-[360px] flex-col rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(10,31,68,0.04)] lg:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Period Summary
            </h2>
            <p className="text-xs text-muted-foreground">
              {latest?.period ? formatMonthYear(latest.period) : "No period set"}
            </p>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Net Revenue
                </dt>
                <dd className="mt-1 text-xl font-semibold text-foreground">
                  {formatCurrencyOrDash(latest?.net_revenue ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Net Income
                </dt>
                <dd
                  className={`mt-1 inline-flex items-center gap-1.5 text-xl font-semibold ${
                    latest?.net_income == null
                      ? "text-foreground"
                      : latest.net_income < 0
                        ? "text-destructive"
                        : "text-accent"
                  }`}
                >
                  {latest?.net_income != null &&
                    (latest.net_income < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    ))}
                  {formatCurrencyOrDash(latest?.net_income ?? null)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Gross Margin
                </dt>
                <dd
                  className={`mt-1 text-xl font-semibold ${
                    grossMarginPct == null
                      ? "text-foreground"
                      : grossMarginPct < 0
                        ? "text-destructive"
                        : "text-accent"
                  }`}
                >
                  {grossMarginPct == null ? "—" : `${grossMarginPct.toFixed(1)}%`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

function StatCard({
  label,
  value,
  tone,
  icon,
  periodLabel,
}: {
  label: string;
  value: string;
  tone: Tone;
  icon: React.ReactNode;
  periodLabel: string;
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
      <div className="mt-1 text-xs text-muted-foreground">{periodLabel || "—"}</div>
    </div>
  );
}

function LockedToggle({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Always on</span>
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
    <label className="flex cursor-pointer items-center justify-between rounded-md border border-border bg-background px-3 py-2 hover:bg-muted/40">
      <span className="text-sm text-foreground">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-primary"
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
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 && (
          <>
            <div style={{ width: `${arPct}%` }} className="h-full bg-primary" />
            <div style={{ width: `${apPct}%` }} className="h-full bg-muted-foreground/40" />
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
          AR <span className="font-medium text-foreground">{formatCurrencyOrDash(ar)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-sm bg-muted-foreground/40" />
          AP <span className="font-medium text-foreground">{formatCurrencyOrDash(ap)}</span>
        </span>
      </div>
    </div>
  );
}

