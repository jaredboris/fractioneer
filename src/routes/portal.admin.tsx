import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Upload, FileText, Loader2, Plus, Trash2, Search, AlertTriangle, CheckCircle2, ChevronRight, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/portal/AdminSidebar";
import { getMyRole, createClientAccount, extractFinancialsFromRows, saveExtractedFinancials, generateAiInsights, generateInsightsForPeriod, approvePeriod, postClientAlert, clearClientAlert, recordSharedDocument, deleteSharedDocument, type ExtractedFinancials, type ExtractedMonth } from "@/lib/portal.functions";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0F1729]">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500 dark:text-[#9CA3AF]" />
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
    status: string;
    published_at: string | null;
  };
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [openPeriod, setOpenPeriod] = useState<PeriodRow | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingPeriod, setDeletingPeriod] = useState(false);
  const [prefillPeriodEnd, setPrefillPeriodEnd] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Active urgent alert for the selected client
  const [activeAlert, setActiveAlert] = useState<{ id: string; message: string; created_at: string } | null>(null);
  const [alertDraft, setAlertDraft] = useState("");
  const [postingAlert, setPostingAlert] = useState(false);

  // Admin-shared documents for the selected client
  type SharedDoc = { id: string; file_name: string; file_path: string; size_bytes: number | null; created_at: string };
  const [sharedDocs, setSharedDocs] = useState<SharedDoc[]>([]);
  const [sharingDoc, setSharingDoc] = useState(false);

  // Backfill state for "Generate missing insights"
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillProgress, setBackfillProgress] = useState<{
    done: number;
    total: number;
    label: string;
    succeeded: number;
    failed: number;
    finished: boolean;
  } | null>(null);

  const handleBackfillInsights = useCallback(async () => {
    setBackfillRunning(true);
    setBackfillProgress({ done: 0, total: 0, label: "Scanning periods…", succeeded: 0, failed: 0, finished: false });
    try {
      const [{ data: allPeriods, error: pErr }, { data: allInsights, error: iErr }] = await Promise.all([
        supabase.from("periods").select("client_id, period_end"),
        supabase.from("ai_insights").select("client_id, period_end"),
      ]);
      if (pErr) throw new Error(pErr.message);
      if (iErr) throw new Error(iErr.message);

      const have = new Set(
        (allInsights ?? [])
          .filter((r) => r.period_end)
          .map((r) => `${r.client_id}::${r.period_end}`),
      );
      const missing = (allPeriods ?? []).filter(
        (p) => !have.has(`${p.client_id}::${p.period_end}`),
      );

      const nameById = new Map(clients.map((c) => [c.id, c.company_name || c.full_name || c.id]));

      if (missing.length === 0) {
        setBackfillProgress({ done: 0, total: 0, label: "No missing periods — nothing to generate.", succeeded: 0, failed: 0, finished: true });
        return;
      }

      let succeeded = 0;
      let failed = 0;
      for (let i = 0; i < missing.length; i++) {
        const m = missing[i];
        const label = `${nameById.get(m.client_id) ?? m.client_id} · ${m.period_end}`;
        setBackfillProgress({ done: i, total: missing.length, label, succeeded, failed, finished: false });
        try {
          await generateInsightsForPeriod({ data: { client_id: m.client_id, period_end: m.period_end } });
          succeeded++;
        } catch (e) {
          console.error("[backfill insights] failed", m, e);
          failed++;
        }
      }
      setBackfillProgress({
        done: missing.length,
        total: missing.length,
        label: `Done. Generated insights for ${succeeded} period${succeeded === 1 ? "" : "s"}${failed ? `, ${failed} failed.` : "."}`,
        succeeded,
        failed,
        finished: true,
      });
    } catch (e) {
      setBackfillProgress({
        done: 0,
        total: 0,
        label: e instanceof Error ? e.message : "Backfill failed",
        succeeded: 0,
        failed: 0,
        finished: true,
      });
    } finally {
      setBackfillRunning(false);
    }
  }, [clients]);

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
    const [{ data: dash }, { data: docs }, { data: pers }, { data: alertRow }, { data: shared }] = await Promise.all([
      supabase.from("dashboard_data").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("documents").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase
        .from("periods")
        .select("id, period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap, document_id, status, published_at")
        .eq("client_id", clientId)
        .order("period_end", { ascending: false }),
      supabase
        .from("client_alerts")
        .select("id, message, created_at")
        .eq("client_id", clientId)
        .is("cleared_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("shared_documents")
        .select("id, file_name, file_path, size_bytes, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
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
    setActiveAlert(alertRow ?? null);
    setAlertDraft("");
    setSharedDocs((shared ?? []) as SharedDoc[]);
  }, []);

  async function handleApprovePeriod(id: string) {
    setApprovingId(id);
    try {
      await approvePeriod({ data: { period_id: id } });
      setStatus({ kind: "ok", msg: "Period approved & published." });
      if (selectedId) loadClientData(selectedId);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Approve failed" });
    } finally {
      setApprovingId(null);
    }
  }

  async function handlePostAlert() {
    if (!selectedId || !alertDraft.trim()) return;
    setPostingAlert(true);
    try {
      await postClientAlert({ data: { client_id: selectedId, message: alertDraft.trim() } });
      setStatus({ kind: "ok", msg: "Alert posted." });
      loadClientData(selectedId);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed to post alert" });
    } finally {
      setPostingAlert(false);
    }
  }

  async function handleClearAlert() {
    if (!activeAlert) return;
    try {
      await clearClientAlert({ data: { alert_id: activeAlert.id } });
      setStatus({ kind: "ok", msg: "Alert cleared." });
      if (selectedId) loadClientData(selectedId);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Failed to clear" });
    }
  }

  async function handleShareDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    setSharingDoc(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `shared/${selectedId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("client-documents")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      await recordSharedDocument({
        data: {
          client_id: selectedId,
          file_name: file.name,
          file_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
        },
      });
      setStatus({ kind: "ok", msg: `Shared ${file.name}.` });
      loadClientData(selectedId);
    } catch (err) {
      setStatus({ kind: "err", msg: err instanceof Error ? err.message : "Share failed" });
    } finally {
      setSharingDoc(false);
      e.target.value = "";
    }
  }

  async function handleDeleteShared(doc: { id: string; file_name: string; file_path: string }) {
    if (!confirm(`Remove ${doc.file_name} from the client's Documents tab?`)) return;
    try {
      await deleteSharedDocument({ data: { id: doc.id, file_path: doc.file_path } });
      if (selectedId) loadClientData(selectedId);
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Delete failed" });
    }
  }

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

  async function handleDeletePeriod(id: string) {
    setDeletingPeriod(true);
    const { error } = await supabase.from("periods").delete().eq("id", id);
    setDeletingPeriod(false);
    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }
    setOpenPeriod(null);
    setConfirmingDelete(false);
    loadClientData(selectedId);
  }

  async function handleDownloadDoc(path: string, name: string) {
    const { data } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(path, 60, { download: name });
    if (!data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzePhase, setAnalyzePhase] = useState<"reading" | "extracting" | "finalizing" | null>(null);

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
    setAnalyzePhase("reading");
    setXlsxFileName(file.name);
    setUploadedFile(file);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      if (wb.SheetNames.length === 0) throw new Error("Spreadsheet has no sheets.");


      // Extraction can safely drop high-volume transaction sheets — it only
      // needs the IS/BS summary. Insights NEED the transaction tabs (invoices,
      // payments, AR aging) for payment-speed / concentration / overdue-AR.
      const EXTRACT_SKIP_SUBSTR = ["gl", "general ledger", "detail", "invoices", "payments"];
      const INSIGHTS_SKIP_SUBSTR = ["gl", "general ledger"]; // keep invoices/payments/aging
      const PRIORITY_SUBSTR = ["income statement", "p&l", "pnl", "profit and loss", "balance sheet", "cash flow", "aging", "invoices", "payments", "ar"];
      const PRIORITY_TOKEN = ["is", "bs", "ar", "ap"];
      const MAX_ROWS = 2000;

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

      // Build the narrow extraction blob.
      const extractSkipped = (p: Parsed) =>
        EXTRACT_SKIP_SUBSTR.some((s) => p.name.toLowerCase().includes(s)) || p.rows.length > 600;
      let chosenForExtract = parsed.filter((p) => !extractSkipped(p));
      if (chosenForExtract.length === 0) {
        chosenForExtract = [...parsed].sort((a, b) => a.rows.length - b.rows.length).slice(0, 3);
      }
      chosenForExtract.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
      setIncomeStatementDetected(chosenForExtract.some((p) => p.isIncomeStmt));
      const extractBlocks = chosenForExtract.map((p) => `=== Sheet: ${p.name} ===\n${JSON.stringify(p.rows)}`);
      const rowsStr = extractBlocks.join("\n\n").slice(0, 400_000);

      // Build the wider insights blob — keeps transaction tabs.
      const insightsSkipped = (p: Parsed) =>
        INSIGHTS_SKIP_SUBSTR.some((s) => p.name.toLowerCase().includes(s)) || p.rows.length > MAX_ROWS;
      let chosenForInsights = parsed.filter((p) => !insightsSkipped(p));
      if (chosenForInsights.length === 0) chosenForInsights = chosenForExtract;
      chosenForInsights.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
      const insightsBlocks = chosenForInsights.map((p) => `=== Sheet: ${p.name} ===\n${JSON.stringify(p.rows)}`);
      const insightsRowsStr = insightsBlocks.join("\n\n").slice(0, 380_000);

      setAnalyzePhase("extracting");
      const result = await extractFinancialsFromRows({ data: { rows: rowsStr } });
      const sortedMonths = [...result.months].sort((a, b) =>
        a.period_end < b.period_end ? -1 : a.period_end > b.period_end ? 1 : 0,
      );
      setExtracted({ months: sortedMonths });
      setExtractedSourceRows(insightsRowsStr);

      setAnalyzePhase("finalizing");
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
      setUploadedFile(null);
    } finally {
      setAnalyzing(false);
      setAnalyzePhase(null);
    }
  }


  async function handleConfirmExtracted() {
    if (!extracted || extracted.months.length === 0 || !selectedId) return;
    setSavingExtracted(true);
    setStatus(null);
    try {
      // Upload the source file to Storage so Reports / AI banner can offer
      // a download, and so insights have a reproducible reference.
      let documentInfo: { file_name: string; file_path: string; file_size: number | null } | undefined;
      if (uploadedFile) {
        const safeName = uploadedFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const path = `${selectedId}/source/${stamp}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("client-documents")
          .upload(path, uploadedFile, {
            cacheControl: "3600",
            upsert: false,
            contentType:
              uploadedFile.type ||
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
        if (upErr) throw new Error(`Upload: ${upErr.message}`);
        documentInfo = {
          file_name: uploadedFile.name,
          file_path: path,
          file_size: uploadedFile.size ?? null,
        };
      }

      await saveExtractedFinancials({
        data: { client_id: selectedId, months: extracted.months, document: documentInfo },
      });
      setStatus({ kind: "ok", msg: `Saved ${extracted.months.length} month${extracted.months.length === 1 ? "" : "s"} to the client's dashboard. Generating AI insights…` });
      const sourceRows = extractedSourceRows;
      setExtracted(null);
      setExtractedSourceRows(null);
      setExistingByPeriod({});
      setXlsxFileName(null);
      setUploadedFile(null);
      setIncomeStatementDetected(false);
      setPrefillPeriodEnd(null);
      loadClientData(selectedId);
      // Notify any open client dashboard that insights are regenerating so the
      // AI Insights card can show a shimmer immediately.
      const insightsChannel = supabase.channel(`ai_insights:${selectedId}`);
      insightsChannel.subscribe((s) => {
        if (s === "SUBSCRIBED") {
          void insightsChannel.send({ type: "broadcast", event: "generating", payload: { state: "start" } });
        }
      });
      // Fire-and-forget: regenerate AI insights for this client. Don't block the
      // save UX; surface errors quietly.
      void generateAiInsights({
        data: { client_id: selectedId, source_rows: sourceRows ?? undefined },
      })
        .then((r: { count: number }) => {
          setStatus({ kind: "ok", msg: `Saved and generated ${r.count} AI insight${r.count === 1 ? "" : "s"}.` });
        })
        .catch((err: unknown) => {
          console.error("[ai_insights] generation failed", err);
        })
        .finally(() => {
          void insightsChannel.send({ type: "broadcast", event: "generating", payload: { state: "end" } });
          setTimeout(() => { void supabase.removeChannel(insightsChannel); }, 1000);
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


        <section className="mb-6 rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
                Select client
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading}
                className="mt-2 block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackfillInsights}
                disabled={backfillRunning}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E9F1] bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-60 dark:border-[#1E2A3A] dark:bg-[#0F1729] dark:text-white dark:hover:bg-[#1a2335]"
                title="Generate AI insights for every period that doesn't have any yet, across all clients. Runs sequentially."
              >
                {backfillRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate missing insights
              </button>
              <button
                onClick={() => setAddOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600/90"
              >
                <Plus className="h-4 w-4" />
                {addOpen ? "Cancel" : "Add client"}
              </button>
            </div>
          </div>

          {backfillProgress && (
            <div className="mt-4 rounded-lg border border-[#E5E9F1] bg-slate-50 px-4 py-3 dark:border-[#1E2A3A] dark:bg-[#0F1729]">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-slate-700 dark:text-[#E5E7EB]">
                  {backfillProgress.total > 0
                    ? `Generating insights — ${backfillProgress.done} of ${backfillProgress.total}`
                    : backfillProgress.label}
                </span>
                {backfillProgress.finished && (
                  <button
                    type="button"
                    onClick={() => setBackfillProgress(null)}
                    className="text-slate-500 hover:text-slate-700 dark:text-[#9CA3AF] dark:hover:text-white"
                  >
                    Dismiss
                  </button>
                )}
              </div>
              {backfillProgress.total > 0 && (
                <>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1E2A3A]">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${(backfillProgress.done / Math.max(1, backfillProgress.total)) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1.5 truncate text-[11px] text-slate-500 dark:text-[#9CA3AF]">
                    {backfillProgress.finished ? backfillProgress.label : backfillProgress.label}
                  </div>
                </>
              )}
            </div>
          )}


          {addOpen && (
            <form
              onSubmit={handleCreateClient}
              className="mt-5 grid grid-cols-1 gap-4 rounded-lg border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] p-5 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New client</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">
                  Creates the login, profile, and <code>client</code> role in one step. Share the email and
                  temporary password with them.
                </p>
              </div>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Company name
                <input
                  required
                  value={addForm.company_name}
                  onChange={(e) => setAddForm({ ...addForm, company_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </label>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Contact name <span className="text-slate-500 dark:text-[#9CA3AF]/60">(optional)</span>
                <input
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </label>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Email
                <input
                  required
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </label>
              <label className="block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
                Temporary password
                <input
                  required
                  type="password"
                  minLength={8}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="mt-1 block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </label>
              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="inline-flex items-center rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2335]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBusy}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600/90 disabled:opacity-60"
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
            <section className="rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard values</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
                Shown on the client's portal homepage.
              </p>

              <form onSubmit={handleSaveDashboard} className="mt-5 space-y-5">
                <Field label="Monthly close status">
                  <select
                    value={form.monthly_close}
                    onChange={(e) => setForm({ ...form, monthly_close: e.target.value })}
                    className="block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
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
                    className="block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
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
                  className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save dashboard values"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Documents</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">PDF or Excel files shared with this client.</p>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#E5E9F1] bg-slate-50 dark:border-[#1E2A3A] dark:bg-[#0F1729] px-4 py-6 text-sm text-slate-500 dark:text-[#9CA3AF] transition-colors hover:bg-slate-50 dark:bg-[#0F1729]">
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

              <ul className="mt-5 divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A] rounded-md border border-[#E5E9F1] dark:border-[#1E2A3A]">
                {documents.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">No files yet.</li>
                )}
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{d.file_name}</div>
                        <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                          {new Date(d.created_at).toLocaleDateString()}
                          {d.file_size ? ` · ${(d.file_size / 1024).toFixed(0)} KB` : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDoc(d)}
                      className="rounded p-1.5 text-slate-500 dark:text-[#9CA3AF] transition-colors hover:bg-rose-600/10 hover:text-destructive"
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
          <section className="mt-6 rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Urgent alert on client dashboard</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
              Pinned message shown above this client&apos;s stat cards. Only one active alert at a time.
            </p>
            {activeAlert ? (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Active · posted {new Date(activeAlert.created_at).toLocaleString()}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-900 dark:text-white">{activeAlert.message}</p>
                </div>
                <button
                  onClick={handleClearAlert}
                  className="shrink-0 rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-1.5 text-xs text-slate-900 dark:text-white hover:bg-slate-50 dark:bg-[#0F1729]"
                >
                  Clear alert
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <textarea
                  value={alertDraft}
                  onChange={(e) => setAlertDraft(e.target.value)}
                  placeholder="e.g. Your November close has been delayed — we'll have it ready by Friday."
                  rows={3}
                  className="w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
                <button
                  onClick={handlePostAlert}
                  disabled={postingAlert || !alertDraft.trim()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {postingAlert ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                  Post alert
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "clients" && selectedId && (
          <section className="mt-6 rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Shared files</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
              Polished deliverables — reports, reconciliations, tax prep summaries. Visible in the client&apos;s Documents tab.
            </p>

            <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[#E5E9F1] bg-slate-50 dark:border-[#1E2A3A] dark:bg-[#0F1729] px-4 py-6 text-sm text-slate-500 dark:text-[#9CA3AF] transition-colors hover:bg-slate-50 dark:bg-[#0F1729]">
              {sharingDoc ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Click to share a file with this client
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={handleShareDocument}
                disabled={sharingDoc}
              />
            </label>

            <ul className="mt-5 divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A] rounded-md border border-[#E5E9F1] dark:border-[#1E2A3A]">
              {sharedDocs.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">No files shared yet.</li>
              )}
              {sharedDocs.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-white">{d.file_name}</div>
                      <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                        Shared {new Date(d.created_at).toLocaleDateString()}
                        {d.size_bytes ? ` · ${(d.size_bytes / 1024).toFixed(0)} KB` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteShared(d)}
                    className="rounded p-1.5 text-slate-500 dark:text-[#9CA3AF] transition-colors hover:bg-rose-600/10 hover:text-destructive"
                    aria-label={`Remove ${d.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === "clients" && selectedId && (
          <section className="mt-6 rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Reporting periods</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
              Uploaded via the Upload tab. Click a row to view, re-upload, or delete.
            </p>

            <div className="mt-5 overflow-x-auto rounded-md border border-[#E5E9F1] dark:border-[#1E2A3A]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-[#0F1729] text-xs uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Period end</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Net rev</th>
                    <th className="px-3 py-2 text-right font-medium">Net inc</th>
                    <th className="px-3 py-2 text-right font-medium">GM</th>
                    <th className="px-3 py-2 text-right font-medium">Cash</th>
                    <th className="px-3 py-2 text-right font-medium">AR</th>
                    <th className="px-3 py-2 text-right font-medium">AP</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A]">
                  {periods.length === 0 && (
                    <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-500 dark:text-[#9CA3AF]">No periods yet — upload an Excel file on the Upload tab.</td></tr>
                  )}
                  {[...periods].sort((a, b) => {
                    // Pending review first, then by period_end desc
                    const ap = a.status === "pending_review" ? 0 : 1;
                    const bp = b.status === "pending_review" ? 0 : 1;
                    if (ap !== bp) return ap - bp;
                    return a.period_end < b.period_end ? 1 : -1;
                  }).map((p) => {
                    const gm = p.gross_margin != null
                      ? Number(p.gross_margin)
                      : (p.net_revenue && p.net_revenue !== 0
                        ? (p.net_income ?? 0) / p.net_revenue
                        : null);
                    const isPending = p.status === "pending_review";
                    return (
                      <tr
                        key={p.id}
                        onClick={() => { setConfirmingDelete(false); setOpenPeriod(p); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setConfirmingDelete(false); setOpenPeriod(p); }
                        }}
                        className={`cursor-pointer text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:bg-[#0F1729] focus:bg-slate-50 dark:bg-[#0F1729] focus:outline-none ${isPending ? "bg-amber-500/5" : ""}`}
                      >
                        <td className="px-3 py-2">{p.period_end}</td>
                        <td className="px-3 py-2">
                          {isPending ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApprovePeriod(p.id); }}
                              disabled={approvingId === p.id}
                              className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-500/25 disabled:opacity-60 dark:text-amber-300"
                            >
                              {approvingId === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              Approve & Publish
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:text-green-300">
                              <CheckCircle2 className="h-3 w-3" />
                              Published
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyCompact(p.net_revenue)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyCompact(p.net_income)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtPercent(gm)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyCompact(p.cash_balance)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyCompact(p.total_ar)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyCompact(p.total_ap)}</td>
                        <td className="px-3 py-2 text-right text-slate-500 dark:text-[#9CA3AF]">
                          <ChevronRight className="ml-auto h-4 w-4" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <PeriodDetailSheet
              period={openPeriod}
              documents={documents}
              confirmingDelete={confirmingDelete}
              setConfirmingDelete={setConfirmingDelete}
              deleting={deletingPeriod}
              onClose={() => { setOpenPeriod(null); setConfirmingDelete(false); }}
              onDelete={handleDeletePeriod}
              onDownload={handleDownloadDoc}
              onReupload={(periodEnd) => {
                setPrefillPeriodEnd(periodEnd);
                setOpenPeriod(null);
                setConfirmingDelete(false);
                navigate({ to: "/portal/admin", search: { tab: "upload" }, replace: false });
              }}
            />
          </section>
        )}



        {tab === "upload" && selectedId && (
          <section className="mt-6 rounded-2xl border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload client financials</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
                  Upload an Excel file (.xlsx). Lovable AI will extract cash, AR, AP, net revenue, and monthly close status, then you confirm before saving to the dashboard.
                </p>
              </div>
            </div>

            {prefillPeriodEnd && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                <span>
                  Re-uploading <strong>{fmtPeriodLabel(prefillPeriodEnd)}</strong> — new data will overwrite this row.
                </span>
                <button
                  onClick={() => setPrefillPeriodEnd(null)}
                  className="rounded px-2 py-0.5 text-blue-700/80 transition-colors hover:bg-blue-500/10 dark:text-blue-300/80"
                >
                  Clear
                </button>
              </div>
            )}


            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#E5E9F1] bg-slate-50 dark:border-[#1E2A3A] dark:bg-[#0F1729] px-4 py-6 text-sm text-slate-500 dark:text-[#9CA3AF] transition-colors hover:bg-slate-50 dark:bg-[#0F1729]">
              {analyzing ? (
                <ExtractionProgress phase={analyzePhase} fileName={xlsxFileName} />
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {xlsxFileName && extracted ? `Replace (${xlsxFileName})` : "Click to upload .xlsx"}
                </span>
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
                <div className="mt-5 rounded-lg border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Extracted {months.length} month{months.length === 1 ? "" : "s"}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">
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
                        <tr className="border-b border-[#E5E9F1] dark:border-[#1E2A3A] text-left text-slate-500 dark:text-[#9CA3AF]">
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
                                : "border-b border-[#E5E9F1] dark:border-[#1E2A3A]"
                            }
                          >
                            <td className="px-2 py-2 font-medium text-slate-900 dark:text-white">{m.period_end}</td>
                            <DiffCell newVal={m.net_revenue} oldVal={existing?.net_revenue ?? null} diff={!!diffs.net_revenue} />
                            <DiffCell newVal={m.net_income} oldVal={existing?.net_income ?? null} diff={!!diffs.net_income} />
                            <DiffCell newVal={m.cash_balance} oldVal={existing?.cash_balance ?? null} diff={!!diffs.cash_balance} />
                            <DiffCell newVal={m.total_ar} oldVal={existing?.total_ar ?? null} diff={!!diffs.total_ar} />
                            <DiffCell newVal={m.total_ap} oldVal={existing?.total_ap ?? null} diff={!!diffs.total_ap} />
                            <td className="px-2 py-2 text-right">
                              {status === "new" && <span className="text-emerald-600 dark:text-emerald-400">New</span>}
                              {status === "unchanged" && <span className="text-slate-500 dark:text-[#9CA3AF]">Unchanged</span>}
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
                      onClick={() => { setExtracted(null); setExtractedSourceRows(null); setExistingByPeriod({}); setXlsxFileName(null); setIncomeStatementDetected(false); }}
                      className="inline-flex items-center rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2335]"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmExtracted}
                      disabled={savingExtracted}
                      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600/90 disabled:opacity-60"
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
      <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">{label}</label>
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
      className="block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:text-[#9CA3AF] focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
    />
  );
}

function DiffCell({ newVal, oldVal, diff }: { newVal: number | null; oldVal: number | null; diff: boolean }) {
  const fmt = (v: number | null) =>
    v == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  if (diff && oldVal !== null) {
    return (
      <td className="px-2 py-2 text-right tabular-nums">
        <div className="text-slate-500 dark:text-[#9CA3AF] line-through">{fmt(oldVal)}</div>
        <div className="font-medium text-amber-700 dark:text-amber-300">{fmt(newVal)}</div>
      </td>
    );
  }
  return <td className="px-2 py-2 text-right tabular-nums text-slate-900 dark:text-white">{fmt(newVal)}</td>;
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
    <div className="rounded-md border border-[#E5E9F1] dark:border-[#1E2A3A] bg-slate-50 dark:bg-[#0F1729] px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${missing ? "text-destructive" : "text-slate-900 dark:text-white"}`}>
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
    <label className="block text-xs font-medium text-slate-500 dark:text-[#9CA3AF]">
      {label}
      <input
        type={type}
        step="any"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-2 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
      />
    </label>
  );
}

// ----- Period table helpers + detail sheet -----

const moneyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtMoneyCompact(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return moneyFmt.format(v);
}

function fmtPercent(v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtPeriodLabel(d: string) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

type PeriodSheetRow = {
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

function PeriodDetailSheet({
  period,
  documents,
  confirmingDelete,
  setConfirmingDelete,
  deleting,
  onClose,
  onDelete,
  onDownload,
  onReupload,
}: {
  period: PeriodSheetRow | null;
  documents: Document[];
  confirmingDelete: boolean;
  setConfirmingDelete: (v: boolean) => void;
  deleting: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDownload: (path: string, name: string) => void;
  onReupload: (periodEnd: string) => void;
}) {
  if (!period) return null;
  const gm = period.net_revenue && period.net_revenue !== 0
    ? (period.net_income ?? 0) / period.net_revenue
    : null;
  const doc = documents.find((d) => d.id === period.document_id) ?? null;
  const label = fmtPeriodLabel(period.period_end);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close panel"
      />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#111827] shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-[#E5E9F1] dark:border-[#1E2A3A] px-6 py-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Period ending
            </div>
            <h3 className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-white">{label}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 dark:text-[#9CA3AF] transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2335] hover:text-slate-900 dark:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="space-y-3">
            <DetailRow label="Net revenue" value={fmtMoneyCompact(period.net_revenue)} />
            <DetailRow label="Net income" value={fmtMoneyCompact(period.net_income)} />
            <DetailRow label="Gross margin" value={fmtPercent(gm)} />
            <DetailRow label="Cash balance" value={fmtMoneyCompact(period.cash_balance)} />
            <DetailRow label="Total AR" value={fmtMoneyCompact(period.total_ar)} />
            <DetailRow label="Total AP" value={fmtMoneyCompact(period.total_ap)} />
          </dl>

          <div className="mt-6 border-t border-[#E5E9F1] dark:border-[#1E2A3A] pt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Source file
            </div>
            {doc ? (
              <button
                onClick={() => onDownload(doc.file_path, doc.file_name)}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:bg-[#0F1729]"
              >
                <Download className="h-4 w-4" />
                {doc.file_name}
              </button>
            ) : (
              <div className="mt-2 text-sm text-slate-500 dark:text-[#9CA3AF]">No source file linked</div>
            )}
          </div>
        </div>

        <footer className="border-t border-[#E5E9F1] dark:border-[#1E2A3A] px-6 py-4">
          {confirmingDelete ? (
            <div>
              <p className="text-sm text-slate-900 dark:text-white">
                This will permanently remove <strong>{label}</strong> data from the client dashboard and charts. This cannot be undone.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="rounded-md border border-[#E5E9F1] dark:border-[#1E2A3A] px-3 py-2 text-sm font-medium text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:bg-[#0F1729] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(period.id)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600/90 disabled:opacity-60"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Delete permanently
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => onReupload(period.period_end)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E5E9F1] bg-white dark:border-[#1E2A3A] dark:bg-[#0F1729] px-3 py-2 text-sm font-medium text-slate-900 dark:text-white transition-colors hover:bg-slate-50 dark:bg-[#0F1729]"
              >
                <Upload className="h-4 w-4" />
                Re-upload
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600/90"
              >
                <Trash2 className="h-4 w-4" />
                Delete period
              </button>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-slate-500 dark:text-[#9CA3AF]">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
    </div>
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

function ExtractionProgress({
  phase,
  fileName,
}: {
  phase: "reading" | "extracting" | "finalizing" | null;
  fileName: string | null;
}) {
  const steps: { id: "reading" | "extracting" | "finalizing"; label: string }[] = [
    { id: "reading", label: "Reading sheets…" },
    { id: "extracting", label: "Extracting monthly figures…" },
    { id: "finalizing", label: "Almost done…" },
  ];
  const order: Record<string, number> = { reading: 0, extracting: 1, finalizing: 2 };
  const currentIdx = phase ? order[phase] : -1;
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">
        Analyzing {fileName ?? "spreadsheet"}…
      </div>
      <ul className="flex w-full max-w-md flex-col gap-1.5">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={s.id} className="flex items-center gap-2 text-xs">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  done
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                    : active
                      ? "bg-blue-500/20 text-blue-600 dark:text-blue-300"
                      : "bg-slate-100 text-slate-500 dark:bg-[#0F1729] dark:text-[#9CA3AF]/50"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={done || active ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-[#9CA3AF]/60"}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

