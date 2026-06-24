import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Eye, X, Wrench } from "lucide-react";
import { stopImpersonation, useImpersonation, useAdminOverride } from "@/lib/impersonation";

/**
 * Fixed-position banner shown across every portal page while an admin is
 * viewing the app as a client. Rendered via a React portal so it can be
 * dropped into the sidebar once and still cover the entire viewport.
 */
export function ImpersonationBanner() {
  const imp = useImpersonation();
  const [override, setOverride] = useAdminOverride();
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
          Viewing as <strong className="font-semibold">{imp.label}</strong> — Spy Mode
          {override && <span className="ml-1 opacity-80">(Override — editing enabled)</span>}

        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOverride(!override)}
          aria-pressed={override}
          title={override ? "Showing default widget layout" : "Showing client's actual widget layout"}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            override
              ? "bg-amber-950 text-amber-100 hover:bg-amber-900"
              : "bg-amber-950/10 text-amber-950 hover:bg-amber-950/20"
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          Admin Override
          <span
            aria-hidden
            className={`ml-1 inline-flex h-3.5 w-6 items-center rounded-full px-0.5 transition-colors ${
              override ? "bg-amber-100/90" : "bg-amber-950/30"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full bg-amber-950 transition-transform ${
                override ? "translate-x-2.5" : "translate-x-0"
              }`}
            />
          </span>
        </button>
        <button
          type="button"
          onClick={exit}
          className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/10 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-amber-950/20"
        >
          <X className="h-3.5 w-3.5" />
          Exit
        </button>
      </div>
    </div>,
    document.body,
  );
}
