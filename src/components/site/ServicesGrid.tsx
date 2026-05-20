import {
  Briefcase,
  ClipboardList,
  BookOpen,
  Users,
  Receipt,
  Wallet,
} from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const services = [
  {
    icon: Briefcase,
    title: "Fractional CFO",
    body: "Strategic finance leadership for forecasting, capital planning, board reporting, and operating decisions — without the full-time hire.",
  },
  {
    icon: ClipboardList,
    title: "Fractional Controller",
    body: "Ownership of the monthly close, financial controls, and reporting accuracy so leadership can trust the numbers every month.",
  },
  {
    icon: BookOpen,
    title: "Bookkeeping",
    body: "Clean, current books across entities and locations, reconciled on a consistent cadence and structured for real reporting.",
  },
  {
    icon: Users,
    title: "Payroll and Benefits",
    body: "Reliable multi-state payroll runs, benefits administration, and clean integration with the general ledger.",
  },
  {
    icon: Receipt,
    title: "AP/AR Management",
    body: "Vendor payments, customer invoicing, and collections handled on a predictable rhythm that protects cash and relationships.",
  },
  {
    icon: Wallet,
    title: "Cash Flow and Audit Support",
    body: "Weekly cash visibility, scenario planning, and the documentation needed to support audits, diligence, and lender requests.",
  },
];

export function ServicesGrid() {
  return (
    <Section id="services" muted>
      <SectionHeader
        eyebrow="Services"
        title="One finance team for the full operating stack."
      />
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
