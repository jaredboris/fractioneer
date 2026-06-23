// Edge function: send a "new sign-in" email after AAL2 verification.
// Invoked from the client right after supabase.auth.mfa.challengeAndVerify
// succeeds. Uses Resend for delivery and ip-api.com for IP geolocation.
//
// Required secrets (project-scoped, server-side):
//   - RESEND_API_KEY
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FROM = "Fractioneer Security <security@fractioneer.co>";
const REPLY_TO = "team@fractioneer.co";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      console.error("[notify-login] RESEND_API_KEY missing");
      return json({ ok: false, error: "email_not_configured" }, 500);
    }

    // Validate the caller via their JWT.
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user?.email) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    const user = userData.user;

    const body = await safeJson(req);
    const userAgent = String(body.user_agent ?? req.headers.get("user-agent") ?? "");
    const timezone = String(body.timezone ?? "UTC");

    // Best-effort: pull display name.
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", user.id)
      .maybeSingle();
    const displayName =
      profile?.full_name || profile?.company_name || user.email?.split("@")[0] || "there";

    // Client IP
    const ip = pickClientIp(req);
    const location = await lookupLocation(ip);
    const device = parseUserAgent(userAgent);
    const when = formatWhen(timezone);

    const subject = "New sign-in to your Fractioneer portal";
    const html = renderHtml({ displayName, when, location, device });
    const text = renderText({ displayName, when, location, device });

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [user.email],
        reply_to: REPLY_TO,
        subject,
        html,
        text,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      console.error("[notify-login] resend failed", resp.status, errBody);
      return json({ ok: false, error: "send_failed", status: resp.status }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("[notify-login] unexpected", e);
    return json({ ok: false, error: "internal" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function safeJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

function pickClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("172.")) {
    const second = Number(ip.split(".")[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

async function lookupLocation(ip: string): Promise<string | null> {
  if (isPrivateIp(ip)) return null;
  try {
    const r = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city`,
      { signal: AbortSignal.timeout(3000) },
    );
    if (!r.ok) return null;
    const j = await r.json();
    if (j?.status !== "success") return null;
    const parts = [j.city, j.regionName, j.country].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown device";
  let os = "Unknown OS";
  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X ([\d_\.]+)/i.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_\.]+)/i);
    os = `macOS ${m?.[1]?.replace(/_/g, ".") ?? ""}`.trim();
  } else if (/iPhone OS ([\d_]+)/i.test(ua)) {
    const m = ua.match(/iPhone OS ([\d_]+)/i);
    os = `iOS ${m?.[1]?.replace(/_/g, ".") ?? ""}`.trim();
  } else if (/Android ([\d\.]+)/i.test(ua)) {
    const m = ua.match(/Android ([\d\.]+)/i);
    os = `Android ${m?.[1] ?? ""}`.trim();
  } else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown browser";
  if (/Edg\/([\d\.]+)/.test(ua)) browser = `Edge ${ua.match(/Edg\/([\d\.]+)/)?.[1] ?? ""}`;
  else if (/OPR\/([\d\.]+)/.test(ua)) browser = `Opera ${ua.match(/OPR\/([\d\.]+)/)?.[1] ?? ""}`;
  else if (/Chrome\/([\d\.]+)/.test(ua) && !/Chromium/.test(ua))
    browser = `Chrome ${ua.match(/Chrome\/([\d\.]+)/)?.[1] ?? ""}`;
  else if (/Firefox\/([\d\.]+)/.test(ua))
    browser = `Firefox ${ua.match(/Firefox\/([\d\.]+)/)?.[1] ?? ""}`;
  else if (/Safari\/([\d\.]+)/.test(ua) && /Version\/([\d\.]+)/.test(ua))
    browser = `Safari ${ua.match(/Version\/([\d\.]+)/)?.[1] ?? ""}`;

  return `${browser.trim()} on ${os}`.trim();
}

function formatWhen(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "UTC",
      dateStyle: "full",
      timeStyle: "long",
    }).format(new Date());
  } catch {
    return new Date().toUTCString();
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml({
  displayName,
  when,
  location,
  device,
}: {
  displayName: string;
  when: string;
  location: string | null;
  device: string;
}): string {
  const rows: { label: string; value: string }[] = [
    { label: "Time", value: when },
    ...(location ? [{ label: "Location", value: location }] : []),
    { label: "Device", value: device },
  ];
  const rowHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;width:100px;vertical-align:top;">${escape(r.label)}</td>
        <td style="padding:8px 0;color:#0F172A;font-size:14px;font-family:'SFMono-Regular',Consolas,Menlo,monospace;">${escape(r.value)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>New sign-in</title></head>
<body style="margin:0;padding:0;background:#F5F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FB;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E9F1;">
        <tr>
          <td style="background:#0A0F1E;padding:20px 28px;">
            <div style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:0.02em;">Fractioneer</div>
            <div style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.12em;margin-top:2px;">Security Alert</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#0F172A;">New sign-in to your Fractioneer portal</h1>
            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">
              Hi ${escape(displayName)}, a new sign-in was detected on your Fractioneer account.
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E5E9F1;border-bottom:1px solid #E5E9F1;margin:16px 0;">
              ${rowHtml}
            </table>
            <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#475569;">
              If this wasn't you, contact <a href="mailto:team@fractioneer.co" style="color:#3B82F6;text-decoration:none;">team@fractioneer.co</a> immediately and change your password.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFC;padding:14px 28px;border-top:1px solid #E5E9F1;">
            <div style="font-size:11px;color:#94A3B8;">Questions? Reach us at <a href="mailto:team@fractioneer.co" style="color:#64748B;">team@fractioneer.co</a></div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText({
  displayName,
  when,
  location,
  device,
}: {
  displayName: string;
  when: string;
  location: string | null;
  device: string;
}): string {
  const lines = [
    `Hi ${displayName},`,
    ``,
    `A new sign-in was detected on your Fractioneer account.`,
    ``,
    `Time:     ${when}`,
    ...(location ? [`Location: ${location}`] : []),
    `Device:   ${device}`,
    ``,
    `If this wasn't you, contact team@fractioneer.co immediately and change your password.`,
  ];
  return lines.join("\n");
}
