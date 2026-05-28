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
  "562 construction M&A deals in 2025, PE buyers drove 54.3% of activity (Capstone Partners, 2026)",
  "Subcontractor M&A up 38.6% YoY in 2025 (Transjovan Capital)",
  "Already serve Roof Scientist, Top Rail Fence, Window Hero, Temporary Wall Systems, The Designery, Stonework, Patriot Fleet, Meridian Fleet",
];

const card2Bullets = [
  "574 PE-acquired autism therapy sites across 42 states (JAMA Pediatrics, 2026)",
  "Brown University (Jan 2026): 500+ PE-acquired autism centers, 80% of 2018–2022 cohort approaching exit",
  "Phoenix Recovery already on the roster as our first behavioral health client",
];

const card3Bullets = [
  "9 of top 11 chains are PE-backed; KinderCare bought 47-site chain across 14 states (Tyton Partners, 2024)",
  "Education industry cold email response rates of 12–15% (Reachoutly, 2026), highest of any vertical tracked",
  "270,000+ childcare providers nationwide, 95% independent (ChildcareCenter.us)",
  "Rich personalization data: licensing, capacity, accreditation, tuition publicly available via Winnie and state databases",
];

const sectionEyebrow =
  "text-[9px] font-semibold uppercase tracking-[0.24em] text-primary";

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

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[9.5px] leading-snug text-foreground/85">
      <span className="text-accent font-bold leading-none mt-[2px]">•</span>
      <span>{children}</span>
    </li>
  );
}

function SectionHeader({ label, sub }: { label: string; sub: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="inline-block h-2 w-2 rounded-full bg-accent" />
        <div className={sectionEyebrow}>{label}</div>
      </div>
      <p className="mt-1 ml-5 text-[9px] italic text-muted-foreground">{sub}</p>
    </div>
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
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <div className="text-[7.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
              Internal · Industry analysis
            </div>
          </div>

          {/* Hero */}
          <div className="mt-3">
            <h1 className="text-[26px] leading-[1.05] font-semibold text-primary tracking-tight">
              Industries to target.
            </h1>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground max-w-[7in]">
              Three plays across three risk profiles, ranked from where we have the most leverage to where we have the cleanest blast opportunity.
            </p>
          </div>

          {/* Criteria strip */}
          <div className="mt-2.5 rounded-md bg-muted/60 px-4 py-1.5 flex items-center justify-between">
            {criteria.map((c, i) => (
              <div key={c} className="flex items-center gap-4 flex-1 justify-center first:justify-start last:justify-end">
                <span className="text-[9px] font-medium text-foreground/80 tracking-wide">{c}</span>
                {i < criteria.length - 1 && <span className="text-border text-[10px]">|</span>}
              </div>
            ))}
          </div>

          {/* Section 1 */}
          <div className="mt-3">
            <SectionHeader
              label="Expand what we already do"
              sub="Existing client base, lowest risk, targeted high-touch outreach."
            />
            <div className="mt-2 rounded-md border border-primary/15 border-l-[3px] border-l-primary bg-white p-3 shadow-[0_1px_0_rgba(10,31,68,0.04)]">
              <CardEyebrow>Existing expertise</CardEyebrow>
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Specialty trade contractors
                </div>
                <div className="text-[9px] italic text-muted-foreground">
                  Roofing, fencing, exterior services, fleet, containment, kitchen/bath
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {card1Bullets.map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
              <div className="mt-2 pt-1.5 border-t border-border/60 text-[9.5px] font-semibold text-primary leading-snug">
                Strongest leverage. We already speak this language and have credibility in the space.
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="mt-3">
            <SectionHeader
              label="New territory"
              sub="No existing client base, higher learning curve, but cleanly matches our service model."
            />
            <div className="mt-2 rounded-md border border-primary/15 border-l-[3px] border-l-primary bg-white p-3 shadow-[0_1px_0_rgba(10,31,68,0.04)]">
              <CardEyebrow>Expansion opportunity</CardEyebrow>
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Behavioral health and specialty healthcare
                </div>
                <div className="text-[9px] italic text-muted-foreground">
                  ABA, mental health, addiction treatment, pediatric therapy
                </div>
              </div>
              <ul className="mt-2 space-y-1">
                {card2Bullets.map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
              <div className="mt-2 pt-1.5 border-t border-border/60 text-[9.5px] font-semibold text-primary leading-snug">
                Founders are clinicians, not finance people. Books are usually a mess.
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="mt-3">
            <SectionHeader
              label="Blast outreach"
              sub="Largest list, scaled automated email pipeline, lowest per-contact effort."
            />
            <div className="mt-2 rounded-md border border-primary/15 border-l-[3px] border-l-accent bg-accent/[0.08] p-3">
              <CardEyebrow>Volume play</CardEyebrow>
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
                  Independent insurance agencies
                </div>
                <div className="text-[9px] italic text-muted-foreground">
                  Principal-led agencies, succession-driven sales
                </div>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1">
                {card3Bullets.map((b) => <Bullet key={b}>{b}</Bullet>)}
              </ul>
              <div className="mt-2 pt-1.5 border-t border-primary/15 text-[9.5px] font-semibold text-primary leading-snug">
                Big list, urgent consolidation, less competition for finance services.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto -mx-[0.55in] bg-primary px-[0.55in] py-3">
            <div className="text-[12px] font-semibold text-white leading-snug">
              Lead with specialty trades. Build behavioral health second. Run insurance as the blast pipeline.
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
