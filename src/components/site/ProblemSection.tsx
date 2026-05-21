import { BarChart3, LineChart, ShieldCheck } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const items = [
  {
    icon: BarChart3,
    title: "Multi-location reporting gets messy",
    body: "Unit, regional, and entity-level numbers stop rolling up cleanly — and leadership loses one clear picture.",
  },
  {
    icon: LineChart,
    title: "Cash visibility becomes harder",
    body: "Royalties, payroll cycles, vendor terms, and timing differences make weekly cash positions hard to trust.",
  },
  {
    icon: ShieldCheck,
    title: "Clean books are not enough",
    body: "Lenders, auditors, and investors expect documented process and reporting — not just reconciled bank feeds.",
  },
];

export function ProblemSection() {
  return (
    <Section id="problem">
      <SectionHeader
        eyebrow="The problem"
        title="Franchise finance gets complicated fast."
        description="As franchise systems grow, finance gets harder to manage across entities, locations, payroll cycles, vendors, royalties, reports, and audits."
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
