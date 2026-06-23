## 1. Forgot password flow

- Add a "Forgot password?" link under the password field on `src/routes/portal.login.tsx`, linking to a new route `/portal/forgot-password`.
- Create `src/routes/portal.forgot-password.tsx` (ssr: false, noindex):
  - Matches the existing dark login card styling (logo, card, inputs, primary button).
  - Email input + submit → `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${window.location.origin}/portal/reset-password })`.
  - Inline success state ("Check your email for the reset link") and inline error.
  - "← Back to sign in" link to `/portal/login`.
- Create `src/routes/portal.reset-password.tsx` (ssr: false, noindex, public — must be reachable without 2FA):
  - On mount, watch `supabase.auth.onAuthStateChange` for `PASSWORD_RECOVERY` (Supabase fires this when the email link lands).
  - Form: new password + confirm new password. Submit → `supabase.auth.updateUser({ password })`.
  - On success: sign the user out (so they can't slip past 2FA via the recovery session), show "Password updated — redirecting to sign in", then `navigate({ to: "/portal/login" })`.
  - Add `/portal/reset-password` to the portal `beforeLoad` bypass list alongside login / setup-2fa / verify-2fa.

## 2. Change Password in Settings

In `src/routes/portal.settings.tsx`, add a new `ChangePasswordCard` section rendered alongside `SecurityCard` (hidden in impersonation mode):
- Three inputs: current password, new password, confirm new password.
- On submit:
  1. Re-authenticate by calling `supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })`. If it fails, show "Current password is incorrect".
  2. Validate new === confirm and min length 8; otherwise inline error.
  3. Call `supabase.auth.updateUser({ password: newPassword })`.
  4. On success, clear fields and show inline green "Password updated" message.
- Styling matches existing cards (same border/bg tokens, blue primary button, red error box).

## 3. Persist dark/light mode preference (no-flash)

`ThemeToggle` already writes to `localStorage` under `fractioneer-portal-theme`, but the class is only applied after React mounts → flash of light mode.

- Add a tiny pre-hydration script in `src/routes/__root.tsx` `head()` (as a `script` tag with inline content) that, before paint, reads `localStorage.getItem('fractioneer-portal-theme')`, falls back to `prefers-color-scheme`, and sets `document.documentElement.classList.toggle('dark', ...)` and `colorScheme`.
- Update `ThemeToggle.getInitialTheme()` to also consider `prefers-color-scheme` when no stored value exists, so it matches what the pre-hydration script applied (no mismatch flicker).

## 4. Fix 2FA bypass on saved sessions

Root cause: Supabase persists the access token in localStorage with its `aal` claim. A user who completed 2FA in a previous browser session returns with `currentLevel === "aal2"` already, so the gate in `src/routes/portal.tsx` never redirects to `/portal/verify-2fa`. Supabase does not let you downgrade AAL.

Fix — require a per-tab "verified this session" flag:

- Add a small helper module `src/lib/mfa-session.ts`:
  - `markMfaVerifiedThisSession()` → `sessionStorage.setItem('fractioneer-mfa-verified', '1')`
  - `wasMfaVerifiedThisSession()` → boolean
  - `clearMfaVerifiedThisSession()`
  - `sessionStorage` (not localStorage) so it naturally resets when the tab/browser is closed.
- In `src/routes/portal.tsx` `beforeLoad`, after the existing `getAuthenticatorAssuranceLevel()` block:
  - If the user has any verified TOTP factor (call `supabase.auth.mfa.listFactors()`; cache result per-call) AND `wasMfaVerifiedThisSession()` is false → `throw redirect({ to: "/portal/verify-2fa" })`, even when `currentLevel === "aal2"`.
  - This guarantees every fresh tab/app load re-verifies, regardless of stored session AAL.
- In `src/routes/portal.verify-2fa.tsx`, after a successful `challengeAndVerify`, call `markMfaVerifiedThisSession()` before navigating to `/portal`.
- In every sign-out path (`PortalHeader.handleLogout`, `verify-2fa.handleSignOut`, settings re-enrollment if relevant, reset-password sign-out) call `clearMfaVerifiedThisSession()`.
- Also clear the flag inside the existing `onAuthStateChange` listener at the top of `portal.tsx` on `SIGNED_OUT` and `SIGNED_IN` (a new sign-in must re-verify).

## Technical notes

- All new routes use `ssr: false` and `robots: noindex` to match existing portal routes.
- `/portal/reset-password` must NOT be under `/portal` auth gate — it is added to the bypass list so Supabase's recovery session can render the form.
- The pre-hydration theme script must be inline (not an external src) so it runs before first paint.
- The MFA gate adds one extra `listFactors()` call per portal navigation; cheap and necessary since AAL alone is unreliable across saved sessions.

## Files

- New: `src/routes/portal.forgot-password.tsx`, `src/routes/portal.reset-password.tsx`, `src/lib/mfa-session.ts`
- Edited: `src/routes/portal.login.tsx`, `src/routes/portal.settings.tsx`, `src/routes/portal.tsx`, `src/routes/portal.verify-2fa.tsx`, `src/routes/__root.tsx`, `src/components/ThemeToggle.tsx`
