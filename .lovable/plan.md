# Multi-month extraction with upsert-by-period

The `periods` table already has `UNIQUE (client_id, period_end)` — no migration needed. The work is in the extraction server function, the save server function, and the admin review UI.

## 1. Server: return an array of monthly rows (`src/lib/portal.functions.ts`)

Replace `ExtractedFinancials` shape with:

```ts
ExtractedMonth = {
  period_end: "YYYY-MM-DD",        // last day of the month column
  cash_balance, total_ar, total_ap, // point-in-time as of that month
  net_revenue, net_income,          // that month's value (NOT cumulative)
  monthly_close_status: "open" | "closed" | null,
}
ExtractedPayload = { months: ExtractedMonth[] }
```

Rewrite the system prompt for `extractFinancialsFromRows`:
- Identify every monthly column on the Income Statement and Balance Sheet (e.g. Apr 2025, May 2025, …). Ignore "Total" / YTD columns — those are derived and not returned as a month.
- For each month column emit one record:
  - `net_revenue`, `net_income`: that month's value from the "Total for Income" and "Net Income" / "Net Operating Income" rows.
  - `cash_balance`, `total_ar`, `total_ap`: point-in-time from the Balance Sheet for that same month column (null if BS has no matching column).
  - `monthly_close_status`: same value for every month, derived from the statement.
- A single-month export → 1 record. A 12-month export → 12 records, sorted ascending by `period_end`.
- Return raw JSON `{ "months": [...] }`.

`saveExtractedFinancials`:
- New input: `{ client_id, months: ExtractedMonth[] }`.
- For each month, upsert into `periods` on conflict `(client_id, period_end)` — overwrites existing row with new values (most-recent-upload-wins).
- Also upsert `dashboard_data` using the **latest month** (max `period_end`) so the client dashboard still reflects current state.
- Keep the AI-spend `ai_usage` log entry (one per save, not per month).

## 2. Admin UI: per-month review table with conflict detection (`src/routes/portal.admin.tsx`)

State:
- Replace `extracted: ExtractedFinancials | null` with `extractedMonths: ExtractedMonth[] | null`.
- Add `existingByPeriod: Record<string, PeriodRow>` populated after a successful extraction by querying `periods` for the selected client where `period_end IN (extracted months)`.

After `extractFinancialsFromRows` returns:
- Sort `months` ascending.
- Query existing rows: `supabase.from("periods").select("period_end, cash_balance, total_ar, total_ap, net_revenue, net_income").eq("client_id", selectedId).in("period_end", monthsList)`.
- Build the conflict map: for each extracted month, compare the 5 numeric fields to the existing row (treat null == null as equal, compare numbers with a small epsilon e.g. `Math.abs(a - b) < 0.005`).

Render in place of the current `<dl>`:
- Compact table, one row per month, columns: Period · Net revenue · Net income · Cash · AR · AP · Status.
- A row with no existing data renders normally.
- A row whose new values match existing exactly renders normally with a subtle "unchanged" badge.
- A **conflicting** row is highlighted (amber border / amber tinted bg, matching existing dark-theme tokens used elsewhere — `border-amber-500/30 bg-amber-500/5`). Each conflicting numeric cell shows `existing → new` stacked (existing struck-through in muted, new in foreground). Above the table, when any conflicts exist, render the amber note: *"One or more months already have data — confirming will overwrite the existing values."*
- Keep the existing "Income statement detected but values not extracted" banner; trigger it when `incomeStatementDetected && months.every((m) => m.net_revenue == null && m.net_income == null)`.

Confirm button calls the new `saveExtractedFinancials({ data: { client_id, months } })`. Discard / post-save reset clears `extractedMonths` and `existingByPeriod`.

Keep current summary-sheet filtering (`SKIP_SUBSTR`, `PRIORITY_*`, 600-row cap, 400k char cap) and all existing dark-theme styling.

## Files touched

- `src/lib/portal.functions.ts` — new schema, prompt, save handler signature.
- `src/routes/portal.admin.tsx` — state shape, post-extract conflict fetch, per-month review table.

## Out of scope

- No DB migration (unique constraint already present).
- No changes to dashboard read paths — `dashboard_data` still holds the latest month and the client dashboard continues to read it unchanged.
