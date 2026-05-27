import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import jonPaulPhoto from "@/assets/team/jon-paul-mcgahan.jpeg";
import markPhoto from "@/assets/team/mark-carman.jpeg";
import keriPhoto from "@/assets/team/keri-chang.jpeg";

type Leader = {
  name: string;
  role: string;
  chips: string[];
  bio: string;
  photo?: string;
};

type Member = {
  name: string;
  role: string;
  tags: string[];
  photo?: string;
};

const leaders: Leader[] = [
  {
    name: "Jon Paul McGahan",
    role: "Chief Executive Officer / Founder",
    chips: ["15+ years", "$10B+ AUM client experience"],
    bio: "JP leads fractional finance work across private funds, franchise systems, and founder-owned businesses.",
    photo: jonPaulPhoto,
  },
  {
    name: "Mark Carman",
    role: "Chief Operating Officer",
    chips: ["PE / VC", "Franchising", "Controller operations"],
    bio: "Mark brings PE, VC, franchising, and controller experience to client finance operations.",
    photo: markPhoto,
  },
  {
    name: "Lindsey Lacy",
    role: "Fractional CFO",
    chips: ["PE / VC", "Forecasting", "Growth stage"],
    bio: "Lindsey helps growing companies build finance infrastructure, forecasting, and investor reporting.",
  },
];

const team: Member[] = [
  {
    name: "Sona Banker",
    role: "Fractional CFO",
    tags: ["Franchising", "Multi-unit", "Strategy"],
  },
  {
    name: "Jason Cohen",
    role: "Technical Accountant",
    tags: ["Technical accounting", "Audit", "Controls"],
  },
  {
    name: "Keri Chang",
    role: "Senior Staff Accountant",
    tags: ["25 yrs", "Bookkeeping", "Franchising"],
    photo: keriPhoto,
  },
  {
    name: "Theresa Laietta",
    role: "Senior Payroll Supervisor",
    tags: ["Payroll", "Benefits", "HR compliance"],
  },
  {
    name: "Angie Serrano",
    role: "Senior Staff Accountant",
    tags: ["AP / AR", "Audit support", "Bookkeeping"],
  },
  {
    name: "Katie Ramirez",
    role: "Senior Staff Accountant",
    tags: ["Bookkeeping", "Reconciliations", "Reporting"],
  },
  {
    name: "Ivy Hije",
    role: "Senior Staff Accountant",
    tags: ["AP / AR", "Invoicing", "Bookkeeping"],
  },
  {
    name: "Law Pidlaoan",
    role: "Senior Staff Accountant",
    tags: ["Bookkeeping", "Reporting", "Reconciliations"],
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

function LeaderCard({ p }: { p: Leader }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 flex gap-4 items-start shadow-sm">
      {p.photo ? (
        <img
          src={p.photo}
          alt={p.name}
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-lg object-cover border border-border"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-base font-semibold"
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

function MemberCard({ p }: { p: Member }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      {p.photo ? (
        <img
          src={p.photo}
          alt={p.name}
          loading="lazy"
          className="h-11 w-11 shrink-0 rounded-md object-cover border border-border"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted text-foreground text-xs font-semibold"
        >
          {initials(p.name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground truncate">
          {p.name}
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-accent mt-0.5">
          {p.role}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {p.tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TeamGrid() {
  return (
    <Section id="team" muted>
      <SectionHeader
        eyebrow="Team"
        title="A 17-person finance bench across CFO, controller, accounting, payroll, AP/AR, and reporting."
        description="Senior finance leadership backed by controller, accounting, payroll, and AP/AR execution — the same team across CFO, controller, and back-office work."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { count: "3", label: "Senior finance leaders" },
          { count: "5", label: "Accounting & controller specialists" },
          { count: "4", label: "Payroll & AP/AR operators" },
          { count: "5", label: "Reporting, audit & support" },
        ].map((b) => (
          <div
            key={b.label}
            className="rounded-lg border border-border bg-card px-4 py-3 flex items-baseline gap-3"
          >
            <span className="text-2xl font-semibold text-accent leading-none">{b.count}</span>
            <span className="text-[12px] leading-snug text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Leadership
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {leaders.map((p) => (
          <LeaderCard key={p.name} p={p} />
        ))}
      </div>

      <div className="mt-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Finance operations team
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((p) => (
          <MemberCard key={p.name} p={p} />
        ))}
      </div>
    </Section>
  );
}
