import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Upload, FileText, Loader2, Plus, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/fractioneer-logo.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getMyRole } from "@/lib/portal.functions";

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
    const [{ data: dash }, { data: docs }] = await Promise.all([
      supabase.from("dashboard_data").select("*").eq("client_id", clientId).maybeSingle(),
      supabase.from("documents").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
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

  async function handleAddClient() {
    const email = prompt("New client's email (must already be created in Cloud → Users):");
    if (!email) return;
    const company = prompt("Company name:");
    if (!company) return;
    // Find user by email via profiles join — we look up auth user by listing profiles whose linked email matches.
    // Since profiles table has no email, we ask admin to confirm the user id.
    const userId = prompt(
      "Paste the new client's user ID (from Cloud → Users). The user must already exist.",
    );
    if (!userId) return;
    const { error: pErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, company_name: company });
    if (pErr) {
      setStatus({ kind: "err", msg: `Profile: ${pErr.message}` });
      return;
    }
    const { error: rErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "client" }, { onConflict: "user_id,role" });
    if (rErr) {
      setStatus({ kind: "err", msg: `Role: ${rErr.message}` });
      return;
    }
    setStatus({ kind: "ok", msg: `Added ${company}.` });
    await loadClients();
    setSelectedId(userId);
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
              onClick={handleAddClient}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add client
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Create the auth user in <strong>Cloud → Users</strong> first, then click <em>Add client</em> to attach
            a company name and the <code>client</code> role.
          </p>
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
        ) : (
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
