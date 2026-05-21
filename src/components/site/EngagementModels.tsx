import { Check } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import { BookACallButton } from "./BookACallButton";
import { SendInfoButton } from "./SendInfoButton";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "Finance Foundation",
    description:
      "For businesses that need clean books, payroll, AP/AR, and reliable monthly reporting.",
    features: [
      "Bookkeeping and reconciliations",
      "Payroll administration",
      "AP/AR management",
      "Monthly financial reporting",
    ],
  },
  {
    name: "Controller-Led Operations",
    description:
      "For growing operators that need stronger financial controls, reporting, close processes, and cash flow management.",
    features: [
      "Controller ownership of the close",
      "Multi-entity reporting",
      "Cash flow management",
      "Financial controls and process",
      "Lender and vendor support",
    ],
    featured: true,
  },
  {
    name: "CFO Partnership",
    description:
      "For leadership teams that need strategic finance, board support, forecasting, audit support, and decision-ready reporting.",
    features: [
      "Fractional CFO leadership",
      "Forecasting and scenario planning",
      "Board and investor packages",
      "Audit and diligence support",
      "Capital and lender strategy",
    ],
  },
];

export function EngagementModels() {
  return (
    <Section id="engagements">
      <SectionHeader
        eyebrow="Engagement models"
        title="Flexible support based on where the business is today."
        description="Most clients start with the support they need today, then expand as the business grows."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={cn(
              "relative rounded-xl border border-border bg-card p-8 flex flex-col",
              t.featured && "border-accent/40 shadow-[0_24px_50px_-30px_rgba(26,167,255,0.35)]",
            )}
          >
            {t.featured && (
              <div className="absolute inset-x-0 -top-px h-px bg-accent rounded-t-xl" />
            )}
            <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t.description}
            </p>
            <ul className="mt-6 space-y-2.5">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-2">
              <BookACallButton
                variant={t.featured ? "primary" : "nav"}
                className={cn(
                  "w-full",
                  !t.featured &&
                    "bg-transparent text-foreground border border-border hover:bg-transparent hover:border-accent hover:text-accent",
                )}
              >
                Book a call
              </BookACallButton>
              <SendInfoButton variant="nav" className="w-full" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
