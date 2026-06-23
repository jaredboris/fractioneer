import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  CheckCircle2,
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Banknote,
  Activity,
  Briefcase,
  Calendar,
  BarChart3,
  LineChart as LineIcon,
  Plus,
  Minus,
  X,
  GripVertical,
  Trash2,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,

} from "lucide-react";




// ---- Types & Catalog ---------------------------------------------------------

export type WidgetKind = "stat" | "chart" | "wide";

export type NormalizedRow = {
  period: string | null; // YYYY-MM-DD
  net_revenue: number | null;
  net_income: number | null;
  gross_margin: number | null; // percent or null
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
  monthly_close_status: string | null;
  monthly_close: string | null;
};

export type WidgetContext = {
  rows: NormalizedRow[]; // ascending by period
  latest: NormalizedRow | null;
  prev: NormalizedRow | null;
  lastUploadAt: string | null;
  isDark: boolean;
  clientId: string;
  viewerRole: "admin" | "client";
  viewerId: string;
  aiInsights?: { insight_text: string; category: string }[];
  generatingInsights?: boolean;
};



export type WidgetDef = {
  id: string;
  label: string;
  kind: WidgetKind;
  locked?: boolean;
  defaultOn?: boolean;
  render: (ctx: WidgetContext) => React.ReactNode;
};

