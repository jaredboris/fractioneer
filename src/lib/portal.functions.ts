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
    const { userId } = context;
    // IMPORTANT: read existing roles via the service-role client. The
    // user-context client is subject to the `user_roles` RLS policies, which
    // require `is_aal2()`. This handler runs in the portal gate BEFORE the
    // user has completed TOTP, so an RLS-scoped SELECT returns empty even
    // when roles already exist — causing us to incorrectly upsert a duplicate
    // `client` row for admins on every fresh login.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (readErr) throw new Error(readErr.message);
    if (existing && existing.length > 0) {
      // Prefer admin if present; otherwise return the first role.
      const role = existing.some((r) => r.role === "admin") ? "admin" : (existing[0].role as "admin" | "client");
      return { role, created: false };
    }
    // No role yet — provision default `client`.
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

const MonthSchema = z.object({
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cash_balance: z.number().nullable(),
  total_ar: z.number().nullable(),
  total_ap: z.number().nullable(),
  net_revenue: z.number().nullable(),
  net_income: z.number().nullable(),
  monthly_close_status: z.enum(["open", "closed"]).nullable(),
});
const ExtractedSchema = z.object({ months: z.array(MonthSchema) });

export type ExtractedMonth = z.infer<typeof MonthSchema>;
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
      "You are a financial data extraction assistant analyzing accounting software exports (QuickBooks, Xero, etc). The data spans multiple sheets — typically an Income Statement (P&L) and a Balance Sheet — often with multiple monthly columns (e.g. Apr 2025, May 2025, … Mar 2026) and indented subtotal rows.\n\nYour task: emit ONE record per monthly column present in the data. Ignore 'Total' / YTD / cumulative columns — those are derived. A single-month export yields 1 record; a 12-month export yields 12 records.\n\nFor EACH month column, extract:\n- period_end: YYYY-MM-DD, the LAST day of that month (column header).\n- net_revenue: that month's value from the 'Total for Income' / 'Total Income' / 'Total Revenue' row on the Income Statement. Single-month value, NOT cumulative.\n- net_income: that month's value from the bottom-line 'Net Income' or 'Net Operating Income' row.\n- cash_balance: as of that month-end, the Balance Sheet 'Total for Bank Accounts' / 'Total Cash' / sum of checking+savings. Point-in-time. Null if Balance Sheet has no column for that month.\n- total_ar: as of that month-end, 'Total for Accounts Receivable' / 'A/R' total. Null if not present for that month.\n- total_ap: as of that month-end, 'Total for Accounts Payable' / 'A/P' total. Null if not present.\n- monthly_close_status: 'closed' if the statement appears finalized, else 'open'. Same value for every month.\n\nReturn ONLY a raw JSON object: { \"months\": [ { period_end, cash_balance, total_ar, total_ap, net_revenue, net_income, monthly_close_status }, ... ] }, sorted ascending by period_end. Numbers only (no currency symbols or commas). Use null for any value genuinely absent. No explanation, no markdown.";


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
        months: z.array(MonthSchema).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    // Upsert every month into periods (most-recent-upload-wins per month).
    const periodRows = data.months.map((m) => ({
      client_id: data.client_id,
      period_end: m.period_end,
      cash_balance: m.cash_balance,
      total_ar: m.total_ar,
      total_ap: m.total_ap,
      net_revenue: m.net_revenue,
      net_income: m.net_income,
    }));
    const { error: periodError } = await context.supabase
      .from("periods")
      .upsert(periodRows, { onConflict: "client_id,period_end" });
    if (periodError) throw new Error(periodError.message);

    // Latest month drives the live client dashboard snapshot.
    const latest = [...data.months].sort((a, b) =>
      a.period_end < b.period_end ? 1 : a.period_end > b.period_end ? -1 : 0,
    )[0];
    const { error } = await context.supabase
      .from("dashboard_data")
      .upsert(
        {
          client_id: data.client_id,
          period: latest.period_end,
          cash_balance: latest.cash_balance,
          total_ar: latest.total_ar,
          total_ap: latest.total_ap,
          net_revenue: latest.net_revenue,
          net_income: latest.net_income,
          monthly_close_status: latest.monthly_close_status,
        },
        { onConflict: "client_id" },
      );
    if (error) throw new Error(error.message);

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("ai_usage").insert({
        admin_user_id: context.userId,
        client_id: data.client_id,
        model: "google/gemini-2.5-pro",
        operation: "save_extracted_financials",
        estimated_cost_usd: 0.03,
      });
    } catch {
      /* logging failure must not block the save */
    }
    return { ok: true, saved: data.months.length };
  });

// ---------------------------------------------------------------------------
// Admin-only: generate descriptive AI insights for a client. Called from the
// admin upload flow right after `saveExtractedFinancials`. Insights are cached
// in the `ai_insights` table — page loads never trigger model calls.
// ---------------------------------------------------------------------------

