import { Info } from "lucide-react";

/**
 * Persistent, non-dismissable informational banner shown at the very top of
 * every portal page. Intentionally low-contrast slate/navy — not a warning.
 */
export function BetaBanner() {
  return (
    <div className="w-full border-b bg-[#0F1A2E] border-[#1E2A3A] text-slate-300">
      <div className="flex items-center gap-2 px-4 py-1.5 text-[11px] leading-tight">
        <Info className="h-3 w-3 shrink-0 text-blue-400" />
        <p>
          Fractioneer Portal is currently in beta. Some figures may contain
          errors — your team reviews all data before it&apos;s shared.
        </p>
      </div>
    </div>
  );
}
