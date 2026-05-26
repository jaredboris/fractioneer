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
    <section id="problem" className="w-full py-7 md:py-9 bg-primary text-primary-foreground">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-8 md:mb-10 max-w-3xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            The problem
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.1]">
            Franchise finance gets complicated fast.
          </h2>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-white/70">
            Growth multiplies the work across entities, units, royalties, and audits.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((i) => (
            <div
              key={i.title}
              className="rounded-xl border border-white/10 bg-white/5 p-7 transition-colors hover:border-accent/60"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <i.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{i.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{i.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
