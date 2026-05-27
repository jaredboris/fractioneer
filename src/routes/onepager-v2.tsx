import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import logo from "@/assets/fractioneer-logo.jpg";
import abaco from "@/assets/logos/abaco.png";
import mpk from "@/assets/logos/mpk-equity.png";
import pretium from "@/assets/logos/pretium.webp";
import riverside from "@/assets/logos/riverside.gif";
import sequelBrands from "@/assets/logos/sequel-brands.webp";
import homefront from "@/assets/logos/homefront-brands.png";
import crashOverride from "@/assets/logos/crash-override.svg";

export const Route = createFileRoute("/onepager-v2")({
  head: () => ({
    meta: [
      { title: "Fractioneer | One-pager" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OnePager,
});

const services = [
  { title: "CFO leadership", desc: "Forecasting, capital planning, board-ready reporting." },
  { title: "Controller & monthly close", desc: "Reliable close across entities, projects, and locations." },
  { title: "Bookkeeping & reconciliations", desc: "Clean, current books built for real reporting." },
  { title: "AP/AR & vendor coordination", desc: "Vendor payments, customer invoicing, steady cadence." },
  { title: "Payroll & cash flow", desc: "Multi-entity payroll and disciplined cash management." },
  { title: "Tax & audit support", desc: "Books built to hold up under audit, lender review, and diligence." },
];

const engagements = [
  { title: "Controller-led operations", desc: "Day-to-day finance ownership: close, reporting, cash flow, and controls." },
  { title: "CFO partnership", desc: "Strategic finance leadership, forecasting, board support, and capital strategy." },
  { title: "Project & deal support", desc: "Partner buyouts, transactions, diligence, cleanups, audits, lender requests, and finance department buildouts." },
];

const whyUs = [
  { title: "Boutique by design.", desc: "A short list of clients and white\u2011glove service across every engagement." },
  { title: "Senior-led.", desc: "Every engagement is owned by experienced finance leaders, not junior staff." },
  { title: "Built for complexity.", desc: "We run finance for businesses with multi-entity, multi-project, multi-location, and multi-stakeholder structures." },
  { title: "Independent and transparent.", desc: "Engagements designed to give ownership clear visibility into the numbers, the process, and the reporting." },
];

const metrics = [
  { stat: "$100M", label: "Annual client revenue serviced" },
  { stat: "4 yrs", label: "Average client engagement" },
  { stat: "15+", label: "M&A transactions supported" },
  { stat: "17", label: "Full-time finance staff" },
];

// Per-logo height tuning so wide wordmarks (MPK, HomeFront) read at the same
// visual weight as compact marks (Abaco, Pretium). Values are px max-height.
const logos = [
  { name: "Riverside", src: riverside, invert: true, h: 22 },
  { name: "MPK Equity Partners", src: mpk, invert: true, h: 26 },
  { name: "Pretium", src: pretium, invert: false, h: 18 },
  { name: "Abaco", src: abaco, invert: false, h: 20 },
  { name: "Sequel Brands", src: sequelBrands, invert: true, h: 24 },
  { name: "HomeFront Brands", src: homefront, invert: false, h: 28 },
  { name: "Crash Override", src: crashOverride, invert: false, h: 22 },
];

function OnePager() {
  return (
    <>
      <style>{`
        @page { size: letter portrait; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          .onepager-sheet { box-shadow: none !important; margin: 0 !important; }
          body { background: white !important; }
        }
        .onepager-sheet {
          width: 8.5in;
          min-height: 11in;
          margin: 0.5in auto;
          background: white;
          box-shadow: 0 10px 40px rgba(10, 31, 68, 0.15);
          padding: 0.4in 0.5in;
          color: var(--color-foreground);
        }
      `}</style>

      <div className="min-h-screen bg-muted/40 py-6">
        <button
          onClick={() => window.print()}
          className="no-print fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>

        <div className="onepager-sheet">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <div className="text-[8.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
              Capability overview
            </div>
          </div>

          {/* Hero */}
          <div className="mt-5">
            <h1 className="text-[26px] leading-[1.1] font-semibold text-foreground tracking-tight max-w-[7.2in]">
              Finance support for complex operator-owned businesses.
            </h1>
            <p className="mt-2.5 text-[11.5px] leading-snug text-muted-foreground max-w-[6.8in]">
              Fractioneer helps leadership teams clean up financial operations, support transactions, and build reliable finance functions across entities, projects, and locations.
            </p>
          </div>

          {/* Metrics */}
          <div className="mt-5 grid grid-cols-4 gap-px bg-border rounded-md overflow-hidden border border-border">
            {metrics.map((m) => (
              <div key={m.label} className="bg-card px-2 py-3 text-center">
                <div className="text-[22px] font-semibold text-foreground tracking-tight leading-none">{m.stat}</div>
                <div className="mt-1.5 text-[8.5px] leading-snug text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Who we serve */}
          <div className="mt-5">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-foreground mb-2">Who we serve</div>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-1 text-[10.5px] text-foreground/85">
              <li>• Construction, fleet, fitness, recovery, franchise, and other operator-heavy businesses with multi-entity, multi-project, multi-location, or multi-stakeholder ownership structures</li>
              <li>• Multi-unit operators and growth-stage businesses</li>
              <li>• PE-backed brands and founder-owned companies</li>
              <li>• Franchisors and franchise platforms</li>
            </ul>
          </div>

          {/* What we run */}
          <div className="mt-5">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-foreground mb-2">What we run</div>
            <div className="grid grid-cols-3 gap-2">
              {services.map((s) => (
                <div key={s.title} className="rounded-md border border-border bg-card p-2.5">
                  <div className="text-[10.5px] font-semibold text-foreground leading-tight">{s.title}</div>
                  <div className="mt-1 text-[9.5px] leading-snug text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Transaction & buyout callout */}
            <div className="mt-2 rounded-md border border-accent/40 bg-accent/[0.06] p-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[10.5px] font-semibold text-foreground leading-tight">Transaction &amp; buyout support</div>
                <div className="text-[8px] font-medium uppercase tracking-[0.14em] text-accent">Featured capability</div>
              </div>
              <div className="mt-1 text-[10px] leading-snug text-foreground/80">
                Support for partner buyouts, ownership transitions, financial diligence, books cleanup, and finance department buildouts.
              </div>
            </div>
          </div>

          {/* How we engage */}
          <div className="mt-5">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-foreground mb-2">How we engage</div>
            <div className="grid grid-cols-3 gap-2">
              {engagements.map((e) => (
                <div key={e.title} className="rounded-md border border-border bg-card p-2.5">
                  <div className="text-[10.5px] font-semibold text-foreground leading-tight">{e.title}</div>
                  <div className="mt-1 text-[9.5px] leading-snug text-muted-foreground">{e.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Fractioneer */}
          <div className="mt-5">
            <div className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-foreground mb-2">Why Fractioneer</div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2">
              {whyUs.map((w) => (
                <div key={w.title} className="text-[10px] leading-snug">
                  <div className="font-semibold text-foreground">{w.title}</div>
                  <div className="text-muted-foreground mt-0.5">{w.desc}</div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 text-[10px] italic text-foreground/75 leading-snug">
              Built for situations where ownership needs cleaner books, stronger controls, and clearer visibility before making major business decisions.
            </div>
          </div>

          {/* Logos */}
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-4 items-center">
              {logos.map((l) => (
                <div key={l.name} className="flex items-center justify-center h-8">
                  <img
                    src={l.src}
                    alt={l.name}
                    className="w-auto max-w-full object-contain"
                    style={{
                      maxHeight: `${l.h}px`,
                      filter: l.invert
                        ? "grayscale(100%) invert(1) brightness(0.45) contrast(1.1)"
                        : "grayscale(100%) brightness(0.55) contrast(1.1)",
                      opacity: 0.75,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-4 rounded-md bg-muted/60 border border-border p-3">
            <p className="text-[10.5px] italic leading-snug text-foreground/90">
              "Fractioneer has run financial operations for my companies for over 6 years. I would trust them with anything."
            </p>
            <div className="mt-1.5 text-[9.5px] text-muted-foreground">
              — Michael C. Abdy, Founder / General Partner, Abaco
            </div>
          </div>

          {/* CTA */}
          <div className="mt-4 rounded-md bg-primary text-primary-foreground p-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold leading-tight">Next step</div>
              <div className="text-[10px] text-primary-foreground/80 leading-snug mt-0.5">
                A 30-minute call with Mark to walk through your situation and where Fractioneer can help.
              </div>
            </div>
            <div className="text-[10.5px] font-medium whitespace-nowrap">info@fractioneer.co</div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[9px] text-muted-foreground">
            <div>info@fractioneer.co</div>
            <div className="font-medium text-foreground/80">fractioneer.co</div>
          </div>
        </div>
      </div>
    </>
  );
}
