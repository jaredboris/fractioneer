import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Upload, FileText, Loader2, Plus, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/fractioneer-logo.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getMyRole, createClientAccount, extractFinancialsFromRows, saveExtractedFinancials, type ExtractedFinancials } from "@/lib/portal.functions";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/portal/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Fractioneer Client Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/portal/login" });
    return { user: data.user };
  },
  component: AdminGate,
});

function AdminGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Server-side admin check. requireSupabaseAuth re-validates the JWT and
      // user_roles is queried server-side, so a non-admin can't reach the
      // admin UI shell by skipping the client redirect.
      try {
        const result = await getMyRole();
        if (cancelled) return;
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
  }, [navigate]);

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

const MONTHLY_OPTIONS = ["On track", "Delayed", "Ready"];
const APAR_OPTIONS = ["Current", "Behind"];

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
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

  async function handleXlsxSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedId) return;
    setStatus(null);
    setExtracted(null);
    setAnalyzing(true);
    setXlsxFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      if (wb.SheetNames.length === 0) throw new Error("Spreadsheet has no sheets.");
      const blocks: string[] = [];
      for (const name of wb.SheetNames) {
        const sheet = wb.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });
        blocks.push(`=== Sheet: ${name} ===\n${JSON.stringify(rows)}`);
      }
      const rowsStr = blocks.join("\n\n").slice(0, 180_000);
      const result = await extractFinancialsFromRows({ data: { rows: rowsStr } });
      setExtracted(result);
    } catch (err) {
      setStatus({ kind: "err", msg: err instanceof Error ? err.message : "Failed to analyze spreadsheet" });
      setXlsxFileName(null);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirmExtracted() {
    if (!extracted || !selectedId) return;
    setSavingExtracted(true);
    setStatus(null);
    try {
      const period = extracted.period_end ?? new Date().toISOString().slice(0, 10);
      const { period_end: _omit, ...rest } = extracted;
      await saveExtractedFinancials({
        data: {
          client_id: selectedId,
          period,
          ...rest,
        },
      });
      setStatus({ kind: "ok", msg: "Saved extracted financials to the client's dashboard." });
      setExtracted(null);
      setXlsxFileName(null);
      loadClientData(selectedId);
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

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
              Admin Console
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/portal"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to portal
            </Link>
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

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Client management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update dashboard metrics and manage documents for any client.
          </p>
        </div>

        {status && (
          <div
            className={`mb-6 rounded-md border px-4 py-2 text-sm ${
              status.kind === "ok"
                ? "border-accent/30 bg-accent/5 text-accent"
                : "border-destructive/30 bg-destructive/5 text-destructive"
            }`}
          >
            {status.msg}
          </div>
        )}

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

        {selectedId ? (
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

        {selectedId && (
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

            {extracted && (
              <div className="mt-5 rounded-lg border border-border bg-background p-5">
                <h3 className="text-sm font-semibold text-foreground">Extracted values</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Review before saving. Missing fields came back as null — verify your source file if any of these look wrong.
                </p>
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ExtractedRow label="Cash balance" value={extracted.cash_balance} kind="currency" />
                  <ExtractedRow label="Total AR" value={extracted.total_ar} kind="currency" />
                  <ExtractedRow label="Total AP" value={extracted.total_ap} kind="currency" />
                  <ExtractedRow label="Net revenue" value={extracted.net_revenue} kind="currency" />
                  <ExtractedRow label="Net income" value={extracted.net_income} kind="currency" />
                  <ExtractedRow label="Period end" value={extracted.period_end} kind="text" />
                  <ExtractedRow label="Monthly close status" value={extracted.monthly_close_status} kind="text" />

                </dl>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setExtracted(null); setXlsxFileName(null); }}
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
                    Confirm & save
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {!selectedId && (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Select a client above to manage their dashboard and documents.
          </div>
        )}
      </main>
    </div>
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
