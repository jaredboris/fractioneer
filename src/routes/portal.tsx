import { createFileRoute, redirect, useNavigate, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
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
  const [dashboard, setDashboard] = useState<{
    monthly_close: string;
    monthly_close_detail: string | null;
    cash_position: string;
    cash_position_detail: string | null;
    ap_ar_status: string;
    ap_ar_detail: string | null;
  } | null>(null);
  const [docs, setDocs] = useState<
    { id: string; file_name: string; file_path: string; file_size: number | null; created_at: string }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: profile }, { data: dash }, { data: documents }] = await Promise.all([
        supabase.from("profiles").select("company_name").eq("id", user.id).maybeSingle(),
        supabase.from("dashboard_data").select("*").eq("client_id", user.id).maybeSingle(),
        supabase.from("documents").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setCompanyName(profile?.company_name ?? "");
      setDashboard(dash ?? null);
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
    <div className="min-h-screen bg-muted/40">
      <PortalHeader displayName={displayName} email={user.email ?? null} role={role} showAdminLink={false} />

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back{companyName ? `, ${companyName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's the latest snapshot of your finance operations.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(10,31,68,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
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
