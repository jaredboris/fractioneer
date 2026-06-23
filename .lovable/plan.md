## Move Notes from widget to a dedicated sidebar tab

Notes is currently a locked dashboard widget. Move it out of the widget system entirely and make it a first-class page at `/portal/notes`, available to both clients and admins, with unread badges in the sidebar.

### 1. Remove Notes from the widget system

**`src/lib/dashboard-widgets.tsx`**
- Delete the `notes` widget definition (the locked card that renders `NotesCard`).
- Remove it from the default widget list, the Add Widget menu source, and any "locked widgets" array so it cannot appear on the dashboard or be re-added.

**`src/routes/portal.tsx`**
- Remove the `notes` entry from default widget prefs / locked-widgets handling so existing users whose saved prefs include `notes` silently drop it on load.

`NotesCard.tsx` stays — we'll reuse its thread + composer UI inside the new page (or extract the thread list/composer into the new page directly; either way the same `notes` table queries are reused).

### 2. New route `/portal/notes`

**`src/routes/portal.notes.tsx`** (new, under the same auth shell pattern as other portal routes)
- Detects role via `has_role` / existing profile lookup the portal already uses.
- **Client view**: loads `notes` for `client_id = auth.uid()` ordered `created_at desc`. Renders each note with author name, an `ADMIN` or `CLIENT` badge (uses `Badge` variants matching dark theme), and a localized timestamp. Bottom composer: `Textarea` + "Post note" button → inserts a row with `author_role='client'`, `author_id=auth.uid()`, `client_id=auth.uid()`, `author_name=profile.full_name || email`.
- **Admin view**: top bar with a client `Select` (loads from `profiles` joined to `user_roles` where role='client'). On select, loads that client's thread the same way. Composer posts with `author_role='admin'`, `author_id=auth.uid()`, `client_id=selectedClientId`, `author_name=admin profile name`. Admin does NOT need impersonation; this works under their own session because RLS already allows admins to read/insert via `has_role(auth.uid(),'admin')`.
- On thread view (client view mount, or admin selecting a client), upsert into `notes_read_state` with `client_id, user_id=auth.uid(), last_read_at=now()` to clear the unread indicator for that thread.
- Realtime subscription on `notes` filtered by `client_id` so new posts appear without refresh.

### 3. Sidebar nav + unread badge

**`src/components/portal/PortalSidebar.tsx`** — add `{ label: "Notes", to: "/portal/notes", icon: MessageSquare }` to the `NAV` array (between Documents and Settings).

**`src/components/portal/AdminSidebar.tsx`** — add the same `Notes` nav item (top-level, not under `/portal/admin?tab=...`); active when `pathname === "/portal/notes"`.

**Unread logic (shared hook `useNotesUnread`)** placed alongside the sidebars or in `src/hooks/`:
- Client: unread = exists a `notes` row where `client_id = auth.uid()`, `author_role = 'admin'`, and `created_at > coalesce(last_read_at for this user+thread, epoch)`.
- Admin: unread = exists ANY `notes` row where `author_role = 'client'` and `created_at > coalesce(last_read_at for admin+that client_id, epoch)`. Iterates client_ids the admin sees.
- Hook returns a boolean; sidebar renders a small dot badge on the Notes nav item when true.
- Subscribes to realtime `notes` inserts to flip badge live; also re-evaluates on route change.

### 4. Backend

`notes` and `notes_read_state` tables + RLS already exist and stay as-is (already gated by `is_aal2`, `client_id = auth.uid()` for clients, `has_role(...,'admin')` for admins). No migration needed.

### Verification

- Dashboard: no Notes card; Add Widget menu has no Notes entry; existing prefs containing `notes` load cleanly.
- `/portal/notes` as a client: shows own thread, can post, badge clears after viewing.
- `/portal/notes` as an admin: client selector works, can read & post to any client's thread without impersonation, badge clears per-thread.
- Sidebar badge appears on the other party's first post and disappears on visit.
