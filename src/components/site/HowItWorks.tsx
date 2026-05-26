import { Search, Settings2, TrendingUp } from "lucide-react";
import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const steps = [
  {
    icon: Search,
    title: "Assess",
    body: "We review your current finance setup, systems, reporting, and business-specific needs.",
  },
  {
    icon: Settings2,
    title: "Build",
    body: "We create the operating rhythm, reporting structure, and finance support model.",
  },
  {
    icon: TrendingUp,
    title: "Run",
    body: "We handle the finance work on a recurring cadence so leadership can trust the numbers.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeader
        eyebrow="How it works"
        title="How Fractioneer works with your team"
        description="A simple path from scattered finance activity to a finance function leadership can rely on."
      />

      <div className="relative">
        {/* Desktop connector line */}
        <div
          aria-hidden
          className="hidden md:block absolute top-7 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />
        <ol className="grid gap-6 md:grid-cols-3 md:gap-8 relative">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="relative rounded-xl border border-border bg-card p-6 md:bg-transparent md:border-0 md:p-0 md:text-center"
            >
              <div className="flex md:flex-col items-start md:items-center gap-4">
                <div className="relative shrink-0">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-card border border-border text-accent">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <span className="absolute -top-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {i + 1}
                  </span>
                </div>
                <div className="md:mt-2">
                  <h3 className="text-base font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:max-w-xs md:mx-auto">
                    {s.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
