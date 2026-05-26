import { Building2, Briefcase, Users } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const audiences = [
  {
    icon: Building2,
    title: "Franchise systems",
    body: "Franchisee visibility, royalty and fee tracking, unit economics, and FDD-ready reporting.",
    chips: ["Franchisors", "Multi-unit", "Platforms"],
    primary: true,
  },
  {
    icon: Briefcase,
    title: "Multi-unit & PE-backed operators",
    body: "Cash visibility, controls, and diligence-ready reporting across entities.",
    chips: ["Portfolio cos.", "Diligence-ready"],
  },
  {
    icon: Users,
    title: "Founder-owned growth companies",
    body: "CFO-level guidance plus day-to-day finance execution without a full hire.",
    chips: ["Growing teams", "No full hire"],
  },
];

export function WhoWeHelp() {
  return (
    <Section id="who-we-help">
      <SectionHeader
        eyebrow="Who we help"
        title="Built for franchise systems and the operators behind them."
        description="Fractioneer supports franchisors, multi-unit operators, PE-backed platforms, and founder-owned companies with finance operations that scale."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {audiences.map((a) => (
          <div
            key={a.title}
            className={
              "rounded-xl border bg-card p-6 flex flex-col " +
              (a.primary
                ? "border-accent/40 shadow-[0_24px_50px_-30px_rgba(26,167,255,0.35)]"
                : "border-border")
            }
          >
            {a.primary && (
              <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                <span className="h-1 w-1 rounded-full bg-accent" />
                Primary focus
              </div>
            )}
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <a.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-foreground">
              {a.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {a.body}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {a.chips.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
