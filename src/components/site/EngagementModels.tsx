import { Check } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import { BookACallButton } from "./BookACallButton";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Controller-led operations",
    bestFor: "Operators that need reliable monthly close, reporting, controls, and day-to-day finance execution.",
    features: [
      "Monthly close",
      "Multi-entity reporting",
      "Cash flow management",
      "AP/AR and payroll coordination",
      "Financial controls",
    ],
    cta: "Discuss controller support",
    intent: "Controller support",
  },
  {
    name: "CFO partnership",
    bestFor: "Leadership teams that need senior finance guidance, forecasting, board support, and decision-ready reporting.",
    features: [
      "Fractional CFO leadership",
      "Forecasting and scenario planning",
      "Board and investor packages",
      "Capital and lender strategy",
      "Audit and diligence support",
    ],
    featured: true,
    cta: "Discuss CFO support",
    intent: "CFO support",
  },
  {
    name: "Project and deal support",
    bestFor: "Businesses that need finance support around transactions, diligence, cleanups, audits, lender requests, or special projects.",
    features: [
      "M&A support",
      "Diligence support",
      "Audit and tax support",
      "Reporting cleanups",
      "Lender and investor requests",
    ],
    cta: "Discuss project support",
    intent: "Project support",
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
