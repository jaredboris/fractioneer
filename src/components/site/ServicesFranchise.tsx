import { Section } from "./Section";

type Layer = {
  number: string;
  label: string;
  items: string[];
  note: string;
};

const layers: Layer[] = [
  {
    number: "01",
    label: "Strategic finance",
    items: [
      "CFO leadership",
      "Forecasting",
      "Board-ready reporting",
      "Cash flow visibility",
    ],
    note: "Forecasting, planning, and reporting leadership can rely on.",
  },
  {
    number: "02",
    label: "Controls & close",
    items: [
      "Controller support",
      "Monthly close",
      "Multi-entity reporting",
      "Tax and audit support",
    ],
    note: "Reliable close, controls, and audit-ready documentation.",
  },
  {
    number: "03",
    label: "Daily operations",
    items: [
      "Bookkeeping",
      "Payroll & benefits",
      "AP / AR",
      "Vendor coordination",
    ],
    note: "Day-to-day finance execution across entities and locations.",
  },
];

export function ServicesFranchise() {
  return (
    <Section id="services" muted>
      <div className="mb-8 md:mb-10 max-w-3xl">
        <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          What we run
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-[1.1] text-foreground">
          What Fractioneer runs for franchise systems and growing operators.
        </h2>
        <p className="mt-5 text-base md:text-lg leading-relaxed text-muted-foreground">
          A complete finance function across strategy, controls, close,
          reporting, and day-to-day execution.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {layers.map((layer) => (
          <div
            key={layer.number}
            className="rounded-xl border border-border bg-card p-6 flex flex-col"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold text-accent tabular-nums leading-none">
                {layer.number}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {layer.label}
              </span>
            </div>
            <ul className="mt-5 space-y-1.5">
              {layer.items.map((it) => (
                <li
                  key={it}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                  />
                  {it}
                </li>
              ))}
            </ul>
            <p className="mt-5 pt-4 border-t border-border text-xs leading-relaxed text-muted-foreground">
              {layer.note}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
