import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { PortalEmptyState } from "@/components/portal/EmptyState";
import { getMyRole } from "@/lib/portal.functions";
import { useCompanyName } from "@/hooks/useProfile";
import { useEffectiveClientId } from "@/lib/impersonation";
import { getCached, setCached } from "@/lib/portal-cache";

export const Route = createFileRoute("/portal/cashflow")({
  head: () => ({
    meta: [
      { title: "Cash Flow — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CashFlowPage,
});

type Row = {
  period_end: string;
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
};

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(v);

const fmtDateShort = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });

function CashFlowPage() {
  const { user } = Route.useRouteContext() as {
    user: { id: string; email?: string | null };
  };
  const effectiveId = useEffectiveClientId(user.id)!;
  const companyName = useCompanyName(effectiveId);
  const [role, setRole] = useState<string | null>(() => getCached<string>("role", user.id) ?? null);
  const [rows, setRows] = useState<Row[] | null>(
    () => getCached<Row[]>("cashflow", effectiveId) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCached<Row[]>("cashflow", effectiveId);
    setRows(cached ?? null);
    (async () => {
      const { data } = await supabase
        .from("periods")
        .select("period_end, cash_balance, total_ar, total_ap")
        .eq("client_id", effectiveId)
        .order("period_end", { ascending: true });
      if (cancelled) return;
      const fresh = (data ?? []) as Row[];
      setCached("cashflow", effectiveId, fresh);
      setRows(fresh);
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

  const chartData = (rows ?? []).map((r) => ({
    period: fmtDateShort(r.period_end),
    cash: r.cash_balance,
    ar: r.total_ar,
    ap: r.total_ap,
  }));

  return (
    <div className="flex min-h-screen bg-[#EEF2FA] dark:bg-[#05070D]">
      <PortalSidebar companyName={companyName} email={user.email ?? null} role={role} />
      <main className="flex flex-1 flex-col px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Cash Flow
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Cash balance and AR/AP trends across reported periods.
          </p>
        </div>

        {rows === null ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : rows.length === 0 ? (
          <PortalEmptyState />
        ) : (
          <div className="space-y-6">
            {rows.length === 1 && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
                Only one period reported so far — the chart will build out as more
                periods are added.
              </div>
            )}

            <ChartCard title="Cash balance over time">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="currentColor" strokeOpacity={0.4} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="currentColor"
                    strokeOpacity={0.4}
                    tickFormatter={(v) => fmtCurrency(Number(v))}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.95)",
                      border: "1px solid #1E2A3A",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtCurrency(Number(v))}
                  />
                  <Line
                    type="monotone"
                    dataKey="cash"
                    name="Cash balance"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3B82F6" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="AR & AP trends">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="currentColor" strokeOpacity={0.4} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="currentColor"
                    strokeOpacity={0.4}
                    tickFormatter={(v) => fmtCurrency(Number(v))}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.95)",
                      border: "1px solid #1E2A3A",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => fmtCurrency(Number(v))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="ar"
                    name="Accounts Receivable"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#10B981" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ap"
                    name="Accounts Payable"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#F59E0B" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </main>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      <div className="mt-4 text-slate-500 dark:text-[#9CA3AF]">{children}</div>
    </section>
  );
}
