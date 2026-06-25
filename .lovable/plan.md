# Dashboard Widget Redesign — Match Reference Style

Goal: bring every widget on the **admin** portal up to the polished dark "NeuroBank" look in the references, and tighten the **client** portal to the same exact system so both sides feel like one product.

## Visual language (locked tokens)

Applied uniformly to every widget on both sides:

- **Card surface**: `#0B1220` background, `#1E2A3A` 1px border, `rounded-2xl` (16px), generous `p-6` padding, no inner shadows. On hover: border lifts to `#2A3A52`.
- **Card header**: title in `text-white text-[15px] font-medium` on the left, top-right `↗` arrow button (`ArrowUpRight` in a `h-8 w-8` ghost square, `text-[#9CA3AF] hover:text-white hover:bg-[#1E2A3A]`). Replaces the current mixed icon row.
- **Hero number**: `text-3xl font-semibold text-white` + secondary chip ("↑ 12% From last month") in `text-emerald-300` / `text-rose-300` with arrow glyph.
- **Glow accent**: primary chart/data line uses `#3B82F6` with a soft radial glow underneath (`bg-blue-500/20 blur-3xl` absolutely-positioned behind the chart area). Secondary series uses `#5EEAD4` (teal).
- **Progress bars** (Income Sources style): inline `% chip` (rounded-md, `bg-[#1E2A3A] text-white text-[11px] px-1.5`) + thin 4px track `bg-[#1E2A3A]` with gradient fill `from-blue-500 to-cyan-400`.
- **Mini bar columns** (Spending style): stacked vertical bars, tallest highlighted in blue gradient with glow, others muted `bg-[#1E2A3A]`. Category icon row below in muted circular chips.
- **Line/area charts**: remove gridlines, keep only baseline axis labels in `text-[#6B7280] text-[10px]`. Tooltip dot is a white-ringed blue circle with a callout pill showing the value.
- **Page background**: `#05070D` with a faint top-left blue radial gradient (`radial-gradient(circle at 0% 0%, rgba(59,130,246,0.08), transparent 60%)`).

## Admin side (`src/routes/portal.admin.tsx`)

Rebuild each widget to use a shared `<DashboardCard title actionHref>` shell instead of the current ad-hoc card markup. Widgets to restyle (no logic/data changes):

1. **KPI stat cards** (clients, active uploads, etc.) → hero-number layout with delta chip + tiny sparkline glow.
2. **Recent uploads / queue tables** → row layout matching Income Sources Breakdown: numbered `#`, label, value, percent chip + bar.
3. **Activity / volume chart** → Monthly Income Overview treatment: single glowing blue line, hovered point with `$value` callout, month labels only.
4. **Per-client breakdown** → Spending-card treatment: vertical bars with one highlighted column.
5. **Status / health widget** → Earnings half-gauge style (radial 180° arc, blue→gray, big % centered).
6. **AI insights / notes panel** → dark card with deep blue radial glow background, carousel dots, large quote-style copy, bottom-right arrow.

Top bar gets the reference's pill controls: `📅 This Month` selector (left) and `⬇ Export Report` (right) in matching `bg-[#111827] border-[#1E2A3A]` pills.

## Client side (`src/routes/portal.tsx` + `src/lib/dashboard-widgets.tsx`)

Already close — tighten to the exact same shell:

- Swap every widget card wrapper to the shared `<DashboardCard>` from above so admin/client are pixel-identical containers.
- Replace current header icon clutter with the single top-right `↗` arrow.
- Standardize the Net Margin / Revenue / Net Income stat cards to the hero-number + delta-chip pattern.
- Upgrade the period summary line chart to the glowing-line treatment.
- Reports page (`portal.reports.tsx`) period cards: same card shell, same stat typography.

## Reports page

Apply the reference's top-of-page layout: left `📅 This Month` pill (period selector) and right `⬇ Export Report` button. Period cards adopt the new shell + Net Margin styling already in place.

## Shared component

New file `src/components/portal/DashboardCard.tsx` exporting `DashboardCard`, `StatHero` (number + delta chip), `ProgressRow` (rank/label/value/percent+bar), `MiniBarColumns`, `HalfGauge`. Both sides import from this. Keeps the redesign DRY and guarantees parity.

## Out of scope

- No data, query, or business-logic changes.
- No sidebar restructuring (already matches reference after prior pass).
- No theme toggle — admin and client stay dark-only as established.
- No new widgets added; only existing ones restyled.

## Technical notes

- All colors added as Tailwind arbitrary values (no `styles.css` token churn) to keep the change surgical and reversible.
- Glow effects use absolutely-positioned blurred divs inside `relative overflow-hidden` cards — no new deps.
- Charts stay on existing Recharts setup; only `stroke`, `fill`, gradient `<defs>`, and tooltip components change.
