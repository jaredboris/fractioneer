import { Check, CircleDollarSign, FileCheck2, Receipt, Users, Wallet, Building2, Percent } from "lucide-react";

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
              Sample franchise finance snapshot
            </span>
          </div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Illustrative
          </span>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 border-b border-border">
          <Stat label="Monthly close" value="On track" tone="ok" />
          <Stat label="Cash forecast" value="14.2 mo" tone="up" />
          <Stat label="AP / AR" value="Current" tone="ok" />
        </div>

        {/* Middle: Location-level P&L + Royalty tracking */}
        <div className="grid grid-cols-5 gap-px bg-border">
          <div className="col-span-3 bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 text-accent" />
                Location-level P&amp;L
              </div>
              <span className="text-[10px] text-muted-foreground">Sample data</span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                { name: "Northeast — 12 units", v: "$612k", pct: 88 },
                { name: "Midwest — 9 units", v: "$548k", pct: 78 },
                { name: "Southeast — 8 units", v: "$489k", pct: 70 },
                { name: "West — 7 units", v: "$421k", pct: 60 },
              ].map((row) => (
                <li key={row.name} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/80">{row.name}</span>
                    <span className="font-medium text-foreground">{row.v}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent/80"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 bg-card p-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Percent className="h-3.5 w-3.5 text-accent" />
              Royalty tracking
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                { name: "Collected", v: "94%" },
                { name: "Pending", v: "5%" },
                { name: "Past due", v: "1%" },
              ].map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-foreground/80">{row.name}</span>
                  <span className="font-medium text-foreground">{row.v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Wallet className="h-3 w-3 text-accent" />
                Cash forecast — 90 days
              </div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                Positive
              </div>
            </div>
          </div>
        </div>

        {/* Module strip */}
        <div className="grid grid-cols-3 border-t border-border">
          <Module icon={<Users className="h-3.5 w-3.5" />} label="Payroll" status="Run complete" />
          <Module icon={<Receipt className="h-3.5 w-3.5" />} label="AP / AR" status="Reconciled" />
          <Module icon={<FileCheck2 className="h-3.5 w-3.5" />} label="Audit ready" status="Documented" />
        </div>
      </div>

      {/* Floating chip */}
      <div className="absolute -bottom-4 -left-4 hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-md">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-accent">
          <CircleDollarSign className="h-3.5 w-3.5" />
        </span>
        <div className="text-[11px] leading-tight">
          <div className="font-medium text-foreground">Monthly close</div>
          <div className="text-muted-foreground">Day 10 target</div>
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
