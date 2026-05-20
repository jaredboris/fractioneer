import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

// NOTE: Roles and bios below are placeholder drafts for client review.
const team = [
  {
    name: "Jon Paul McGahan",
    role: "Founding Partner",
    bio: "Leads firm strategy and senior client relationships across franchise and PE-backed engagements.",
  },
  {
    name: "Blake Folsom",
    role: "Partner, CFO Services",
    bio: "Heads fractional CFO engagements with multi-unit operators and franchise platforms.",
  },
  {
    name: "Mark Carman",
    role: "Partner, Controllership",
    bio: "Oversees controller-led engagements, financial controls, and monthly close operations.",
  },
  {
    name: "Keri Chang",
    role: "Director, Accounting",
    bio: "Runs accounting delivery across multi-entity clients and complex consolidations.",
  },
  {
    name: "Theresa Laietta",
    role: "Director, Payroll & Benefits",
    bio: "Leads multi-state payroll, benefits administration, and HR-finance coordination.",
  },
  {
    name: "Angie Serrano",
    role: "Director, AP/AR Operations",
    bio: "Manages vendor payments, customer invoicing, and AP/AR processes across the portfolio.",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export function TeamGrid() {
  return (
    <Section id="team" muted>
      <SectionHeader
        eyebrow="Team"
        title="Experienced finance operators, not just accountants."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {team.map((p) => (
          <div key={p.name} className="rounded-xl border border-border bg-card p-6 flex gap-4 items-start">
            <div
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-base font-semibold"
            >
              {initials(p.name)}
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">{p.name}</div>
              <div className="text-xs font-medium uppercase tracking-wider text-accent mt-0.5">
                {p.role}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
