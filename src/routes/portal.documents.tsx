import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
// BetaBanner is mounted in the parent /portal route shell.
import { getMyRole } from "@/lib/portal.functions";
import { useCompanyName } from "@/hooks/useProfile";
import { useEffectiveClientId } from "@/lib/impersonation";
import { getCached, setCached } from "@/lib/portal-cache";

export const Route = createFileRoute("/portal/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DocumentsPage,
});

type SharedDoc = {
  id: string;
  file_name: string;
  file_path: string;
  size_bytes: number | null;
  created_at: string;
};

function DocumentsPage() {
  const { user } = Route.useRouteContext() as {
    user: { id: string; email?: string | null };
  };
  const effectiveId = useEffectiveClientId(user.id)!;
  const companyName = useCompanyName(effectiveId);
  const [role, setRole] = useState<string | null>(() => getCached<string>("role", user.id) ?? null);
  const [docs, setDocs] = useState<SharedDoc[] | null>(
    () => getCached<SharedDoc[]>("shared_documents", effectiveId) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCached<SharedDoc[]>("shared_documents", effectiveId);
    setDocs(cached ?? null);
    (async () => {
      const { data } = await supabase
        .from("shared_documents")
        .select("id, file_name, file_path, size_bytes, created_at")
        .eq("client_id", effectiveId)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const fresh = (data ?? []) as SharedDoc[];
      setCached("shared_documents", effectiveId, fresh);
      setDocs(fresh);
      try {
        const r = await getMyRole();
        if (cancelled) return;
        setCached("role", user.id, r.role ?? "");
        setRole(r.role);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveId, user.id]);

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

  return (
    <div className="flex min-h-screen bg-[#EEF2FA] dark:bg-[#05070D]">
      <PortalSidebar companyName={companyName} email={user.email ?? null} role={role} />
      <main className="flex-1 px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Reports, reconciliations, and other files shared by your Fractioneer team.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
          <ul className="divide-y divide-[#E5E9F1] dark:divide-[#1E2A3A]">
            {docs === null && (
              <li className="flex items-center justify-center px-5 py-10 text-sm text-slate-500 dark:text-[#9CA3AF]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading…
              </li>
            )}
            {docs && docs.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">
                Your Fractioneer team hasn&apos;t shared any documents yet.
              </li>
            )}
            {(docs ?? []).map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-[#1a2335]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {doc.file_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                      Shared {new Date(doc.created_at).toLocaleDateString()}
                      {doc.size_bytes ? ` · ${(doc.size_bytes / 1024).toFixed(0)} KB` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(doc.file_path)}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors bg-white border-[#E5E9F1] text-slate-700 hover:bg-slate-50 dark:bg-[#0F1729] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors bg-white border-[#E5E9F1] text-slate-700 hover:bg-slate-50 dark:bg-[#0F1729] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
