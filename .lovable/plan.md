Most of this restructure already shipped in the previous turn (Reports per-period cards with AI Insights accordion, Cash Flow page with date range + 3 charts, dashboard stripped to stats + insights, per-period `ai_insights` persistence). The one piece missing from the current build is the **period selector on the dashboard** — today the dashboard always shows the most recent period only.

This plan adds that selector and rewires the locked stat cards + AI Insights card to follow it.

## 1. Dashboard period selector (`src/routes/portal.tsx`)

Add a segmented control / dropdown at the top of the dashboard (right side of the page header, beside Manage Widgets) that lists every `periods.period_end` for the client, newest first. Default selection = most recent period. State lives in the page component (`selectedPeriodEnd`, `useState<string | null>`), initialised to the latest period once data loads.

When the user switches periods:
- The 4 locked stat cards (Monthly Close, Cash Position, AR, AP) re-read from the matching `periods` row for that `period_end` instead of from the cached "latest" `dashboard_data` snapshot.
- Optional secondary stat widgets (Net Income, Gross Margin, Working Capital, Total Expenses, Net Revenue, Last Upload) also read from that same `periods` row.
- The AI Insights card filters `ai_insights` to rows where `period_end = selectedPeriodEnd`.

Monthly Close stays as the selected period's `period_end` formatted as month-year. Last Upload still reflects the document attached to that period (`periods.document_id → documents.created_at`), not the global newest upload.

## 2. Data fetching changes

Currently the dashboard relies on a single `dashboard_data` row plus the latest-period `ai_insights` filter. Update the loader:
- Fetch `periods` list for the client: `id, period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap, total_expenses, working_capital, document_id, documents(file_name, created_at)` ordered by `period_end desc`. (Add only the columns not already selected.)
- Fetch all `ai_insights` rows for the client (already keyed by `period_end`).
- Derive the displayed stat values + insights from `selectedPeriodEnd` in a `useMemo` instead of from a single row.

`dashboard_data` is no longer used as the source of truth for the stat cards on the dashboard; the per-period `periods` row is. Other pages that still use `dashboard_data` are untouched.

## 3. Widget plumbing (`src/lib/dashboard-widgets.tsx`)

The widget render functions currently receive a `dashboard_data`-shaped object. Change the shape they receive to a normalized "period view" (same field names, but sourced from a `periods` row). This is an internal rename — the widget catalog (locked + optional stat IDs) stays as-is from the previous turn. `AiInsightsCard` accepts the already-filtered insight list for the selected period instead of doing its own "latest period" filter.

## 4. UI placement

```text
┌─────────────────────────────────────────────────────────┐
│ Dashboard           [ Period ▾ Nov 2025 ]  [Manage…]    │
├─────────────────────────────────────────────────────────┤
│ [Monthly Close] [Cash] [AR] [AP]      ← locked row      │
│ [optional stat] [optional stat] …      ← draggable      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ AI Insights — Nov 2025                              │ │
│ │ • …                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

Same NeuroBank dark styling, same glow, same card sizing. Selector uses a small dark `<select>` styled to match other dark controls (or a Radix dropdown if one is already in use on this page).

## Files touched

- `src/routes/portal.tsx` — add selector state, switch data source from `dashboard_data` to `periods[]`, pass per-period values + filtered insights to widgets.
- `src/lib/dashboard-widgets.tsx` — rename the prop shape consumed by stat widgets to a `PeriodView`; update `AiInsightsCard` to accept a pre-filtered insight list.

No schema changes, no Reports/Cash Flow changes, no sidebar changes, no auth changes.
