# Conversion flow: "Book a call" + booking modal

## Recommendation
Use **Calendly** (or Cal.com / HubSpot Meetings) — not a custom scheduler. Building a real calendar means timezone handling, availability, Google/Outlook OAuth, reminders, reschedules, and routing — weeks of work with no premium-feel upside. We'll ship a clean modal with a clearly-marked embed slot now; pasting a Calendly inline embed later is a one-line change.

## Scope
- Replace all CTA copy ("Book a consultation" / "Explore franchise…" secondary CTA stays as-is) with **"Book a call"** in: Navbar, Hero (primary), Final CTA.
- Remove `mailto:` and `#contact` hash links from those CTAs.
- New `BookingModal` component opens on any "Book a call" click. No auto-open, no exit-intent.
- Inside the modal: headline, subheadline, calendar embed placeholder, and a collapsed "Not ready to book?" fallback that expands into a lead form.
- Lead form submits to Lovable Cloud (`leads` table). After success, replace form with thank-you message.

## Files

**New**
- `src/components/site/BookingModal.tsx` — shadcn `Dialog` wrapper, exposes context + trigger button.
- `src/components/site/BookingProvider.tsx` — React context (`useBooking()` → `openBooking()`) so any button anywhere triggers the same modal instance. Mounted once in `src/routes/index.tsx`.
- `src/components/site/BookACallButton.tsx` — reusable button (variants: `primary` navy, `light` white-on-navy for FinalCTA). Calls `openBooking()`.
- `src/components/site/LeadForm.tsx` — the fallback form (zod + react-hook-form + shadcn Form/Input/Select/Textarea).
- `src/lib/leads.functions.ts` — `submitLead` server fn using `supabaseAdmin` (public form, no auth). Zod-validated inputs.
- Supabase migration: `leads` table.

**Edited**
- `src/components/site/Navbar.tsx` — desktop + mobile "Book a consultation" → `<BookACallButton>`.
- `src/components/site/Hero.tsx` — primary CTA → `<BookACallButton>`; keep secondary "Explore franchise finance support" link.
- `src/components/site/FinalCTA.tsx` — `mailto:` button → `<BookACallButton variant="light">`; section headline copy unchanged.
- `src/routes/index.tsx` — wrap `<main>` in `<BookingProvider>`.

## Modal structure

```text
┌─ Dialog (max-w-2xl) ──────────────────────────┐
│ Book a call with Fractioneer                  │
│ Pick a time to talk with our team about your  │
│ franchise finance needs.                      │
│                                               │
│ ┌─ Calendar embed slot (dashed border) ─────┐ │
│ │ Calendar embed goes here. Replace with    │ │
│ │ Calendly, HubSpot Meetings, or Cal.com    │ │
│ │ embed code.                               │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ── divider ──                                 │
│                                               │
│ Not ready to book?                            │
│ Tell us what you need and we'll follow up.    │
│ [ Share your details ▾ ]   ← collapsed by default
└───────────────────────────────────────────────┘
```

Embed slot is a single `<div id="booking-embed-slot">` with the placeholder text + a code-comment marker `{/* BOOKING_EMBED_SLOT */}` so it's easy to find and replace.

Clicking "Share your details" expands `<LeadForm>` inline (no second modal). After successful submit, the form area is replaced with the thank-you message; the calendar embed slot stays visible above.

## Lead form

Fields (all required except message):
- First name, Last name — text, 1–80 chars
- Work email — `z.string().email()`, max 200
- Company name — text, 1–120 chars
- Company type — select: Franchisor / Multi-unit franchise operator / Franchise platform / PE-backed company / Founder-owned business / Other
- Number of locations — select: 1 to 5 / 6 to 20 / 21 to 50 / 51+ / Not applicable
- What do you need help with — select: Fractional CFO / Bookkeeping/accounting / Payroll / AP/AR / Cash flow management / Audit support / Not sure yet
- Message — optional textarea, max 1000

Submit button: **Send request**. While submitting → disabled + spinner. On success → "Thanks. We'll review your information and follow up shortly." On error → inline error message, form remains.

## Backend (Lovable Cloud)

Enable Lovable Cloud (one tool call). Migration:

```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  work_email text not null,
  company_name text not null,
  company_type text not null,
  num_locations text not null,
  help_with text not null,
  message text,
  source text not null default 'website_booking_modal'
);
alter table public.leads enable row level security;
-- No public select/insert policies. All writes go through the server fn
-- using the service-role client (supabaseAdmin), which bypasses RLS.
```

`src/lib/leads.functions.ts`:
- `createServerFn({ method: "POST" })` with zod `inputValidator` matching the form schema (enums enforced server-side).
- Handler imports `supabaseAdmin` from `@/integrations/supabase/client.server` and inserts the row. Returns `{ ok: true }` or throws on error.
- File contains ONLY the server fn + its imports (no plain helpers) so the `client.server` import doesn't leak to the client bundle.

Client uses `useServerFn(submitLead)` from `LeadForm`.

CRM hookup later: add a second step inside the handler (HubSpot/Resend/etc.) without changing the client. Schema is CRM-friendly.

## Design notes
- Modal uses existing tokens (`bg-background`, `text-foreground`, accent blue for the expand toggle, hairline divider).
- Embed slot: `min-h-[420px]`, `rounded-lg border border-dashed border-border bg-muted/40`, centered placeholder text in `text-muted-foreground text-sm`.
- Fallback toggle: ghost button with chevron, accent-blue label.
- Mobile: modal becomes full-height sheet via shadcn Dialog responsive sizing; form stacks single-column.
- Accessibility: Dialog handles focus trap + Esc; form fields have associated labels and `aria-invalid` on errors.

## Out of scope
- Real Calendly/HubSpot embed code (placeholder only, per request).
- Email notification on lead submit (table is ready; wire later).
- Admin view of leads.
- Removing/renaming the existing `#contact` anchor on the FinalCTA section (kept for any deep links; the button inside it switches to opening the modal).