// All widgets in display order. Default order for new clients = `defaultOn` only.
export const WIDGET_CATALOG: WidgetDef[] = [
  {
    id: "monthly_close",
    label: "Monthly Close Status",
    kind: "stat",
    locked: true,
    defaultOn: true,
    render: (ctx) => (
      <StatCard
        label="Monthly Close"
        value={ctx.latest?.monthly_close_status ?? ctx.latest?.monthly_close ?? "—"}
        tone={ctx.latest?.monthly_close_status === "closed" ? "ok" : "info"}
        icon={<CheckCircle2 className="h-5 w-5" />}
        periodLabel={formatAsOf(ctx.latest?.period ?? null)}
      />
    ),
  },
  {
    id: "cash_position",
    label: "Cash Position",
    kind: "stat",
    locked: true,
    defaultOn: true,
    render: (ctx) => (
      <StatCard
        label="Cash Position"
        value={fmtCurr(ctx.latest?.cash_balance)}
        numericValue={ctx.latest?.cash_balance ?? null}
        tone="info"
        icon={<Wallet className="h-5 w-5" />}
        periodLabel={formatAsOf(ctx.latest?.period ?? null)}
        trend={trendOf(ctx.latest?.cash_balance, ctx.prev?.cash_balance)}
      />
    ),
  },
  {
    id: "accounts_receivable",
    label: "Accounts Receivable",
    kind: "stat",
    defaultOn: true,
    render: (ctx) => (
      <StatCard
        label="Accounts Receivable"
        value={fmtCurr(ctx.latest?.total_ar)}
        numericValue={ctx.latest?.total_ar ?? null}
        tone="info"
        icon={<Receipt className="h-5 w-5" />}
        periodLabel={formatAsOf(ctx.latest?.period ?? null)}
        trend={trendOf(ctx.latest?.total_ar, ctx.prev?.total_ar)}
      />
    ),
  },
  {
    id: "accounts_payable",
    label: "Accounts Payable",
    kind: "stat",
    defaultOn: true,
    render: (ctx) => (
      <StatCard
        label="Accounts Payable"
        value={fmtCurr(ctx.latest?.total_ap)}
        numericValue={ctx.latest?.total_ap ?? null}
        tone="info"
        icon={<Receipt className="h-5 w-5" />}
        periodLabel={formatAsOf(ctx.latest?.period ?? null)}
        trend={trendOf(ctx.latest?.total_ap, ctx.prev?.total_ap)}
      />
    ),
  },
  {
    id: "net_revenue",
    label: "Net Revenue",
    kind: "stat",
    render: (ctx) => (
      <StatCard
        label="Net Revenue"
        value={fmtCurr(ctx.latest?.net_revenue)}
        numericValue={ctx.latest?.net_revenue ?? null}
        tone="info"
        icon={<DollarSign className="h-5 w-5" />}
        periodLabel={formatAsOf(ctx.latest?.period ?? null)}
        trend={trendOf(ctx.latest?.net_revenue, ctx.prev?.net_revenue)}
      />
    ),
  },
  {
    id: "net_income",
    label: "Net Income",
    kind: "stat",
    render: (ctx) => (
      <StatCard
        label="Net Income"
        value={fmtCurr(ctx.latest?.net_income)}
        numericValue={ctx.latest?.net_income ?? null}
        tone={ctx.latest?.net_income != null && ctx.latest.net_income < 0 ? "warn" : "ok"}
        icon={<Activity className="h-5 w-5" />}
        periodLabel={formatAsOf(ctx.latest?.period ?? null)}
        trend={trendOf(ctx.latest?.net_income, ctx.prev?.net_income)}
      />
    ),
  },
  {
    id: "gross_margin",
    label: "Gross Margin",
    kind: "stat",
    render: (ctx) => {
      const gm = computeGrossMargin(ctx.latest);
      return (
        <StatCard
          label="Gross Margin"
          value={gm == null ? "—" : `${gm.toFixed(1)}%`}
          tone={gm == null ? "info" : gm < 0 ? "warn" : "ok"}
          icon={<TrendingUp className="h-5 w-5" />}
          periodLabel={formatAsOf(ctx.latest?.period ?? null)}
        />
      );
    },
  },
  {
    id: "total_expenses",
    label: "Total Expenses",
    kind: "stat",
    render: (ctx) => {
      const exp = computeExpenses(ctx.latest);
      const prevExp = computeExpenses(ctx.prev);
      return (
        <StatCard
          label="Total Expenses"
          value={fmtCurr(exp)}
          numericValue={exp}
          tone="info"
          icon={<Banknote className="h-5 w-5" />}
          periodLabel={formatAsOf(ctx.latest?.period ?? null)}
          trend={trendOf(exp, prevExp)}
        />
      );
    },
  },
  {
    id: "working_capital",
    label: "Working Capital",
    kind: "stat",
    render: (ctx) => {
      const wc = computeWC(ctx.latest);
      const pwc = computeWC(ctx.prev);
      return (
        <StatCard
          label="Working Capital"
          value={fmtCurr(wc)}
          numericValue={wc}
          tone={wc == null ? "info" : wc < 0 ? "warn" : "ok"}
          icon={<Briefcase className="h-5 w-5" />}
          periodLabel={formatAsOf(ctx.latest?.period ?? null)}
          trend={trendOf(wc, pwc)}
        />
      );
    },
  },
  {
    id: "last_upload",
    label: "Last Upload Date",
    kind: "stat",
    render: (ctx) => {
      const v = ctx.lastUploadAt;
      let display = "—";
      if (v) {
        // v is a YYYY-MM-DD period_end string; parse without timezone shift.
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
        const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
        display = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      }
      return (
        <StatCard
          label="Last Upload"
          value={display}
          tone="info"
          icon={<Calendar className="h-5 w-5" />}
          periodLabel={v ? "Most recent period" : ""}
        />
      );
    },
  },
  {
    id: "ai_insights",
    label: "AI Insights",
    kind: "wide",
    defaultOn: true,
    render: (ctx) => <AiInsightsCard ctx={ctx} />,
  },
  {
    id: "chart_rev_exp",
    label: "Revenue vs Expenses",

    kind: "chart",
    render: (ctx) => <RevExpChart ctx={ctx} />,
  },
  {
    id: "chart_cash_flow",
    label: "Cash Flow Over Time",
    kind: "chart",
    render: (ctx) => <CashFlowChart ctx={ctx} />,
  },
  {
    id: "chart_ar_ap",
    label: "AR vs AP Over Time",
    kind: "chart",
    render: (ctx) => <ArApChart ctx={ctx} />,
  },
];

export const WIDGET_BY_ID = Object.fromEntries(WIDGET_CATALOG.map((w) => [w.id, w]));
export const LOCKED_IDS = WIDGET_CATALOG.filter((w) => w.locked).map((w) => w.id);
export const DEFAULT_IDS = WIDGET_CATALOG.filter((w) => w.defaultOn).map((w) => w.id);

// ---- Hook --------------------------------------------------------------------

// One-time cleanup of legacy localStorage keys. Widget prefs now live in
// Supabase exclusively so admin and client browsers stay in sync.
const LEGACY_STORAGE_KEY = "portal.dashboard.widgets.v2";
function cleanupLegacyStorage() {
  if (typeof window === "undefined") return;
  try {
    const ls = window.localStorage;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && (k === LEGACY_STORAGE_KEY || k.startsWith(`${LEGACY_STORAGE_KEY}:`))) toRemove.push(k);
    }
    toRemove.forEach((k) => ls.removeItem(k));
  } catch {}
}

