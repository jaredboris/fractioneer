## Status: mostly already implemented — verify + harden

The previous turn already moved widget prefs to Supabase: `useWidgetPrefs` in `src/lib/dashboard-widgets.tsx` reads from `widget_prefs`, writes via `upsert`, subscribes to realtime changes filtered by `user_id`, and wipes legacy `localStorage` keys on mount. RLS already covers both sides (`Users manage their own widget prefs` on `auth.uid() = user_id`, plus `Admins can manage all widget prefs` via `has_role`), and `widget_prefs` is in the `supabase_realtime` publication. No other file in `src/` references widget storage.

So the three symptoms you describe shouldn't be happening against the current code. Most likely cause: the browser tab you tested in was still running pre-refactor code (the realtime + RLS migration only took effect last turn). Two small hardening changes will also make the persistence path bulletproof.

### Changes to `src/lib/dashboard-widgets.tsx`

1. **Explicit upsert conflict target + error surfacing.** Change `persist()` to:
   ```ts
   const { error } = await supabase
     .from("widget_prefs")
     .upsert(
       { user_id: clientId, widget_ids: next, updated_at: new Date().toISOString() },
       { onConflict: "user_id" },
     );
   if (error) console.error("[widget_prefs] persist failed", error);
   ```
   Make `persist` `async`, await it inside `setIds`, and after a successful write trigger a `setFetchNonce((n) => n + 1)` so the canonical row is re-read from the server (matches your "refetch after save" requirement and guarantees the UI shows exactly what's persisted).

2. **Drop the optimistic local update path that could mask a write failure.** Keep `setIdsState(next)` for instant feedback, but rely on the post-write refetch (and realtime echo on other tabs) as the source of truth.

### Verification steps after the change

- Hard-refresh both the admin and client tabs (clears any stale bundles).
- Client adds a widget → refresh → widget persists. Check Network for a 200 on `POST /widget_prefs`.
- Client edits → admin's open spy-mode tab updates within ~1s (realtime).
- Admin in spy mode with Admin Override edits → client's open tab updates within ~1s.
- Confirm `localStorage` has no `portal.dashboard.widgets.*` keys (cleanup runs on mount).

### Files touched

- `src/lib/dashboard-widgets.tsx` — `persist()` + `setIds()` only. No schema or RLS changes; existing migration already enabled realtime and admin write policy.
