import {
  CalendarCheck,
  Wallet,
  BarChart3,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const items = [
  {
    icon: CalendarCheck,
    title: "Monthly close status",
    body: "See whether books are on track, delayed, or ready for review.",
  },
  {
    icon: Wallet,
    title: "Cash position",
    body: "Understand cash visibility across the business.",
  },
  {
    icon: BarChart3,
    title: "Unit-level P&L",
    body: "Track performance by location, region, or entity.",
  },
  {
    icon: Receipt,
    title: "Royalty and fee tracking",
    body: "Keep collected, pending, and past-due amounts visible.",
  },
  {
    icon: ShieldCheck,
    title: "Audit readiness",
    body: "Maintain documentation and reporting support for audits and diligence.",
  },
];

export function LeadershipVisibility() {
  return (
    <Section id="visibility">
      <SectionHeader
        eyebrow="Leadership visibility"
        title="What leadership can see clearly."
        description="Fractioneer helps franchise leaders turn scattered finance activity into reporting they can actually use."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((i) => (
          <div
            key={i.title}
            className="rounded-xl border border-border bg-card p-5 flex flex-col"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <i.icon className="h-[18px] w-[18px]" />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {i.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {i.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
