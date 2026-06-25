import { ArrowUpRight } from "lucide-react";
import type { ReactNode, MouseEventHandler } from "react";

/**
 * Shared widget shell. Matches the NeuroBank reference: dark card with a soft
 * top-glow gradient, title left, optional top-right arrow affordance.
 */
export function DashboardCard({
  title,
  subtitle,
  children,
  onAction,
  actionLabel = "Open",
  className = "",
  glow = false,
  padded = true,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  actionLabel?: string;
  className?: string;
  glow?: boolean;
  padded?: boolean;
}) {
  return (
    <section
      className={`nb-card ${glow ? "nb-card-glow" : ""} ${padded ? "p-6" : ""} ${className}`}
    >
      {(title || onAction) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[15px] font-medium text-slate-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-[#9CA3AF]">{subtitle}</p>
            )}
          </div>
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              aria-label={actionLabel}
              className="nb-arrow shrink-0"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

/** Hero number + optional delta chip, matching the Balance Overview reference. */
export function StatHero({
  value,
  delta,
  hint,
}: {
  value: ReactNode;
  delta?: { dir: "up" | "down"; label: string };
  hint?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {value}
        </div>
        {delta && (
          <span className={`nb-chip ${delta.dir === "up" ? "nb-chip-up" : "nb-chip-down"}`}>
            {delta.dir === "up" ? "↑" : "↓"} {delta.label}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-[11px] text-slate-400 dark:text-[#6B7280]">{hint}</div>}
    </div>
  );
}

/** Row in an "Income Sources Breakdown" style list. */
export function ProgressRow({
  index,
  label,
  value,
  percent,
}: {
  index?: number;
  label: ReactNode;
  value: ReactNode;
  percent: number;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3 py-2">
      {index != null && (
        <span className="w-6 text-[11px] tabular-nums text-slate-400 dark:text-[#6B7280]">
          {String(index).padStart(2, "0")}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-[#E5E7EB]">
        {label}
      </span>
      <span className="w-24 text-right text-sm tabular-nums text-slate-900 dark:text-white">
        {value}
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="rounded-md border border-[#1E2A3A] bg-[#0F1729] px-1.5 py-0.5 text-[11px] tabular-nums text-white">
          {pct.toFixed(0)}%
        </span>
        <span className="relative block h-1 w-24 overflow-hidden rounded-full bg-[#1E2A3A]">
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            style={{ width: `${pct}%` }}
          />
        </span>
      </span>
    </div>
  );
}
