## Goal

Change Admin Override behavior in spy mode. Today, toggling it ON swaps to the default 4-card layout (read-only-ish). New behavior: the toggle controls **edit access** to the client's actual layout, not which layout is shown.

## Behavior matrix

| Spy mode | Override | Widgets shown | Edit controls | Persists to client's `widget_prefs`? |
|---|---|---|---|---|
| Off (normal client) | n/a | Client's own | Yes | Yes (own row) |
| On | OFF | Client's actual | Hidden (read-only) | No |
| On | ON | Client's actual | Visible (Manage Widgets, Add Widget, drag, remove) | **Yes — writes to that client's row** |

## Changes

### 1. `src/lib/dashboard-widgets.tsx` — `useWidgetPrefs`

- Drop the `overrideIds` option entirely (no more seeding the default layout on toggle).
- Keep only the `readOnly` option. Override no longer affects which layout is fetched — always fetch the client's real `widget_prefs` row, always subscribe to realtime updates.
- Remove the prevOverrideRef / fetchNonce-on-exit logic tied to override transitions (keep fetchNonce for post-persist refetch).
- `persist()` writes to `widget_prefs` keyed on `clientId` (the effective/impersonated id) — already correct, just needs `readOnly` to be `false` when admin override is on.

### 2. `src/routes/portal.tsx` — `ClientDashboard`

- Change the hook call:
  ```ts
  const widgets = useWidgetPrefs(effectiveId, {
    readOnly: !!impersonation && !override, // override ON unlocks editing
  });
  ```
- Remove the `overrideIds` prop and the `DEFAULT_IDS` reference for override.
- When `impersonation && override`, render an extra **"Reset to default layout"** button next to Manage Widgets / Add Widget. Style as destructive (red/rose). Wire to an `AlertDialog` confirm; on confirm call `widgets.setIds(DEFAULT_IDS)` which persists to the client's row.

### 3. `src/components/portal/ImpersonationBanner.tsx`

- Update the toggle's title/tooltip text to reflect new meaning: "Admin Override unlocks editing the client's layout" instead of "default widget layout".
- Remove the `(Override — default layout)` hint in the banner text.

### 4. No DB / migration changes

`widget_prefs` already keyed by `user_id` (the client). Admin in spy mode is already writing as the admin's auth identity but to the client's row — confirm RLS allows admins to upsert other users' rows. If RLS currently restricts to `auth.uid() = user_id`, a migration is needed to allow `has_role(auth.uid(), 'admin')` to upsert/select any row. I'll verify before implementation and add a migration only if needed.

## Out of scope

- No changes to widget catalog, layout structure, or non-override flows.
- No change to how spy mode itself (impersonation) works.
