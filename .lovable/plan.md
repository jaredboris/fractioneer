## Background

Widget prefs today live only in the admin's browser `localStorage` (`portal.dashboard.widgets.v2`), so spy mode currently shows the admin's own layout, not the client's. To show the client's actual layout from any device we need to persist prefs server-side keyed by the client's `user_id`.

## 1. Server-backed widget prefs

New `public.widget_prefs` table:
- `user_id uuid PK references auth.users(id) on delete cascade`
- `widget_ids text[] not null default '{}'`
- `updated_at timestamptz not null default now()` (+ trigger)

Grants + RLS:
- `GRANT SELECT, INSERT, UPDATE, DELETE ON public.widget_prefs TO authenticated;`
- `GRANT ALL ON public.widget_prefs TO service_role;`
- Owner policy: `auth.uid() = user_id` for select/insert/update/delete.
- Admin read policy: `public.has_role(auth.uid(), 'admin')` for select (so spy mode can read any client's row without service role).

No admin write policy — admin overrides never persist (enforced both in SQL and in the client hook).

## 2. Refactor `useWidgetPrefs(clientId, options)`

Update `src/lib/dashboard-widgets.tsx`:

```ts
useWidgetPrefs(clientId: string, opts?: { readOnly?: boolean; overrideIds?: string[] | null })
```

Behavior:
- Local cache key becomes `portal.dashboard.widgets.v2:{clientId}` (per-client, so admin's own layout never bleeds into a client they spy on).
- On mount, hydrate from local cache, then fetch the row from `widget_prefs` for `clientId`; if the row exists, update state + cache. If no row, leave defaults.
- Writes (`setIds`/`add`/`remove`/`move`) update local state, write cache, and upsert to `widget_prefs` — but only when `readOnly !== true`. In read-only mode, mutation functions become no-ops (and the UI hides the edit button).
- When `overrideIds` is a non-null array, the hook returns that list as `ids` and ignores both server prefs and local cache. All mutations are no-ops while override is active.

## 3. Spy mode wiring

`src/routes/portal.tsx` (`ClientDashboard`):
- Resolve `effectiveClientId = impersonation?.clientId ?? user.id`.
- Read the override flag from sessionStorage via a new `useAdminOverride()` hook.
- Call `useWidgetPrefs(effectiveClientId, { readOnly: !!impersonation, overrideIds: override ? DEFAULT_IDS : null })`.
- In spy mode, hide the "Edit" / "Add widget" affordances (since edits are disabled).

## 4. Admin Override toggle in the banner

New helpers in `src/lib/impersonation.ts`:
- `useAdminOverride(): [boolean, (next: boolean) => void]`
- Stored in sessionStorage under `fractioneer-impersonate-override` and cleared automatically inside `stopImpersonation()`.

Update `src/components/portal/ImpersonationBanner.tsx`:
- Keep current "Viewing as [Client Name] — Spy Mode" copy.
- Add a toggle button (styled like a small pill switch matching the amber banner) labeled "Admin Override" with on/off state. When ON, append "(Override — default layout)" to the banner text so it's obvious the rendered layout isn't the client's.
- Toggling does NOT navigate; the dashboard re-reads override state via the hook and re-renders.

## 5. Migration of existing prefs

One-time: on first load, if `localStorage["portal.dashboard.widgets.v2"]` exists and the per-client key for the current user is missing, copy it over (then leave the legacy key in place — harmless). No SQL backfill needed.

## Files

- New migration: `widget_prefs` table + RLS + grants + updated_at trigger.
- Edited: `src/lib/dashboard-widgets.tsx` (hook signature + server sync + read-only/override modes).
- Edited: `src/lib/impersonation.ts` (override hook + clear on stop).
- Edited: `src/components/portal/ImpersonationBanner.tsx` (toggle button + label).
- Edited: `src/routes/portal.tsx` (pass `effectiveClientId`, `readOnly`, `overrideIds`; hide edit affordances in spy mode).

## Technical notes

- Admin override never writes — guarded in both RLS (no admin write policy) and the hook (no-op mutations).
- Per-client local cache key prevents flash of the wrong layout when switching between clients or exiting spy mode.
- Hook keeps localStorage as a synchronous first-paint cache; server fetch reconciles on mount.
