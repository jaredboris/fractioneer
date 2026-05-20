import { Section } from "./Section";

const proofPoints = [
  { stat: "100+", label: "Client engagements" },
  { stat: "15+ yrs", label: "Fractional finance experience" },
  { stat: "Long-term", label: "Portfolio finance relationships" },
  { stat: "One team", label: "CFO, controller, accounting, payroll, AP/AR" },
];

export function SocialProof() {
  return (
    <Section className="py-16 md:py-20">
      <p className="text-center text-sm md:text-base font-medium text-muted-foreground max-w-2xl mx-auto">
        Trusted by franchise brands, PE-backed operators, and founder-owned businesses.
      </p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex h-16 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-xs font-medium text-muted-foreground"
          >
            Client logo
          </div>
        ))}
      </div>

      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {proofPoints.map((p) => (
          <div key={p.label} className="bg-card p-6">
            <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {p.stat}
            </div>
            <div className="mt-2 text-sm text-muted-foreground leading-snug">
              {p.label}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