const INSIGHT_CATEGORIES = [
  "payment_speed",
  "concentration",
  "runway",
  "overdue_ar",
  "seasonality",
  "margin",
] as const;

const InsightSchema = z.object({
  category: z.enum(INSIGHT_CATEGORIES),
  text: z.string().min(1).max(280),
});
const InsightsResponseSchema = z.object({
  insights: z.array(InsightSchema).min(0).max(8),
});

// Words that signal advice rather than description. Insights containing any
// of these are dropped server-side as a belt-and-braces guardrail on top of
// the system prompt.
const ADVISORY_PATTERN =
  /\b(should|must|need to|ought to|recommend|recommended|suggest|suggested|advice|advise|consider|try to|we suggest|you could|you can improve|we recommend|prioritize|focus on)\b/i;

export const generateAiInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        client_id: z.string().uuid(),
        source_rows: z.string().max(400_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { data: periods, error: periodsErr } = await context.supabase
      .from("periods")
      .select("period_end, net_revenue, net_income, gross_margin, cash_balance, total_ar, total_ap")
      .eq("client_id", data.client_id)
      .order("period_end", { ascending: true });
    if (periodsErr) throw new Error(periodsErr.message);

    const systemPrompt = [
      "You are an analyst writing short, FACTUAL insight bullets about a small business's financials for the business owner.",
      "",
      "CRITICAL RULES:",
      "- DESCRIPTIVE statements of fact ONLY. Never advice, never recommendations, never opinions, never next-steps.",
      "- Banned phrasing: 'should', 'must', 'need to', 'recommend', 'suggest', 'consider', 'try to', 'we advise', 'focus on', 'prioritize'.",
      "- State what the data shows ('$145K is over 90 days overdue'), never what to do about it ('you should write these off').",
      "- Each insight <= 140 characters, plain English, no markdown, no emojis.",
      "- If a category has insufficient data in the input, OMIT it. Do not fabricate.",
      "- Return AT MOST one insight per category. Return 0-6 insights total.",
      "",
      "Categories you may produce (use the exact category key):",
      "- payment_speed   - slowest/fastest paying customers and/or average collection period, from invoice & payment dates in the source file.",
      "- concentration   - % of revenue from top customer and/or top 5, from the source file.",
      "- runway          - months current cash covers average burn in down (negative net-income) months, from periods history.",
      "- overdue_ar      - $ and/or customer count in 91+ day aging bucket, from AR aging in the source file.",
      "- seasonality     - highest and lowest revenue months across the periods history.",
      "- margin          - gross margin direction (rising / compressing / flat) month-over-month.",
      "",
      'Output JSON only: { "insights": [ { "category": "...", "text": "..." } ] }. No prose, no markdown.',
    ].join("\n");

    const userPayload = JSON.stringify({
      periods_history: periods ?? [],
      source_file_rows: data.source_rows ?? null,
    }).slice(0, 380_000);

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
          { role: "user", content: userPayload },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
      throw new Error(`AI insights request failed (${res.status}): ${text.slice(0, 200)}`);
    }

    const payload = await res.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "";

    try {
      const usage = payload?.usage ?? {};
      const pIn = Number(usage.prompt_tokens ?? 0);
      const pOut = Number(usage.completion_tokens ?? 0);
      const total = Number(usage.total_tokens ?? pIn + pOut);
      const cost = (pIn / 1_000_000) * 1.25 + (pOut / 1_000_000) * 5;
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("ai_usage").insert({
        admin_user_id: context.userId,
        client_id: data.client_id,
        model: "google/gemini-2.5-pro",
        operation: "generate_ai_insights",
        prompt_tokens: pIn || null,
        completion_tokens: pOut || null,
        total_tokens: total || null,
        estimated_cost_usd: Number.isFinite(cost) ? cost : null,
      });
    } catch {
      /* logging failure must not block the result */
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const stripped = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      parsed = JSON.parse(stripped);
    }
    const validated = InsightsResponseSchema.parse(parsed);

    const seen = new Set<string>();
    const safe = validated.insights.filter((i) => {
      if (ADVISORY_PATTERN.test(i.text)) return false;
      if (seen.has(i.category)) return false;
      seen.add(i.category);
      return true;
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delErr } = await supabaseAdmin
      .from("ai_insights")
      .delete()
      .eq("client_id", data.client_id);
    if (delErr) throw new Error(delErr.message);

    if (safe.length > 0) {
      const { error: insErr } = await supabaseAdmin.from("ai_insights").insert(
        safe.map((i) => ({
          client_id: data.client_id,
          insight_text: i.text,
          category: i.category,
        })),
      );
      if (insErr) throw new Error(insErr.message);
    }

    return { ok: true, count: safe.length };
  });

