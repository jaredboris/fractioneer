import { Check } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import { BookACallButton } from "./BookACallButton";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Finance Foundation",
    bestFor: "Clean books, payroll, AP/AR, and monthly reporting.",
    features: ["Bookkeeping", "Payroll", "AP/AR", "Monthly reporting"],
    cta: "Talk through this model",
    intent: "Bookkeeping",
  },
  {
    name: "Controller-Led Operations",
    bestFor: "Close ownership, controls, cash flow, and multi-entity reporting.",
    features: [
      "Monthly close",
      "Multi-entity reporting",
      "Cash flow management",
      "Financial controls",
    ],
    featured: true,
    cta: "Discuss controller support",
    intent: "Controller support",
  },
  {
    name: "CFO Partnership",
    bestFor: "Forecasting, board support, strategic finance, and audit readiness.",
    features: [
      "Fractional CFO leadership",
      "Forecasting",
      "Board and investor packages",
      "Audit and diligence support",
    ],
    cta: "Discuss CFO support",
    intent: "CFO support",
  },
];

export function EngagementModels() {
  return (
    <Section id="engagements">
      <SectionHeader
        eyebrow="Engagement models"
        title="Flexible support based on where the business is today."
        description="Most clients start with what they need today, then expand as the business grows."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative rounded-xl border border-border bg-card p-7 flex flex-col",
              t.featured && "border-accent/40 shadow-[0_24px_50px_-30px_rgba(26,167,255,0.35)]",
            )}
          >
            {t.featured && (
              <div className="absolute inset-x-0 -top-px h-px bg-accent rounded-t-xl" />
            )}
            <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                Best for
              </div>
              <p className="mt-1.5 text-sm leading-snug text-foreground/85">
                {t.bestFor}
              </p>
            </div>
            <div className="mt-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Includes
              </div>
              <ul className="mt-3 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/85">
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-7">
              <BookACallButton
                variant={t.featured ? "primary" : "nav"}
                intent={t.intent}
                className={cn(
                  "w-full",
                  !t.featured &&
                    "bg-transparent text-foreground border border-border hover:bg-transparent hover:border-accent hover:text-accent",
                )}
              >
                {t.cta}
              </BookACallButton>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
