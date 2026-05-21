import {
  Briefcase,
  ClipboardList,
  BookOpen,
  Users,
  Receipt,
  Wallet,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { Section } from "./Section";

type Service = {
  icon: LucideIcon;
  title: string;
  body: string;
};

type Layer = {
  number: string;
  label: string;
  services: Service[];
};

const layers: Layer[] = [
  {
    number: "01",
    label: "Strategic finance",
    services: [
      {
        icon: Briefcase,
        title: "CFO leadership",
        body: "Forecasting, planning, and board-ready reporting.",
      },
      {
        icon: Wallet,
        title: "Cash flow and reporting support",
        body: "Cash visibility, reporting packages, and audit preparation.",
      },
    ],
  },
  {
    number: "02",
    label: "Controls and close",
    services: [
      {
        icon: ClipboardList,
        title: "Controller and monthly close",
        body: "Reliable close processes across entities and locations.",
      },
      {
        icon: ShieldCheck,
        title: "Franchise audits for franchisors",
        body: "Documentation, reporting coordination, and franchise location review.",
      },
    ],
  },
  {
    number: "03",
    label: "Daily finance operations",
    services: [
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
    ],
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
          A complete finance function across strategy, controls, close,
          reporting, and day-to-day execution.
        </p>
      </div>

      <div className="space-y-4">
        {layers.map((layer) => (
          <div
            key={layer.number}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <div className="grid md:grid-cols-[220px_1fr] divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Layer label */}
              <div className="p-5 md:p-6 flex md:flex-col items-center md:items-start gap-3 md:gap-2 bg-muted/30">
                <span className="text-2xl md:text-3xl font-semibold text-accent tabular-nums leading-none">
                  {layer.number}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {layer.label}
                </span>
              </div>

              {/* Services row */}
              <div
                className={
                  "grid gap-px bg-border " +
                  (layer.services.length === 3
                    ? "sm:grid-cols-2 lg:grid-cols-3"
                    : "sm:grid-cols-2")
                }
              >
                {layer.services.map((s) => (
                  <div
                    key={s.title}
                    className="bg-card p-5 md:p-6 flex items-start gap-3"
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <s.icon className="h-[18px] w-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {s.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {s.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
