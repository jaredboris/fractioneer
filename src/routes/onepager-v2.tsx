import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import logo from "@/assets/fractioneer-logo.jpg";
import abaco from "@/assets/logos/abaco.png";
import mpk from "@/assets/logos/mpk-equity.png";
import stonework from "@/assets/logos/stonework.png";
import riverside from "@/assets/logos/riverside.gif";
import sequelBrands from "@/assets/logos/sequel-brands.webp";
import homefront from "@/assets/logos/homefront-brands.png";
import crashOverride from "@/assets/logos/crash-override.svg";

export const Route = createFileRoute("/onepager-v2")({
  head: () => ({
    meta: [
      { title: "Fractioneer | Transaction support one-pager" },
      { name: "description", content: "Printable overview of Fractioneer's M&A, recapitalization, and finance cleanup support for operator-owned businesses." },
      { property: "og:title", content: "Fractioneer | Transaction support one-pager" },
      { property: "og:description", content: "Printable overview of Fractioneer's M&A and transaction support services." },
      { property: "og:url", content: "https://fractioneer.co/onepager-v2" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "canonical", href: "https://fractioneer.co/onepager-v2" },
    ],
  }),
  component: OnePager,
});

const triggers = [
  "The books are not trusted enough for ownership decisions.",
  "An M&A transaction or recapitalization is underway.",
  "The finance function needs structure leadership can rely on.",
  "Reporting is late, inconsistent, or hard to act on.",
];

const featuredBullets = [
  "Diligence-ready books and documentation",
  "Buy/sell-side M&A support",
  "Quality-of-earnings and lender support",
  "Deal team support and transaction guidance",
];

const capabilities = [
  {
    title: "Monthly close & controls",
    desc: "Close, reconciliations, controls, and audit-ready documentation across entities.",
  },
  {
    title: "CFO & reporting",
    desc: "Forecasting, capital planning, board and lender reporting, cash visibility.",
  },
  {
    title: "Back-office operations",
    desc: "Bookkeeping, AP/AR, payroll coordination, vendor and invoicing workflows.",
  },
];

const whyUs = [
  { title: "Boutique by design", desc: "White-glove service and a focused client roster." },
  { title: "Senior-led", desc: "Every engagement is owned by experienced finance leaders." },
  { title: "Built for complexity", desc: "Multi-entity, multi-project, multi-location, multi-stakeholder." },
  { title: "Independent and transparent", desc: "Clear visibility into the numbers, the process, and the reporting." },
];

const metrics = [
  { stat: "$100M", label: "Annual client revenue serviced" },
  { stat: "4 yrs", label: "Average client engagement" },
  { stat: "15+", label: "M&A transactions supported" },
  { stat: "17", label: "Full-time finance staff" },
];

const logos = [
  { name: "Riverside", src: riverside, invert: true, h: 22 },
  { name: "MPK Equity Partners", src: mpk, invert: true, h: 32 },
  { name: "Stonework Tile + Stone", src: stonework, invert: false, h: 38, boost: true },
  { name: "Abaco", src: abaco, invert: false, h: 20 },
  { name: "Sequel Brands", src: sequelBrands, invert: true, h: 24 },
  { name: "HomeFront Brands", src: homefront, invert: false, h: 28 },
  { name: "Crash Override", src: crashOverride, invert: false, h: 22 },
];

const eyebrow =
  "text-[8px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60 mb-2";

