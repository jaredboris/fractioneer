Apply a global NeuroBank theme overhaul across both portals from a single source of truth (CSS tokens + shared classes), so every page changes together rather than page-by-page.

**1. Global background + tokens (src/styles.css)**

Set html, body to the deep gradient: `linear-gradient(135deg, #0A0F2E 0%, #070B1A 100%)`, fixed attachment.

Add a `.nb-app` content wrapper (applied in PortalShell) with `#0D1117` background + a subtle SVG grid overlay via `::before` (`rgba(100,130,255,0.07)` blue-tinted lines, 40px spacing, pointer-events:none).

Define tokens:

- `--nb-bg: #0D1117`
- `--nb-sidebar: #080C12`
- `--nb-card: #131929`
- `--nb-border: rgba(255,255,255,0.06)`
- `--nb-label: rgba(255,255,255,0.45)`
- `--nb-grid-line: rgba(100,130,255,0.07)`

Map shadcn tokens (`--background`, `--card`, `--border`, `--muted-foreground`, `--sidebar-*`) via `@theme inline` to the above so every shadcn component inherits the look without per-component edits.

---

**2. Unified card class (.nb-card)**

Rewrite `.nb-card` to be the canonical card: background `#131929`, border `1px solid rgba(255,255,255,0.06)`, border-radius 16px, no heavy shadow.

`.nb-label` utility: uppercase, 11px, tracking-wide, color `--nb-label`.

`.nb-value` utility: 28–32px, bold, white.

Remove the previous glow/shine pseudo-elements from `.nb-card` (they conflict with the flat spec) and keep them only on `.nb-card--insight`.

---

**3. AI Insights card (.nb-card--insight)**

Same base as `.nb-card` plus:

- `::before`: the grid texture, slightly stronger (`rgba(100,130,255,0.09)`, 32px spacing).
- `::after`: `radial-gradient(ellipse at 50% 120%, rgba(99,102,241,0.45) 0%, transparent 65%)` filling the card.
- Insight text container anchored to the bottom (mt-auto), large white type, sitting over the glow.

Update AiInsightsCard in `src/lib/dashboard-widgets.tsx` to use this class and bottom-anchored layout, keeping existing arrow nav + counter.

---

**4. Sidebar (src/components/portal/AdminSidebar.tsx + client nav in portal.tsx)**

Background `#080C12`, right border `--nb-border`.

Profile block wrapped in its own rounded card (`.nb-card` variant, smaller padding).

Nav items: plain text + icon; active state = soft `rgba(255,255,255,0.05)` bg + white text, no pill border.

Bottom CTA: blue→purple gradient pill (`linear-gradient(135deg,#3B82F6,#8B5CF6)`).

Apply to both admin sidebar and the client portal nav so they look identical.

---

**5. Charts (src/lib/dashboard-widgets.tsx)**

Chart container bg = card bg (transparent inside `.nb-card`).

Recharts CartesianGrid stroke = `rgba(100,130,255,0.07)`.

Bar charts: electric blue `#3B82F6` with `filter: drop-shadow(0 0 6px rgba(59,130,246,0.6))` and a vertical gradient fill (`#60A5FA → #1D4ED8`).

Line charts (CashFlowChart, ArApChart): use Recharts `<Area>` instead of `<Line>` with a `linearGradient` fill from `rgba(59,130,246,0.3)` at the top to `rgba(59,130,246,0)` at the bottom, plus the same drop-shadow on the stroke. This matches the filled glow-under-curve style visible throughout the NeuroBank references.

Apply via the existing ChartShell/RevExpChart/CashFlowChart/ArApChart so all charts on Cash Flow + Reports update at once.

---

**6. Stat cards parity**

Rebuild StatCard (client) and DarkStatCard (admin) to share one component reading from the new tokens: label (`.nb-label`), value (`.nb-value`), small delta chip, optional ArrowUpRight in top-right. Same markup on both sides.

---

---

**7. Apply globally, not page-by-page**

All edits are concentrated in:

- `src/styles.css` (tokens, `.nb-card`, `.nb-card--insight`, grid texture, sidebar tokens)
- `src/routes/portal.tsx` (shell wrapper class, client sidebar, dashboard layout fix, badge removal)
- `src/components/portal/AdminSidebar.tsx` (sidebar styling)
- `src/lib/dashboard-widgets.tsx` (StatCard, ChartShell, AiInsightsCard, chart colors)
- `src/routes/portal.admin.tsx`, `portal.reports.tsx`, `portal.cashflow.tsx`: only remove leftover hardcoded bg/border classes that override the new tokens (no structural changes).

Because shadcn tokens are remapped centrally, untouched pages inherit the new theme automatically.

---

**Out of scope**

No changes to data fetching, server functions, RLS, AI logic, or feature behavior. Pure visual + two specified bug fixes.