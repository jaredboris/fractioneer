# Plan: Reduce text density in the middle of the page

Targeted edits to four sections. No new sections beyond what's specified. No booking modal, proof, pricing, or extra CTA changes.

## 1. `ServicesFranchise.tsx` — Layered "finance operating system"

Replace the 7-card uniform grid with **3 stacked horizontal layers**, each labeled as a tier of the finance stack.

Structure:
```text
┌─ Layer 01 · Strategic finance ──────────────────────────┐
│  [icon] CFO leadership          [icon] Cash flow & reporting │
└──────────────────────────────────────────────────────────┘
┌─ Layer 02 · Controls & close ───────────────────────────┐
│  [icon] Controller & monthly close   [icon] Franchise audits │
└──────────────────────────────────────────────────────────┘
┌─ Layer 03 · Daily finance operations ───────────────────┐
│  [icon] Bookkeeping  [icon] Payroll  [icon] AP/AR        │
└──────────────────────────────────────────────────────────┘
```

- Each layer = a horizontal band (card with subtle border) with a small layer label/eyebrow on the left (e.g. "01 · Strategic finance") and the services as inline icon+title+one-line items inside.
- Each service: icon (left), bold title, one-line description below. No paragraph copy.
- Use the exact copy provided in the request (one line per service).
- Headline: "What Fractioneer runs for growing operators."
- Subhead: "A complete finance function across strategy, controls, close, reporting, and day-to-day execution."
- Responsive: layers stack full-width; inside each layer the services switch from row → 2-col → 1-col on small screens.
- Keep `muted` background. Keep section id `services`.

## 2. `LeadershipVisibility.tsx` — Compact output tiles

Already close, but tighten:
- Reduce padding (p-5 → p-4), tighter typography.
- Shorten body lines to ≤6 words each (e.g. "On track, delayed, or ready", "Cash across the business", "By location, region, or entity", "Collected, pending, past-due", "Docs ready for audits/diligence").
- Keep 5-column layout on lg, 2-col on sm.
- Keep status chip (Live / Weekly / Monthly / Live / Always-on).
- Add a subtle "Outputs" eyebrow framing — already handled by SectionHeader eyebrow "Leadership visibility".

## 3. `HowItWorks.tsx` — Already exists; refine copy + visual

Section already added after LeadershipVisibility, before EngagementModels. Update copy to match request exactly:
- Subhead: "A simple path from scattered finance activity to a finance function leadership can rely on."
- Steps simplify to **Assess / Build / Run** as the bold titles (currently "Assess the current setup" etc.) with the longer descriptions kept as supporting text.
- Horizontal stepper on desktop (already implemented), stacked on mobile (already implemented). Keep current numbered circle + icon. No animation changes.

## 4. `EngagementModels.tsx` — Tighter comparison

Current structure is close. Tighten:
- Trim "What it includes" to **3–4 short label-style items** (no full sentences). Use exact copy from request:
  - Finance Foundation: Bookkeeping · Payroll · AP/AR · Monthly reporting
  - Controller-Led: Monthly close · Multi-entity reporting · Cash flow management · Financial controls
  - CFO Partnership: Fractional CFO leadership · Forecasting · Board & investor packages · Audit & diligence support
- Keep "Best for" line as-is (already added).
- Keep current CTAs.
- Reduce card padding slightly (p-8 → p-7) and feature list line-height for denser comparison.

## Files touched

- `src/components/site/ServicesFranchise.tsx` — restructure to 3 layered bands
- `src/components/site/LeadershipVisibility.tsx` — shorten copy, tighten padding
- `src/components/site/HowItWorks.tsx` — copy refinement (subhead + step titles)
- `src/components/site/EngagementModels.tsx` — shorten includes to label-style items

## Out of scope

No changes to: Hero, SocialProof, WhoWeHelp, ProblemSection, InlineCTA, Testimonials, TeamGrid, FAQ, FinalCTA, Footer, Navbar, BookingModal, routes, or any data/logic.
