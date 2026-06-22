## Goal
Add (1) mandatory TOTP 2FA for all portal users and (2) an admin-only Excel→AI→dashboard upload flow.

---

## Part 1 — TOTP 2FA (Supabase MFA)

Apply to admin + client users. Gate every `/portal/*` route behind enrollment + verification.

**New routes**
- `src/routes/portal.setup-2fa.tsx` — enroll via `supabase.auth.mfa.enroll({ factorType: 'totp' })`, render QR (svg from `totp.qr_code`) + plain-text secret, verify with `challengeAndVerify()`.
- `src/routes/portal.verify-2fa.tsx` — prompts 6-digit code per session; calls `challengeAndVerify()` against the existing factor.

**Gate logic (in `portal.tsx` `beforeLoad`)**
After auth check, call `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`:
- `currentLevel === 'aal1' && nextLevel === 'aal1'` → no factor → redirect `/portal/setup-2fa`
- `currentLevel === 'aal1' && nextLevel === 'aal2'` → enrolled but not verified this session → redirect `/portal/verify-2fa`
- `aal2` → allow through

Setup/verify routes themselves bypass the gate (check `location.pathname`).

**Login flow**: existing `portal.login.tsx` already redirects to `/portal` — the gate handles routing onward. No changes needed there beyond letting the gate run.

---

## Part 2 — Admin Excel Upload + AI Extraction

**Migration** — extend `dashboard_data` with dedicated columns:
```sql
ALTER TABLE public.dashboard_data
  ADD COLUMN cash_balance numeric,
  ADD COLUMN total_ar numeric,
  ADD COLUMN total_ap numeric,
  ADD COLUMN net_revenue numeric,
  ADD COLUMN monthly_close_status text,
  ADD COLUMN period date;
```
(Existing text columns stay for back-compat; admin form keeps working.)

**Dependency**: `bun add xlsx`

**Server function** `extractFinancialsFromRows` in `src/lib/portal.functions.ts`:
- Admin-only (re-checks `has_role`).
- Input: `{ rows: string }` (JSON-stringified rows, capped length).
- Calls Lovable AI Gateway via `@ai-sdk/openai-compatible` using `google/gemini-2.5-pro` with `Output.object` schema `{ cash_balance, total_ar, total_ap, net_revenue, monthly_close_status }` (all nullable).
- Returns the structured object.

**Server function** `saveExtractedFinancials`:
- Admin-only.
- Input: `{ client_id, cash_balance?, total_ar?, total_ap?, net_revenue?, monthly_close_status?, period }`.
- Upsert into `dashboard_data` by `client_id`.

**Helper file** `src/lib/ai-gateway.server.ts` — provider helper per `ai-sdk-lovable-gateway` knowledge.

**UI** — new "Upload Client Financials" section in `src/routes/portal.admin.tsx`:
1. Reuses existing client dropdown (or its own).
2. File input (`.xlsx`); parses first sheet via `XLSX.utils.sheet_to_json` client-side.
3. "Analyze" → calls `extractFinancialsFromRows`.
4. Shows preview table of extracted values; null fields flagged in red ("Not found in spreadsheet").
5. "Confirm & Save" → calls `saveExtractedFinancials`; success toast.

Styled to match existing card/border/button classes already in `portal.admin.tsx`.

---

## Technical notes
- `LOVABLE_API_KEY` already provisioned — no secret prompt needed.
- TanStack: setup/verify pages use `ssr: false` like `portal.tsx`; `supabase.auth.mfa.*` runs in the browser.
- `getAuthenticatorAssuranceLevel()` is sync-ish from local session — fast enough to call in `beforeLoad`.
- xlsx parsing is client-side, so the file never hits storage; only the parsed JSON goes to the server fn.
- Existing admin dashboard editor remains untouched; new columns surface in the upload preview only (admin can still hand-edit the legacy text fields).

## Out of scope
- Recovery codes / backup factors (Supabase MFA supports only TOTP factors; not requested).
- Unenroll UI.
- Editing the new numeric columns in the existing dashboard form (only the upload flow writes them; can be added later).
