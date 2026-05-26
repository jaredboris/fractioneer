import { BarChart3, LineChart, ShieldCheck } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const items = [
  {
    icon: LineChart,
    title: "Franchisee visibility breaks down",
    body: "AUVs, same-store sales, royalties, and fees stop rolling up cleanly as units grow.",
  },
  {
    icon: BarChart3,
    title: "Multi-entity close gets messy",
    body: "Close, payroll, vendors, and unit-level P&L drift out of sync across entities and locations.",
  },
  {
    icon: ShieldCheck,
    title: "FDD and audit deadlines pile up",
    body: "Item 19, FDD updates, audits, and lender requests need reporting that holds up under review.",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem">
      <SectionHeader
        eyebrow="The problem"
        title="Franchise finance gets complicated fast."
        description="Growth multiplies the work across entities, locations, payroll, vendors, royalties, and audits."
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
