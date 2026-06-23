// Per-tab flag that records whether the user has completed TOTP 2FA in this
// browser session. Supabase stores AAL2 in the persisted JWT, so a saved
// session would otherwise bypass the 2FA prompt on the next app load.
// sessionStorage clears when the tab/browser closes — exactly the lifetime
// we want for "you verified in this session".

const KEY = "fractioneer-mfa-verified";

export function markMfaVerifiedThisSession() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {}
}

export function wasMfaVerifiedThisSession(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function clearMfaVerifiedThisSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
