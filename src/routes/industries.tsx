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

type Card = {
  rank: string;
  tier: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  bullets: string[];
  emphasis: string;
  muted?: boolean;
};

const cards: Card[] = [
  {
    rank: "01",
    tier: "LEAD",
    eyebrow: "Existing expertise",
    title: "Specialty trades, led by fire & life safety",
    subtitle: "Fire/life safety, roofing, fencing, exterior services, fleet, containment",
    bullets: [
      "Pye-Barker completed 57 fire & life safety acquisitions in 2025 alone (company filing, 2026)",
      "US security & life safety M&A hit 242 deals in 2025, up 24.1% YoY, with PE add-ons driving 45.9% (Capstone Partners, 2026)",
      "Code-mandated annual inspections create recurring, repeatable revenue, the same playbook logic as franchising",
      "Already serve Roof Scientist, Top Rail Fence, Window Hero, Temporary Wall Systems, Stonework, Patriot Fleet, Meridian Fleet",
      "Aakeem's Riverside fire safety roll-up (~25 companies in 18 months) is a warm credibility path",
    ],
    emphasis:
      "Strongest leverage. We already speak this language, and fire safety is consolidating fast.",
  },
  {
    rank: "02",
    tier: "EXPAND",
    eyebrow: "Expansion opportunity",
    title: "Behavioral health and specialty healthcare",
    subtitle: "ABA, mental health, addiction treatment, pediatric therapy",
    bullets: [
      "PE has aggressively rolled up autism and ABA therapy centers over the past decade, with hundreds of sites acquired across dozens of states (JAMA Pediatrics, 2026)",
      "Brown University (Jan 2026): a large cohort of PE-acquired centers from 2018-2022 is now approaching exit",
      "Phoenix Recovery already on the roster as our first behavioral health client",
      "Recurring patient revenue and multi-site structures are repeatable once the playbook is built",
    ],
    emphasis:
      "Founders are clinicians, not finance people. Books are usually a mess when PE comes calling.",
  },
  {
    rank: "03",
    tier: "STRONG CANDIDATE",
    eyebrow: "Regulatory tailwind",
    title: "Law firms, personal injury focus",
    subtitle: "PI and plaintiff firms in ABS and MSO structures",
    bullets: [
      "Arizona has approved 136+ alternative business structures; 59% of new 2024 licensees wholly nonlawyer-owned (Sidley Austin, 2026)",
      "PI firms carry high upfront case-acquisition costs and succession pressure, classic cleanup-before-sale trigger",
      "MSO model lets PE invest even in non-ABS states, widening the consolidation runway",
      "Trust accounting and contingency-fee structures are repeatable once learned",
    ],
    emphasis: "A world we already know. Repeatable structure, accelerating PE interest.",
  },
  {
    rank: "04",
    tier: "RESEARCH NEXT",
    eyebrow: "Worth a pass",
    title: "Property management",
    subtitle: "Founder-led operators managing 500–3,000 units",
    bullets: [
      "Tens of thousands of independent operators, severe fragmentation, active PE roll-ups by national consolidators",
      "Founders approaching retirement, recurring management-fee revenue",
      "Caveat: exit-urgency trigger fires less often than trades or healthcare; founders tend to hold",
    ],
    emphasis:
      "Real fragmentation and PE activity, but the urgency trigger is softer. Worth a dedicated look.",
    muted: true,
  },
  {
    rank: "05",
    tier: "RESEARCH NEXT",
    eyebrow: "Watch item",
    title: "Youth sports",
    subtitle: "Leagues, facilities, tournament operators",
    bullets: [
      "$40B market, heavy PE activity (Unrivaled Sports, IMG Academy $1.25B in 2025)",
      "Caveat: the federal Let Kids Play Act (introduced May 2026) would ban PE ownership and label PE funds \u201Cvulture investors\u201D",
      "Caveat: many small league operators are low-margin hobby businesses, not our ICP",
    ],
    emphasis:
      "Exciting consolidation story, but regulatory headwind and thin operator margins give real pause.",
    muted: true,
  },
];

const criteria = [
  "Fragmented",
  "PE-active",
  "Operators preparing exits",
  "Repeatable structure",
  "Strong enough margins to support us",
];

function PriorityCard({ card }: { card: Card }) {
  const muted = card.muted;
  return (
    <div
      className={
        muted
          ? "rounded-md border border-border bg-muted/50 border-l-[3px] border-l-muted-foreground/40 p-2 flex gap-3"
          : "rounded-md border border-primary/15 border-l-[3px] border-l-primary bg-white p-2 shadow-[0_1px_0_rgba(10,31,68,0.04)] flex gap-3"
      }
    >
      <div className="flex-none w-[88px] pt-0.5 pr-2 border-r border-border/50">
        <div
          className={
            muted
              ? "text-[26px] leading-none font-bold text-accent/40 tracking-tight"
              : "text-[26px] leading-none font-bold text-accent/70 tracking-tight"
          }
        >
          {card.rank}
        </div>
        <div className="mt-1.5 inline-block rounded-sm bg-primary/10 px-1.5 py-[2px] text-[6.5px] font-semibold uppercase tracking-[0.18em] text-primary whitespace-nowrap">
          {card.tier}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[7.5px] font-semibold uppercase tracking-[0.22em] text-accent mb-0.5 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {card.eyebrow}
        </div>
        <div className="text-[12.5px] font-semibold text-primary leading-tight tracking-tight">
          {card.title}
        </div>
        <div className="text-[9px] italic text-muted-foreground mt-0.5">{card.subtitle}</div>
        <ul className={muted ? "mt-1 space-y-[2px]" : "mt-1 space-y-[2px]"}>
          {card.bullets.map((b) => (
            <li
              key={b}
              className="flex gap-2 text-[8.5px] leading-snug text-foreground/85"
            >
              <span className="text-accent font-bold leading-none mt-[2px]">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-1 pt-1 border-t border-border/60 text-[8.5px] font-semibold text-primary leading-snug">
          {card.emphasis}
        </div>
      </div>
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
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <div className="text-[7.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
              Internal · Industry analysis
            </div>
          </div>

          {/* Hero */}
          <div className="mt-2">
            <h1 className="text-[24px] leading-[1.05] font-semibold text-primary tracking-tight">
              Industries to target.
            </h1>
            <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground max-w-[7in]">
              Ranked by fit against our model: fragmented, PE-active, operators preparing exits, and a repeatable financial structure we can build a playbook around.
            </p>
          </div>

          {/* Criteria strip */}
          <div className="mt-1.5 rounded-md bg-muted/60 px-4 py-1 flex items-center justify-between">
            {criteria.map((c, i) => (
              <div
                key={c}
                className="flex items-center gap-3 flex-1 justify-center first:justify-start last:justify-end"
              >
                <span className="text-[8.5px] font-medium text-foreground/80 tracking-wide whitespace-nowrap">
                  {c}
                </span>
                {i < criteria.length - 1 && (
                  <span className="text-border text-[10px]">|</span>
                )}
              </div>
            ))}
          </div>

          {/* Ranked cards */}
          <div className="mt-2 space-y-1">
            {cards.map((c) => (
              <PriorityCard key={c.rank} card={c} />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto -mx-[0.55in] bg-primary px-[0.55in] py-2">
            <div className="text-[11px] font-semibold text-white leading-snug">
              Lead with specialty trades and fire safety. Expand into behavioral health and PI law. Keep property management and youth sports on the research bench.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
