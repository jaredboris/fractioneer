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
 * Ensures the authenticated caller has at least one row in `user_roles`.
 * Called on every portal entry: first-time OAuth (e.g. Google) sign-ins
 * land without any role row, so we default them to `client`. Admins can
 * change the row manually afterwards. No-op if any role already exists.
 */
export const ensureMyRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing, error: readErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .limit(1);
    if (readErr) throw new Error(readErr.message);
    if (existing && existing.length > 0) {
      return { role: existing[0].role as "admin" | "client", created: false };
    }
    // No role yet — provision default `client`. Insert requires service role
    // because user_roles RLS does not grant self-insert.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "client" }, { onConflict: "user_id,role" });
    if (insErr) throw new Error(insErr.message);
    return { role: "client" as const, created: true };
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

// ---------------------------------------------------------------------------
// Admin-only: extract financials from Excel rows using Lovable AI.
// The browser parses the .xlsx with SheetJS and sends row JSON here.
// ---------------------------------------------------------------------------

const ExtractedSchema = z.object({
  cash_balance: z.number().nullable(),
  total_ar: z.number().nullable(),
  total_ap: z.number().nullable(),
  net_revenue: z.number().nullable(),
  net_income: z.number().nullable(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  monthly_close_status: z.enum(["open", "closed"]).nullable(),
});

export type ExtractedFinancials = z.infer<typeof ExtractedSchema>;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Forbidden: admin role required");
}

export const extractFinancialsFromRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ rows: z.string().min(1).max(200_000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt =
      "You are a financial data extraction assistant analyzing accounting software exports (QuickBooks, Xero, etc). The data may span multiple sheets, typically an Income Statement (P&L) and a Balance Sheet, with monthly columns and indented subtotal rows. Extract these values, using the MOST RECENT period column when multiple months are present:\n\ncash_balance: the total of all cash and bank accounts. Look for a 'Total for Bank Accounts', 'Total Cash', or sum of checking/savings accounts on the Balance Sheet. Not individual accounts.\n\ntotal_ar: total accounts receivable. Look for 'Total for Accounts Receivable' or 'A/R' total on the Balance Sheet.\n\ntotal_ap: total accounts payable. Look for 'Total for Accounts Payable' or 'A/P' total on the Balance Sheet. If no liabilities section is present, return null.\n\nnet_revenue: total income for the full period shown. Use the 'Total' or 'Total for Income' column if a period total exists; otherwise sum the monthly income figures. Do NOT use a single month's value when a period total is available.\n\nnet_income: the bottom-line 'Net Income' figure for the full period.\n\nperiod_end: the date the statement covers (e.g. the 'As of' date or the last month column header), formatted YYYY-MM-DD.\n\nmonthly_close_status: 'closed' if the statement appears finalized, otherwise 'open'.\n\nReturn ONLY a raw JSON object with these exact keys: cash_balance, total_ar, total_ap, net_revenue, net_income, period_end, monthly_close_status. Use null for any value genuinely not present. Numbers only for financial fields (no currency symbols or commas). No explanation, no markdown.";

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.rows },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const payload = await res.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "";

    // Log usage so the admin overview can show real AI spend (gemini-2.5-pro
    // pricing as of 2026: $1.25 / 1M input tokens, $5 / 1M output tokens).
    try {
      const usage = payload?.usage ?? {};
      const pIn = Number(usage.prompt_tokens ?? 0);
      const pOut = Number(usage.completion_tokens ?? 0);
      const total = Number(usage.total_tokens ?? pIn + pOut);
      const cost = (pIn / 1_000_000) * 1.25 + (pOut / 1_000_000) * 5;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("ai_usage").insert({
        admin_user_id: context.userId,
        client_id: null,
        model: "google/gemini-2.5-pro",
        operation: "extract_financials",
        prompt_tokens: pIn || null,
        completion_tokens: pOut || null,
        total_tokens: total || null,
        estimated_cost_usd: Number.isFinite(cost) ? cost : null,
      });
    } catch {
      /* logging failure must not block the extraction result */
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const stripped = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(stripped);
    }
    return ExtractedSchema.parse(parsed);
  });

export const saveExtractedFinancials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        client_id: z.string().uuid(),
        period: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        cash_balance: z.number().nullable(),
        total_ar: z.number().nullable(),
        total_ap: z.number().nullable(),
        net_revenue: z.number().nullable(),
        net_income: z.number().nullable(),
        monthly_close_status: z.enum(["open", "closed"]).nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("dashboard_data")
      .upsert(
        {
          client_id: data.client_id,
          period: data.period,
          cash_balance: data.cash_balance,
          total_ar: data.total_ar,
          total_ap: data.total_ap,
          net_revenue: data.net_revenue,
          net_income: data.net_income,
          monthly_close_status: data.monthly_close_status,
        },
        { onConflict: "client_id" },
      );
    if (error) throw new Error(error.message);
    const { error: periodError } = await context.supabase
      .from("periods")
      .upsert(
        {
          client_id: data.client_id,
          period_end: data.period,
          cash_balance: data.cash_balance,
          total_ar: data.total_ar,
          total_ap: data.total_ap,
          net_revenue: data.net_revenue,
          net_income: data.net_income,
        },
        { onConflict: "client_id,period_end" },
      );
    if (periodError) throw new Error(periodError.message);
    return { ok: true };
  });



