# Fix multi-tab QuickBooks extraction

## 1. Filter sheets before sending to AI (`src/routes/portal.admin.tsx`, `handleXlsxSelected`)

Replace the "send every sheet" loop with a filter + priority pass:

- **Skip** any sheet whose name (case-insensitive) contains: `gl`, `general ledger`, `detail`, `invoices`, `payments`, OR whose row count exceeds 600.
- **Priority sheets** (always include if present, sent first): names containing `is`, `income statement`, `p&l`, `pnl`, `profit and loss`, `bs`, `balance sheet`, `cash flow`, `ar`, `ap`, `aging`. Match `is`/`bs`/`ar`/`ap` as whole tokens (split on non-letters) so they don't false-match inside other words.
- Track whether any income-statement sheet was included → pass this to the review UI via component state (`incomeStatementDetected`).
- Increase per-extraction payload size from `180_000` → `400_000` chars (accuracy over cost, per user).
- If after filtering 0 sheets remain, fall back to sending the smallest sheets so we never send an empty payload.

## 2. Sharpen AI prompt (`src/lib/portal.functions.ts`, `extractFinancialsFromRows` system prompt)

Add explicit guidance:
- "Total for Income" row = `net_revenue`; "Net Income" or "Net Operating Income" row = `net_income`.
- When monthly columns are present, use the **Total** column for `net_revenue` and `net_income`; use the **most recent month** column for point-in-time balance-sheet values (cash, AR, AP).
- Keep `period_end` as the most recent month column header.

No schema or model change. (Model stays `google/gemini-2.5-pro`.)

## 3. Flag partial extraction in the review screen (`src/routes/portal.admin.tsx`, around line 793)

After the extracted rows, if `incomeStatementDetected && (extracted.net_revenue == null || extracted.net_income == null)`, render an amber warning banner:

> "Income statement detected but values not extracted — please verify manually."

State lives on the admin component alongside `extracted`; reset together with `setExtracted(null)`.

## Files touched
- `src/routes/portal.admin.tsx` — sheet filter, new `incomeStatementDetected` state, warning banner.
- `src/lib/portal.functions.ts` — prompt refinement only.

## Out of scope
No changes to the server function signature, schema, DB, or save flow.
