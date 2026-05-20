import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

const items = [
  {
    title: "Franchise and PE experience",
    body: "Deep operating context with franchisors, multi-unit operators, and PE-backed brands.",
  },
  {
    title: "CFO through bookkeeping support",
    body: "Strategic finance and day-to-day execution delivered by the same coordinated team.",
  },
  {
    title: "Embedded finance team model",
    body: "We plug into your business, your systems, and your cadence — not the other way around.",
  },
  {
    title: "Long-term operating partnership",
    body: "Built for years of partnership, not a one-off engagement or transactional support.",
  },
];

export function WhyFractioneer() {
  return (
    <Section id="approach" muted>
      <SectionHeader
        eyebrow="Why Fractioneer"
        title="More than bookkeeping. A finance department that scales with you."
      />
      <div className="grid gap-px bg-border rounded-xl overflow-hidden border border-border">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
          {items.map((item, idx) => (
            <div key={item.title} className="bg-card p-7 lg:p-8">
              <div className="text-xs font-semibold tracking-[0.18em] text-accent">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
