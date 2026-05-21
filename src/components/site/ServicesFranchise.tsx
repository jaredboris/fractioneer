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
    body: "Forecasting, planning, and board-ready reporting.",
  },
  {
    icon: ClipboardList,
    title: "Controller and monthly close",
    body: "Reliable close processes across entities and locations.",
  },
  {
    icon: BookOpen,
    title: "Bookkeeping and reconciliations",
    body: "Clean books built for operator reporting.",
  },
  {
    icon: Users,
    title: "Payroll and benefits",
    body: "Payroll, deductions, benefits support, and compliance workflows.",
  },
  {
    icon: Receipt,
    title: "AP/AR and vendor coordination",
    body: "Vendor payments, receivables, invoicing, and working capital visibility.",
  },
  {
    icon: Wallet,
    title: "Cash flow and reporting support",
    body: "Cash forecasting, reporting packages, and audit preparation.",
  },
  {
    icon: ShieldCheck,
    title: "Franchise audits for franchisors",
    body: "Support for documentation, reporting coordination, and franchise location review.",
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
          What Fractioneer runs for growing operators.
        </h2>
        <p className="mt-5 text-base md:text-lg leading-relaxed text-muted-foreground">
          One coordinated finance team across CFO, controller, accounting,
          payroll, AP/AR, cash flow, reporting, and franchise audit support.
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
