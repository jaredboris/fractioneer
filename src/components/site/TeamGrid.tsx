import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import jonPaulPhoto from "@/assets/team/jon-paul-mcgahan.jpeg";
import markPhoto from "@/assets/team/mark-carman.jpeg";
import keriPhoto from "@/assets/team/keri-chang.jpeg";

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
    photo: jonPaulPhoto,
  },
  {
    name: "Mark Carman",
    role: "Chief Operating Officer",
    chips: ["PE / VC", "Franchising", "Controller operations"],
    bio: "Mark brings PE, VC, franchising, modeling, and controller experience to client finance operations.",
    photo: markPhoto,
  },
  {
    name: "Lindsey Lacy",
    role: "Fractional CFO",
    chips: ["PE / VC", "Forecasting", "Growth stage"],
    bio: "Lindsey helps growing companies build finance infrastructure, forecasting, and investor reporting.",
  },
  {
    name: "Sona Banker",
    role: "Fractional CFO",
    chips: ["Franchising", "Multi-unit", "Finance strategy"],
    bio: "Sona guides franchise and multi-unit operators through strategic finance, cash flow, and scaling decisions.",
  },
  {
    name: "Jason Cohen",
    role: "Technical Accountant",
    chips: ["Technical accounting", "Audit", "Controls"],
    bio: "Jason supports clients on technical accounting matters, audit readiness, and internal control design.",
  },
];

const execution: Person[] = [
  {
    name: "Keri Chang",
    role: "Senior Staff Accountant",
    chips: ["25 years", "Bookkeeping", "Franchising"],
    bio: "Keri manages bookkeeping, reconciliations, reporting, and day-to-day accounting accuracy.",
    photo: keriPhoto,
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
  {
    name: "Katie Ramirez",
    role: "Senior Staff Accountant",
    chips: ["Bookkeeping", "Reconciliations", "Reporting"],
    bio: "Katie handles bookkeeping, reconciliations, financial reporting, and day-to-day accounting accuracy.",
  },
  {
    name: "Ivy Hije",
    role: "Senior Staff Accountant",
    chips: ["AP/AR", "Invoicing", "Accounting"],
    bio: "Ivy supports AP, AR, invoicing, bookkeeping, and maintaining accurate financial records.",
  },
  {
    name: "Law Pidlaoan",
    role: "Senior Staff Accountant",
    chips: ["Bookkeeping", "Reporting", "Accuracy"],
    bio: "Law manages bookkeeping, reporting, reconciliations, and ensures accounting accuracy across clients.",
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
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5">
          {p.chips.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <span aria-hidden className="h-1 w-1 rounded-full bg-accent/70" />
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
