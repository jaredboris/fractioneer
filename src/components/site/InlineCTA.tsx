import { useBooking } from "./BookingProvider";

type Props = {
  title: string;
  subtext: string;
  primaryLabel: string;
  secondaryLabel?: string;
  primaryView?: "calendar" | "form";
};

export function InlineCTA({
  title,
  subtext,
  primaryLabel,
  secondaryLabel,
  primaryView = "calendar",
}: Props) {
  const { openBooking } = useBooking();
  return (
    <section className="w-full py-6 md:py-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-xl border border-border bg-muted/40 px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground max-w-2xl">
              {subtext}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openBooking({ view: primaryView })}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {primaryLabel}
            </button>
            {secondaryLabel && (
              <button
                type="button"
                onClick={() => openBooking({ view: "form" })}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
