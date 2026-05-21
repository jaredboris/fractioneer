import { Building2, Briefcase, Users } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const audiences = [
  {
    icon: Building2,
    title: "Franchise systems",
    body: "Franchisors, franchise platforms, and multi-unit operators that need clean reporting, payroll coordination, royalty visibility, and scalable finance operations.",
  },
  {
    icon: Briefcase,
    title: "PE-backed operators",
    body: "Portfolio companies and operators that need stronger monthly reporting, cash visibility, controls, audit support, and finance execution.",
  },
  {
    icon: Users,
    title: "Founder-owned businesses",
    body: "Growing businesses that need CFO-level guidance and day-to-day finance support without building a full in-house team.",
  },
];

export function WhoWeHelp() {
  return (
    <Section id="who-we-help">
      <SectionHeader
        eyebrow="Who we help"
        title="Built for franchise systems — and the operators around them."
        description="Fractioneer is franchise-focused, and also supports PE-backed operators and founder-owned businesses that need a real finance function."
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
          </div>
        ))}
      </div>
    </Section>
  );
}
