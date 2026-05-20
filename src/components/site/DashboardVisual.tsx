import { ArrowUpRight, Check, CircleDollarSign, FileCheck2, Receipt, Users } from "lucide-react";

export function DashboardVisual() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-3xl bg-[var(--gradient-navy-blue)] opacity-[0.06] blur-2xl"
      />
      <div className="relative rounded-2xl border border-border bg-card shadow-[0_30px_60px_-30px_rgba(10,31,68,0.25)] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-foreground/70">
              Finance Operations — Q3
            </span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Live
          </span>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 border-b border-border">
          <Stat label="Monthly close" value="On track" tone="ok" />
          <Stat label="Cash runway" value="14.2 mo" tone="up" />
          <Stat label="AP open" value="$184k" tone="neutral" />
        </div>

        {/* Chart + side */}
        <div className="grid grid-cols-5 gap-px bg-border">
          <div className="col-span-3 bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Unit-level revenue</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  $2.41M
                </div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                <ArrowUpRight className="h-3 w-3" /> 8.4%
              </div>
            </div>
            <Sparkline />
            <div className="mt-3 flex gap-1.5">
              {["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP"].map((m) => (
                <span key={m} className="flex-1 text-center text-[9px] tracking-wide text-muted-foreground">
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="col-span-2 bg-card p-5">
            <div className="text-xs text-muted-foreground">Locations</div>
            <ul className="mt-3 space-y-2.5">
              {[
                { name: "Northeast", v: "$612k" },
                { name: "Midwest", v: "$548k" },
                { name: "Southeast", v: "$489k" },
                { name: "West", v: "$421k" },
              ].map((row) => (
                <li key={row.name} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/80">{row.name}</span>
                  <span className="font-medium text-foreground">{row.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Module strip */}
        <div className="grid grid-cols-3 border-t border-border">
          <Module icon={<Users className="h-3.5 w-3.5" />} label="Payroll" status="Run complete" />
          <Module icon={<Receipt className="h-3.5 w-3.5" />} label="AP / AR" status="42 invoices" />
          <Module icon={<FileCheck2 className="h-3.5 w-3.5" />} label="Audit" status="Ready" />
        </div>
      </div>

      {/* Floating chip */}
      <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
          <CircleDollarSign className="h-3.5 w-3.5" />
        </span>
        <div className="text-[11px] leading-tight">
          <div className="font-medium text-foreground">Cash flow forecast</div>
          <div className="text-muted-foreground">Updated today</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "up" | "neutral" }) {
  return (
    <div className="px-5 py-4 border-r border-border last:border-r-0">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-1.5">
        {tone === "ok" && <Check className="h-3.5 w-3.5 text-accent" />}
        <span className="text-sm font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
}

function Module({ icon, label, status }: { icon: React.ReactNode; label: string; status: string }) {
  return (
    <div className="px-5 py-3 border-r border-border last:border-r-0">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <span className="text-accent">{icon}</span>
        {label}
      </div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{status}</div>
    </div>
  );
}

function Sparkline() {
  // simple SVG sparkline using accent color
  const pts = [22, 28, 24, 34, 30, 42, 38, 50, 56];
  const max = 60;
  const w = 280;
  const h = 70;
  const step = w / (pts.length - 1);
  const d = pts
    .map((p, i) => {
      const x = i * step;
      const y = h - (p / max) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full h-16">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.17 240)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="oklch(0.7 0.17 240)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={d} fill="none" stroke="oklch(0.7 0.17 240)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
