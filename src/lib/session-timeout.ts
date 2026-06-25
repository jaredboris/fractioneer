import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const KEY = "fr_last_active";
const TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 hours

export function markActive() {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Synchronous-ish gate. Run this BEFORE rendering any protected route. If
 * `last_active` is older than 8 hours, sign the session out and return true so
 * the caller can redirect to login before render.
 */
export async function enforceInactivityTimeout(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(KEY);
    const last = raw ? Number(raw) : NaN;
    if (Number.isFinite(last) && Date.now() - last > TIMEOUT_MS) {
      window.localStorage.removeItem(KEY);
      try {
        await supabase.auth.signOut();
      } catch {
        /* ignore — we redirect regardless */
      }
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Mounted inside the portal shell. Records user activity on every interaction
 * so the gate above can detect inactivity on the next app load.
 */
export function useInactivityTimeout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (await enforceInactivityTimeout()) {
        if (cancelled) return;
        navigate({ to: "/portal/login", replace: true });
        return;
      }
      markActive();
    })();

    const onActivity = () => markActive();
    const events = [
      "click",
      "keydown",
      "pointerdown",
      "scroll",
      "touchstart",
      "visibilitychange",
    ] as const;
    for (const ev of events) window.addEventListener(ev, onActivity, { passive: true });

    return () => {
      cancelled = true;
      for (const ev of events) window.removeEventListener(ev, onActivity);
    };
  }, [navigate]);

  useEffect(() => {
    markActive();
  }, [pathname]);
}
