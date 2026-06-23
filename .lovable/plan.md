## Fix overly aggressive 2FA gate

The portal gate in `src/routes/portal.tsx` currently runs two checks:

1. The Supabase AAL check (correct).
2. A per-tab `sessionStorage` flag (`wasMfaVerifiedThisSession`) that forces re-verification any time the tab hasn't seen a verify event — including normal refreshes where the saved session is already `aal2`.

That second check is what makes refresh feel aggressive. Remove it and rely solely on Supabase's AAL state, which already represents "this session has verified TOTP."

### Changes

**`src/routes/portal.tsx`**
- Delete the `wasMfaVerifiedThisSession` block (lines ~154-163).
- Remove the `wasMfaVerifiedThisSession` / `clearMfaVerifiedThisSession` imports.
- Keep the AAL check exactly as-is: redirect to `/portal/verify-2fa` only when `currentLevel === "aal1"` and `nextLevel === "aal2"`. If `currentLevel === "aal2"`, no redirect.

**`src/routes/portal.verify-2fa.tsx`**
- Remove the `markMfaVerifiedThisSession` / `clearMfaVerifiedThisSession` calls and import (no longer needed; AAL upgrades to `aal2` on successful challenge).

**`src/routes/portal.reset-password.tsx`**
- Remove the `clearMfaVerifiedThisSession` import/call.

**`src/lib/mfa-session.ts`**
- Delete the file (no remaining references).

### Result

- Fresh login at `aal1` with a verified TOTP factor → redirected to `/portal/verify-2fa`.
- After successful TOTP challenge → session becomes `aal2`; user lands on the dashboard.
- Subsequent refreshes / new tabs while signed in → AAL is `aal2`, no redirect.
- Sign out → Supabase clears the session; next sign-in starts back at `aal1` and re-prompts.
