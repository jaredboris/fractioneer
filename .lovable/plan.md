## Reporting Periods table redesign (admin → Clients tab)

All in `src/routes/portal.admin.tsx`, no schema changes.

### Removed

- The `<form onSubmit={handleSavePeriod}>` manual-entry grid above the table (lines ~799-830) and its supporting state: `periodForm`, `setPeriodForm`, `savingPeriod`, `handleSavePeriod`, `parseNum` (still used here only).
- The per-row `Trash2` button and `handleDeletePeriod`'s `confirm()`-based flow (replaced by the modal's stronger confirm).
- Subtitle wording about "Use one row per period end date" — replaced with "Uploaded via the Upload tab. Click a row to view, re-upload, or delete."

### Table rows become clickable

Each `<tr>` gets `onClick={() => setOpenPeriod(p)}`, `role="button"`, hover styles, and a focus ring. Trailing chevron icon in a new last column hints at the drill-in. The GM column now renders the computed margin (see below).

### Slide-out detail panel

New `<PeriodDetailDialog>` rendered inside the same section. Built on the existing shadcn `Sheet` component (already in the project — same dark theme as everything else). Shows when `openPeriod` is set.

Contents:
- Header: "Period ending {fmtDate(p.period_end)}".
- Definition list of every stored field: Net revenue, Net income, Gross margin (computed), Cash balance, Total AR, Total AP, all currency-formatted with `Intl.NumberFormat`.
- Source file row: if `p.document_id`, show the linked file name with a download button (signed URL via `client-documents` bucket, same pattern as Reports page). If null, show "No source file linked".
- Footer with two buttons:
  - **Re-upload** (secondary): closes the panel, switches `tab` to `"upload"`, sets a new `prefillPeriodEnd` state, and the existing Upload card pre-fills the date and shows a small "Re-uploading {period_end} — new data will overwrite this row" banner. The actual file-pick flow is unchanged; `saveExtractedFinancials` already upserts by `(client_id, period_end)` so re-upload simply replaces. No new server function.
  - **Delete period** (destructive red, `bg-destructive`): triggers an inline two-step confirm inside the panel — replaces the buttons with the warning copy verbatim:

    > This will permanently remove **{fmtDate(p.period_end)}** data from the client dashboard and charts. This cannot be undone.

    plus a "Cancel" button and a final red **"Delete permanently"** button. Only the second click runs `supabase.from("periods").delete().eq("id", p.id)`, reloads, and closes the panel. No native `confirm()`.

### Gross margin column fix

`periods` has `net_revenue` and `net_income` but no `total_expenses` column. The requested formula `(net_revenue - total_expenses) / net_revenue` is algebraically `net_income / net_revenue`, so compute it client-side from the two values we already have:

```ts
const gm = p.net_revenue && p.net_revenue !== 0
  ? (p.net_income ?? 0) / p.net_revenue
  : null;
```

Format as `%` with one decimal (`42.3%`), em-dash when null or revenue is zero. Applies to both the table cell and the detail panel. The stored `gross_margin` column is left untouched (other places like Reports still read it; that's a separate concern).

### Sort order

Already `order("period_end", { ascending: false })` — kept as-is.

## Technical detail

- New state: `openPeriod: PeriodRow | null`, `confirmingDelete: boolean`, `deleting: boolean`, `prefillPeriodEnd: string | null`.
- Re-upload prefill is consumed in `handleXlsxSelected` to scope the existing-period existence check; it doesn't restrict which months the user actually uploads (extraction still returns whatever is in the file).
- Unused imports (`Plus`) cleaned up; `Trash2` kept (Documents list still uses it).

## Out of scope

- Editing field values inside the panel (data is upload-driven).
- Backfilling `periods.gross_margin` or adding a `total_expenses` column.
- Bulk delete or multi-select.
