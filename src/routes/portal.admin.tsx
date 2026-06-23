import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Upload, FileText, Loader2, Plus, Trash2, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/portal/AdminSidebar";
import { getMyRole, createClientAccount, extractFinancialsFromRows, saveExtractedFinancials, type ExtractedFinancials, type ExtractedMonth } from "@/lib/portal.functions";
import * as XLSX from "xlsx";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { getCached, setCached } from "@/lib/portal-cache";

const adminSearchSchema = z.object({
  tab: fallback(z.enum(["clients", "upload", "activity"]), "clients").default("clients"),
});

const portalRouteApi = getRouteApi("/portal");

export const Route = createFileRoute("/portal/admin")({
  validateSearch: zodValidator(adminSearchSchema),
  head: () => ({
    meta: [
      { title: "Admin — Fractioneer Client Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminGate,
});

function AdminGate() {
  const { user } = portalRouteApi.useRouteContext() as { user?: { id: string; email?: string | null } };
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok" | "denied">(() =>
    user ? (getCached<string | null>("role", user.id) === "client" ? "checking" : "ok") : "checking",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Server-side admin check. requireSupabaseAuth re-validates the JWT and
      // user_roles is queried server-side, so a non-admin can't reach the
      // admin UI shell by skipping the client redirect.
      try {
        const result = await getMyRole();
        if (cancelled) return;
        setCached("role", user?.id ?? "current", result.role);
        if (result.role === "admin") setStatus("ok");
        else {
          setStatus("denied");
          navigate({ to: "/portal", replace: true });
        }
      } catch {
        if (cancelled) return;
        setStatus("denied");
        navigate({ to: "/portal/login", replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, user?.id]);

  if (status !== "ok") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <AdminPage />;
}

type Client = { id: string; company_name: string | null; full_name: string | null };
type DashboardData = {
  client_id: string;
  monthly_close: string;
  monthly_close_detail: string | null;
  cash_position: string;
  cash_position_detail: string | null;
  ap_ar_status: string;
  ap_ar_detail: string | null;
};
type Document = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
};
type ExistingPeriod = {
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
  net_revenue: number | null;
  net_income: number | null;
};


const MONTHLY_OPTIONS = ["On track", "Delayed", "Ready"];
const APAR_OPTIONS = ["Current", "Behind"];

type ActivityLogItem = {
  id: string;
  kind: "upload" | "extraction";
  client_id: string;
  client_name: string;
  label: string;
  created_at: string;
  flagged_nulls: string[];
};

function AdminPage() {
  const { user } = portalRouteApi.useRouteContext() as { user: { id: string; email?: string | null } };
  const navigate = useNavigate();
  const search = Route.useSearch();
  const tab = search.tab;
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Omit<DashboardData, "client_id">>({
    monthly_close: "On track",
    monthly_close_detail: "",
    cash_position: "",
    cash_position_detail: "",
    ap_ar_status: "Current",
    ap_ar_detail: "",
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // Periods (Reports / Cash Flow)
  type PeriodRow = {
    id: string;
    period_end: string;
    net_revenue: number | null;
    net_income: number | null;
    gross_margin: number | null;
    cash_balance: number | null;
    total_ar: number | null;
    total_ap: number | null;
    document_id: string | null;
  };
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [periodForm, setPeriodForm] = useState({
    period_end: "",
    net_revenue: "",
    net_income: "",
    gross_margin: "",
    cash_balance: "",
    total_ar: "",
    total_ap: "",
    document_id: "",
  });
  const [savingPeriod, setSavingPeriod] = useState(false);

  const loadClients = useCallback(async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "client");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (ids.length === 0) {
      setClients([]);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, company_name, full_name")
      .in("id", ids);
    setClients(profiles ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      await loadClients();
      setLoading(false);
    })();
  }, [loadClients]);

  const loadClientData = useCallback(async (clientId: string) => {
    const [{ data: dash }, { data: docs }, { data: pers }] = await Promise.all([
      supabase.from("dashboard_data").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("documents").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase
        .from("periods")
        .select("id, period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap, document_id")
        .eq("client_id", clientId)
        .order("period_end", { ascending: false }),
    ]);
    if (dash) {
      setForm({
        monthly_close: dash.monthly_close,
        monthly_close_detail: dash.monthly_close_detail ?? "",
        cash_position: dash.cash_position,
        cash_position_detail: dash.cash_position_detail ?? "",
        ap_ar_status: dash.ap_ar_status,
        ap_ar_detail: dash.ap_ar_detail ?? "",
      });
    } else {
      setForm({
        monthly_close: "On track",
        monthly_close_detail: "",
        cash_position: "",
        cash_position_detail: "",
        ap_ar_status: "Current",
        ap_ar_detail: "",
      });
    }
    setDocuments(docs ?? []);
    setPeriods((pers ?? []) as PeriodRow[]);
  }, []);

  useEffect(() => {
    if (selectedId) loadClientData(selectedId);
  }, [selectedId, loadClientData]);

  async function handleSaveDashboard(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setStatus(null);
    const { error } = await supabase.from("dashboard_data").upsert({
      client_id: selectedId,
      ...form,
    });
    setSaving(false);
    setStatus(error ? { kind: "err", msg: error.message } : { kind: "ok", msg: "Dashboard saved." });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setUploading(true);
    setStatus(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${selectedId}/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage
      .from("client-documents")
      .upload(path, file, { contentType: file.type });
    if (upErr) {
      setUploading(false);
      setStatus({ kind: "err", msg: upErr.message });
      e.target.value = "";
      return;
    }
    const { error: dbErr } = await supabase.from("documents").insert({
      client_id: selectedId,
      file_name: file.name,
      file_path: path,
      file_size: file.size,
      uploaded_by: user.id,
    });
    setUploading(false);
    e.target.value = "";
    if (dbErr) {
      setStatus({ kind: "err", msg: dbErr.message });
      return;
    }
    setStatus({ kind: "ok", msg: `Uploaded ${file.name}.` });
    loadClientData(selectedId);
  }

  async function handleDeleteDoc(doc: Document) {
    if (!confirm(`Delete ${doc.file_name}?`)) return;
    await supabase.storage.from("client-documents").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    loadClientData(selectedId);
  }

  function parseNum(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  async function handleSavePeriod(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !periodForm.period_end) return;
    setSavingPeriod(true);
    setStatus(null);
    const { error } = await supabase.from("periods").upsert(
      {
        client_id: selectedId,
        period_end: periodForm.period_end,
        net_revenue: parseNum(periodForm.net_revenue),
        net_income: parseNum(periodForm.net_income),
        gross_margin: parseNum(periodForm.gross_margin),
        cash_balance: parseNum(periodForm.cash_balance),
        total_ar: parseNum(periodForm.total_ar),
        total_ap: parseNum(periodForm.total_ap),
        document_id: periodForm.document_id || null,
      },
      { onConflict: "client_id,period_end" },
    );
    setSavingPeriod(false);
    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }
    setStatus({ kind: "ok", msg: "Period saved." });
    setPeriodForm({
      period_end: "",
      net_revenue: "",
      net_income: "",
      gross_margin: "",
      cash_balance: "",
      total_ar: "",
      total_ap: "",
      document_id: "",
    });
    loadClientData(selectedId);
  }

  async function handleDeletePeriod(id: string, label: string) {
    if (!confirm(`Delete period ${label}?`)) return;
    await supabase.from("periods").delete().eq("id", id);
    loadClientData(selectedId);
  }

  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    company_name: "",
    full_name: "",
  });

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    setAddBusy(true);
    setStatus(null);
    try {
      const result = await createClientAccount({
        data: {
          email: addForm.email.trim(),
          password: addForm.password,
          company_name: addForm.company_name.trim(),
          full_name: addForm.full_name.trim() || undefined,
        },
      });
      setStatus({ kind: "ok", msg: `Added ${result.company_name}. They can sign in with their email and password.` });
      setAddForm({ email: "", password: "", company_name: "", full_name: "" });
      setAddOpen(false);
      await loadClients();
      setSelectedId(result.id);
    } catch (err) {
      setStatus({ kind: "err", msg: err instanceof Error ? err.message : "Failed to create client" });
    } finally {
      setAddBusy(false);
    }
  }

  // ----- Excel upload / AI extraction -----
  const [xlsxFileName, setXlsxFileName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [savingExtracted, setSavingExtracted] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFinancials | null>(null);
  const [extractedSourceRows, setExtractedSourceRows] = useState<string | null>(null);
  const [existingByPeriod, setExistingByPeriod] = useState<Record<string, ExistingPeriod>>({});

  const [incomeStatementDetected, setIncomeStatementDetected] = useState(false);


  async function handleXlsxSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedId) return;
    setStatus(null);
    setExtracted(null);
    setExtractedSourceRows(null);
    setExistingByPeriod({});
    setIncomeStatementDetected(false);
    setAnalyzing(true);
    setXlsxFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      if (wb.SheetNames.length === 0) throw new Error("Spreadsheet has no sheets.");

      const SKIP_SUBSTR = ["gl", "general ledger", "detail", "invoices", "payments"];
      const PRIORITY_SUBSTR = ["income statement", "p&l", "pnl", "profit and loss", "balance sheet", "cash flow", "aging"];
      const PRIORITY_TOKEN = ["is", "bs", "ar", "ap"];
      const MAX_ROWS = 600;

      type Parsed = { name: string; rows: unknown[][]; priority: boolean; isIncomeStmt: boolean };
      const parsed: Parsed[] = wb.SheetNames.map((name) => {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, header: 1 }) as unknown[][];
        const lower = name.toLowerCase();
        const tokens = lower.split(/[^a-z0-9&]+/).filter(Boolean);
        const isPriority =
          PRIORITY_SUBSTR.some((s) => lower.includes(s)) ||
          PRIORITY_TOKEN.some((t) => tokens.includes(t));
        const isIncomeStmt =
          lower.includes("income statement") ||
          lower.includes("p&l") ||
          lower.includes("pnl") ||
          lower.includes("profit and loss") ||
          tokens.includes("is");
        return { name, rows, priority: isPriority, isIncomeStmt };
      });

      const isSkipped = (p: Parsed) =>
        SKIP_SUBSTR.some((s) => p.name.toLowerCase().includes(s)) || p.rows.length > MAX_ROWS;

      let chosen = parsed.filter((p) => !isSkipped(p));
      if (chosen.length === 0) {
        chosen = [...parsed].sort((a, b) => a.rows.length - b.rows.length).slice(0, 3);
      }
      chosen.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

      setIncomeStatementDetected(chosen.some((p) => p.isIncomeStmt));

      const blocks = chosen.map((p) => `=== Sheet: ${p.name} ===\n${JSON.stringify(p.rows)}`);
      const rowsStr = blocks.join("\n\n").slice(0, 400_000);
      const result = await extractFinancialsFromRows({ data: { rows: rowsStr } });
      const sortedMonths = [...result.months].sort((a, b) =>
        a.period_end < b.period_end ? -1 : a.period_end > b.period_end ? 1 : 0,
      );
      setExtracted({ months: sortedMonths });
      setExtractedSourceRows(rowsStr);


      // Fetch any existing rows for these periods so we can flag overwrites.
      if (sortedMonths.length > 0) {
        const periodList = sortedMonths.map((m) => m.period_end);
        const { data: existingRows } = await supabase
          .from("periods")
          .select("period_end, cash_balance, total_ar, total_ap, net_revenue, net_income")
          .eq("client_id", selectedId)
          .in("period_end", periodList);
        const map: Record<string, ExistingPeriod> = {};
        for (const r of existingRows ?? []) {
          map[r.period_end as string] = {
            cash_balance: r.cash_balance as number | null,
            total_ar: r.total_ar as number | null,
            total_ap: r.total_ap as number | null,
            net_revenue: r.net_revenue as number | null,
            net_income: r.net_income as number | null,
          };
        }
        setExistingByPeriod(map);
      }
    } catch (err) {
      setStatus({ kind: "err", msg: err instanceof Error ? err.message : "Failed to analyze spreadsheet" });
      setXlsxFileName(null);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmExtracted() {
    if (!extracted || extracted.months.length === 0 || !selectedId) return;
    setSavingExtracted(true);
    setStatus(null);
    try {
      await saveExtractedFinancials({
        data: { client_id: selectedId, months: extracted.months },
      });
      setStatus({ kind: "ok", msg: `Saved ${extracted.months.length} month${extracted.months.length === 1 ? "" : "s"} to the client's dashboard. Generating AI insights…` });
      const sourceRows = extractedSourceRows;
      setExtracted(null);
      setExtractedSourceRows(null);
      setExistingByPeriod({});
      setXlsxFileName(null);
      setIncomeStatementDetected(false);
      loadClientData(selectedId);
      // Fire-and-forget: regenerate AI insights for this client. Don't block the
      // save UX; surface errors quietly.
      void generateAiInsights({
        data: { client_id: selectedId, source_rows: sourceRows ?? undefined },
      })
        .then((r) => {
          setStatus({ kind: "ok", msg: `Saved and generated ${r.count} AI insight${r.count === 1 ? "" : "s"}.` });
        })
        .catch((err) => {
          console.error("[ai_insights] generation failed", err);
        });
    } catch (err) {
      setStatus({ kind: "err", msg: err instanceof Error ? err.message : "Failed to save" });
    } finally {
      setSavingExtracted(false);
    }
  }




  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }

  const titleByTab: Record<string, { title: string; sub: string }> = {
    clients: { title: "Client management", sub: "Update dashboard metrics and manage documents for any client." },
    upload: { title: "Upload financials", sub: "Drop in an Excel file — AI extracts cash, AR, AP, revenue, and close status." },
    activity: { title: "Activity log", sub: "Every upload and AI extraction across all clients." },
  };
  const head = titleByTab[tab];

  return (
    <AdminShell email={user.email ?? null}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{head.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">{head.sub}</p>
      </div>

      {status && (
        <div
          className={`mb-6 rounded-md border px-4 py-2 text-sm ${
            status.kind === "ok"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-300"
          }`}
        >
          {status.msg}
        </div>
      )}

      {tab === "activity" ? (
        <ActivityLogPanel />
      ) : (
        <>


        <section className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Select client
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading}
                className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">
                  {loading ? "Loading…" : clients.length === 0 ? "No clients yet" : "— choose a client —"}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.full_name || c.id}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {addOpen ? "Cancel" : "Add client"}
            </button>
          </div>

          {addOpen && (
            <form
              onSubmit={handleCreateClient}
              className="mt-5 grid grid-cols-1 gap-4 rounded-lg border border-border bg-background p-5 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-foreground">New client</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Creates the login, profile, and <code>client</code> role in one step. Share the email and
                  temporary password with them.
                </p>
              </div>
              <label className="block text-xs font-medium text-muted-foreground">
                Company name
                <input
                  required
                  value={addForm.company_name}
                  onChange={(e) => setAddForm({ ...addForm, company_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Contact name <span className="text-muted-foreground/60">(optional)</span>
                <input
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Email
                <input
                  required
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Temporary password
                <input
                  required
                  type="password"
                  minLength={8}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </label>
              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBusy}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {addBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create client
                </button>
              </div>
            </form>
          )}
        </section>

        {tab === "clients" && selectedId ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">Dashboard values</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Shown on the client's portal homepage.
              </p>

              <form onSubmit={handleSaveDashboard} className="mt-5 space-y-5">
                <Field label="Monthly close status">
                  <select
                    value={form.monthly_close}
                    onChange={(e) => setForm({ ...form, monthly_close: e.target.value })}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {MONTHLY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Detail (e.g. November close — 3 days remaining)"
                    value={form.monthly_close_detail ?? ""}
                    onChange={(v) => setForm({ ...form, monthly_close_detail: v })}
                  />
                </Field>

                <Field label="Cash position">
                  <Input
                    placeholder="$1.84M"
                    value={form.cash_position}
                    onChange={(v) => setForm({ ...form, cash_position: v })}
                  />
                  <Input
                    placeholder="Detail (e.g. 14.2 months runway · +6% MoM)"
                    value={form.cash_position_detail ?? ""}
                    onChange={(v) => setForm({ ...form, cash_position_detail: v })}
                  />
                </Field>

                <Field label="AP / AR status">
                  <select
                    value={form.ap_ar_status}
                    onChange={(e) => setForm({ ...form, ap_ar_status: e.target.value })}
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    {APAR_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Detail (e.g. AP $128k · AR $342k · 0 past due)"
                    value={form.ap_ar_detail ?? ""}
                    onChange={(v) => setForm({ ...form, ap_ar_detail: v })}
                  />
                </Field>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save dashboard values"}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground">Documents</h2>
              <p className="mt-1 text-sm text-muted-foreground">PDF or Excel files shared with this client.</p>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Click to upload PDF or Excel
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.xls,.xlsx,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>

              <ul className="mt-5 divide-y divide-border rounded-md border border-border">
                {documents.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-muted-foreground">No files yet.</li>
                )}
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{d.file_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(d.created_at).toLocaleDateString()}
                          {d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(d)}
                      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${d.file_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === "clients" && selectedId && (
          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Reporting periods</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Per-period financials power the Reports and Cash Flow tabs. Use one row per period end date.
            </p>

            <form onSubmit={handleSavePeriod} className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-4">
              <NumField label="Period end" type="date" required value={periodForm.period_end} onChange={(v) => setPeriodForm({ ...periodForm, period_end: v })} />
              <NumField label="Net revenue" value={periodForm.net_revenue} onChange={(v) => setPeriodForm({ ...periodForm, net_revenue: v })} />
              <NumField label="Net income" value={periodForm.net_income} onChange={(v) => setPeriodForm({ ...periodForm, net_income: v })} />
              <NumField label="Gross margin (% or 0–1)" value={periodForm.gross_margin} onChange={(v) => setPeriodForm({ ...periodForm, gross_margin: v })} />
              <NumField label="Cash balance" value={periodForm.cash_balance} onChange={(v) => setPeriodForm({ ...periodForm, cash_balance: v })} />
              <NumField label="Total AR" value={periodForm.total_ar} onChange={(v) => setPeriodForm({ ...periodForm, total_ar: v })} />
              <NumField label="Total AP" value={periodForm.total_ap} onChange={(v) => setPeriodForm({ ...periodForm, total_ap: v })} />
              <label className="block text-xs font-medium text-muted-foreground">
                Source Excel
                <select
                  value={periodForm.document_id}
                  onChange={(e) => setPeriodForm({ ...periodForm, document_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">— none —</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>{d.file_name}</option>
                  ))}
                </select>
              </label>
              <div className="col-span-2 flex items-end justify-end sm:col-span-4">
                <button
                  type="submit"
                  disabled={savingPeriod || !periodForm.period_end}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {savingPeriod && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save period
                </button>
              </div>
            </form>

            <div className="mt-5 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Period end</th>
                    <th className="px-3 py-2 text-right font-medium">Net rev</th>
                    <th className="px-3 py-2 text-right font-medium">Net inc</th>
                    <th className="px-3 py-2 text-right font-medium">GM</th>
                    <th className="px-3 py-2 text-right font-medium">Cash</th>
                    <th className="px-3 py-2 text-right font-medium">AR</th>
                    <th className="px-3 py-2 text-right font-medium">AP</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {periods.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">No periods yet.</td></tr>
                  )}
                  {periods.map((p) => (
                    <tr key={p.id} className="text-foreground">
                      <td className="px-3 py-2">{p.period_end}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.net_revenue ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.net_income ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.gross_margin ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.cash_balance ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.total_ar ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.total_ap ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleDeletePeriod(p.id, p.period_end)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete period ${p.period_end}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}


        {tab === "upload" && selectedId && (
          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Upload client financials</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload an Excel file (.xlsx). Lovable AI will extract cash, AR, AP, net revenue, and monthly close status, then you confirm before saving to the dashboard.
                </p>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40">
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing {xlsxFileName ?? "spreadsheet"}…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {xlsxFileName && extracted ? `Replace (${xlsxFileName})` : "Click to upload .xlsx"}
                </>
              )}
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleXlsxSelected}
                disabled={analyzing || savingExtracted}
              />
            </label>

            {extracted && extracted.months.length > 0 && (() => {
              const months = extracted.months;
              const rows = months.map((m) => {
                const existing = existingByPeriod[m.period_end] ?? null;
                const fields: Array<keyof ExistingPeriod> = ["net_revenue", "net_income", "cash_balance", "total_ar", "total_ap"];
                const diffs: Record<string, boolean> = {};
                let anyDiff = false;
                if (existing) {
                  for (const f of fields) {
                    const a = m[f] as number | null;
                    const b = existing[f];
                    const same = (a == null && b == null) || (a != null && b != null && Math.abs(a - b) < 0.005);
                    diffs[f] = !same;
                    if (!same) anyDiff = true;
                  }
                }
                return { m, existing, diffs, status: !existing ? "new" : anyDiff ? "conflict" : "unchanged" as const };
              });
              const hasConflicts = rows.some((r) => r.status === "conflict");
              const allMissingIS = months.every((m) => m.net_revenue == null && m.net_income == null);
              return (
                <div className="mt-5 rounded-lg border border-border bg-background p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Extracted {months.length} month{months.length === 1 ? "" : "s"}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Review before saving. Most-recent-upload-wins per month.
                      </p>
                    </div>
                  </div>

                  {hasConflicts && (
                    <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      One or more months already have data — confirming will overwrite the existing values.
                    </div>
                  )}
                  {incomeStatementDetected && allMissingIS && (
                    <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      Income statement detected but values not extracted — please verify manually.
                    </div>
                  )}

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="px-2 py-2 font-medium">Period</th>
                          <th className="px-2 py-2 font-medium text-right">Net revenue</th>
                          <th className="px-2 py-2 font-medium text-right">Net income</th>
                          <th className="px-2 py-2 font-medium text-right">Cash</th>
                          <th className="px-2 py-2 font-medium text-right">AR</th>
                          <th className="px-2 py-2 font-medium text-right">AP</th>
                          <th className="px-2 py-2 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ m, existing, diffs, status }) => (
                          <tr
                            key={m.period_end}
                            className={
                              status === "conflict"
                                ? "border-b border-amber-500/30 bg-amber-500/5"
                                : "border-b border-border"
                            }
                          >
                            <td className="px-2 py-2 font-medium text-foreground">{m.period_end}</td>
                            <DiffCell newVal={m.net_revenue} oldVal={existing?.net_revenue ?? null} diff={!!diffs.net_revenue} />
                            <DiffCell newVal={m.net_income} oldVal={existing?.net_income ?? null} diff={!!diffs.net_income} />
                            <DiffCell newVal={m.cash_balance} oldVal={existing?.cash_balance ?? null} diff={!!diffs.cash_balance} />
                            <DiffCell newVal={m.total_ar} oldVal={existing?.total_ar ?? null} diff={!!diffs.total_ar} />
                            <DiffCell newVal={m.total_ap} oldVal={existing?.total_ap ?? null} diff={!!diffs.total_ap} />
                            <td className="px-2 py-2 text-right">
                              {status === "new" && <span className="text-emerald-600 dark:text-emerald-400">New</span>}
                              {status === "unchanged" && <span className="text-muted-foreground">Unchanged</span>}
                              {status === "conflict" && <span className="text-amber-700 dark:text-amber-300">Overwrite</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => { setExtracted(null); setExistingByPeriod({}); setXlsxFileName(null); setIncomeStatementDetected(false); }}
                      className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmExtracted}
                      disabled={savingExtracted}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {savingExtracted && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Confirm & save {months.length} month{months.length === 1 ? "" : "s"}
                    </button>
                  </div>
                </div>
              );
            })()}

          </section>
        )}

        {!selectedId && (
          <div className="rounded-2xl border border-dashed border-[#E5E9F1] bg-white p-12 text-center text-sm text-slate-500 dark:border-[#1E2A3A] dark:bg-[#111827] dark:text-[#9CA3AF]">
            Select a client above to manage their dashboard and documents.
          </div>
        )}
        </>
      )}
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
    />
  );
}

function DiffCell({ newVal, oldVal, diff }: { newVal: number | null; oldVal: number | null; diff: boolean }) {
  const fmt = (v: number | null) =>
    v == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  if (diff && oldVal !== null) {
    return (
      <td className="px-2 py-2 text-right tabular-nums">
        <div className="text-muted-foreground line-through">{fmt(oldVal)}</div>
        <div className="font-medium text-amber-700 dark:text-amber-300">{fmt(newVal)}</div>
      </td>
    );
  }
  return <td className="px-2 py-2 text-right tabular-nums text-foreground">{fmt(newVal)}</td>;
}

function ExtractedRow({

  label,
  value,
  kind,
}: {
  label: string;
  value: number | string | null;
  kind: "currency" | "text";
}) {
  const missing = value === null || value === undefined;
  const display = missing
    ? "Not found"
    : kind === "currency"
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value))
    : String(value);
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${missing ? "text-destructive" : "text-foreground"}`}>
        {display}
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  type = "number",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "number" | "date";
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        type={type}
        step="any"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </label>
  );
}


function ActivityLogPanel() {
  const [items, setItems] = useState<ActivityLogItem[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "client");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) { if (!cancelled) setItems([]); return; }
      const [{ data: profiles }, { data: docs }, { data: pers }] = await Promise.all([
        supabase.from("profiles").select("id, company_name, full_name").in("id", ids),
        supabase.from("documents").select("id, client_id, file_name, created_at").in("client_id", ids).order("created_at", { ascending: false }).limit(200),
        supabase.from("periods").select("id, client_id, period_end, created_at, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap").in("client_id", ids).order("created_at", { ascending: false }).limit(200),
      ]);
      if (cancelled) return;
      const nameMap = new Map<string, string>((profiles ?? []).map((p) => [p.id, p.company_name || p.full_name || p.id.slice(0, 8)]));
      const docItems: ActivityLogItem[] = (docs ?? []).map((d) => ({
        id: `doc-${d.id}`, kind: "upload", client_id: d.client_id,
        client_name: nameMap.get(d.client_id) ?? "Unknown",
        label: d.file_name, created_at: d.created_at, flagged_nulls: [],
      }));
      const fieldLabels: Array<[string, string]> = [
        ["net_revenue", "Net revenue"], ["net_income", "Net income"], ["gross_margin", "Gross margin"],
        ["cash_balance", "Cash"], ["total_ar", "AR"], ["total_ap", "AP"],
      ];
      const perItems: ActivityLogItem[] = (pers ?? []).map((p) => {
        const nulls = fieldLabels.filter(([k]) => (p as Record<string, unknown>)[k] === null).map(([, l]) => l);
        const fields = fieldLabels.filter(([k]) => (p as Record<string, unknown>)[k] !== null).map(([, l]) => l);
        return {
          id: `per-${p.id}`, kind: "extraction", client_id: p.client_id,
          client_name: nameMap.get(p.client_id) ?? "Unknown",
          label: `Period ${p.period_end} · ${fields.length}/${fieldLabels.length} fields`,
          created_at: p.created_at, flagged_nulls: nulls,
        };
      });
      const combined = [...docItems, ...perItems].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      setItems(combined);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      i.client_name.toLowerCase().includes(q) || i.label.toLowerCase().includes(q) || i.kind.includes(q),
    );
  }, [items, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827]">
      <div className="flex flex-col gap-3 border-b border-[#E5E9F1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#1E2A3A]">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">All activity</h2>
          <p className="text-xs text-slate-500 dark:text-[#9CA3AF]">
            {items === null ? "Loading…" : `${filtered?.length ?? 0} entries`}
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search client, file, kind…"
            className="block w-full min-w-[18rem] rounded-md border border-[#E5E9F1] bg-white py-2 pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-[#1E2A3A] dark:bg-[#0F1729] dark:text-white"
          />
        </div>
      </div>

      {items === null ? (
        <div className="flex items-center justify-center px-5 py-12 text-sm text-slate-500 dark:text-[#9CA3AF]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">
          {query ? "No matches." : "No activity yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-[#0F1729] dark:text-[#6B7280]">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3">Null fields</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A]">
              {(filtered ?? []).map((i) => (
                <tr key={i.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500 dark:text-[#9CA3AF]">
                    {new Date(i.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">{i.client_name}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                      i.kind === "upload"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    }`}>
                      {i.kind === "upload" ? <Upload className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                      {i.kind === "upload" ? "Upload" : "Extraction"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-700 dark:text-[#D1D5DB]">{i.label}</td>
                  <td className="px-5 py-3">
                    {i.flagged_nulls.length === 0 ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        {i.flagged_nulls.join(", ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
