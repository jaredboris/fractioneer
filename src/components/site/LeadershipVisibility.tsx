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
    title: "Monthly close",
    body: "On track, delayed, or ready.",
    status: "Monthly",
    tone: "muted" as const,
  },
  {
    icon: Wallet,
    title: "Cash position",
    body: "Cash across the business.",
    status: "Weekly",
    tone: "muted" as const,
  },
  {
    icon: BarChart3,
    title: "Unit-level P&L",
    body: "By location, region, or entity.",
    status: "Monthly",
    tone: "muted" as const,
  },
  {
    icon: Receipt,
    title: "Royalty and fee tracking",
    body: "Collected, pending, past-due.",
    status: "Monthly",
    tone: "muted" as const,
  },
  {
    icon: ShieldCheck,
    title: "Audit readiness",
    body: "Docs ready for audits and diligence.",
    status: "Always-on",
    tone: "accent" as const,
  },
];

export function LeadershipVisibility() {
  return (
    <Section id="visibility">
      <SectionHeader
        eyebrow="Leadership visibility"
        title="What leadership gets every month."
        description="Scattered finance activity turned into reporting leadership can actually use."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((i) => (
          <div
            key={i.title}
            className="rounded-xl border border-border bg-card p-4 flex flex-col"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <i.icon className="h-4 w-4" />
              </span>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " +
                  (i.tone === "accent"
                    ? "bg-accent/10 text-accent"
                    : "bg-muted text-muted-foreground")
                }
              >
                <span
                  className={
                    "h-1.5 w-1.5 rounded-full " +
                    (i.tone === "accent" ? "bg-accent" : "bg-muted-foreground/60")
                  }
                />
                {i.status}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground leading-snug">
              {i.title}
            </h3>
            <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
              {i.body}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
