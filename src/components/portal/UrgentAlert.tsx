import { AlertCircle } from "lucide-react";

/**
 * Pinned message from the Fractioneer team, shown above the stat cards on a
 * client's dashboard. Subtle amber tint on the dark theme — visible but not
 * a red warning.
 */
export function UrgentAlert({ message, createdAt }: { message: string; createdAt: string }) {
  const when = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 nb-rise bg-amber-50 border-amber-200 text-amber-900 dark:bg-[#1A1408] dark:border-[#7C5410] dark:text-[#FDE68A] shadow-[0_0_24px_-8px_rgba(245,158,11,0.35)]"
      role="status"
    >
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-[#F59E0B]">
        <AlertCircle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700/80 dark:text-[#FCD34D]/80">
          Message from your Fractioneer team
          <span className="opacity-60">· {when}</span>
        </div>
        <p className="mt-1 text-sm font-medium leading-snug whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  );
}
