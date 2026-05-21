import { cn } from "@/lib/utils";
import { useBooking, type BookingView } from "./BookingProvider";

type Variant = "primary" | "light" | "nav";

const styles: Record<Variant, string> = {
  primary:
    "h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium",
  light:
    "h-12 px-7 bg-white text-primary hover:bg-white/90 text-sm font-semibold",
  nav: "h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium",
};

export function BookACallButton({
  variant = "primary",
  className,
  children = "Book a call",
  view,
  intent,
}: {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
  view?: BookingView;
  intent?: string;
}) {
  const { openBooking } = useBooking();
  return (
    <button
      type="button"
      onClick={() => openBooking({ view, intent })}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
