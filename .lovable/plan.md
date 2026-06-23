## Make widget preferences sync live across admin and client

The `widget_prefs` table (per-user `widget_ids text[]`) already exists, and `useWidgetPrefs` already upserts to it. The reason changes don't appear across browsers:

1. `useWidgetPrefs` keeps a `localStorage` cache (`portal.dashboard.widgets.v2:{clientId}`) that's used as the initial state and updated on every write. On the *other* browser, the cache holds the stale layout and only the one-shot fetch on mount reconciles it. Until that fetch resolves, the stale cache flashes; after it resolves, no further updates arrive unless the user refreshes.
2. There's no realtime subscription, so a change made in the admin's tab never pushes into the client's tab (and vice versa) without a manual reload.

### Changes

**`src/lib/dashboard-widgets.tsx` — `useWidgetPrefs`**
- Remove the localStorage cache entirely: delete `LEGACY_STORAGE_KEY`, `cacheKey`, `loadFromCache`, and every `window.localStorage.*` call in the hook. Initial state becomes `DEFAULT_IDS` until the server row resolves.
- Keep the existing fetch effect (keyed on `clientId` and `overrideIds`) as the initial load.
- Add a Supabase realtime subscription on `widget_prefs` filtered to `user_id=eq.{clientId}`, listening for `INSERT` and `UPDATE`. On each event, normalize `new.widget_ids` and `setIdsState(next)` — but skip while `overrideIds` is active so an admin's working draft isn't clobbered by their own write echo.
- The persist path stays the same upsert; no local cache write.

**No schema or RLS changes.** The existing `widget_prefs` table, the owner-write policy, and the admin-write policy from the last migration already cover both sides.

### Behavior after the change

- Client edits a widget → upsert to `widget_prefs` → admin's open spy-mode tab receives the realtime UPDATE and re-renders with the new order.
- Admin in spy mode with Admin Override edits a widget → upsert to the *client's* `widget_prefs` row → client's open dashboard receives the realtime UPDATE and re-renders.
- First paint shows the default layout briefly before the server row resolves (single small fetch, no flash of someone else's stale cache).
- No more cross-browser drift, no manual refresh required.

### File touched

- `src/lib/dashboard-widgets.tsx`
