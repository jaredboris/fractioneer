import { Building2, Briefcase, Users } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const audiences = [
  {
    icon: Building2,
    title: "Franchise systems",
    body: "Clean reporting, payroll, royalties, and scalable finance ops.",
    chips: ["Franchisors", "Multi-unit", "Platforms"],
  },
  {
    icon: Briefcase,
    title: "PE-backed operators",
    body: "Stronger reporting, cash visibility, controls, and audit support.",
    chips: ["Portfolio cos.", "Diligence-ready"],
  },
  {
    icon: Users,
    title: "Founder-owned businesses",
    body: "CFO-level guidance plus day-to-day finance execution.",
    chips: ["Growing teams", "No full hire"],
  },
];

export function WhoWeHelp() {
  return (
    <Section id="who-we-help">
      <SectionHeader
        eyebrow="Who we help"
        title="Built for franchise systems — and the operators around them."
        description="Franchise-focused, with deep support for PE-backed operators and founder-owned businesses."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {audiences.map((a) => (
          <div
            key={a.title}
            className="rounded-xl border border-border bg-card p-6 flex flex-col"
          >
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
