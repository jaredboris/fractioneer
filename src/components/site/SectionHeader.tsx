import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16 max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.1] text-foreground">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base md:text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
