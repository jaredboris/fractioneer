import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import logo from "@/assets/fractioneer-logo.jpg";

export const Route = createFileRoute("/industries")({
  head: () => ({
    meta: [
      { title: "Fractioneer | Industry analysis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IndustriesPage,
});

const criteria = [
  "Fragmented",
  "PE-active",
  "Operators preparing exits",
  "Multi-entity complexity",
];

const card1Bullets = [
  "562 construction M&A deals in 2025, PE buyers drove 54.3% of activity",
  "PE paying 10.6x EBITDA vs 7.5x for strategics (Transjovan Capital, 2026)",
  "Already serve Roof Scientist, Top Rail Fence, Window Hero, TWS, Stonework, Patriot Fleet, Meridian",
];

const card2Bullets = [
  "574 PE-acquired autism therapy sites across 42 states (JAMA Pediatrics, 2026)",
  "ABA platforms commanding mid-to-high teens EBITDA multiples (FOCUS Investment Banking)",
  "Phoenix Recovery already on the roster",
];

const card3Bullets = [
  "40,000–50,000 MSPs operating in the US (ChannelE2E)",
  "169 MSP M&A deals in 2025, 200+ annually (Channel Futures)",
  "Founders are technical, respond to cold outreach",
  "Top 50 MSPs hold small share, extreme fragmentation",
];

const sectionEyebrow =
  "text-[9px] font-semibold uppercase tracking-[0.24em] text-accent";

const cardCaption =
  "text-[7.5px] font-semibold uppercase tracking-[0.22em] text-accent mb-1.5 flex items-center gap-1.5";

function CardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className={cardCaption}>
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </div>
  );
}

function Bullet({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className={`flex gap-2 text-[9.5px] leading-snug ${light ? "text-white/90" : "text-foreground/85"}`}>
      <span className="text-accent font-bold leading-none mt-[2px]">•</span>
      <span>{children}</span>
    </li>
  );
}

function IndustriesPage() {
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
          padding: 0.4in 0.55in 0in;
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
              Internal · Industry analysis
            </div>
          </div>

          {/* Hero */}
          <div className="mt-4">
            <h1 className="text-[26px] leading-[1.05] font-semibold text-primary tracking-tight">
              Secondary industry targets.
            </h1>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground max-w-[6.6in]">
              Three industries that match where Fractioneer wins, mapped to two outreach approaches.
            </p>
          </div>

          {/* Criteria strip */}
          <div className="mt-3 rounded-md bg-muted/60 px-4 py-2 flex items-center justify-between">
            {criteria.map((c, i) => (
              <div key={c} className="flex items-center gap-4 flex-1 justify-center first:justify-start last:justify-end">
                <span className="text-[9px] font-medium text-foreground/80 tracking-wide">{c}</span>
                {i < criteria.length - 1 && (
                  <span className="text-border text-[10px]">|</span>
                )}
              </div>
            ))}
          </div>

          {/* Section 1: Targeted outreach */}
          <div className="mt-4">
            <div className="flex items-baseline gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              <div className={sectionEyebrow}>Targeted outreach</div>
            </div>
            <p className="mt-1 ml-5 text-[9px] italic text-muted-foreground">
              Researched, personalized, Loom-driven. Smaller list, higher conversion.
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-3">
              {/* Card 1 */}
              <div className="rounded-md border border-primary/15 bg-white p-3.5 flex flex-col shadow-[0_1px_0_rgba(10,31,68,0.04)]">
                <CardEyebrow>Target profile</CardEyebrow>
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Specialty trade contractors
                </div>
                <div className="text-[9px] italic text-muted-foreground mt-0.5">
                  Roofing, fencing, electrical, mechanical, exterior services, fleet
                </div>
                <ul className="mt-2.5 space-y-1">
                  {card1Bullets.map((b) => (
                    <Bullet key={b}>{b}</Bullet>
                  ))}
                </ul>
                <div className="mt-auto pt-2.5 border-t border-border/60 text-[9.5px] font-semibold text-primary leading-snug">
                  The cleanup moment hits when PE diligence exposes their books.
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-md border border-primary/15 bg-white p-3.5 flex flex-col shadow-[0_1px_0_rgba(10,31,68,0.04)]">
                <CardEyebrow>Target profile</CardEyebrow>
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Behavioral health and specialty healthcare
                </div>
                <div className="text-[9px] italic text-muted-foreground mt-0.5">
                  ABA, mental health, addiction treatment, pediatric therapy
                </div>
                <ul className="mt-2.5 space-y-1">
                  {card2Bullets.map((b) => (
                    <Bullet key={b}>{b}</Bullet>
                  ))}
                </ul>
                <div className="mt-auto pt-2.5 border-t border-border/60 text-[9.5px] font-semibold text-primary leading-snug">
                  Founders are clinicians, not finance people. Books are usually a mess.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Blast outreach */}
          <div className="mt-4">
            <div className="flex items-baseline gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              <div className={sectionEyebrow}>Blast outreach</div>
            </div>
            <p className="mt-1 ml-5 text-[9px] italic text-muted-foreground">
              Automated email pipeline. Larger list, lower per-contact conversion, scaled reach.
            </p>

            {/* Card 3 — tinted background */}
            <div className="mt-2.5 rounded-md border-l-[3px] border-accent border border-primary/15 bg-accent/[0.07] p-3.5">
              <CardEyebrow>Volume track</CardEyebrow>
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Managed IT service providers
                </div>
                <div className="text-[9px] italic text-muted-foreground">
                  Founder-led $5M–$30M revenue operators
                </div>
              </div>
              <ul className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-1">
                {card3Bullets.map((b) => (
                  <Bullet key={b}>{b}</Bullet>
                ))}
              </ul>
              <div className="mt-2.5 pt-2 border-t border-primary/15 text-[9.5px] font-semibold text-primary leading-snug">
                The one industry on this list where blast email actually works.
              </div>
            </div>
          </div>

          {/* Recommendation footer — dark navy band, full bleed */}
          <div className="mt-auto -mx-[0.55in] bg-primary px-[0.55in] py-3">
            <div className="text-[12px] font-semibold text-white leading-snug">
              Lead with two targeted tracks. Build MSPs as the scaled pipeline.
            </div>
            <div className="mt-1 text-[9.5px] italic text-white/70">
              Built for pushback. Happy to walk through any of it.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