function normalize(ids: string[]): string[] {
  const filtered = ids.filter((id) => WIDGET_BY_ID[id]);
  for (const lid of LOCKED_IDS) {
    if (!filtered.includes(lid)) filtered.unshift(lid);
  }
  return filtered;
}

import { supabase } from "@/integrations/supabase/client";

export function useWidgetPrefs(
  clientId: string,
  opts?: { readOnly?: boolean; overrideIds?: string[] | null },
) {
  const readOnly = !!opts?.readOnly;
  const overrideIds = opts?.overrideIds ?? null;

  const [ids, setIdsState] = useState<string[]>(DEFAULT_IDS);
  // Track override transitions so we can seed state on enter and refetch on exit.
  const prevOverrideRef = useRef<string[] | null>(null);
  const [fetchNonce, setFetchNonce] = useState(0);

  // Clear any legacy localStorage entries left over from the cached implementation.
  useEffect(() => {
    cleanupLegacyStorage();
  }, []);

  // Reset to defaults when the target client changes (spy mode switch) until
  // the server fetch resolves.
  useEffect(() => {
    setIdsState(DEFAULT_IDS);
  }, [clientId]);

  // Handle override toggle:
  //  - flipping ON seeds local state with the override list (no persist).
  //  - flipping OFF triggers a server refetch to restore the client's saved layout.
  useEffect(() => {
    const prev = prevOverrideRef.current;
    if (overrideIds && !prev) {
      setIdsState(normalize(overrideIds));
    } else if (!overrideIds && prev) {
      setFetchNonce((n) => n + 1);
    }
    prevOverrideRef.current = overrideIds;
  }, [overrideIds]);

  // Pull authoritative prefs from the database. Skipped while override is active
  // so the admin's working draft isn't clobbered.
  useEffect(() => {
    if (overrideIds) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("widget_prefs")
        .select("widget_ids")
        .eq("user_id", clientId)
        .maybeSingle();
      if (cancelled || error) return;
      if (data?.widget_ids && Array.isArray(data.widget_ids) && data.widget_ids.length > 0) {
        setIdsState(normalize(data.widget_ids as string[]));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, overrideIds, fetchNonce]);

  // Live updates: any change to this client's widget_prefs row (made by the
  // client themselves or by an admin in spy mode) is pushed to every open tab.
  // Skipped while override is active so the admin's draft isn't overwritten by
  // their own write echo.
  useEffect(() => {
    if (overrideIds) return;
    const channel = supabase
      .channel(`widget_prefs:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "widget_prefs",
          filter: `user_id=eq.${clientId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { widget_ids?: unknown } | null;
          const next = row?.widget_ids;
          if (Array.isArray(next) && next.length > 0) {
            setIdsState(normalize(next as string[]));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, overrideIds]);

  // Persist to the server — unless we're read-only. After a successful write,
  // bump fetchNonce so the canonical row is re-read from Supabase.
  async function persist(next: string[]) {
    if (readOnly) return;
    const { error } = await supabase
      .from("widget_prefs")
      .upsert(
        { user_id: clientId, widget_ids: next, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) {
      console.error("[widget_prefs] persist failed", error);
      return;
    }
    setFetchNonce((n) => n + 1);
  }

  function setIds(updater: string[] | ((prev: string[]) => string[])) {
    if (readOnly) return;
    setIdsState((cur) => {
      const next = typeof updater === "function" ? (updater as (p: string[]) => string[])(cur) : updater;
      void persist(next);
      return next;
    });
  }

  return {
    ids,
    readOnly,
    setIds,
    add(id: string) {
      if (readOnly) return;
      setIds((cur) => (cur.includes(id) ? cur : [...cur, id]));
    },
    remove(id: string) {
      if (readOnly) return;
      if (LOCKED_IDS.includes(id)) return;
      setIds((cur) => cur.filter((x) => x !== id));
    },
    move(from: number, to: number) {
      if (readOnly) return;
      setIds((cur) => {
        if (from === to || from < 0 || to < 0 || from >= cur.length || to >= cur.length) return cur;
        const next = [...cur];
        const [it] = next.splice(from, 1);
        next.splice(to, 0, it);
        return next;
      });
    },
  };
}



// ---- Editable wrapper (iOS-style edit mode, dnd-kit sortable) ---------------

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function EditableWidget({
  id,
  index,
  editMode,
  removing,
  onRemove,
  onAnimationEnd,
  className,
  children,
}: {
  id: string;
  index: number;
  editMode: boolean;
  removing: boolean;
  onRemove: (id: string) => void;
  onAnimationEnd?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const w = WIDGET_BY_ID[id];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled: !editMode || removing,
    // Spring-y transition for items sliding out of the way.
    transition: {
      duration: w?.kind === "chart" ? 640 : 560,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  if (!w) return null;
  const locked = !!w.locked;

  // The source item stays in its grid cell while a DragOverlay follows the
  // cursor, so we hide the original content (opacity 0) to leave a clean gap.
  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : undefined,
  };

  const jiggleClass = editMode && !removing && !isDragging
    ? w.kind === "chart"
      ? (index % 2 === 0 ? "widget-jiggle-wide-a" : "widget-jiggle-wide-b")
      : (index % 2 === 0 ? "widget-jiggle-a" : "widget-jiggle-b")
    : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`widget-sortable relative ${className ?? ""}`}
      {...attributes}
      {...(editMode && !removing ? listeners : {})}
    >
      <div
        className={`relative ${jiggleClass} ${removing ? "widget-remove" : ""} ${editMode ? "cursor-grab active:cursor-grabbing" : ""}`}
        onAnimationEnd={removing ? onAnimationEnd : undefined}
      >
        {children}
        {isOver && !isDragging && (
          <div className="widget-destination-highlight" aria-hidden />
        )}
        {editMode && (
          <>
            {locked ? (
              <span
                className="absolute -top-2 -left-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-500 text-white shadow-lg ring-2 ring-white dark:ring-[#0F1729]"
                aria-label="Locked"
                title="Always on"
              >
                <Lock className="h-3 w-3" />
              </span>
            ) : (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(id);
                }}
                className="absolute -top-2 -left-2 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-600/80 text-white shadow-lg ring-2 ring-white hover:bg-slate-600 dark:bg-white/20 dark:ring-[#0F1729] dark:hover:bg-white/30 transition-colors"
                aria-label={`Remove ${w.label}`}
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Visual shown inside <DragOverlay> while a widget is being dragged. */
export function WidgetOverlay({ children }: { children: React.ReactNode }) {
  return <div className="widget-overlay">{children}</div>;
}



export function AddWidgetModal({
  ids,
  onAdd,
  onClose,
}: {
  ids: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
}) {
  const available = WIDGET_CATALOG.filter((w) => !ids.includes(w.id));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-xl border bg-white border-[#E5E9F1] dark:bg-[#0F1729] dark:border-[#1E2A3A] p-5 shadow-xl nb-rise"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Add a widget</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">
              Choose a widget to add to your dashboard.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-[#1a2335]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {available.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500 dark:text-[#9CA3AF]">
            All widgets are already on your dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {available.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  onAdd(w.id);
                  onClose();
                }}
                className="group flex items-center gap-3 rounded-lg border px-3 py-3 text-left bg-slate-50 border-[#E5E9F1] hover:border-blue-400 hover:bg-blue-50 dark:bg-[#111827] dark:border-[#1E2A3A] dark:hover:border-blue-500/60 dark:hover:bg-[#1a2335] transition-colors"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  {w.kind === "chart" ? <LineIcon className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{w.label}</div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-[#6B7280]">
                    {w.kind}
                  </div>
                </div>
                <Plus className="h-4 w-4 text-slate-400 group-hover:text-blue-500 dark:text-[#6B7280]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Stat Card (preserved styling) ------------------------------------------

type Tone = "ok" | "warn" | "info";

export function StatCard({
  label,
  value,
  numericValue,
  tone,
  icon,
  periodLabel,
  trend,
}: {
  label: string;
  value: string;
  numericValue?: number | null;
  tone: Tone;
  icon: React.ReactNode;
  periodLabel: string;
  trend?: { dir: "up" | "down"; pct: number };
}) {
  const iconBg =
    tone === "ok"
      ? "rgba(16, 185, 129, 0.12)"
      : tone === "warn"
        ? "rgba(248, 113, 113, 0.12)"
        : "rgba(59, 130, 246, 0.12)";
  const iconColor = tone === "ok" ? "#10B981" : tone === "warn" ? "#EF4444" : "#3B82F6";
  return (
    <div className="rounded-xl p-5 nb-card h-full">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-[#6B7280]">
          {label}
        </span>
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg, color: iconColor, boxShadow: `0 0 12px ${iconBg}` }}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {numericValue != null && Number.isFinite(numericValue) ? (
          <CountUpValue value={numericValue} format={(n) => fmtCurr(n)} fallback={value} />
        ) : (
          value
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-400 dark:text-[#6B7280]">{periodLabel || "—"}</span>
        {trend && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-medium"
            style={{ color: trend.dir === "up" ? "#10B981" : "#EF4444" }}
          >
            {trend.dir === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.pct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

function CountUpValue({
  value,
  format,
  fallback,
  duration = 1200,
}: {
  value: number | null | undefined;
  format: (n: number) => string;
  fallback: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState<number | null>(value == null ? null : 0);
  useEffect(() => {
    if (value == null || !Number.isFinite(value)) {
      setDisplay(null);
      return;
    }
    const target = Number(value);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  if (display == null) return <>{fallback}</>;
  return <>{format(display)}</>;
}

// ---- Chart widgets -----------------------------------------------------------

function chartTheme(isDark: boolean) {
  return {
    axisStroke: isDark ? "#6B7280" : "#94A3B8",
    gridStroke: isDark ? "#1E2A3A" : "#E5E9F1",
    expensesFill: isDark ? "#374151" : "#E2E8F0",
    tooltipBg: isDark ? "#111827" : "#FFFFFF",
    tooltipBorder: isDark ? "#1E2A3A" : "#E5E9F1",
    tooltipText: isDark ? "#E5E7EB" : "#0F172A",
    legendColor: isDark ? "#9CA3AF" : "#475569",
  };
}

function ChartShell({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: boolean;
  sparse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-xl p-4 nb-card h-full">
      <div className="mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
          {title}
        </h2>
        <p className="text-[11px] text-slate-400 dark:text-[#6B7280]">{subtitle}</p>
      </div>
      {empty ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-xs leading-relaxed text-slate-400 dark:text-[#6B7280]">
          More data will appear as your Fractioneer team uploads monthly financials.
        </div>
      ) : (
        <div className="h-[200px] w-full flex-1">{children}</div>
      )}
    </div>
  );
}


function RevExpChart({ ctx }: { ctx: WidgetContext }) {
  const t = chartTheme(ctx.isDark);
  const data = useMemo(
    () =>
      ctx.rows
        .filter((r) => r.period)
        .map((r) => ({
          month: formatMonthShort(r.period!),
          Revenue: r.net_revenue ?? 0,
          Expenses: computeExpenses(r) ?? 0,
        })),
    [ctx.rows],
  );
  return (
    <ChartShell title="Revenue vs Expenses" subtitle="By month, based on submitted financials." empty={data.length === 0} sparse={data.length <= 1}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nbRevenue2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis dataKey="month" stroke={t.axisStroke} fontSize={12} />
          <YAxis stroke={t.axisStroke} fontSize={12} tickFormatter={(v) => compactCurrency(Number(v))} />
          <RTooltip
            formatter={(v: number) => fmtCurr(v)}
            contentStyle={{
              background: t.tooltipBg,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: t.tooltipText,
            }}
            cursor={{ fill: "rgba(59,130,246,0.08)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: t.legendColor }} />
          <Bar
            dataKey="Revenue"
            fill="url(#nbRevenue2)"
            radius={[4, 4, 0, 0]}
            className="nb-chart-bar"
            animationDuration={1100}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="Expenses"
            fill={t.expensesFill}
            radius={[4, 4, 0, 0]}
            animationDuration={1100}
            animationBegin={150}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function CashFlowChart({ ctx }: { ctx: WidgetContext }) {
  const t = chartTheme(ctx.isDark);
  const data = useMemo(
    () =>
      ctx.rows
        .filter((r) => r.period)
        .map((r) => ({ month: formatMonthShort(r.period!), Cash: r.cash_balance ?? 0 })),
    [ctx.rows],
  );
  return (
    <ChartShell title="Cash Flow Over Time" subtitle="Cash balance trend by month." empty={data.length === 0} sparse={data.length <= 1}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis dataKey="month" stroke={t.axisStroke} fontSize={12} />
          <YAxis stroke={t.axisStroke} fontSize={12} tickFormatter={(v) => compactCurrency(Number(v))} />
          <RTooltip
            formatter={(v: number) => fmtCurr(v)}
            contentStyle={{
              background: t.tooltipBg,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: t.tooltipText,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: t.legendColor }} />
          <Line
            type="monotone"
            dataKey="Cash"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#3B82F6" }}
            activeDot={{ r: 5 }}
            animationDuration={1100}
            animationEasing="ease-out"
            style={{ filter: "drop-shadow(0 0 6px rgba(59,130,246,0.45))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function ArApChart({ ctx }: { ctx: WidgetContext }) {
  const t = chartTheme(ctx.isDark);
  const data = useMemo(
    () =>
      ctx.rows
        .filter((r) => r.period)
        .map((r) => ({
          month: formatMonthShort(r.period!),
          AR: r.total_ar ?? 0,
          AP: r.total_ap ?? 0,
        })),
    [ctx.rows],
  );
  return (
    <ChartShell title="AR vs AP Over Time" subtitle="Accounts receivable vs payable by month." empty={data.length === 0} sparse={data.length <= 1}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={t.gridStroke} vertical={false} />
          <XAxis dataKey="month" stroke={t.axisStroke} fontSize={12} />
          <YAxis stroke={t.axisStroke} fontSize={12} tickFormatter={(v) => compactCurrency(Number(v))} />
          <RTooltip
            formatter={(v: number) => fmtCurr(v)}
            contentStyle={{
              background: t.tooltipBg,
              border: `1px solid ${t.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
              color: t.tooltipText,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: t.legendColor }} />
          <Line
            type="monotone"
            dataKey="AR"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#3B82F6" }}
            animationDuration={1100}
            animationEasing="ease-out"
            style={{ filter: "drop-shadow(0 0 6px rgba(59,130,246,0.45))" }}
          />
          <Line
            type="monotone"
            dataKey="AP"
            stroke={ctx.isDark ? "#94A3B8" : "#64748B"}
            strokeWidth={2.5}
            dot={{ r: 3, fill: ctx.isDark ? "#94A3B8" : "#64748B" }}
            animationDuration={1100}
            animationBegin={150}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

// ---- Helpers -----------------------------------------------------------------

function fmtCurr(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Number(v),
  );
}

function compactCurrency(v: number): string {
  if (!Number.isFinite(v)) return "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

function parsePeriod(period: string): Date {
  const [y, m, d] = period.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatAsOf(period: string | null): string {
  if (!period) return "";
  return `As of ${parsePeriod(period).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatMonthShort(period: string): string {
  return parsePeriod(period).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function trendOf(curr: number | null | undefined, previous: number | null | undefined) {
  if (curr == null || previous == null || previous === 0) return undefined;
  const pct = ((Number(curr) - Number(previous)) / Math.abs(Number(previous))) * 100;
  if (!Number.isFinite(pct)) return undefined;
  return { dir: pct >= 0 ? ("up" as const) : ("down" as const), pct: Math.abs(pct) };
}

function computeExpenses(r: NormalizedRow | null): number | null {
  if (!r || r.net_revenue == null || r.net_income == null) return null;
  return Math.max(0, Number(r.net_revenue) - Number(r.net_income));
}

function computeGrossMargin(r: NormalizedRow | null): number | null {
  if (!r) return null;
  if (r.gross_margin != null) return Number(r.gross_margin);
  if (r.net_revenue == null || r.net_income == null || r.net_revenue === 0) return null;
  const expenses = Math.max(0, Number(r.net_revenue) - Number(r.net_income));
  return ((Number(r.net_revenue) - expenses) / Number(r.net_revenue)) * 100;
}

function computeWC(r: NormalizedRow | null): number | null {
  if (!r) return null;
  if (r.total_ar == null && r.total_ap == null) return null;
  return Number(r.total_ar ?? 0) - Number(r.total_ap ?? 0);
}

// ---- Merge periods + dashboard_data per field --------------------------------

export type PeriodRow = {
  period_end: string | null;
  net_revenue: number | null;
  net_income: number | null;
  gross_margin: number | null;
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
};

export type DashboardRow = {
  period: string | null;
  net_revenue: number | null;
  net_income: number | null;
  cash_balance: number | null;
  total_ar: number | null;
  total_ap: number | null;
  monthly_close_status: string | null;
  monthly_close: string | null;
};

/**
 * Build the normalized timeline. Each unique period gets one row whose
 * fields prefer the periods-table value, falling back to dashboard_data when null.
 * Returns rows ascending by period.
 */
export function mergeRows(periods: PeriodRow[], dashboard: DashboardRow[]): NormalizedRow[] {
  const map = new Map<string, NormalizedRow>();
  const pick = <T,>(a: T | null | undefined, b: T | null | undefined): T | null =>
    a != null ? (a as T) : b != null ? (b as T) : null;

  // First seed from dashboard so its monthly_close fields stick.
  for (const d of dashboard) {
    if (!d.period) continue;
    map.set(d.period, {
      period: d.period,
      net_revenue: d.net_revenue ?? null,
      net_income: d.net_income ?? null,
      gross_margin: null,
      cash_balance: d.cash_balance ?? null,
      total_ar: d.total_ar ?? null,
      total_ap: d.total_ap ?? null,
      monthly_close_status: d.monthly_close_status ?? null,
      monthly_close: d.monthly_close ?? null,
    });
  }
  // Overlay periods (preferred source for numerics).
  for (const p of periods) {
    if (!p.period_end) continue;
    const existing = map.get(p.period_end);
    map.set(p.period_end, {
      period: p.period_end,
      net_revenue: pick(p.net_revenue, existing?.net_revenue),
      net_income: pick(p.net_income, existing?.net_income),
      gross_margin: pick(p.gross_margin, existing?.gross_margin),
      cash_balance: pick(p.cash_balance, existing?.cash_balance),
      total_ar: pick(p.total_ar, existing?.total_ar),
      total_ap: pick(p.total_ap, existing?.total_ap),
      monthly_close_status: existing?.monthly_close_status ?? null,
      monthly_close: existing?.monthly_close ?? null,
    });
  }
  return Array.from(map.values()).sort((a, b) => (a.period! < b.period! ? -1 : 1));
}

// ---- AI Insights card --------------------------------------------------------

function AiInsightsCard({ ctx }: { ctx: WidgetContext }) {
  const insights = ctx.aiInsights ?? [];
  const [idx, setIdx] = useState(0);
  const [latestDoc, setLatestDoc] = useState<{ file_name: string; file_path: string } | null>(null);

  // Reset and auto-advance.
  useEffect(() => { setIdx(0); }, [insights.length]);
  useEffect(() => {
    if (insights.length <= 1) return;
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % insights.length);
    }, 6000);
    return () => window.clearInterval(t);
  }, [insights.length]);

  // Fetch the latest uploaded source file for this client, used by the
  // "download source file" link in the disclaimer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("documents")
        .select("file_name, file_path")
        .eq("client_id", ctx.clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setLatestDoc(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [ctx.clientId]);

  async function downloadLatest() {
    if (!latestDoc) return;
    const { data } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(latestDoc.file_path, 60, { download: latestDoc.file_name });
    if (!data?.signedUrl) return;
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = latestDoc.file_name;
    a.click();
  }

  const current = insights[idx];

  return (
    <div
      className="relative flex min-h-[280px] flex-col overflow-hidden rounded-xl p-5 h-full"
      style={{
        background:
          "radial-gradient(120% 80% at 80% 90%, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0.10) 35%, rgba(10,15,30,0) 70%), linear-gradient(180deg, #0B1226 0%, #060A18 100%)",
        border: "1px solid #1E2A3A",
        boxShadow: "inset 0 0 60px rgba(59,130,246,0.06)",
      }}
    >
      {/* Subtle grid texture overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
          AI Insights
        </h2>
      </div>

      <div className="relative mt-6 flex-1">
        {insights.length === 0 ? (
          <p className="max-w-md text-sm leading-relaxed text-white/60">
            No insights yet — insights generate automatically when your Fractioneer team uploads new financials.
          </p>
        ) : (
          <p
            key={idx}
            className="max-w-xl text-xl font-medium leading-snug text-white animate-[nb-rise_0.5s_ease-out]"
          >
            {current?.insight_text}
          </p>
        )}
      </div>

      {insights.length > 1 && (
        <div className="relative mt-4 flex items-center gap-1.5">
          {insights.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show insight ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-5 bg-white" : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      <div className="relative mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/40">
        <span>AI-generated, may contain errors</span>
        {latestDoc && (
          <>
            <span aria-hidden>·</span>
            <button
              type="button"
              onClick={downloadLatest}
              className="text-blue-300/80 underline decoration-blue-400/40 underline-offset-2 hover:text-blue-200"
            >
              Download source file
            </button>
          </>
        )}
      </div>
    </div>
  );
}


