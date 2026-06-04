import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-verified role lookup. Reads the caller's role from `user_roles`
 * using a Supabase client bound to the authenticated user (RLS applies).
 * Returns `"admin" | "client" | null`. Cannot be spoofed from the browser.
 */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => r.role as string);
    if (roles.includes("admin")) return { userId, role: "admin" as const };
    if (roles.includes("client")) return { userId, role: "client" as const };
    return { userId, role: null };
  });
