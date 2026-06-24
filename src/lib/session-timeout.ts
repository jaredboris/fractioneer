import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const KEY = "fr_last_active";
const TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours
const WRITE_THROTTLE_MS = 30 * 1000;

let lastWrite = 0;
function markActive() {
  const now = Date.now();
  if (now - lastWrite < WRITE_THROTTLE_MS) return;
  lastWrite = now;
  try {
    window.localStorage.setItem(KEY, String(now));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Hook mounted inside the portal shell. On first load, if it's been more than
 * 8 hours since the last recorded activity, sign the user out and bounce to
 * /portal/login — re-auth (password + 2FA) is then required. Otherwise wires
 * up listeners that record activity on user interaction and route changes.
 */
export function useInactivityTimeout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = window.localStorage.getItem(KEY);
        const last = raw ? Number(raw) : NaN;
        if (Number.isFinite(last) && Date.now() - last > TIMEOUT_MS) {
          window.localStorage.removeItem(KEY);
          await supabase.auth.signOut();
          if (cancelled) return;
          navigate({ to: "/portal/login", replace: true });
          return;
        }
      } catch {
        /* ignore */
      }
      markActive();
    })();

    const onActivity = () => markActive();
    window.addEventListener("click", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    window.addEventListener("visibilitychange", onActivity);

    return () => {
      cancelled = true;
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("visibilitychange", onActivity);
    };
  }, [navigate]);

  // Route changes count as activity.
  useEffect(() => {
    markActive();
  }, [pathname]);
}
