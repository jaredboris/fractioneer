import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Note = {
  id: string;
  client_id: string;
  author_id: string;
  author_role: "admin" | "client";
  author_name: string | null;
  body: string;
  created_at: string;
};

export function NotesCard({
  clientId,
  viewerRole,
  viewerId,
}: {
  clientId: string;
  viewerRole: "admin" | "client";
  viewerId: string;
}) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Load notes + read state
  useEffect(() => {
    let cancelled = false;
    setNotes(null);
    setLastReadAt(null);
    (async () => {
      const [{ data: rows }, { data: rs }] = await Promise.all([
        supabase
          .from("notes")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("notes_read_state")
          .select("last_read_at")
          .eq("client_id", clientId)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      setNotes((rows ?? []) as Note[]);
      setLastReadAt(rs?.last_read_at ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // Realtime: prepend new notes for this client
  useEffect(() => {
    const channel = supabase
      .channel(`notes:${clientId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes", filter: `client_id=eq.${clientId}` },
        (payload) => {
          const n = payload.new as Note;
          setNotes((cur) => (cur ? [n, ...cur.filter((x) => x.id !== n.id)] : [n]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const unreadCount = useMemo(() => {
    // Only the client themselves sees the unread indicator.
    if (viewerRole !== "client" || viewerId !== clientId || !notes) return 0;
    const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
    return notes.filter(
      (n) => n.author_role === "admin" && new Date(n.created_at).getTime() > since,
    ).length;
  }, [notes, lastReadAt, viewerRole, viewerId, clientId]);

  // When the card is visible to the client viewer, mark as read.
  useEffect(() => {
    if (viewerRole !== "client" || viewerId !== clientId) return;
    if (!cardRef.current || unreadCount === 0) return;
    const el = cardRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          const now = new Date().toISOString();
          setLastReadAt(now);
          void supabase
            .from("notes_read_state")
            .upsert({ client_id: clientId, last_read_at: now }, { onConflict: "client_id" });
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [unreadCount, clientId, viewerRole, viewerId]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setError(null);

    // Derive author name from profiles (best effort).
    let authorName: string | null = null;
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", viewerId)
      .maybeSingle();
    authorName =
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
    // Posting also counts as reading.
    if (viewerRole === "client" && viewerId === clientId) {
      const now = new Date().toISOString();
      setLastReadAt(now);
      void supabase
        .from("notes_read_state")
        .upsert({ client_id: clientId, last_read_at: now }, { onConflict: "client_id" });
    }
  }

  return (
    <div ref={cardRef} className="flex min-h-[280px] flex-col rounded-xl p-5 nb-card h-full">
      <div ref={headerRef} className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
            <MessageSquare className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Notes
            </h2>
            <p className="text-[11px] text-slate-400 dark:text-[#6B7280]">
              Messages between you and your Fractioneer team.
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-300"
            title={`${unreadCount} unread admin note${unreadCount === 1 ? "" : "s"}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handlePost} className="mb-4 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            viewerRole === "admin"
              ? "Write a note to this client…"
              : "Write a note to your Fractioneer team…"
          }
          rows={2}
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
            {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Post note
          </button>
        </div>
      </form>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {notes === null && (
          <div className="flex items-center justify-center py-6 text-xs text-slate-400 dark:text-[#6B7280]">
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            Loading notes…
          </div>
        )}
        {notes && notes.length === 0 && (
          <div className="rounded-md border border-dashed border-[#E5E9F1] px-4 py-8 text-center text-xs text-slate-400 dark:border-[#1E2A3A] dark:text-[#6B7280]">
            No notes from your Fractioneer team yet.
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
