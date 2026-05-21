import { cn } from "@/lib/utils";
import { useBooking } from "./BookingProvider";

type Variant = "primary" | "light" | "nav";

const styles: Record<Variant, string> = {
  primary:
    "h-12 px-6 border border-border bg-transparent text-foreground hover:border-accent hover:text-accent text-sm font-medium",
  light:
    "h-12 px-7 border border-white/40 bg-transparent text-white hover:bg-white/10 text-sm font-semibold",
  nav: "h-10 px-4 border border-border bg-transparent text-foreground hover:border-accent hover:text-accent text-sm font-medium",
};

export function SendInfoButton({
  variant = "primary",
  className,
  children = "Send us your info",
}: {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
}) {
  const { openLeadForm } = useBooking();
  return (
    <button
      type="button"
      onClick={openLeadForm}
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
