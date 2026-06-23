# Five Fixes

## 1. Empty charts — diagnose then fix

The same `periodsRows` array feeds both the stat cards (which work) and the three charts. Three likely culprits:

- RLS on `periods` requires `is_aal2()` — if the viewing client hasn't passed 2FA, `SELECT` returns 0 rows silently. Stat cards would also show "—".
- `mergeRows` keyed by `period_end` may collide with a `dashboard_data.period` of different format, dropping rows.
- `ChartShell` shows the placeholder when `data.length <= 1`, so a single-row dataset looks identical to "empty".

### Changes (`src/lib/dashboard-widgets.tsx`, `src/routes/portal.tsx`)

- In `ClientDashboard.loadAll`, after the four parallel queries, `console.info("[dashboard] periods", pers?.length, "dashboard_data", dash?.length, "insights", insights?.length, "for", effectiveId)` plus the first row of each. Temporary; clearly labeled.
- In each chart component (`RevExpChart`, `CashFlowChart`, `ArApChart`), `console.info("[chart:<name>] rows", ctx.rows.length, "non-null period rows", data.length)` once per render.
- Distinguish "no data" from "one period" in `ChartShell`: keep the placeholder only when `empty`; when `sparse`, render the chart anyway (a single point/bar is informative, not broken). Update the three callers to drop the `sparse` placeholder branch.
- If the diagnostic shows `pers` = 0 while stat cards do show numbers, the bug is RLS/aal2 and we'll widen the SELECT policy (drop `is_aal2()` from the client read, keep it on admin writes) — but only after the log confirms.  
  
On the RLS fix in step 1: do NOT simply drop is_aal2() from the periods read policy, since that reopens the security hole where a pre-2FA token could read financial data. Instead, first confirm whether the viewing session has actually reached aal2. If the session IS aal2 but the read still fails, the policy logic is wrong and should be corrected. If the session is NOT reaching aal2 when it should be, fix the session elevation instead. Only widen the policy as a last resort, and if you do, apply the same aal2 read requirement consistently to BOTH periods and dashboard_data so the two tables have matching security — right now dashboard_data appears to lack the aal2 requirement, which is itself an inconsistency to flag.
- Remove the diagnostic logs in the same pass after the fix is verified.

## 2. AI Insights card — readable, no auto-advance

`src/lib/dashboard-widgets.tsx` `AiInsightsCard`:

- Delete the `setInterval` auto-advance effect.
- Keep the one-at-a-time layout and dark styling, but add large left/right arrow buttons (lucide `ChevronLeft`/`ChevronRight`) flanking the insight text, disabled at the ends, with `aria-label`s. Keep the dots as a position indicator, still clickable.
- Show `Insight {idx+1} of {insights.length}` as a small counter next to the dots.

## 3. Generate insights in the background

`src/routes/portal.admin.tsx` `handleConfirmExtracted` already fires `generateAiInsights` without awaiting. Tighten the UX:

- Immediately after `saveExtractedFinancials` resolves, set a success status ("Saved. Insights generating in the background.") and clear the extraction state so the upload screen returns to idle — already happens; verify no `await` blocks here.
- Add a `generatingInsights` boolean on `ClientDashboard` and listen via the existing `ai_insights` realtime channel: when `count == 0` for this client and a recent confirm just happened, show a subtle "Generating insights…" shimmer inside `AiInsightsCard`. Pass `generating?: boolean` through `WidgetContext` (new optional field). Source the flag from a lightweight `ai_usage` poll (most recent `created_at` for `operation='generate_ai_insights'` within last 2 minutes and no insights yet), or simpler: set it locally when the admin confirms (broadcast via Supabase channel `ai_insights:<client>` `system` event). Use the latter for simplicity.
- `AiInsightsCard` renders the shimmer when `ctx.generating && insights.length === 0`.

## 4. Extraction progress sequence

`src/routes/portal.admin.tsx` `handleXlsxSelected`:

- Replace the boolean `analyzing` with a `phase` state: `"reading" | "extracting" | "finalizing" | null`.
- Set `"reading"` before `XLSX.read`, `"extracting"` before `extractFinancialsFromRows`, `"finalizing"` before the existing-rows lookup, then `null`.
- Render a three-step indicator (checkmark / spinner / dim) in the upload panel that replaces the bare spinner. Labels: "Reading sheets…", "Extracting monthly figures…", "Almost done".
- True streaming of month rows requires changing `extractFinancialsFromRows` to a streaming server function, which is a larger refactor — out of scope; the labeled phases are the deliverable here.

## 5. Clickable AI Spend card with breakdown

`ai_usage` already has an `operation` column (`extract_financials`, `save_extracted_financials`, `generate_ai_insights`) — no migration needed.

`src/routes/portal.tsx` admin dashboard:

- Wrap the "AI spend (month)" `DarkStatCard` in a `<button>` that opens a new `AiSpendDetailDialog` (shadcn `Dialog`).
- Dialog content (single query: `ai_usage` for the current month, joined client labels from existing profile/lead lookup already in scope):
  - **By operation**: table of `operation` → count, total cost. Bucket `extract_financials` + `save_extracted_financials` together as "Extraction"; `generate_ai_insights` as "Insights".
  - **By client**: table of client name → count, total cost (sorted desc by cost).
  - **Recent activity**: chronological list (newest first, last 50) of `created_at`, client, operation bucket, cost.
- Keep the existing `aiSpendThisMonth` query; add a second `ai_usage` fetch (full rows for the current month) that fires only when the dialog opens.

## Technical notes

- No new migrations required; `ai_usage.operation` already exists.
- Diagnostic `console.info` logs in step 1 are explicitly temporary and will be removed once the root cause is confirmed and fixed.
- All chart fixes stay inside `src/lib/dashboard-widgets.tsx`; client data loading stays in `src/routes/portal.tsx`.
- The "Generating insights…" signal uses Supabase realtime broadcast (no schema change) to avoid polling.

## Out of scope

- True per-row streaming during extraction (would require switching the server function to a streaming response).
- Per-client AI cost budgets or alerts.
- Backfilling `operation` labels on historic `ai_usage` rows (already correctly labeled in current data).