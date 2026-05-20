import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import {
  Building2,
  Network,
  Percent,
  HandCoins,
  Presentation,
  FileSearch,
} from "lucide-react";

const items = [
  { icon: Building2, title: "Franchisor reporting", body: "Clear monthly reporting that fits how franchisors actually run." },
  { icon: Network, title: "Multi-unit financial visibility", body: "Unit, region, and entity-level views that roll up cleanly." },
  { icon: Percent, title: "Royalty and fee tracking", body: "Accurate royalty, marketing, and tech fee accounting on a steady cadence." },
  { icon: HandCoins, title: "Payroll and vendor coordination", body: "Coordinated payroll cycles and vendor payments across locations." },
  { icon: Presentation, title: "Board and investor reporting", body: "Decision-ready packages built for boards, sponsors, and partners." },
  { icon: FileSearch, title: "Audit and diligence support", body: "Documentation, schedules, and support throughout audits and transactions." },
];

export function FranchiseSection() {
  return (
    <Section id="franchise">
      <SectionHeader
        eyebrow="Built for franchise"
        title="Built for franchisors and multi-unit operators."
        description="Fractioneer helps franchise businesses create clean reporting, reliable monthly closes, better cash flow visibility, and a finance process that can scale across locations and entities."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="rounded-xl border border-border bg-card p-7">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <i.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-base font-semibold text-foreground">{i.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
