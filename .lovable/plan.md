## Fix charts + Last Upload to read from `periods`

The three timeline charts and the Last Upload Date stat aren't reflecting the 12 monthly rows that the new extractor writes to `public.periods`. Today the charts read from a merge of `dashboard_data` + `periods`, and Last Upload Date reads from the `documents` table's most recent upload — neither matches what the user wants.

### Changes

**`src/routes/portal.tsx` — `ClientDashboard` data load + widget context**

- Fetch periods with the same fields already needed by the charts, ordered ascending:
  ```ts
  supabase
    .from("periods")
    .select("period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap")
    .eq("client_id", effectiveId)
    .order("period_end", { ascending: true });
  ```
- Build `mergedRows` from periods rows directly (one normalized row per `period_end`, ascending). Keep `dashboard_data` only as a fallback source for `monthly_close` / `monthly_close_status` on the matching `period_end`, since those fields don't exist on `periods`. This removes the current behavior where a stale `dashboard_data` row could mask period values.
- Replace `lastUploadAt = docs[0]?.created_at` with the most recent `period_end` from periods:
  ```ts
  const lastUploadAt = periodsRows.length
    ? periodsRows[periodsRows.length - 1].period_end
    : null;
  ```
  (Periods are already sorted ascending, so the last entry is the most recent.)

**`src/lib/dashboard-widgets.tsx` — chart widgets**

- Chart widgets (`RevExpChart`, `CashFlowChart`, `ArApChart`) already iterate `ctx.rows`. No change needed beyond ensuring rows are populated from periods (done above). Verify each chart's `data` array length matches the number of periods (12 in the current data) so the "more data will appear…" placeholder no longer shows.
- `last_upload` widget already reads `ctx.lastUploadAt`. Update its `periodLabel` from `"Source file"` to `"Most recent period"` to reflect the new source.

### Verification

After the fix, with the existing 12 rows in `periods` for the test client (`afba6a7c-…`, period_ends Apr 2025 → Mar 2026):
- Revenue vs Expenses bar chart shows 12 month bars.
- Cash Flow line chart shows 12 points.
- AR vs AP line chart shows 12 points for each series.
- Last Upload Date shows "Mar 31, 2026".

No schema or backend changes; this is a frontend data-source fix.
