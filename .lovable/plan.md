# Portal feature additions

Six new features plus one bug fix. Schema changes batched into a single migration; UI changes scoped to the portal routes.

## 1. Beta banner

- New `src/components/portal/BetaBanner.tsx`: thin bar, dark navy (`bg-[#0F1A2E]` / `border-[#1E2A3A]`), small slate-300 text, info icon, non-dismissable. Copy verbatim: *"Fractioneer Portal is currently in beta. Some figures may contain errors — your team reviews all data before it's shared."*
- Render at the top of every portal page by mounting it in the portal sidebar layout shell (above the existing `ImpersonationBanner`) so every `/portal/*` route inherits it. Login/2FA routes excluded.

## 2. Empty onboarding state on dashboard

- In `src/routes/portal.tsx`, when the signed-in (non-admin) client has zero `periods` rows visible to them, replace the entire stat/widget grid with a centered card: heading "Your dashboard is being prepared", body "Your financials are being prepared by your Fractioneer team. You'll be notified when your dashboard is ready." Dark theme card matching existing widget surface; no chart shells, no `—` stat cards. Period selector hidden in this state. Notes/AI Insights cards also hidden until first published period exists.

## 3. Admin approve & publish flow

Schema (one migration):
- Add `periods.status text not null default 'pending_review'` with check `status in ('pending_review','published')`.
- Add `periods.published_at timestamptz null` and `periods.published_by uuid null references auth.users`.
- Backfill existing rows to `status='published', published_at=created_at` so current clients don't lose visibility.
- Update the "Clients view own periods" RLS policy to also require `status = 'published'`. Admins still see all.

Server / UI:
- `portal.functions.ts` extraction confirm path: insert new period as `pending_review` (default). Add a new `approvePeriod({ periodId })` server fn (admin + aal2 guard) that sets status='published', published_at=now(), published_by=auth.uid().
- `portal.admin.tsx`: in the client detail / periods list, render a "Pending review" pill on `pending_review` rows and an "Approve & Publish" button that calls `approvePeriod` and invalidates queries. Sort pending to top.
- Client-facing: in `portal.tsx` and `portal.reports.tsx`, on each period card show a small slate badge "Reviewed by your Fractioneer team" (no AI-extraction disclaimer). Because RLS hides unpublished rows, no extra client filtering is needed.

## 4. Urgent team alerts

Schema (same migration):
- `client_alerts(id uuid pk, client_id uuid fk profiles on delete cascade, message text not null, created_by uuid, created_at, cleared_at timestamptz null)`.
- GRANTs to `authenticated` + `service_role`. RLS: client SELECTs own where `cleared_at is null`; admins full access.

Server fns: `getActiveAlert(clientId)`, `postAlert({ clientId, message })`, `clearAlert({ alertId })` — admin-only for writes.

UI:
- `portal.admin.tsx` client detail: textarea + "Post alert" button; if an active alert exists, show it with "Clear" button.
- `portal.tsx` (client dashboard): if active alert, render a prominent highlighted callout (amber-tinted but on dark surface, not warning red) directly above the stat cards row, below the beta banner. Single line + timestamp.

## 5. Documents tab — admin file sharing

Schema (same migration):
- `shared_documents(id, client_id fk profiles, file_name text, file_path text, mime_type text, size_bytes bigint, uploaded_by uuid, created_at)`.
- GRANTs + RLS: clients SELECT own; admins full access.
- Reuse existing `client-documents` storage bucket under a `shared/{client_id}/...` prefix; add bucket RLS policies for client read of own prefix and admin write/read.

UI:
- `portal.admin.tsx` client detail: new "Shared files" section with file picker uploading to storage + inserting `shared_documents` row, plus list with delete.
- `portal.documents.tsx` (client): rewrite list to read `shared_documents` only — filename, formatted upload date, Download button (signed URL). Remove the existing Excel-source listing.
- Admin period slide-out keeps its existing source-Excel download path; nothing changes there.

## 6. Inactivity session timeout (8h)

- New `src/lib/session-timeout.ts`: on app load read `localStorage["fr_last_active"]`; if `now - last > 8h`, call `supabase.auth.signOut()` and `router.navigate({ to: "/portal/login" })` before rendering portal content. Otherwise install listeners (`click`, `keydown`, `visibilitychange`, route change) that throttle-write the timestamp every ~30s.
- Mount inside the portal layout (same shell as the beta banner) so it runs for every `/portal/*` route but not marketing pages. The existing 2FA flow on login enforces fresh credentials + 2FA naturally.

## Bug fix — Gross Margin shows "—"

Root cause confirmed via DB inspection: `periods.gross_margin` is `NULL` for every existing row — `fmtPercent` is correct, the column is genuinely empty because the extraction step never populated it. Fix:
- Update the Anthropic extraction prompt in `portal.functions.ts` to require `gross_margin` as a decimal (0–1) whenever revenue and COGS are present in the source, and to compute it from `(revenue - cogs)/revenue` when both line items exist.
- Add a one-time admin "Recompute gross margin" action on the admin client detail that runs a server fn to fill `gross_margin` for existing periods where the source file is still attached (re-parse path), so historical periods backfill without re-uploading.
- No frontend change to `portal.reports.tsx` is needed beyond verifying the formatter; once values populate, the card renders correctly.

## Files touched

- New: `src/components/portal/BetaBanner.tsx`, `src/components/portal/UrgentAlert.tsx`, `src/lib/session-timeout.ts`, one Supabase migration.
- Edited: `src/components/portal/PortalSidebar.tsx` (or the portal layout route) to mount banner + timeout, `src/routes/portal.tsx`, `src/routes/portal.admin.tsx`, `src/routes/portal.documents.tsx`, `src/routes/portal.reports.tsx`, `src/lib/portal.functions.ts`.

## Out of scope

- No changes to marketing routes, auth flows beyond timeout-triggered sign-out, or Cash Flow tab.
