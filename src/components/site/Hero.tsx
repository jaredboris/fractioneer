import { ArrowRight } from "lucide-react";
import { DashboardVisual } from "./DashboardVisual";
import { BookACallButton } from "./BookACallButton";
import michaelPhoto from "@/assets/testimonial-michael-abdy.jpeg";


export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.7_0.17_240/0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-6 pb-16 md:pt-10 md:pb-20">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-foreground/80">Finance operations for franchise growth</span>
            </div>

            <h1 className="mt-6 text-4xl md:text-5xl lg:text-[3.5rem] font-semibold leading-[1.05] text-foreground">
              The outsourced finance department for growing{" "}
              <span className="text-accent">franchise systems</span>.
            </h1>

            <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-muted-foreground">
              Fractioneer runs CFO, controller, bookkeeping, payroll, AP/AR,
              cash flow, and audit support for franchisors, multi-unit
              operators, PE-backed brands, and founder-owned companies.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <BookACallButton />
              <a
                href="#services"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground hover:border-accent hover:text-accent transition-colors"
              >
                See how we support franchise finance
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <figure className="mt-8 flex items-start gap-3 max-w-lg">
              <img
                src={michaelPhoto}
                alt="Michael C. Abdy"
                className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                loading="lazy"
              />
              <div className="min-w-0">
                <blockquote className="text-[13px] leading-relaxed text-foreground/80">
                  &ldquo;Fractioneer has run financial operations for my companies for over 6 years. I would trust them with anything.&rdquo;
                </blockquote>
                <figcaption className="mt-1.5 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/90">Michael C. Abdy</span>, Founder / General Partner, Abaco
                </figcaption>
              </div>
            </figure>
          </div>

          <div className="lg:pl-6">
            <DashboardVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
