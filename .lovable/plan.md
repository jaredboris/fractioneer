## Changes

### 1. Remove "Reviewed by your Fractioneer team" badge from Reports cards
`src/routes/portal.reports.tsx` lines 205–208: delete the badge div. Leave the dashboard badge in `portal.tsx` untouched (request scoped to Reports tab).

### 2. Fix 8-hour inactivity timeout

**Root cause**: the check runs inside `useInactivityTimeout()`, mounted only after `PortalShell` renders. By then the authenticated subtree gate has already let the user in and rendered. The `last_active` key is also throttled (30s) and not always updated.

**Fix in `src/lib/session-timeout.ts`**:
- Drop throttle — write `last_active` on every interaction (cheap, single localStorage call).
- Listen on `click`, `keydown`, `pointerdown`, `scroll`, `touchstart` in addition to current set; record route changes (already present).
- Export a synchronous `enforceInactivityTimeout()` that reads `last_active` and, if expired, calls `supabase.auth.signOut()` and returns `true`.

**Run the check before the app renders**:
- In `src/routes/_authenticated/route.tsx`'s `beforeLoad` (already `ssr: false`, client-only), call `enforceInactivityTimeout()` first; if expired, `throw redirect({ to: "/portal/login" })` before the existing `getUser()` check. This blocks render of any protected route until the check completes.
- Keep `useInactivityTimeout()` mounted in `PortalShell` for the live interaction listeners (no functional change there beyond the listener/throttle updates).

The managed `_authenticated/route.tsx` is integration-managed and normally shouldn't be edited — but the existing project already customizes it (the portal lives at `/portal`, not under `_authenticated/`). I'll verify which gate file actually protects `/portal/*` and patch that one (likely a `beforeLoad` inside `src/routes/portal.tsx` or a `portal` layout route). If the gate is in `portal.tsx`, add the `enforceInactivityTimeout()` call at the top of that route's `beforeLoad`.

### Out of scope
- Dashboard badge in `portal.tsx`.
- Supabase session length / refresh token settings.
