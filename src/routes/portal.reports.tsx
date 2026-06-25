import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, FileSpreadsheet, Sparkles, ChevronDown } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { PortalEmptyState } from "@/components/portal/EmptyState";
import { getMyRole } from "@/lib/portal.functions";
import { useCompanyName } from "@/hooks/useProfile";
import { useEffectiveClientId } from "@/lib/impersonation";
import { getCached, setCached } from "@/lib/portal-cache";

export const Route = createFileRoute("/portal/reports")({
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
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
  document_id: string | null;
  documents: { file_name: string; file_path: string } | null;
};

type InsightRow = {
  insight_text: string;
  category: string;
  period_end: string | null;
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
  const [insights, setInsights] = useState<InsightRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    const cached = getCached<PeriodRow[]>("reports", effectiveId);
    setPeriods(cached ?? null);
    async function loadAll() {
      const [{ data: periodData }, { data: insightData }] = await Promise.all([
        supabase
          .from("periods")
          .select(
            "id, period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap, document_id, documents(file_name, file_path)",
          )
          .eq("client_id", effectiveId)
          .order("period_end", { ascending: false }),
        supabase
          .from("ai_insights")
          .select("insight_text, category, period_end")
          .eq("client_id", effectiveId),
      ]);
      if (cancelled) return;
      const fresh = (periodData ?? []) as unknown as PeriodRow[];
      setCached("reports", effectiveId, fresh);
      setPeriods(fresh);
      setInsights((insightData ?? []) as InsightRow[]);
      try {
        const r = await getMyRole();
        if (cancelled) return;
        setCached("role", user.id, r.role ?? "");
        setRole(r.role);
      } catch {}
    }
    void loadAll();
    // Realtime: refresh insights when admin regenerates them for any period.
    const channel = supabase
      .channel(`reports_ai_insights:${effectiveId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ai_insights", filter: `client_id=eq.${effectiveId}` },
        () => { void loadAll(); },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [effectiveId, user.id]);

  const insightsByPeriod = useMemo(() => {
    const m = new Map<string, InsightRow[]>();
    for (const i of insights) {
      const key = i.period_end ?? "";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(i);
    }
    return m;
  }, [insights]);

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
    <div className="flex min-h-screen bg-[#EEF2FA] dark:bg-[#05070D]">
      <PortalSidebar companyName={companyName} email={user.email ?? null} role={role} />
      <main className="flex flex-1 flex-col px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Period-by-period snapshots with the AI insights generated for each upload.
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
              <PeriodCard
                key={p.id}
                period={p}
                insights={insightsByPeriod.get(p.period_end) ?? []}
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PeriodCard({
  period,
  insights,
  onDownload,
}: {
  period: PeriodRow;
  insights: InsightRow[];
  onDownload: (path: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="group flex flex-col rounded-2xl border bg-white p-5 transition-colors border-[#E5E9F1] hover:border-blue-400/40 dark:bg-[#0A0E18] dark:border-[#1E2A3A] dark:hover:border-blue-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
            Period ending
          </div>
          <div className="mt-1 text-lg font-bold leading-tight text-slate-900 dark:text-white">
            {fmtDate(period.period_end)}
          </div>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
          <FileSpreadsheet className="h-4 w-4" />
        </span>
      </div>




      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 border-[#E5E9F1] dark:border-[#1E2A3A]">
        <Stat label="Net Revenue" value={fmtCurrency(period.net_revenue)} />
        <Stat label="Net Income" value={fmtCurrency(period.net_income)} />
        <Stat
          label="Net Margin"
          value={
            period.net_revenue && period.net_income != null && Number(period.net_revenue) !== 0
              ? fmtPercent((Number(period.net_income) / Number(period.net_revenue)) * 100)
              : "—"
          }
        />
        <Stat label="Cash" value={fmtCurrency(period.cash_balance)} />
        <Stat label="AR" value={fmtCurrency(period.total_ar)} />
        <Stat label="AP" value={fmtCurrency(period.total_ap)} />
      </dl>

      <div className="mt-5 flex items-center gap-2">
        {period.documents ? (
          <button
            onClick={() => onDownload(period.documents!.file_path, period.documents!.file_name)}
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

      <div className="mt-4 border-t pt-3 border-[#E5E9F1] dark:border-[#1E2A3A]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            AI Insights
            <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-[#1E2A3A] dark:text-[#9CA3AF]">
              {insights.length || "—"}
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="mt-3 space-y-2">
            {insights.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#E5E9F1] bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500 dark:border-[#1E2A3A] dark:bg-[#111827] dark:text-[#9CA3AF]">
                Insights are not available for this period.
              </div>
            ) : (
              insights.map((i, idx) => (
                <div
                  key={`${i.category}-${idx}`}
                  className="rounded-lg border bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700 border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A] dark:text-[#E5E7EB]"
                >
                  <span className="mr-2 inline-block rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-blue-600 dark:text-blue-300">
                    {i.category.replace(/_/g, " ")}
                  </span>
                  {i.insight_text}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
    </div>
  );
}
