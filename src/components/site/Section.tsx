import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  muted,
  children,
}: {
  id?: string;
  className?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "w-full py-10 md:py-14",
        muted && "bg-muted/50",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
    </section>
  );
}
