## What this changes

Two related fixes around the financial Excel upload.

### 1. Persist the uploaded source file

Today the admin upload parses the .xlsx in the browser, sends rows to AI, and discards the file. Nothing reaches Storage, so `periods.document_id` is always null and the Reports download button never appears.

**Upload flow change** (`src/routes/portal.admin.tsx → handleConfirmExtracted`):

After AI extraction succeeds and the admin clicks "Confirm save":
1. Upload the original `File` to `client-documents/{client_id}/source/{timestamp}-{filename}` via `supabase.storage`.
2. Call a new server function `saveExtractedFinancials` extension that also receives `{ file_name, file_path, file_size }`, inserts one row in `public.documents`, and stamps `periods.document_id` for every month in the upload.
3. Keep the file object in component state (`uploadedFile`) from `handleXlsxSelected` so it's available at confirm time.

**Server function update** (`src/lib/portal.functions.ts`):

Extend `saveExtractedFinancials` input with an optional `document: { file_name, file_path, file_size }`. Inside the handler:
- Insert into `public.documents` (returns `id`).
- Include `document_id` in every period upsert row.

No new bucket, no new table — `client-documents` and `documents` already exist with correct RLS. The bucket-side admin policy already gates inserts; client-side reads are gated by the existing `documents` row check.

**AI Insights card disclaimer** (`src/lib/dashboard-widgets.tsx`):

Replace the bare "AI-generated, may contain errors" line with the same text plus a "Download source file" link. The widget context already has `effectiveId`; the link queries the latest `documents` row for that client and triggers `supabase.storage.from("client-documents").createSignedUrl(path, 60, { download })`. Hidden when no document exists.

**Reports page**: no code change needed — it already reads `periods.documents(file_name, file_path)` and renders the Download button when present. It just hasn't been getting data because nothing was uploading.

### 2. Feed transaction-level data to AI Insights

Today `handleXlsxSelected` builds `rowsStr` after **dropping** any sheet whose name matches `gl / general ledger / detail / invoices / payments`. That string is what's passed to both `extractFinancialsFromRows` and `generateAiInsights`. So insights like "slowest paying customers" and "revenue concentration by customer" have no source data and are silently skipped.

**Fix**:
- Build a second blob, `insightsSourceRows`, that **keeps** the invoices/payments/AR-aging tabs (drops only the truly huge GL when `rows > MAX_ROWS`). Cap at 380KB (same as the model handler).
- Store this in `extractedSourceRows` instead of the extraction-narrowed string.
- The extraction call keeps using the narrow `rowsStr` (it only needs IS + BS for the period summary).
- `generateAiInsights` receives the wider blob, so payment-speed / concentration / overdue-AR-by-customer categories have real input. The existing advisory-language scrub and per-category dedupe stay.

No prompt changes — the system prompt already names the categories that need the source file rows.

## Technical detail

- New migration: none (schema already supports this).
- New server function: none — extend `saveExtractedFinancials` signature; add an optional `document` field validated by Zod.
- Storage path convention: `{client_id}/source/{ISO-timestamp}-{sanitized-filename}.xlsx`. Putting it under `{client_id}/…` keeps it inside the existing admin/client RLS folder check.
- `documents.file_path` is `UNIQUE` — using a timestamp prefix avoids collisions on re-upload of the same filename.
- AI Insights card: add a small `useEffect` (or inline `useQuery`) inside `AiInsightsCard` that fetches `select id, file_path, file_name from documents where client_id = effectiveId order by created_at desc limit 1` once on mount.

## Out of scope

- Replacing or de-duplicating existing documents for re-uploads (new upload = new file, old one stays).
- Showing a list of past uploads on the admin page.
- Streaming or progress UI for the storage upload step.
