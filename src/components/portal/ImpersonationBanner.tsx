import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Eye, X } from "lucide-react";
import { stopImpersonation, useImpersonation } from "@/lib/impersonation";

/**
 * Fixed-position banner shown across every portal page while an admin is
 * viewing the app as a client. Rendered via a React portal so it can be
 * dropped into the sidebar once and still cover the entire viewport.
 */
export function ImpersonationBanner() {
  const imp = useImpersonation();
  const navigate = useNavigate();

  // Push page content down so the banner doesn't overlap.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (imp) {
      document.body.style.paddingTop = "44px";
    } else {
      document.body.style.paddingTop = "";
    }
    return () => {
      document.body.style.paddingTop = "";
    };
  }, [imp]);

  if (!imp || typeof document === "undefined") return null;

  function exit() {
    stopImpersonation();
    navigate({ to: "/portal" });
  }

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-[60] flex h-11 items-center justify-between gap-3 bg-amber-500 px-4 text-sm font-medium text-amber-950 shadow">
      <div className="flex items-center gap-2 truncate">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Viewing as <strong className="font-semibold">{imp.label}</strong> — admin spy mode
        </span>
      </div>
      <button
        type="button"
        onClick={exit}
        className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/10 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-amber-950/20"
      >
        <X className="h-3.5 w-3.5" />
        Exit
      </button>
    </div>,
    document.body,
  );
}
