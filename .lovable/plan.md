### 1. Reports tab — insights empty message
In `src/routes/portal.reports.tsx` (~line 254), replace the current message with exactly: **"Insights are not available for this period."** No mention of admin/re-upload.

### 2. Fix gross_margin extraction prompt (new uploads only)
In `src/lib/portal.functions.ts` (~line 188), the extraction prompt currently says "Compute it from (Total Revenue - Total Cost of Goods Sold) / Total Revenue" — but evidence shows the model is returning net profit margin. Tighten the prompt to:
- Pull the **Gross Profit** line directly from the income statement (rows labeled "Gross Profit", "Total Gross Profit", or "Gross Margin"), divided by total revenue for that month.
- Fallback only if no Gross Profit row exists: compute as (Total Revenue − Total COGS) / Total Revenue.
- Explicitly forbid using Net Income / Net Operating Income in this calculation.
- Return null if neither Gross Profit nor a COGS row is present.

No DB migration, no backfill — existing rows untouched.

### 3. Replace Gross Margin → Net Margin in client UI
Net margin = `net_income / net_revenue * 100`. Calculated on the fly from existing fields; no schema change.

**a. `src/lib/dashboard-widgets.tsx`** (dashboard stat card):
- Rename widget `id: "gross_margin"` → `id: "net_margin"`, label "Net Margin".
- Replace `computeGrossMargin` with `computeNetMargin(r)` = `r.net_income / r.net_revenue * 100` when both present and revenue ≠ 0.
- Update the widget id in the default-order array (line 303) accordingly.
- Note: the `NormalizedRow.gross_margin` field and DB column remain — only the displayed metric changes.

**b. `src/routes/portal.reports.tsx`** (period cards, ~line 213):
- Replace `<Stat label="Gross Margin" value={fmtPercent(period.gross_margin)} />` with a Net Margin stat computed inline from `period.net_income / period.net_revenue`.

**c. `src/routes/portal.tsx`** (~line 1289 dashboard fallback):
- Update the latest-value lookup to compute net margin from net_income/net_revenue instead of reading `gross_margin`.

### Out of scope
- Admin portal (`portal.admin.tsx`) — keeps Gross Margin label since it's internal.
- No DB migration, no backfill of existing periods.
- AI insights generation logic unchanged (only the empty-state message).
