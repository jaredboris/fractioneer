import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadForm } from "./LeadForm";
import { cn } from "@/lib/utils";

export function BookingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [showForm, setShowForm] = useState(false);

  // Reset fallback state whenever modal closes
  useEffect(() => {
    if (!open) setShowForm(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="px-6 pt-6 sm:px-8 sm:pt-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Book a call with Fractioneer
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Pick a time to talk with our team about your franchise finance needs.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8 mt-6">
          {/* BOOKING_EMBED_SLOT — replace this block with the real embed */}
          <div
            id="booking-embed-slot"
            className="flex min-h-[380px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center"
          >
            <p className="text-sm text-muted-foreground max-w-sm">
              Calendar embed goes here. Replace with Calendly, HubSpot Meetings,
              or Cal.com embed code.
            </p>
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="group flex w-full items-start justify-between gap-4 text-left"
              aria-expanded={showForm}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Not ready to book?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us what you need and we'll follow up shortly.
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-accent transition-transform",
                  showForm && "rotate-180",
                )}
              />
            </button>

            {showForm && (
              <div className="mt-6">
                <LeadForm />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
