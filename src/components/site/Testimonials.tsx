import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

// NOTE: Draft quotes for client approval — please replace with real ones.
const quotes = [
  {
    quote:
      "Fractioneer gave us a finance function that finally matched the pace of the business — clean reporting we can actually plan from.",
    name: "Michael C. Abdy",
    company: "Abaco",
  },
  {
    quote:
      "Their team operates like an in-house finance group. The visibility across our portfolio improved within the first quarter.",
    name: "Aakeem Andrada",
    company: "Riverside",
  },
  {
    quote:
      "Reliable monthly closes, real cash flow visibility, and people who understand how franchise systems actually run.",
    name: "Paul Ferrara",
    company: "PatchMaster",
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials">
      <SectionHeader
        eyebrow="Testimonials"
        title="Trusted by operators managing real financial complexity."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {quotes.map((q) => (
          <figure
            key={q.name}
            className="rounded-xl border border-border bg-card p-7 flex flex-col"
          >
            <div className="text-accent text-3xl leading-none" aria-hidden>
              &ldquo;
            </div>
            <blockquote className="mt-2 text-sm md:text-[15px] leading-relaxed text-foreground/90 flex-1">
              {q.quote}
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-border">
              <div className="text-sm font-semibold text-foreground">{q.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{q.company}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
