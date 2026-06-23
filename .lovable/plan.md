# Restructure dashboard, Reports, and Cash Flow + per-period AI Insights

Three-page restructure plus a schema change so AI Insights are stored per period and never overwritten.

## 1. Schema change — per-period AI Insights

Add `period_end DATE` to `public.ai_insights` (nullable for backfill safety, but always written going forward) and a unique key on `(client_id, period_end, category)` so re-generation for the same period updates in place instead of stacking duplicates.

```text
ai_insights
  + period_end  date           -- which uploaded period this insight describes
  + unique (client_id, period_end, category)
  + index (client_id, period_end desc)
```

Existing rows get backfilled to the latest `periods.period_end` per client so they don't disappear from the dashboard after the migration. Realtime publication already includes the table — no change needed.

## 2. Generation flow — stop wiping history

`generateAiInsights` in `src/lib/portal.functions.ts` currently does `DELETE … WHERE client_id = X` then re-inserts. Replace that with:

- Look up the most recent `periods.period_end` for the client at generation time (or accept an explicit `period_end` arg from the admin caller).
- Delete only rows matching `(client_id, period_end)` — that period's previous run — then insert the fresh set with `period_end` populated.
- Older periods' insights are preserved permanently.

The admin trigger in `portal.admin.tsx` keeps working unchanged; new uploads naturally generate insights tied to the new `period_end`.

## 3. Dashboard page (`src/routes/portal.tsx`) — pulse check only

Strip the dashboard down:

- **Locked stat row (always visible, in order):** Monthly Close, Cash Position, AR, AP. These 4 cards span the full width, 4-up on desktop. All values come from the most recent `dashboard_data` row.
- **AI Insights card** — full width, directly below. Queries `ai_insights` filtered to the latest `period_end` only (server-side: `order period_end desc limit 1`, then filter that period's rows). Same NeuroBank dark styling as today.
- **Nothing else on this page.** Remove Period Summary, Revenue vs Expenses, Cash Flow Over Time, AR vs AP, and the AR vs AP stat widget from the dashboard.

**Manage Widgets / Add Widget** stay, but the catalog of *optional* widgets is restricted to secondary stat cards: Net Income, Gross Margin, Working Capital, Total Expenses, Net Revenue, Last Upload. Chart widgets (`chart_rev_exp`, `chart_cash_flow`, `chart_ar_ap`) are removed from `WIDGET_CATALOG` in `src/lib/dashboard-widgets.tsx`. A small data migration removes those chart IDs from any saved `widget_prefs.widget_ids` arrays so users don't see broken slots.

Locked IDs become: `monthly_close`, `cash_position`, `ar`, `ap`, `ai_insights`. Layout: locked stats row → optional stat widgets (still 4-up, draggable) → AI Insights wide card pinned last.

## 4. Reports page (`src/routes/portal.reports.tsx`) — period by period

Each existing period card gains:

- The metrics already shown (Net Revenue, Net Income, Gross Margin) **plus** Cash, AR, AP pulled from the same `periods` row.
- The existing Excel download button.
- A new expandable **"AI Insights"** section (collapsible accordion, collapsed by default) that fetches `ai_insights` rows for `(client_id, period_end)` of that card. Renders each insight with its category badge, matching the dashboard's insight styling.
- If no rows exist yet for that period, show a subtle "Generating…" state with a spinner. A lightweight realtime subscription on `ai_insights` filtered by `client_id` swaps in the insights when they land.

Newest period first, same grid as today.

## 5. Cash Flow page (`src/routes/portal.cashflow.tsx`) — charts + date filter

Rebuild as a focused analytics page:

- **Date range selector** at the top. Default: last 12 months ending at the most recent `period_end`. Presets: 3M / 6M / 12M / All. (Simple preset buttons — no custom date picker needed for v1.)
- Three stacked chart cards, all filtered by the selected range:
  1. **Revenue vs Expenses** — bar chart (move the dashboard's `RevExpChart` logic here, but using `periods` rows directly so it works across the full history, not just the cached `dashboard_data` snapshot).
  2. **Cash Flow Over Time** — line chart (replaces the current "Cash balance over time" card).
  3. **AR vs AP Over Time** — line chart (replaces the current "AR & AP trends" card).
- Nothing else on the page.

The page already reads `periods`; extend the select to include `net_revenue` and expense-derivable fields, and the filter is just an in-memory slice of the array.

## 6. Cleanup

- Remove `chart_rev_exp`, `chart_cash_flow`, `chart_ar_ap`, and the `period_summary` / AR-vs-AP wide widgets from `WIDGET_CATALOG`. Keep their render functions only where reused by Cash Flow / Reports — otherwise delete.
- Update `LOCKED_IDS` and `DEFAULT_IDS` derivation accordingly.
- Drop the bento `grid-cols-12` chart branch in `portal.tsx` since charts no longer appear there; the dashboard reverts to a simple stats grid + full-width insights card.
- Sidebar nav unchanged.

## Technical notes

- Files touched:
  - `supabase/migrations/<new>.sql` — add column, unique index, backfill.
  - `src/lib/portal.functions.ts` — `generateAiInsights` writes `period_end`, scoped delete.
  - `src/lib/dashboard-widgets.tsx` — trim catalog, lock the 4 stats, update `AiInsightsCard` to query latest `period_end`.
  - `src/routes/portal.tsx` — strip to stats + insights.
  - `src/routes/portal.reports.tsx` — add Cash/AR/AP, per-period insights accordion, realtime subscription.
  - `src/routes/portal.cashflow.tsx` — date range + 3 charts.
  - `src/routes/portal.admin.tsx` — no logic change; verify the existing insight-generation trigger still calls the updated server fn correctly.
- Types regenerate after the migration runs, so code that reads `ai_insights.period_end` lands after approval.
- No changes to auth, RLS shape, or sidebar.