function OnePager() {
  return (
    <>
      <style>{`
        @page { size: letter portrait; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .onepager-page { min-height: 0 !important; padding: 0 !important; background: white !important; }
          .onepager-sheet { box-shadow: none !important; margin: 0 !important; height: 10.88in !important; }
        }
        .onepager-sheet {
          width: 8.5in;
          height: 11in;
          box-sizing: border-box;
          margin: 0.5in auto;
          background: white;
          box-shadow: 0 10px 40px rgba(10, 31, 68, 0.15);
          padding: 0.35in 0.55in 0.3in;
          color: var(--color-foreground);
          overflow: hidden;
        }
      `}</style>

      <div className="onepager-page min-h-screen bg-muted/40 py-6">
        <button
          onClick={() => window.print()}
          className="no-print fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium shadow-lg hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </button>

        <div className="onepager-sheet flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <div className="text-[7.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
              Capability overview
            </div>
          </div>

          {/* Hero — dominant focal point */}
          <div className="mt-5">
            <h1 className="text-[28px] leading-[1.05] font-semibold text-primary tracking-tight max-w-[7in]">
              Finance support for complex operator-owned businesses.
            </h1>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground max-w-[6.6in]">
              Fractioneer helps leadership teams clean up financial operations, support M&amp;A transactions and recapitalizations, and build reliable finance functions across all aspects of the business.
            </p>
          </div>

          {/* Metrics — bold, oversized */}
          <div className="mt-6 grid grid-cols-4 gap-6 border-y border-border py-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <div className="text-[28px] font-semibold text-accent tracking-tight leading-none">{m.stat}</div>
                <div className="mt-1.5 text-[8.5px] leading-snug text-muted-foreground uppercase tracking-wide">{m.label}</div>
              </div>
            ))}
          </div>

          {/* When leadership calls Fractioneer — flat bordered band */}
          <div className="mt-6 border-y border-border py-3">
            <h2 className={eyebrow}>When leadership calls Fractioneer</h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] leading-snug text-foreground/85">
              {triggers.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-accent font-semibold">→</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured capability — most visually dominant block */}
          <div className="mt-6 rounded-md border-l-[3px] border-accent bg-primary text-primary-foreground p-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-[13px] font-semibold leading-tight tracking-tight">Transaction &amp; M&amp;A support</div>
              <div className="text-[7.5px] font-semibold uppercase tracking-[0.2em] text-accent">Featured capability</div>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-primary-foreground/85 max-w-[6.5in]">
              Support for M&amp;A transactions, recapitalizations, ownership transitions, financial diligence, books cleanup, and finance department buildouts.
            </p>
            <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9.5px] leading-snug text-primary-foreground/90">
              {featuredBullets.map((b) => (
                <li key={b} className="flex gap-1.5">
                  <span className="text-accent">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What Fractioneer can manage day to day — 3 condensed cards */}
          <div className="mt-6">
            <h2 className={eyebrow}>What Fractioneer can manage day to day</h2>
            <div className="grid grid-cols-3 gap-3">
              {capabilities.map((c) => (
                <div key={c.title} className="border-t-2 border-primary/80 pt-2">
                  <div className="text-[10.5px] font-semibold text-primary leading-tight">{c.title}</div>
                  <div className="mt-1 text-[9px] leading-snug text-muted-foreground">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Why Fractioneer — compact inline list */}
          <div className="mt-6">
            <h2 className={eyebrow}>Why Fractioneer</h2>
            <ul className="space-y-1">
              {whyUs.map((w) => (
                <li key={w.title} className="text-[9.5px] leading-snug">
                  <span className="font-semibold text-foreground">{w.title}.</span>{" "}
                  <span className="text-muted-foreground">{w.desc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Logos + testimonial — proof band */}
          <div className="mt-6 rounded-md bg-muted/50 px-4 py-3">
            <div className="text-[7.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70 mb-2 text-center">
              Trusted by operators, sponsors, and founders
            </div>
            <div className="grid grid-cols-7 gap-4 items-center">
              {logos.map((l) => (
                <div key={l.name} className="flex items-center justify-center h-9">
                  <img
                    src={l.src}
                    alt={`${l.name} client logo`}
                    className="w-auto max-w-full object-contain"
                    style={{
                      maxHeight: `${l.h}px`,
                      filter: l.invert
                        ? "grayscale(100%) invert(1) brightness(0.45) contrast(1.1)"
                        : l.boost
                          ? "grayscale(100%) brightness(0.25) contrast(1.4)"
                          : "grayscale(100%) brightness(0.55) contrast(1.1)",
                      opacity: l.boost ? 0.95 : 0.7,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2.5 border-t border-border/60 text-center">
              <p className="text-[10px] italic leading-snug text-foreground/85 max-w-[6in] mx-auto">
                &ldquo;Fractioneer has run financial operations for my companies for over 6 years. I would trust them with anything.&rdquo;
              </p>
              <div className="mt-1 text-[8.5px] text-muted-foreground">
                Michael C. Abdy, Founder / General Partner, Abaco
              </div>
            </div>
          </div>

          {/* CTA — soft sign-off */}
          <div className="mt-auto pt-3 flex items-center justify-end border-t border-border">
            <div className="text-right text-[10px] font-medium whitespace-nowrap">
              <div className="text-primary">info@fractioneer.co</div>
              <div className="text-muted-foreground text-[9px] mt-0.5">fractioneer.co</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
