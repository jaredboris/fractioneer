
# Refine `/onepager-v2`

Scope: edit only `src/routes/onepager-v2.tsx`. Pure content + visual hierarchy pass. No new components, no routing changes, no business logic.

## 1. Soften the CTA

Replace the "Worth a 30-minute call with Mark." block with a quieter warm-referral footer:

- Headline: **"Mark can walk through where Fractioneer may be able to help."**
- Sub: one short line — "A direct conversation about your finance setup. No prep required."
- Right side: `info@fractioneer.co` / `fractioneer.co` (unchanged).
- Reduce visual weight: drop the `border-t-2 border-accent` to a single `border-t border-border`, smaller headline (`text-[12px]` instead of `14px`). The CTA should feel like a sign-off, not a pitch.

## 2. De-duplicate copy

Audit pass — current page repeats "cleanup", "controls", "AP/AR", "reporting", "buyout", "ownership transition" across triggers, featured block, capability cards, and why-us. Tighten so each idea lands once in its strongest spot:

- **Triggers** (callout): keep all four, but rewrite to be about *situations* (messy books, transition underway, finance function gaps, reporting leadership can't trust) — strip operational nouns.
- **Featured block**: own "transaction, buyout, diligence, ownership transition" exclusively. Remove "cleanup" from its supporting bullets (move to capability card).
- **Capability cards**: own the operational vocabulary (cleanup, controls, AP/AR, payroll, close). Drop "transaction support" from the CFO card since the featured block owns it. Rewrite the three cards so titles + descriptions don't echo trigger language:
  - "Monthly close & controls"
  - "CFO & reporting"
  - "Back-office operations"
- **Why Fractioneer**: keep as differentiators only (boutique, senior-led, complexity, transparency). Don't re-list services.

## 3. Sharpen hierarchy

The page currently has ~6 blocks of roughly equal weight. Re-tier them:

- **Tier 1 (dominant)**: Hero headline + metrics row. Metrics already at 30px — keep. Add a touch more vertical space above metrics so they breathe.
- **Tier 2 (featured)**: Transaction & buyout block. Keep navy `bg-primary` treatment; this is the single strongest visual moment after the metrics.
- **Tier 3 (supporting)**: Triggers callout, capability cards, why-us. Flatten these visually so they read as supporting content, not competing features:
  - Triggers: remove the `bg-muted/60` fill, render as a clean bordered band (`border-y border-border py-3`) — lighter than the featured block.
  - Capability cards: keep the `border-t-2 border-primary/80` accent.
  - Why-us: drop to a single-line row with bold label + inline description (`text-[10px]`) to compress vertical space and reduce card-count fatigue.
- **Tier 4 (proof)**: Logo strip + testimonial — current `bg-muted/50` band stays, slightly tighter padding.
- **Tier 5 (sign-off)**: CTA as described above.

## 4. Section order (unchanged but re-justified)

1. Header
2. Hero
3. Metrics
4. Triggers ("When leadership calls Fractioneer")
5. Featured: Transaction & buyout
6. Capability cards ("What Fractioneer can run")
7. Why Fractioneer
8. Proof: logos + testimonial
9. CTA

## 5. Constraints

- Must still fit 8.5"×11" single page. After flattening why-us and tightening CTA, vertical budget should improve, not worsen.
- No new claims, no fake dashboards, no prospect name.
- Construction/multi-entity stays subtle — only the existing "multi-entity, multi-project, multi-location" line in Why Fractioneer carries it.
- Logo strip untouched (already tuned in prior turns).

Deliverable: one edit to `src/routes/onepager-v2.tsx`.
