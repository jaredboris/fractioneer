import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true when the current viewer has unread notes posted by the other
 * party in any thread they can see.
 *
 *  - Client viewers (viewerRole = "client"): unread if their own thread has
 *    an admin note newer than their last_read_at.
 *  - Admin viewers (viewerRole = "admin"): unread if ANY thread has a client
 *    note newer than the admin's last_read_at for that thread.
 *
 * Cheap implementation: fetch the relevant notes + this viewer's read-state
 * rows on mount, then re-evaluate whenever a new note arrives via realtime
 * or the active route changes.
 */
export function useNotesUnread(
  viewerId: string | null,
  viewerRole: "admin" | "client" | null,
): boolean {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!viewerId || !viewerRole) {
      setUnread(false);
      return;
    }
    const uid = viewerId;
    const role = viewerRole;
    let cancelled = false;

    async function recompute() {
      const otherRole = role === "admin" ? "client" : "admin";
      const [{ data: notes }, { data: readRows }] = await Promise.all([
        supabase
          .from("notes")
          .select("client_id, created_at")
          .eq("author_role", otherRole),
        supabase
          .from("notes_read_state")
          .select("client_id, last_read_at")
          .eq("user_id", uid),
      ]);
      if (cancelled) return;
      const lastRead = new Map<string, number>();
      for (const r of readRows ?? []) {
        lastRead.set(r.client_id, new Date(r.last_read_at).getTime());
      }
      const has = (notes ?? []).some((n) => {
        const t = new Date(n.created_at).getTime();
        const lr = lastRead.get(n.client_id) ?? 0;
        return t > lr;
      });
      setUnread(has);
    }

    void recompute();

    // Refresh on new notes inserts (any client thread the viewer can read).
    const noteChannel = supabase
      .channel(`notes_unread:${viewerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notes" },
        () => {
          void recompute();
        },
      )
      .subscribe();

    // Refresh when the viewer marks a thread as read.
    const readChannel = supabase
      .channel(`notes_read_state:${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes_read_state",
          filter: `user_id=eq.${viewerId}`,
        },
        () => {
          void recompute();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(noteChannel);
      supabase.removeChannel(readChannel);
    };
  }, [viewerId, viewerRole]);

  return unread;
}
