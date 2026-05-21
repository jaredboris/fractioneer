import { useState, useEffect } from "react";
import { ArrowRight, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LeadForm } from "./LeadForm";

export function BookingModal({
  open,
  onOpenChange,
  initialShowForm = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialShowForm?: boolean;
}) {
  const [showForm, setShowForm] = useState(initialShowForm);

  useEffect(() => {
    if (open) setShowForm(initialShowForm);
    else setShowForm(false);
  }, [open, initialShowForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
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
          {/* BOOKING_EMBED_SLOT — replace this block with the real embed */}
          <div
            id="booking-embed-slot"
            className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center"
          >
            <p className="text-sm text-muted-foreground max-w-sm">
              Calendar embed goes here. Replace with Calendly, HubSpot Meetings,
              or Cal.com embed code.
            </p>
          </div>

          <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <Mail className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  Don't have time to book right now?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us what you need and we'll follow up shortly.
                </p>
              </div>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  aria-expanded={false}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  Send us your info
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {showForm && (
              <div className="mt-5 border-t border-accent/20 pt-5">
                <LeadForm />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

