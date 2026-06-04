import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

/**
 * Admin-only: create a brand-new client end-to-end.
 *  1. Create the auth user (email confirmed) via the service-role admin API
 *  2. Insert/upsert the profile row with company_name and full_name
 *  3. Assign the `client` role in user_roles
 *
 * The caller MUST be an admin (verified server-side against user_roles).
 */
export const createClientAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        password: z.string().min(8).max(72),
        company_name: z.string().min(1).max(255),
        full_name: z.string().min(1).max(255).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // 1. Caller must be admin (re-checked server-side; RLS-friendly via has_role)
    const { supabase, userId } = context;
    const { data: roleRows, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRows || roleRows.length === 0) {
      throw new Error("Forbidden: admin role required");
    }

    // 2. Service-role admin operations (create auth user, write profile + role)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name ?? null,
        company_name: data.company_name,
      },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Failed to create user");
    }
    const newUserId = created.user.id;

    // handle_new_user() trigger inserts the profile; upsert ensures company_name/full_name
    // are set even if the trigger raced or the metadata was incomplete.
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: newUserId,
          company_name: data.company_name,
          full_name: data.full_name ?? null,
        },
        { onConflict: "id" },
      );
    if (profileErr) {
      // Roll back the auth user to avoid orphans
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Profile: ${profileErr.message}`);
    }

    const { error: roleAssignErr } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: newUserId, role: "client" },
        { onConflict: "user_id,role" },
      );
    if (roleAssignErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Role: ${roleAssignErr.message}`);
    }

    return { id: newUserId, email: data.email, company_name: data.company_name };
  });

