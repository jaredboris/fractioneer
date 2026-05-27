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

export const Route = createFileRoute("/onepager")({
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
  { title: "Controller & monthly close", desc: "Reliable close across entities and locations." },
  { title: "Bookkeeping & reconciliations", desc: "Clean, current books built for real reporting." },
  { title: "Payroll & benefits", desc: "Multi-state payroll and benefits administration." },
  { title: "AP/AR & vendor coordination", desc: "Vendor payments, customer invoicing, steady cadence." },
  { title: "Tax & audit support", desc: "Daily bookkeeping built to hold up under audit and diligence." },
];

const engagements = [
  { title: "Controller-Led Operations", desc: "Day-to-day finance ownership, close, reporting, cash flow, controls." },
  { title: "CFO Partnership", desc: "Strategic finance leadership, forecasting, board support, capital strategy." },
  { title: "Project & Deal Support", desc: "M&A, diligence, audits, and special transactions, billed by engagement." },
];

const whyUs = [
  { title: "Boutique by design.", desc: "We work with a short list of clients and deliver white\u2011glove service across every engagement." },
  { title: "Senior-led.", desc: "Every client engagement is owned by experienced finance leaders, not junior staff." },
  { title: "Built for complexity.", desc: "We run finance for businesses with multi-entity, multi-location, and multi-state operations." },
  { title: "Long-term partners.", desc: "Our average client relationship runs 4+ years." },
];

const metrics = [
  { stat: "$100M", label: "Annual client revenue serviced" },
  { stat: "4 yrs", label: "Average client engagement length" },
  { stat: "1,500+", label: "Franchisees overseen" },
  { stat: "17", label: "Full-time staff across finance functions" },
];

const logos = [
  { name: "Riverside", src: riverside, invert: false },
  { name: "MPK Equity Partners", src: mpk, invert: true },
  { name: "Pretium", src: pretium, invert: false },
  { name: "Abaco", src: abaco, invert: false },
  { name: "Sequel Brands", src: sequelBrands, invert: false },
  { name: "HomeFront Brands", src: homefront, invert: false },
  { name: "Crash Override", src: crashOverride, invert: false },
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
          padding: 0.45in 0.5in;
          color: var(--color-foreground);
        }
        .logo-grayscale { filter: grayscale(100%); }
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
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Capability overview
            </div>
          </div>

          {/* Hero */}
          <div className="mt-5">
            <h1 className="text-[20px] leading-[1.15] font-semibold text-foreground tracking-tight">
              Fractional finance leadership and operations for growing operators.
            </h1>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground max-w-[7in]">
              CFO, controller, bookkeeping, payroll, AP/AR, cash flow, and audit support, delivered by a senior finance team built for businesses that need real financial structure without a full in-house department.
            </p>
          </div>

          {/* Who we serve */}
          <div className="mt-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">Who we serve</div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10.5px] text-foreground/85">
              <li>• Franchisors and franchise platforms</li>
              <li>• Multi-unit operators and growth-stage businesses</li>
              <li>• PE-backed brands and founder-owned companies</li>
              <li>• Construction, fleet, fitness, recovery, and other operator-heavy industries</li>
            </ul>
          </div>

          {/* What we run */}
          <div className="mt-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">What we run</div>
            <div className="grid grid-cols-3 gap-2">
              {services.map((s) => (
                <div key={s.title} className="rounded-md border border-border bg-card p-2.5">
                  <div className="text-[10.5px] font-semibold text-foreground leading-tight">{s.title}</div>
                  <div className="mt-1 text-[9.5px] leading-snug text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* How we engage */}
          <div className="mt-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">How we engage</div>
            <div className="grid grid-cols-3 gap-2">
              {engagements.map((e) => (
                <div key={e.title} className="rounded-md border border-border bg-card p-2.5 border-l-2 border-l-accent">
                  <div className="text-[10.5px] font-semibold text-foreground leading-tight">{e.title}</div>
                  <div className="mt-1 text-[9.5px] leading-snug text-muted-foreground">{e.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Fractioneer */}
          <div className="mt-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent mb-2">Why Fractioneer</div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
              {whyUs.map((w) => (
                <div key={w.title} className="text-[10px] leading-snug">
                  <div className="font-semibold text-foreground">{w.title}</div>
                  <div className="text-muted-foreground mt-0.5">{w.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-5 grid grid-cols-4 gap-px bg-border rounded-md overflow-hidden border border-border">
            {metrics.map((m) => (
              <div key={m.label} className="bg-card p-2.5 text-center">
                <div className="text-[16px] font-semibold text-foreground tracking-tight leading-none">{m.stat}</div>
                <div className="mt-1 text-[8.5px] leading-snug text-muted-foreground">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Logos */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              {logos.map((l) => (
                <img
                  key={l.name}
                  src={l.src}
                  alt={l.name}
                  className="logo-grayscale h-6 w-auto max-w-[0.9in] object-contain opacity-70"
                  style={l.invert ? { filter: "grayscale(100%) invert(1) brightness(0.5)" } : undefined}
                />
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-5 rounded-md bg-muted/60 border border-border p-3">
            <p className="text-[10.5px] italic leading-snug text-foreground/90">
              "Fractioneer has run financial operations for my companies for over 6 years. I would trust them with anything."
            </p>
            <div className="mt-1.5 text-[9.5px] text-muted-foreground">
              — Michael C. Abdy, Founder / General Partner, Abaco
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-[9.5px] text-muted-foreground">
            <div>info@fractioneer.co</div>
            <div className="font-medium text-foreground">Book a call: fractioneer.co/book</div>
            <div>fractioneer.co</div>
          </div>
        </div>
      </div>
    </>
  );
}
