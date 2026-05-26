import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadForm } from "./LeadForm";
import type { BookingView } from "./BookingProvider";

export function BookingModal({
  open,
  onOpenChange,
  initialView = "calendar",
  intent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialView?: BookingView;
  intent?: string;
}) {
  const [view, setView] = useState<BookingView>(initialView);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (open) setView(initialView);
  }, [open, initialView]);

  useEffect(() => {
    if (open && view === "calendar" && !scriptRef.current) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
      scriptRef.current = script;
    }
    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [open, view]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {view === "calendar" ? (
          <>
            <div className="px-6 pt-6 sm:px-8 sm:pt-7">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  Book a call with Fractioneer
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Pick a time to talk with our team about your franchise finance needs.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-7 mt-5 space-y-5">
              <div
                className="calendly-inline-widget"
                data-url="https://calendly.com/fractioneer/fractioneer-intro-call"
                style={{ minWidth: 320, height: 700 }}
              />

              <div className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Mail className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Prefer not to schedule right now?
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Send us a few details and we'll follow up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setView("form")}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  Send details instead
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 pt-6 sm:px-8 sm:pt-7">
              <button
                type="button"
                onClick={() => setView("calendar")}
                className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to calendar
              </button>
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  Send us a few details.
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Tell us what you need and we'll follow up shortly.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-6 pb-6 sm:px-8 sm:pb-7 mt-5">
              <LeadForm initialHelpWith={intent} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
