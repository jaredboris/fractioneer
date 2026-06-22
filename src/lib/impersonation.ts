import { useEffect, useState } from "react";

/**
 * Admin "view as client" / spy-mode helper. The admin's auth session stays
 * intact (their JWT still has the admin role and RLS lets them read every
 * client row), but every client-portal page reads this overridden client id
 * when it queries `dashboard_data`, `documents`, `periods`, etc.
 *
 * SessionStorage (not localStorage) so impersonation ends when the tab closes.
 */
const KEY = "fractioneer-impersonate";
const EVENT = "fractioneer-impersonate-changed";

type Stored = { clientId: string; label: string };

function read(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.clientId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function startImpersonation(clientId: string, label: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify({ clientId, label }));
  window.dispatchEvent(new Event(EVENT));
}

export function stopImpersonation() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useImpersonation(): Stored | null {
  const [state, setState] = useState<Stored | null>(() => read());
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return state;
}

/** Returns the impersonated client id when active, otherwise the user's own id. */
export function useEffectiveClientId(userId: string | undefined): string | undefined {
  const imp = useImpersonation();
  return imp?.clientId ?? userId;
}
