import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";

// [Awaiting headshots for Theresa Laietta and Angie Serrano — replace initials with real photos when provided]
// Temporarily showing all six team members with initials so the section looks consistent.

type Person = {
  name: string;
  role: string;
  chips: string[];
  bio: string;
  photo?: string;
};

const leaders: Person[] = [
  {
    name: "Jon Paul McGahan",
    role: "Chief Executive Officer / Founder",
    chips: ["15+ years", "100+ clients", "$10B+ AUM client experience"],
    bio: "JP has led fractional finance work for 100+ clients, from private funds to founder-owned businesses.",
  },
  {
    name: "Mark Carman",
    role: "Chief Operating Officer",
    chips: ["PE / VC", "Franchising", "Controller operations"],
    bio: "Mark brings PE, VC, franchising, modeling, and controller experience to client finance operations.",
  },
  {
    name: "Blake Folsom, CPA",
    role: "Fractional CFO",
    chips: ["CPA", "M&A", "Internal controls"],
    bio: "Blake helps growing companies improve cash flow, controls, reporting, and finance strategy.",
  },
];

const execution: Person[] = [
  {
    name: "Keri Chang",
    role: "Senior Staff Accountant",
    chips: ["25 years", "Bookkeeping", "Franchising"],
    bio: "Keri manages bookkeeping, reconciliations, reporting, and day-to-day accounting accuracy.",
  },
  {
    name: "Theresa Laietta",
    role: "Senior Payroll Supervisor",
    chips: ["25+ years", "Payroll", "HR compliance"],
    bio: "Theresa supports payroll, benefits, PEO systems, compliance, onboarding, and deductions.",
  },
  {
    name: "Angie Serrano",
    role: "Senior Staff Accountant",
    chips: ["10+ years", "AP/AR", "Audit support"],
    bio: "Angie supports bookkeeping, invoicing, AP, AR, audit support, and accounting accuracy.",
  },
];

function initials(name: string) {
  return name
    .replace(/,.*$/, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

function PersonCard({ p, prominent = false }: { p: Person; prominent?: boolean }) {
  const avatarSize = prominent ? "h-16 w-16" : "h-14 w-14";
  return (
    <div
      className={
        "rounded-xl border border-border bg-card p-6 flex gap-4 items-start transition-colors hover:border-accent/40" +
        (prominent ? " shadow-sm" : "")
      }
    >
      {p.photo ? (
        <img
          src={p.photo}
          alt={p.name}
          loading="lazy"
          className={`${avatarSize} shrink-0 rounded-lg object-cover border border-border`}
        />
      ) : (
        <div
          aria-hidden
          className={`flex ${avatarSize} shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-base font-semibold`}
        >
          {initials(p.name)}
        </div>
      )}
      <div className="min-w-0">
        <div className="text-base font-semibold text-foreground">{p.name}</div>
        <div className="text-xs font-medium uppercase tracking-wider text-accent mt-0.5">
          {p.role}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.chips.map((c) => (
            <span
              key={c}
              className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {c}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.bio}</p>
      </div>
    </div>
  );
}

export function TeamGrid() {
  return (
    <Section id="team" muted>
      <SectionHeader
        eyebrow="Team"
        title="The finance team behind your finance function."
        description="Senior finance leadership, controller support, bookkeeping, payroll, and AP/AR execution under one coordinated team."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {leaders.map((p) => (
          <PersonCard key={p.name} p={p} prominent />
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {execution.map((p) => (
          <PersonCard key={p.name} p={p} />
        ))}
      </div>
    </Section>
  );
}
