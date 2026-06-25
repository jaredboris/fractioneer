import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
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
import { PortalLayout } from "@/components/portal/PortalLayout";
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
  net_revenue: number | null;
  net_income: number | null;
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
};

type RangeKey = "3M" | "6M" | "12M" | "ALL";

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
  const [range, setRange] = useState<RangeKey>("12M");

  useEffect(() => {
    let cancelled = false;
    const cached = getCached<Row[]>("cashflow", effectiveId);
    setRows(cached ?? null);
    (async () => {
      const { data } = await supabase
        .from("periods")
        .select("period_end, net_revenue, net_income, cash_balance, total_ar, total_ap")
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

  const filtered = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (range === "ALL") return rows;
    const months = range === "3M" ? 3 : range === "6M" ? 6 : 12;
    return rows.slice(-months);
  }, [rows, range]);

  const chartData = filtered.map((r) => {
    const rev = r.net_revenue == null ? 0 : Number(r.net_revenue);
    const ni = r.net_income == null ? 0 : Number(r.net_income);
    const expenses = rev > 0 ? Math.max(0, rev - ni) : 0;
    return {
      period: fmtDateShort(r.period_end),
      revenue: rev,
      expenses,
      cash: r.cash_balance,
      ar: r.total_ar,
      ap: r.total_ap,
    };
  });

  return (
    <PortalLayout
      sidebar={<PortalSidebar companyName={companyName} email={user.email ?? null} role={role} />}
    >
      <main className="flex flex-1 flex-col px-8 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Cash Flow
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
              Revenue, cash balance, and AR/AP trends across reported periods.
            </p>
          </div>
          <RangeSelector value={range} onChange={setRange} />
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
                Only one period reported so far — charts will build out as more periods are added.
              </div>
            )}

            <ChartCard title="Revenue vs Expenses">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <defs>
                    <linearGradient id="cfRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#93C5FD" stopOpacity={1} />
                      <stop offset="40%" stopColor="#3B82F6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="currentColor" strokeOpacity={0.4} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="currentColor"
                    strokeOpacity={0.4}
                    tickFormatter={(v) => fmtCurrency(Number(v))}
                  />
                  <RTooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => fmtCurrency(Number(v))}
                    cursor={{ fill: "rgba(59,130,246,0.08)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="url(#cfRevenue)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#475569" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Cash Flow Over Time">
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
                  <RTooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(Number(v))} />
                  <Line
                    type="monotone"
                    dataKey="cash"
                    name="Cash balance"
                    stroke="#60A5FA"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#60A5FA" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="AR vs AP Over Time">
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
                  <RTooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="ar" name="Accounts Receivable" stroke="#60A5FA" strokeWidth={2.5} dot={{ r: 3, fill: "#60A5FA" }} />
                  <Line type="monotone" dataKey="ap" name="Accounts Payable" stroke="#94A3B8" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 3, fill: "#94A3B8" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </main>
    </PortalLayout>
  );
}

const tooltipStyle = {
  background: "rgba(10,14,24,0.95)",
  border: "1px solid rgba(96,165,250,0.35)",
  borderRadius: 8,
  color: "#fff",
  fontSize: 12,
} as const;

function RangeSelector({ value, onChange }: { value: RangeKey; onChange: (v: RangeKey) => void }) {
  const options: { key: RangeKey; label: string }[] = [
    { key: "3M", label: "3M" },
    { key: "6M", label: "6M" },
    { key: "12M", label: "12M" },
    { key: "ALL", label: "All" },
  ];
  return (
    <div className="inline-flex rounded-lg border bg-white p-0.5 border-[#E5E9F1] dark:bg-[#0A0E18] dark:border-[#1E2A3A]">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.key
              ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]"
              : "text-slate-600 hover:bg-slate-50 dark:text-[#9CA3AF] dark:hover:bg-[#111827]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 border-[#E5E9F1] dark:bg-[#0A0E18] dark:border-[#1E2A3A]">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">{title}</h2>
      <div className="mt-4 text-slate-500 dark:text-[#9CA3AF]">{children}</div>
    </section>
  );
}
