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
  "562 construction M&A deals in 2025, 54% PE-driven",
  "WIP, retainage, multi-state payroll, bonding complexity",
  "Current construction prospect validates fit",
];

const card2Bullets = [
  "Tens of thousands of clinician-led operators, mid-cycle consolidation",
  "Multi-state licensing and entity complexity",
  "Phoenix Recovery already on the roster",
];

const card3Bullets = [
  "Tens of thousands of US operators",
  "Recurring monthly revenue, predictable cash flow",
  "Founders are technical, respond to cold outreach",
  "Active sponsor-to-sponsor recapitalizations signal mature consolidation",
];

const eyebrowCls =
  "text-[8px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60 mb-2";

const cardCaption =
  "text-[7.5px] font-semibold uppercase tracking-[0.22em] text-accent mb-1.5";

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[9.5px] leading-snug text-foreground/85">
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
          padding: 0.4in 0.55in 0.35in;
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
          <div className="mt-5">
            <h1 className="text-[28px] leading-[1.05] font-semibold text-primary tracking-tight">
              Secondary industry targets.
            </h1>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-muted-foreground max-w-[6.6in]">
              Three industries that match where Fractioneer wins, mapped to two outreach approaches.
            </p>
          </div>

          {/* Criteria strip */}
          <div className="mt-4 rounded-md bg-muted/60 px-4 py-2.5 flex items-center justify-between">
            {criteria.map((c, i) => (
              <div key={c} className="flex items-center gap-4 flex-1 justify-center first:justify-start last:justify-end">
                <span className="text-[9.5px] font-medium text-foreground/80 tracking-wide">{c}</span>
                {i < criteria.length - 1 && (
                  <span className="text-border text-[10px]">|</span>
                )}
              </div>
            ))}
          </div>

          {/* Section 1: Targeted outreach */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <div className={eyebrowCls + " mb-0"}>Targeted outreach</div>
            </div>
            <p className="mt-1 text-[9.5px] italic text-muted-foreground">
              Researched, personalized, Loom-driven. Smaller list, higher conversion.
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-3">
              {/* Card 1 */}
              <div className="rounded-md border border-border bg-white p-3.5 flex flex-col">
                <div className={cardCaption}>Target profile</div>
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Specialty trade contractors
                </div>
                <div className="text-[9.5px] italic text-muted-foreground mt-0.5">
                  Commercial roofing, electrical, mechanical, fire &amp; life safety
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
              <div className="rounded-md border border-border bg-white p-3.5 flex flex-col">
                <div className={cardCaption}>Target profile</div>
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Behavioral health and specialty healthcare
                </div>
                <div className="text-[9.5px] italic text-muted-foreground mt-0.5">
                  ABA, physical therapy, mental health, addiction treatment
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
          <div className="mt-5">
            <div className={eyebrowCls + " mb-0"}>Blast outreach</div>
            <p className="mt-1 text-[9.5px] italic text-muted-foreground">
              Automated email pipeline. Larger list, lower per-contact conversion, scaled reach.
            </p>

            {/* Card 3 — distinct treatment */}
            <div className="mt-2.5 rounded-md border-l-[3px] border-accent bg-primary/[0.04] border border-border/60 p-3.5">
              <div className={cardCaption}>Volume track</div>
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Managed IT service providers
                </div>
                <div className="text-[9.5px] italic text-muted-foreground">
                  Founder-led $5M–$30M revenue operators
                </div>
              </div>
              <ul className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-1">
                {card3Bullets.map((b) => (
                  <Bullet key={b}>{b}</Bullet>
                ))}
              </ul>
              <div className="mt-2.5 pt-2 border-t border-border/60 text-[9.5px] font-semibold text-primary leading-snug">
                The one industry on this list where blast email actually works.
              </div>
            </div>
          </div>

          {/* Recommendation footer */}
          <div className="mt-auto pt-3 border-t border-border">
            <div className="text-[12px] font-semibold text-primary leading-snug">
              Lead with two targeted tracks. Build MSPs as the scaled pipeline.
            </div>
            <div className="mt-1 text-[9.5px] italic text-muted-foreground">
              Built for pushback. Happy to walk through any of it.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
