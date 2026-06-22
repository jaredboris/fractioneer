import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalEmptyState } from "@/components/portal/EmptyState";
import { getMyRole } from "@/lib/portal.functions";
import { useCompanyName } from "@/hooks/useProfile";
import { useEffectiveClientId } from "@/lib/impersonation";
import { getCached, setCached } from "@/lib/portal-cache";

export const Route = createFileRoute("/portal/reports")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reports — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReportsPage,
});

type PeriodRow = {
  id: string;
  period_end: string;
  net_revenue: number | null;
  net_income: number | null;
  gross_margin: number | null;
  document_id: string | null;
  documents: { file_name: string; file_path: string } | null;
};

const fmtCurrency = (v: number | null) =>
  v === null || v === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(v);

const fmtPercent = (v: number | null) => {
  if (v === null || v === undefined) return "—";
  // Accept either fractional (0.42) or whole percent (42)
  const pct = Math.abs(v) <= 1 ? v * 100 : v;
  return `${pct.toFixed(1)}%`;
};

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function ReportsPage() {
  const { user } = Route.useRouteContext() as {
    user: { id: string; email?: string | null };
  };
  const effectiveId = useEffectiveClientId(user.id)!;
  const companyName = useCompanyName(effectiveId);
  const [role, setRole] = useState<string | null>(() => getCached<string>("role", user.id) ?? null);
  const [periods, setPeriods] = useState<PeriodRow[] | null>(
    () => getCached<PeriodRow[]>("reports", effectiveId) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCached<PeriodRow[]>("reports", effectiveId);
    setPeriods(cached ?? null);
    (async () => {
      const { data } = await supabase
        .from("periods")
        .select(
          "id, period_end, net_revenue, net_income, gross_margin, document_id, documents(file_name, file_path)",
        )
        .eq("client_id", effectiveId)
        .order("period_end", { ascending: false });
      if (cancelled) return;
      const fresh = (data ?? []) as unknown as PeriodRow[];
      setCached("reports", effectiveId, fresh);
      setPeriods(fresh);
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

  async function handleDownload(path: string, name: string) {
    const { data } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(path, 60, { download: name });
    if (!data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = name;
    a.click();
  }

  return (
    <div className="flex min-h-screen bg-[#EEF2FA] dark:bg-[#0A0F1E]">
      <PortalSidebar companyName={companyName} email={user.email ?? null} role={role} />
      <main className="flex flex-1 flex-col px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Period snapshots prepared by your Fractioneer team.
          </p>
        </div>

        {periods === null ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : periods.length === 0 ? (
          <PortalEmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {periods.map((p) => (
              <article
                key={p.id}
                className="group flex flex-col rounded-2xl border bg-white p-5 transition-colors border-[#E5E9F1] hover:border-blue-400/40 dark:bg-[#111827] dark:border-[#1E2A3A] dark:hover:border-blue-500/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
                      Period ending
                    </div>
                    <div className="mt-1 text-lg font-bold leading-tight text-slate-900 dark:text-white">
                      {fmtDate(p.period_end)}
                    </div>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                </div>

                <dl className="mt-5 space-y-3 border-t pt-4 border-[#E5E9F1] dark:border-[#1E2A3A]">
                  <Stat label="Net revenue" value={fmtCurrency(p.net_revenue)} />
                  <Stat label="Net income" value={fmtCurrency(p.net_income)} />
                  <Stat label="Gross margin" value={fmtPercent(p.gross_margin)} />
                </dl>

                <div className="mt-5 flex items-center gap-2">
                  {p.documents ? (
                    <button
                      onClick={() =>
                        handleDownload(p.documents!.file_path, p.documents!.file_name)
                      }
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Excel
                    </button>
                  ) : (
                    <div className="w-full rounded-lg border border-dashed px-3 py-2 text-center text-xs text-slate-400 border-[#E5E9F1] dark:border-[#1E2A3A] dark:text-[#6B7280]">
                      No source file attached
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-slate-500 dark:text-[#9CA3AF]">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
