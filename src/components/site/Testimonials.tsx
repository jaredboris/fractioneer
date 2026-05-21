import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import michaelPhoto from "@/assets/testimonial-michael-abdy.jpeg";
import aakeemPhoto from "@/assets/testimonial-aakeem-andrada.jpeg";
import paulPhoto from "@/assets/testimonial-paul-ferrara.jpeg";

const quotes = [
  {
    label: "Portfolio finance",
    quote:
      "Fractioneer has run financial operations for every one of my companies for over 6 years. They are experts at financial operations and have been pivotal in managing our portfolio companies.",
    name: "Michael C. Abdy",
    title: "Founder / General Partner",
    company: "Abaco",
    photo: michaelPhoto,
  },
  {
    label: "Portfolio finance",
    quote:
      "Fractioneer seamlessly integrates with our portfolio companies, providing financial insight, reporting, and strategic guidance that helps teams make better decisions and focus on growth.",
    name: "Aakeem Andrada",
    title: "Assistant Vice President",
    company: "Riverside",
    photo: aakeemPhoto,
  },
  {
    label: "Franchisor support",
    quote:
      "As a franchisor, managing financial complexity across multiple units can be overwhelming. Fractioneer's expertise, responsiveness, and insights have made them an essential partner in our growth.",
    name: "Paul Ferrara",
    title: "CEO",
    company: "PatchMaster",
    photo: paulPhoto,
  },
];

export function Testimonials() {
  return (
    <Section id="testimonials">
      <SectionHeader
        eyebrow="Testimonials"
        title="Trusted by operators managing real financial complexity."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {quotes.map((q) => (
          <figure
            key={q.name}
            className="rounded-2xl border border-border bg-card p-7 flex flex-col shadow-[0_1px_2px_rgba(10,31,68,0.04)]"
          >
            <span className="inline-flex w-fit items-center rounded-full border border-accent/30 bg-accent/[0.08] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-accent">
              {q.label}
            </span>
            <div className="mt-4 text-accent text-4xl leading-none font-serif" aria-hidden>
              &ldquo;
            </div>
            <blockquote className="mt-2 text-[15px] md:text-base leading-relaxed text-foreground/90 flex-1">
              {q.quote}
            </blockquote>
            <figcaption className="mt-6 pt-5 border-t border-border flex items-center gap-3">
              <img
                src={q.photo}
                alt={q.name}
                className="h-12 w-12 rounded-full object-cover border border-border"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {q.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {q.title}, {q.company}
                </div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </Section>
  );
}
