import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Loader2, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { AdminShell } from "@/components/portal/AdminSidebar";
import { getMyRole } from "@/lib/portal.functions";
import { useCompanyName } from "@/hooks/useProfile";
import { getCached, setCached } from "@/lib/portal-cache";

export const Route = createFileRoute("/portal/notes")({
  head: () => ({
    meta: [
      { title: "Notes — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NotesPage,
});

type Note = {
  id: string;
  client_id: string;
  author_id: string;
  author_role: "admin" | "client";
  author_name: string | null;
  body: string;
  created_at: string;
};

type ClientOption = {
  id: string;
  label: string;
};

function NotesPage() {
  const { user } = Route.useRouteContext() as {
    user: { id: string; email?: string | null };
  };
  const [role, setRole] = useState<"admin" | "client" | null | undefined>(() => {
    const cached = getCached<string>("role", user.id);
    if (cached === "admin" || cached === "client") return cached;
    return undefined;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getMyRole();
        if (cancelled) return;
        setCached("role", user.id, r.role ?? "");
        setRole(r.role);
      } catch {
        if (!cancelled) setRole(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  if (role === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (role === "admin") return <AdminNotesPage userId={user.id} email={user.email ?? null} />;
  return <ClientNotesPage userId={user.id} email={user.email ?? null} />;
}

/* ----------------------------- CLIENT VIEW ------------------------------- */

function ClientNotesPage({ userId, email }: { userId: string; email: string | null }) {
  const companyName = useCompanyName(userId);
  return (
    <div className="flex min-h-screen bg-transparent">
      <PortalSidebar companyName={companyName} email={email} role="client" />
      <main className="flex-1 px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Notes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Messages between you and your Fractioneer team.
          </p>
        </div>
        <NotesThread clientId={userId} viewerId={userId} viewerRole="client" />
      </main>
    </div>
  );
}

/* ------------------------------ ADMIN VIEW ------------------------------- */

function AdminNotesPage({ userId, email }: { userId: string; email: string | null }) {
  const [clients, setClients] = useState<ClientOption[] | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) {
        if (!cancelled) setClients([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, company_name, full_name")
        .in("id", ids);
      if (cancelled) return;
      const opts: ClientOption[] = (profiles ?? [])
        .map((p) => ({
          id: p.id,
          label: p.company_name || p.full_name || p.id.slice(0, 8),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      setClients(opts);
      if (!selectedId && opts.length > 0) setSelectedId(opts[0].id);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = clients?.find((c) => c.id === selectedId) ?? null;

  return (
    <AdminShell email={email}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Notes
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Send and read notes for any client — no spy mode required.
          </p>
        </div>
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-[#6B7280]">
            Client thread
          </label>
          <div className="relative mt-1">
            <Users className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!clients || clients.length === 0}
              className="block min-w-[18rem] rounded-md border border-[#E5E9F1] bg-white py-2 pl-8 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-[#1E2A3A] dark:bg-[#111827] dark:text-white"
            >
              {(!clients || clients.length === 0) && <option value="">No clients yet</option>}
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selected ? (
        <NotesThread
          key={selected.id}
          clientId={selected.id}
          viewerId={userId}
          viewerRole="admin"
          contextLabel={selected.label}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-[#E5E9F1] px-6 py-16 text-center text-sm text-slate-500 dark:border-[#1E2A3A] dark:text-[#9CA3AF]">
          {clients === null ? "Loading clients…" : "No client accounts yet."}
        </div>
      )}
    </AdminShell>
  );
}

/* ----------------------------- THREAD WIDGET ----------------------------- */

function NotesThread({
  clientId,
  viewerId,
  viewerRole,
  contextLabel,
}: {
  clientId: string;
  viewerId: string;
  viewerRole: "admin" | "client";
  contextLabel?: string;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setNotes(null);
    markedRef.current = false;
    (async () => {
      const { data: rows } = await supabase
        .from("notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setNotes((rows ?? []) as Note[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // Realtime: prepend new notes for this thread.
  useEffect(() => {
    const channel = supabase
      .channel(`notes_thread:${clientId}:${viewerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes", filter: `client_id=eq.${clientId}` },
        (payload) => {
          const n = payload.new as Note;
          setNotes((cur) => (cur ? [n, ...cur.filter((x) => x.id !== n.id)] : [n]));
          // Posting from another tab still counts as a read for this viewer.
          markRead();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, viewerId]);

  async function markRead() {
    const now = new Date().toISOString();
    await supabase
      .from("notes_read_state")
      .upsert(
        { client_id: clientId, user_id: viewerId, last_read_at: now },
        { onConflict: "client_id,user_id" },
      );
  }

  // Mark thread as read once notes load (and any time it remounts).
  useEffect(() => {
    if (notes === null || markedRef.current) return;
    markedRef.current = true;
    void markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, clientId, viewerId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setError(null);

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", viewerId)
      .maybeSingle();
    const authorName =
      (viewerRole === "client" ? prof?.company_name : null) ||
      prof?.full_name ||
      (viewerRole === "admin" ? "Fractioneer" : null);

    const { error: insErr } = await supabase.from("notes").insert({
      client_id: clientId,
      author_id: viewerId,
      author_role: viewerRole,
      author_name: authorName,
      body: trimmed,
    });
    setPosting(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setBody("");
    void markRead();
  }

  const unreadCount = useMemo(() => {
    if (!notes) return 0;
    const otherRole = viewerRole === "admin" ? "client" : "admin";
    return notes.filter((n) => n.author_role === otherRole).length;
  }, [notes, viewerRole]);

  return (
    <div className="flex min-h-[400px] flex-col rounded-xl border border-[#E5E9F1] bg-white p-5 dark:border-[#1E2A3A] dark:bg-[#111827]">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <MessageSquare className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {contextLabel ? `Thread with ${contextLabel}` : "Your thread"}
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-[#6B7280]">
            {(notes?.length ?? 0)} note{(notes?.length ?? 0) === 1 ? "" : "s"} ·{" "}
            {unreadCount} from {viewerRole === "admin" ? "client" : "admin"}
          </p>
        </div>
      </div>

      <form onSubmit={handlePost} className="mb-5 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            viewerRole === "admin"
              ? "Write a note to this client…"
              : "Write a note to your Fractioneer team…"
          }
          rows={3}
          maxLength={4000}
          className="block w-full resize-y rounded-md border border-[#E5E9F1] bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-[#1E2A3A] dark:bg-[#0F1729] dark:text-white dark:placeholder:text-[#6B7280]"
        />
        {error && (
          <div className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!body.trim() || posting}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {posting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Post note
          </button>
        </div>
      </form>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {notes === null && (
          <div className="flex items-center justify-center py-6 text-xs text-slate-400 dark:text-[#6B7280]">
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Loading notes…
          </div>
        )}
        {notes && notes.length === 0 && (
          <div className="rounded-md border border-dashed border-[#E5E9F1] px-4 py-10 text-center text-xs text-slate-400 dark:border-[#1E2A3A] dark:text-[#6B7280]">
            No notes yet.
          </div>
        )}
        {(notes ?? []).map((n) => (
          <NoteItem key={n.id} note={n} />
        ))}
      </div>
    </div>
  );
}

function NoteItem({ note }: { note: Note }) {
  const isAdmin = note.author_role === "admin";
  return (
    <div className="rounded-lg border border-[#E5E9F1] bg-slate-50/60 px-3 py-2.5 dark:border-[#1E2A3A] dark:bg-[#0F1729]/60">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          {note.author_name || (isAdmin ? "Fractioneer" : "Client")}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            isAdmin
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-300"
          }`}
        >
          {note.author_role}
        </span>
        <span
          className="ml-auto text-[10px] text-slate-400 dark:text-[#6B7280]"
          title={new Date(note.created_at).toLocaleString()}
        >
          {relativeTime(note.created_at)}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-[#E5E7EB]">
        {note.body}
      </p>
    </div>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
