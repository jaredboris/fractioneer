# Fix AI Insights on Reports + add admin backfill

## Problem
1. The Reports tab's AI Insights dropdown currently shows a "Generating insights for this period…" spinner when a period has none, implying live generation is happening. Even though no generation is triggered from Reports, the UX is misleading — and the user wants any path that *could* trigger on-demand generation from Reports removed.
2. There's no way to backfill insights for periods that were uploaded before insights generation was wired up (or where generation failed).

## Changes

### 1. `src/routes/portal.reports.tsx` (UI only)
- In `PeriodCard`, when `insights.length === 0` and the dropdown is open, replace the spinner + "Generating insights for this period…" with a static informational message:
  > *Insights were not generated for this period. Re-upload this period's financials from the admin portal to generate insights.*
- In the badge next to "AI Insights", change the `open ? "Generating" : "—"` fallback to always show `—` when there are zero insights (no "Generating" state anywhere).
- Keep the existing realtime subscription so that if insights *do* appear (via backfill or re-upload), the card updates live.

### 2. `src/lib/portal.functions.ts` (new server fn)
Add `generateInsightsForPeriod` — admin-only, like `generateAiInsights` but scoped to a single `period_end`:
- Input: `{ client_id: uuid, period_end: string }`
- Loads periods history (same query as today) for context, but stores results tagged to the **specified** `period_end` rather than the latest.
- Same Lovable AI Gateway call, same prompt, same ai_usage logging.
- Deletes any existing rows for `(client_id, period_end)` and inserts the new batch.

The existing `generateAiInsights` (tied to latest period) stays as-is for the normal post-upload flow.

### 3. `src/routes/portal.admin.tsx` (Clients tab — new button)
Add a single admin-only button **"Generate missing insights"** in the Clients tab header area (near the existing client list controls — alongside the search / add-client row).

Behavior:
- On click, query `periods` joined against `ai_insights` to find all `(client_id, period_end)` pairs where no insight rows exist yet (across all clients).
- Show a small inline progress panel: `Generating insights — {n} of {total} ({clientName} · {period_end})` plus a progress bar.
- Iterate sequentially, awaiting each `generateInsightsForPeriod` call. Catch errors per-period, count failures, continue.
- On completion: show summary `Generated insights for X periods. Y failed.` Auto-dismiss after a few seconds or on next click.
- Disable the button while running. No parallelism (avoids rate limits + matches "won't time out" requirement).

No changes to RLS, schema, or other tabs.

## Out of scope
- No changes to the post-upload insights flow.
- No changes to widgets, dashboards, or the admin spy mode.
- No schema changes (uses existing `ai_insights` + `periods` tables).
