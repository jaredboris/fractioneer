import { ArrowRight } from "lucide-react";
import { DashboardVisual } from "./DashboardVisual";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.7_0.17_240/0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-foreground/80">Finance operations for franchise growth</span>
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl lg:text-[3.5rem] font-semibold leading-[1.05] text-foreground">
              The outsourced finance department behind growing{" "}
              <span className="text-accent">franchise systems</span>.
            </h1>

            <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-muted-foreground">
              Fractioneer runs the CFO, controller, bookkeeping, payroll, AP/AR,
              cash flow, and audit support functions that franchisors, franchise
              platforms, and multi-unit operators need to scale with clarity.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#contact"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Book a consultation
              </a>
              <a
                href="#franchise"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
              >
                Explore franchise finance support
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="lg:pl-6">
            <DashboardVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
