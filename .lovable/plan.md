## Targeted Fractioneer homepage updates (revised)

Scope: conversion + credibility only. No site reorder. No fabricated proof. Surgical edits.

### 1. Tighter vertical spacing (~20–30%)
- `Section.tsx`: `py-14 md:py-20` → `py-10 md:py-14`.
- `FinalCTA.tsx`: outer `py-20 md:py-28` → `py-14 md:py-20`; inner card `py-16 md:py-20` → `py-12 md:py-16`.
- `SocialProof.tsx`: override `py-14 md:py-16` → `py-10 md:py-12`.
Keep generous internal padding and gaps so the page still feels premium.

### 2. Header nav relabel
- `Navbar.tsx`: change `"Franchise Finance"` to `"Who We Help"` (keep `#problem` href) in both desktop and mobile lists.

### 3. Franchise audits as a service (conservative)
- `ServicesFranchise.tsx`: add 7th card (icon `ShieldCheck`)
  - Title: "Franchise audits for franchisors"
  - Body: "Support for franchisors that need clean documentation, reporting coordination, and financial process support across franchise locations."
- Lightly broaden existing "Cash flow, audit, and reporting support" body to mention franchisor audit support — no overclaiming.

### 4. New "What leadership can see clearly" section
- New file `src/components/site/LeadershipVisibility.tsx` (uses `<Section>` + `<SectionHeader>`).
- Heading: "What leadership can see clearly."
- Subtext: "Fractioneer helps franchise leaders turn scattered finance activity into reporting they can actually use."
- 5 compact icon cards: Monthly close status, Cash position, Unit-level P&L, Royalty and fee tracking, Audit readiness (exact copy from brief).
- Mount in `routes/index.tsx` between `<ServicesFranchise />` and `<EngagementModels />`.

### 5. Consultative engagement CTAs with intent passthrough
- `BookingProvider.tsx`: extend API to
  ```ts
  openBooking(opts?: { view?: "calendar" | "form"; intent?: string }): void
  ```
  Default (no args) = calendar view, no intent. Preserves all existing call sites.
- `BookACallButton.tsx`: add optional `view` and `intent` props that forward to `openBooking`.
- `EngagementModels.tsx`: per-tier CTA label + intent
  - Finance Foundation → "Talk through this model" / intent "Bookkeeping"
  - Controller-Led Operations → "Discuss controller support" / intent "Controller support"
  - CFO Partnership → "Discuss CFO support" / intent "CFO support"
  Buttons still open the calendar view; intent is preserved and applied if the user switches to the form.

### 6. Testimonial credibility polish (no reorder, no metrics)
- `Testimonials.tsx`: add a small subtle label chip above each quote
  - Abdy/Abaco → "Portfolio finance"
  - Andrada/Riverside → "Portfolio finance"
  - Ferrara/PatchMaster → "Franchisor support"
- Slight layout tweak so name/role/company/headshot read more prominently. No fabricated outcomes.
- Michael Abdy's hero testimonial stays exactly as is.

### 7. FAQ answers
- `FAQ.tsx`: replace `a` text for the 7 existing questions with the stronger brief-supplied answers, and append a new entry:
  - Q: "Can you help with franchise audits?"
  - A: brief-supplied conservative answer.

### 8. Booking modal — two clear paths, calendar default
- `BookingModal.tsx`: internal `view: "calendar" | "form"` state. Resets to whatever `initialView` the provider passes whenever the modal re-opens.

Calendar view:
- Headline: "Book a call with Fractioneer"
- Subtext: "Pick a time to talk with our team about your franchise finance needs."
- Existing embed placeholder
- Below it, a compact secondary card:
  - "Prefer not to schedule right now?"
  - "Send us a few details and we'll follow up."
  - Button: "Send details instead" → switches to form view
- No form rendered underneath the calendar by default.

Form view:
- Headline: "Send us a few details."
- Subtext: "Tell us what you need and we'll follow up shortly."
- `<LeadForm>` at the top of the modal
- Small "← Back to calendar" link
- Forwarded `intent` preselects the "What do you need help with?" option

### 9. LeadForm rewrite (short, low-friction)
- `LeadForm.tsx`:
  - Replace `first_name` + `last_name` with one `full_name` field.
  - Required: Full name, Work email, Company name, What do you need help with?
  - Optional: Company type, Number of locations, Anything else?
  - `helpOptions`: CFO support, Controller support, Bookkeeping, Payroll, AP/AR, Cash flow, Reporting, Franchise audits, Audit support, Not sure yet.
  - Accept optional `initialHelpWith` prop wired from `intent`.

### 10. Final CTA — dual buttons
- `FinalCTA.tsx`:
  - Primary "Book a call" → `openBooking()` (calendar view)
  - Secondary "Send details instead" → `openBooking({ view: "form" })`
  - Replace the current underline link with a real secondary button styled to fit the navy gradient card.

### 11. Logo readability
- `SocialProof.tsx`: bump hero logo cells `h-8 md:h-9` → `h-10 md:h-12`, `max-w-[140px]` → `max-w-[160px]`. Bump `selectedLogos` from `sm` to `h-8 md:h-9`. Section stays compact (covered by #1).

### 12. No fabricated proof
- No new stats, outcomes, client claims, or audit deliverables. Keep all existing credible proof intact.

---

### Technical notes

- `LeadForm` schema: `full_name` (min 1, max 160). Server fn splits on first space into `first_name` / `last_name` (last_name `""` if absent) before insert — avoids a DB migration this pass.
- `helpOptions` enum must match exactly between `LeadForm.tsx` and `leads.functions.ts`, or the server will reject submissions.
- `BookingProvider` stores `{ view, intent }` in state alongside `open`, passes both into `<BookingModal>` as `initialView` and `intent`. Modal resets `view` to `initialView` on each open via a `useEffect` on `open`.
- No new routes, no new packages, no DB migrations.

### Files touched
- edit: `src/components/site/Section.tsx`
- edit: `src/components/site/Navbar.tsx`
- edit: `src/components/site/ServicesFranchise.tsx`
- new:  `src/components/site/LeadershipVisibility.tsx`
- edit: `src/routes/index.tsx`
- edit: `src/components/site/BookingProvider.tsx`
- edit: `src/components/site/BookingModal.tsx`
- edit: `src/components/site/BookACallButton.tsx`
- edit: `src/components/site/EngagementModels.tsx`
- edit: `src/components/site/Testimonials.tsx`
- edit: `src/components/site/FAQ.tsx`
- edit: `src/components/site/LeadForm.tsx`
- edit: `src/components/site/FinalCTA.tsx`
- edit: `src/components/site/SocialProof.tsx`
- edit: `src/lib/leads.functions.ts`
