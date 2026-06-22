import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "fractioneer-portal-profile";

type CachedProfile = { userId: string; companyName: string };

function readCache(userId: string): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as CachedProfile;
    if (parsed.userId !== userId) return "";
    return parsed.companyName ?? "";
  } catch {
    return "";
  }
}

function writeCache(userId: string, companyName: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ userId, companyName } satisfies CachedProfile),
    );
  } catch {
    /* ignore */
  }
}

/**
 * Returns the user's company_name, hydrating immediately from localStorage so
 * portal pages don't flicker to the email fallback during route transitions.
 */
export function useCompanyName(userId: string | undefined): string {
  const [companyName, setCompanyName] = useState<string>(() =>
    userId ? readCache(userId) : "",
  );

  useEffect(() => {
    if (!userId) return;
    // Re-hydrate from cache when userId changes (e.g. account switch).
    const cached = readCache(userId);
    if (cached) setCompanyName(cached);

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", userId)
        .maybeSingle();
      if (cancelled) return;
      const next = data?.company_name ?? "";
      // Only overwrite cached value when we got something non-empty, so a
      // transient null doesn't flash the email fallback.
      if (next) {
        setCompanyName(next);
        writeCache(userId, next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return companyName;
}
