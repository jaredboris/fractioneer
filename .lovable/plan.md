# Match admin UI to client dashboard

The client portal screenshot is the target: dark navy background (`#05070D`), `#111827` cards with `#1E2A3A` borders, rounded-2xl, uppercase tracked labels, subtle widget glow. The admin already uses these tokens for many cards but two things break the parity:

1. Admin loads in light mode (theme is per-user via localStorage; admins often see white).
2. Several admin surfaces (tab strip, tables, buttons, inputs, activity rows, period dialog, empty states) still use light-first slate styling that doesn't read as "widgets".

## Changes

### 1. Force dark on the admin shell
`src/components/portal/AdminSidebar.tsx`
- Drop the light branch from the `useTheme` hook used by admin: default to `dark`, persist `dark`, and remove the light-mode toggle button (keep a single static moon indicator, or hide the toggle entirely for admin).
- Keep the amber/rose admin avatar + shield as-is (per user choice).
- Result: the admin shell, sidebar card, and nav always render with the same `#05070D` / `#111827` / `#1E2A3A` palette as the screenshot.

### 2. Restyle admin page content to widget aesthetic
`src/routes/portal.admin.tsx` — sweep every section so the dark variant is the *only* variant (remove light-mode classes that currently dominate when no `dark` class is present):

- **Tab strip** (Clients / Upload Financials / Activity Log): convert to the same pill style used on the client dashboard period selector — `rounded-xl border border-[#1E2A3A] bg-[#111827]` container, active tab `bg-[#1E2A3A] text-white`, inactive `text-[#9CA3AF] hover:text-white`.
- **Section cards** (`Reporting periods`, `Dashboard values`, `Documents`, `Shared files`, `Urgent alert`, `New client` panel, Activity log card): unify to `rounded-2xl border border-[#1E2A3A] bg-[#111827] p-6`, headings `text-white`, sub-copy `text-[#9CA3AF]`, uppercase eyebrow labels `text-[10px] tracking-wider text-[#9CA3AF]`.
- **Inputs / selects / textareas**: `bg-[#0F1729] border-[#1E2A3A] text-white placeholder:text-[#6B7280] focus:border-blue-500/60 focus:ring-blue-500/40`. Remove `bg-white` / `text-slate-900` light fallbacks.
- **Primary buttons**: `bg-blue-600 hover:bg-blue-500 text-white` (kept). **Secondary buttons**: `border-[#1E2A3A] bg-[#0F1729] text-white hover:bg-[#1a2335]`. **Destructive**: rose-500/10 bg, rose-300 text, rose-500/30 border.
- **Tables** (Clients list, Reporting periods, Activity log): header row `bg-[#0F1729] text-[#9CA3AF] uppercase tracking-wider`, body rows `border-t border-[#1E2A3A] hover:bg-[#1a2335] text-[#E5E7EB]`, numeric/secondary cells `text-[#9CA3AF]`.
- **Empty states** ("No periods yet", "No files shared yet", etc.): `text-[#9CA3AF]` on `bg-[#0F1729]` dashed border `border-[#1E2A3A]`.
- **Period detail dialog / modals**: same card chrome — `bg-[#111827] border-[#1E2A3A]`, headings white, copy `#9CA3AF`.
- **Status pills** (On track / Delayed / Ready / Current / Behind): match client widget glow style — soft tinted bg + matching text (`bg-emerald-500/10 text-emerald-300`, `bg-amber-500/10 text-amber-300`, `bg-rose-500/10 text-rose-300`).
- **Progress bar** for backfill / uploads: track `bg-[#1E2A3A]`, fill `bg-blue-500`.
- **Page background**: ensure `AdminShell` main wrapper is `bg-[#05070D]` (already set) and remove any inner `bg-slate-50` fallbacks.

### 3. Loader / role-check screen
`AdminGate` loader: change `bg-slate-50 dark:bg-[#0F1729]` → `bg-[#05070D]` so the flash before role check matches.

## Out of scope

- No changes to data, server functions, routing, or client portal files.
- Admin avatar stays amber/rose with shield.
- Light mode is removed for admin only; client portal keeps its toggle.

## Technical notes

- Sweep is class-rename only; no markup restructure needed.
- After the sweep, run `rg "bg-white|bg-slate-50|text-slate-900|text-slate-700|text-slate-600|text-slate-500" src/routes/portal.admin.tsx src/components/portal/AdminSidebar.tsx` to confirm no light-mode residue remains (allow only inside conditional dark: pairs that have been collapsed to dark-only values).
- Verify visually with a Playwright screenshot of `/portal/admin?tab=clients`, `?tab=upload`, `?tab=activity` against the client screenshot.
