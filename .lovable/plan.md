# Match Admin Dashboard to Client Dashboard Theme

The shells (`AdminShell` / `PortalShell`) already share the same outer chrome — `#EEF2FA` light / `#05070D` dark background, identical sidebar cards. The mismatch is **inside the admin content area** (`src/routes/portal.admin.tsx`): sections, tables, inputs, buttons, modal slide-out, and Clients table use generic shadcn tokens (`bg-card`, `border-border`, `bg-muted/40`, `bg-primary`, `text-foreground`, etc.). In dark mode these resolve to the original Fractioneer navy palette, not the NeuroBank slate/midnight palette the client dashboard uses (`#111827` surfaces, `#1E2A3A` borders, `#0F1729` insets, `#9CA3AF` muted text, soft blue accents).

## Scope

Only `src/routes/portal.admin.tsx` — visual/token swap, no logic, no layout restructuring, no behavior changes. The Clients table card (already on the NeuroBank palette around line 1585) is the reference; everything else in the file gets brought in line with it.

## Token mapping

Apply consistently across every admin section/card/input/table/button/slide-out:

```text
Surface cards            bg-card                  → bg-white dark:bg-[#111827]
Card borders             border-border            → border-[#E5E9F1] dark:border-[#1E2A3A]
Card radius              rounded-xl               → rounded-2xl   (match client)
Inset / nested panels    bg-background            → bg-slate-50 dark:bg-[#0F1729]
Subtle fills             bg-muted/40, bg-muted/30 → bg-slate-50 dark:bg-[#0F1729]
Inputs                   border-input bg-background → border-[#E5E9F1] dark:border-[#1E2A3A] bg-white dark:bg-[#0F1729]
Focus ring               focus:ring-accent        → focus:ring-blue-500/40 focus:border-blue-500/60
Primary button           bg-primary text-primary-foreground → bg-blue-600 hover:bg-blue-500 text-white
Secondary / ghost button border-border bg-background hover:bg-muted/40 → border-[#E5E9F1] dark:border-[#1E2A3A] bg-white dark:bg-[#0F1729] hover:bg-slate-50 dark:hover:bg-[#1a2335]
Body text                text-foreground          → text-slate-900 dark:text-white
Muted text               text-muted-foreground    → text-slate-500 dark:text-[#9CA3AF]
Table header strip       bg-muted/40              → bg-slate-50 dark:bg-[#0F1729]
Row hover                hover:bg-muted/40        → hover:bg-slate-50 dark:hover:bg-[#1a2335]
Divider                  divide-border / border-border (inside cards) → divide-[#E5E9F1] dark:divide-[#1E2A3A]
Slide-out drawer         border-l border-border bg-card → border-l border-[#E5E9F1] dark:border-[#1E2A3A] bg-white dark:bg-[#111827]
Drawer scrim             bg-black/60              → unchanged
Status pills (pending / approved / alerts / info) → keep current amber/green/blue/rose tints, just confirm contrast on the new surfaces
Destructive button       bg-destructive           → bg-rose-600 hover:bg-rose-500 text-white
```

The empty-state placeholder near line 1252 already uses the NeuroBank tokens — leave it as the contrast reference.

## Out of scope

- No changes to `AdminSidebar`, `AdminShell`, `BetaBanner`, `ImpersonationBanner` (already correct).
- No changes to client-facing routes (`portal.tsx`, `portal.reports.tsx`, `portal.cashflow.tsx`, `portal.documents.tsx`).
- No structural/layout/copy changes — section order, headings, buttons, behavior all stay.
- No edits to `src/styles.css` design tokens; this is a per-file class swap so the rest of the app is untouched.

## Verification

- Visit `/portal/admin` in dark mode: surfaces sit on `#05070D` with `#111827` cards and `#1E2A3A` borders matching the client dashboard cards side-by-side.
- Light mode: white cards on `#EEF2FA` with `#E5E9F1` borders, matching client.
- Clients table, Upload Financials tab, Activity Log tab, period slide-out, alerts/shared-files cards, and the create-client form all share one consistent look.
