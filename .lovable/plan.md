## 1. Notes widget on client dashboard

### Database (migration)

Create `public.notes`:
- `id uuid pk`, `client_id uuid not null` (→ `auth.users`), `author_id uuid not null` (→ `auth.users`), `author_role text not null check in ('admin','client')`, `author_name text`, `body text not null check length 1–4000`, `created_at timestamptz default now()`.
- Indexes: `(client_id, created_at desc)`.
- GRANTs: `SELECT, INSERT ON public.notes TO authenticated`; `ALL TO service_role`. (No update/delete in v1.)
- RLS:
  - SELECT: `client_id = auth.uid() OR has_role(auth.uid(),'admin')`.
  - INSERT: `(client_id = auth.uid() AND author_id = auth.uid() AND author_role='client') OR (has_role(auth.uid(),'admin') AND author_id = auth.uid() AND author_role='admin')`.
- Add to `supabase_realtime` publication so admin/client tabs see each other's posts live.

Create `public.notes_read_state`:
- `client_id uuid pk` (→ `auth.users`), `last_read_at timestamptz not null default 'epoch'`, `updated_at timestamptz default now()`.
- GRANTs same pattern. RLS: row owner is `client_id`; admins read-only any row.
- Used to compute the unread dot for the client. (Admins don't get an unread dot.)

### Widget integration (`src/lib/dashboard-widgets.tsx`)

- Add a new `WIDGET_CATALOG` entry `notes` with `locked: true, defaultOn: true` (same lock semantics as `monthly_close` / `cash_position` → cannot be removed, can be reordered).
- `WidgetContext` extended with `clientId: string` and `viewerRole: 'admin' | 'client'` so the widget knows who's posting and whose read state to update. Passed through from `portal.tsx` (and admin spy mode → `viewerRole: 'admin'`, `clientId` = spied client).
- Render a new `<NotesCard>` component matching existing dark card styling (`rounded-xl border border-border bg-card`, same paddings as other cards). It spans the full width row (treat as `kind: 'chart'` for layout so it gets a wide grid cell).

### `NotesCard` behavior

- Fetches `notes` for `clientId` newest first; subscribes to realtime inserts on `notes` filtered by `client_id`.
- Empty state: muted text "No notes from your Fractioneer team yet."
- Each note: author name + small badge (`ADMIN` amber-tinted / `CLIENT` neutral) + relative timestamp (`x min ago`, with full timestamp on hover).
- Post form: `<Textarea>` + "Post note" button. On submit: insert with `author_id=auth.uid()`, `author_role=viewerRole`, `author_name` from `profiles.full_name || company_name || email`. Clear input on success.
- Unread dot (client view only):
  - On mount, fetch `notes_read_state.last_read_at` for the client.
  - Unread = any admin note with `created_at > last_read_at`. Show a small primary-colored dot on the card header.
  - When the card scrolls into view (IntersectionObserver) OR the client posts a note, upsert `notes_read_state.last_read_at = now()` and clear the dot locally.
- Admin spy mode: no unread dot; read state is never updated by admin viewers.

## 2. Login notification email after 2FA

### Secret + Edge Function

- Request `RESEND_API_KEY` via the secret tool (Resend, as user specified). Confirm sender domain with user — default proposal: `Fractioneer Security <security@fractioneer.co>` (requires that domain verified in Resend; otherwise use `onboarding@resend.dev` for testing).
- New edge function `supabase/functions/notify-login/index.ts` (verify_jwt = true, default). Accepts authenticated `POST` from the client after AAL2 verifies. Body: `{ user_agent, timezone }`. Function:
  1. Reads caller's user from JWT; pulls `email` + `profiles.full_name`.
  2. Reads client IP from `x-forwarded-for` / `cf-connecting-ip`.
  3. Calls `http://ip-api.com/json/{ip}?fields=status,country,regionName,city`. If `status !== 'success'` or IP is private/localhost (`127.`, `10.`, `192.168.`, `::1`, empty), skip location line.
  4. Parses browser + OS from `user_agent` with a small inline UA parser (no deps).
  5. Renders branded HTML email — dark header bar with the Fractioneer wordmark (inline SVG or hosted PNG URL), white body, monospaced detail lines for Time / Location / Device, footer "Questions? team@fractioneer.co". Plain-text fallback included.
  6. Sends via Resend REST (`POST https://api.resend.com/emails`) with subject "New sign-in to your Fractioneer portal".
  7. Returns `{ ok: true }`; never blocks login on failure (function logs error, client ignores non-2xx).

### Trigger point (`src/routes/portal.verify-2fa.tsx`)

- After successful `mfa.challengeAndVerify` (line 64, before navigate), fire-and-forget:
  ```ts
  supabase.functions.invoke('notify-login', {
    body: { user_agent: navigator.userAgent, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  }).catch(() => {});
  ```
- Not fired from password-only login — only after AAL2 passes, per spec.

## Files touched

- New migration: `notes`, `notes_read_state` tables + RLS + grants + realtime.
- `src/lib/dashboard-widgets.tsx` — new `NotesCard` + catalog entry + `WidgetContext` extension.
- `src/routes/portal.tsx` and `src/routes/portal.admin.tsx` — pass `clientId` + `viewerRole` into widget context.
- `supabase/functions/notify-login/index.ts` (new).
- `src/routes/portal.verify-2fa.tsx` — fire notification on AAL2 success.
- Secret request: `RESEND_API_KEY`.

## Open questions

1. Sender address for the login email — use `security@fractioneer.co` (assuming the domain is verified in Resend), or a different From?
2. Should admins also receive the login email when they sign in, or clients only? (Default: everyone who completes 2FA.)
