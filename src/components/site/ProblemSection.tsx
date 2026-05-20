import { BarChart3, LineChart, ShieldCheck } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const items = [
  {
    icon: BarChart3,
    title: "Multi-location reporting",
    body: "Consolidate financials across units, regions, and entities so leadership sees one clear picture.",
  },
  {
    icon: LineChart,
    title: "Cash flow visibility",
    body: "Know what's coming in, what's going out, and what the business can fund — week by week.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-ready operations",
    body: "Clean books, documented processes, and reports that hold up to lenders, auditors, and investors.",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem">
      <SectionHeader
        eyebrow="The problem"
        title="Franchise finance gets complicated fast."
        description="As franchise systems grow, finance becomes harder to manage across entities, locations, payroll cycles, vendors, royalties, reports, and audits. Basic bookkeeping is not enough. Fractioneer gives operators the financial structure they need to scale."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((i) => (
          <div
            key={i.title}
            className="rounded-xl border border-border bg-card p-7 transition-colors hover:border-accent/40"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <i.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{i.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
