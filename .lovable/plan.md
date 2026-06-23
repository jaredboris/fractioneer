## Let Admin Override edit and save the client's widget layout

### Behavior

- Spy mode, override OFF: client's saved layout, read-only (no edit/add buttons). Unchanged.
- Spy mode, override ON: dashboard shows the default layout (Monthly Close, Cash Position, AR, AP). "Manage Widgets" and "Add Widget" buttons appear. Drag/add/remove all work, and each change upserts the client's `widget_prefs` row — overwriting their stored layout.
- Toggling override OFF reloads the client's now-updated layout from the server.
- Admin's own dashboard and client-side behavior: unchanged.

### Changes

**Migration — `widget_prefs` admin write policy**
Currently admins can SELECT any row but only the owner can write. Add:

```sql
CREATE POLICY "Admins can manage all widget prefs"
  ON public.widget_prefs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

Existing owner policy stays. Admins still need AAL2 because `has_role` doesn't re-check it — acceptable since the portal gate already enforces AAL2 before this code runs.

**`src/lib/dashboard-widgets.tsx` — `useWidgetPrefs`**
Split the two concepts that are currently fused into `overrideIds`:
- `readOnly` (boolean) — disables mutations and writes; hides edit UI.
- `overrideIds` (string[] | null) — when transitioning from null → array, seeds local `ids` state with this list *without persisting*. When it transitions back to null, re-fetch from the server.

Replace the current `effectiveIds = overrideIds ? normalize(overrideIds) : ids` shortcut. Instead:
- Keep a ref of the previous `overrideIds` value.
- When override flips on: `setIdsState(normalize(overrideIds))`. Don't write to cache or server.
- When override flips off: re-run the existing server fetch effect to restore the client's saved layout.
- Mutations (`setIds` / `add` / `remove` / `move`) work whenever `!readOnly`, regardless of override. `persist()` writes to `widget_prefs` row keyed by `clientId` — which is already the spy target.
- Returned `readOnly` becomes just the input `readOnly` (no longer `|| !!overrideIds`).

**`src/routes/portal.tsx`**
Update the call site so override mode is editable:

```ts
const widgets = useWidgetPrefs(effectiveId, {
  readOnly: !!impersonation && !override,
  overrideIds: impersonation && override ? DEFAULT_IDS : null,
});
```

The existing `{!widgets.readOnly && (...)}` gate already controls the Manage / Add Widget buttons, so they'll appear automatically when override is on. No other UI changes needed.

### Files

- new migration for the admin write policy on `widget_prefs`
- `src/lib/dashboard-widgets.tsx`
- `src/routes/portal.tsx`
