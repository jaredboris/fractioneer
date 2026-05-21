import {
  Briefcase,
  ClipboardList,
  BookOpen,
  Users,
  Receipt,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Section } from "./Section";

const services = [
  {
    icon: Briefcase,
    title: "CFO leadership",
    body: "Forecasting, capital planning, and board-ready reporting for franchisors and PE-backed platforms — without hiring a full-time CFO.",
  },
  {
    icon: ClipboardList,
    title: "Controller and monthly close",
    body: "A reliable monthly close across entities and locations so franchise leadership can trust the numbers every period.",
  },
  {
    icon: BookOpen,
    title: "Bookkeeping and reconciliations",
    body: "Clean, current books structured for unit-level, regional, and franchisor-wide reporting — not just tax prep.",
  },
  {
    icon: Users,
    title: "Payroll and benefits",
    body: "Multi-state payroll runs and benefits administration coordinated cleanly across franchise entities and locations.",
  },
  {
    icon: Receipt,
    title: "AP/AR and vendor coordination",
    body: "Vendor payments, royalty and fee tracking, and customer invoicing handled on a steady cadence across the system.",
  },
  {
    icon: Wallet,
    title: "Cash flow, audit, and reporting support",
    body: "Weekly cash visibility, lender and investor packages, and documentation that holds up to audits and diligence.",
  },
];

export function ServicesFranchise() {
  return (
    <Section id="services" muted>
      <div className="mb-10 md:mb-12 max-w-3xl">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          What we run
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.1] text-foreground">
          What Fractioneer runs for franchise systems.
        </h2>
        <p className="mt-5 text-base md:text-lg leading-relaxed text-muted-foreground">
          One coordinated finance team across CFO strategy, controllership,
          accounting, payroll, AP/AR, and cash flow — built for the way
          franchisors and multi-unit operators actually run.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.title}
            className="group rounded-xl border border-border bg-card p-7 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-[0_20px_40px_-20px_rgba(10,31,68,0.15)]"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.06] text-primary group-hover:bg-accent/10 group-hover:text-accent transition-colors">
              <s.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
