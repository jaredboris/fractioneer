## Goal
Make the admin "Operations overview" widgets visually identical to the client dashboard widgets (same dark `nb-card` shell, glow, label/icon/number hierarchy, top-right arrow chip).

## Root cause
The admin overview uses a separate `DarkStatCard` component in `src/routes/portal.tsx` (lines 866–895) that still renders the old light-mode shell (`bg-white` with a `bg-[#111827]` dark variant), a filled tinted icon square in the top-right, a smaller 2xl number, and no glow/arrow chip. The client dashboard uses `StatCard` from `src/lib/dashboard-widgets.tsx` which uses `nb-card nb-card-glow`, a tinted icon under the label, a 3xl hero number, and the `nb-arrow` `ArrowUpRight` chip top-right.

## Changes

1. **`src/routes/portal.tsx` — rewrite `DarkStatCard`** to mirror the client `StatCard` layout:
   - Container: `nb-card nb-card-glow rounded-2xl p-5 h-full` (drop `bg-white` / `border-[#E5E9F1]`).
   - Top row: uppercase 11px label on the left, `nb-arrow` button with `ArrowUpRight` icon on the right.
   - Icon rendered below the label, colored by tone (emerald / rose / blue), no filled square background.
   - Value: `mt-3 text-3xl font-semibold tracking-tight text-white`.
   - Detail line beneath in `text-[11px] text-[#6B7280]` (matches client `periodLabel` slot).
   - Import `ArrowUpRight` if not already imported in that file.

2. **`src/routes/portal.tsx` — admin page header** (lines 437–447): switch heading/subtitle text colors to the same dark-only palette the client uses (`text-white` / `text-[#9CA3AF]`) and drop the `text-slate-900 dark:` light-mode pair so it matches the client header look.

3. **AI Spend stat button wrapper** (lines 512–524): keep the button but ensure hover transform doesn't break the new card's glow (add `block h-full` so the card fills the grid cell like the others).

No changes to data, layout grid (`lg:grid-cols-5`), or any other admin section — only the stat card visuals.

## Out of scope
- Client dashboard styling (already correct).
- Lower admin sections (Clients table, Recent activity) — already on `nb-card`.
- Admin Clients/Upload tabs.
