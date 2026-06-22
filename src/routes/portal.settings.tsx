import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { getMyRole } from "@/lib/portal.functions";
import { useCompanyName } from "@/hooks/useProfile";
import { useEffectiveClientId, useImpersonation } from "@/lib/impersonation";

export const Route = createFileRoute("/portal/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  // Auth/MFA gating is handled by the parent `/portal` route. Re-running
  // those async checks here caused a brief blank flash on every sidebar
  // navigation — children inherit `{ user }` from the parent context.
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext() as {
    user: { id: string; email?: string | null };
  };
  const impersonation = useImpersonation();
  const effectiveId = useEffectiveClientId(user.id)!;
  const companyName = useCompanyName(effectiveId);
  const [impersonatedEmail, setImpersonatedEmail] = useState<string | null>(null);
  const displayEmail = impersonation ? impersonatedEmail : user.email ?? null;
  useEffect(() => {
    if (!impersonation) { setImpersonatedEmail(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", effectiveId).maybeSingle();
      if (!cancelled) setImpersonatedEmail(data?.full_name ?? null);
    })();
    return () => { cancelled = true; };
  }, [impersonation, effectiveId]);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await getMyRole();
        if (!cancelled) setRole(r.role);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  return (
    <div className="flex min-h-screen bg-[#EEF2FA] dark:bg-[#0A0F1E]">
      <PortalSidebar companyName={companyName} email={displayEmail} role={impersonation ? "client" : role} />
      <main className="flex-1 px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#9CA3AF]">
            Account details and security.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border p-5 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Account
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-slate-500 dark:text-[#6B7280]">Company</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-white">
                  {companyName || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-[#6B7280]">
                  {impersonation ? "Contact name" : "Email"}
                </dt>
                <dd className="mt-0.5 text-slate-900 dark:text-white">{displayEmail ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-[#6B7280]">Role</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                    {impersonation ? "client" : role ?? "—"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          {impersonation ? (
            <section className="rounded-xl border p-5 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
                Security
              </h2>
              <p className="mt-4 text-sm text-slate-500 dark:text-[#9CA3AF]">
                MFA factors belong to the client's own auth session and cannot be inspected from spy mode.
              </p>
            </section>
          ) : (
            <SecurityCard />
          )}
        </div>
      </main>
    </div>
  );
}

function SecurityCard() {
  const [reenrolling, setReenrolling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function startReenroll() {
    setError(null);
    setSuccess(false);
    setReenrolling(true);
    setLoading(true);
    try {
      // Clean up any unverified leftovers so a fresh enrollment can proceed.
      const { data: list } = await supabase.auth.mfa.listFactors();
      const unverified = list?.all?.filter((f) => f.status === "unverified") ?? [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Fractioneer Portal ${Date.now()}`,
        issuer: "Fractioneer Portal",
      });
      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start re-enrollment");
      setReenrolling(false);
    } finally {
      setLoading(false);
    }
  }

  async function cancelReenroll() {
    if (factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch {}
    }
    setReenrolling(false);
    setQr(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
    setError(null);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setVerifying(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      // Verified the new factor — remove any other verified TOTP factors so
      // only the new device works going forward.
      const { data: list } = await supabase.auth.mfa.listFactors();
      const others = (list?.totp ?? []).filter(
        (f) => f.status === "verified" && f.id !== factorId,
      );
      for (const f of others) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      setSuccess(true);
      setReenrolling(false);
      setQr(null);
      setSecret(null);
      setFactorId(null);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <section className="rounded-xl border p-5 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
        Security
      </h2>

      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          2FA Enabled
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600 dark:text-[#9CA3AF]">
        Two-factor authentication is required on every sign-in.
      </p>

      {success && (
        <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Authenticator updated. Use your new device on the next sign-in.
        </div>
      )}

      {!reenrolling ? (
        <>
          <button
            type="button"
            onClick={startReenroll}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors bg-white border-[#E5E9F1] text-slate-700 hover:bg-slate-50 dark:bg-[#0F1729] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-enroll authenticator
          </button>
          <p className="mt-3 text-xs text-slate-500 dark:text-[#6B7280]">
            Lost access to your authenticator? Contact{" "}
            <a
              href="mailto:team@fractioneer.co"
              className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-[#E5E7EB]"
            >
              team@fractioneer.co
            </a>
          </p>
        </>
      ) : (
        <div className="mt-4 rounded-lg border border-[#E5E9F1] bg-slate-50/60 p-4 dark:border-[#1E2A3A] dark:bg-[#0F1729]">
          {error && (
            <div className="mb-3 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-4 text-sm text-slate-800 dark:text-[#E5E7EB]">
              <div>
                <div className="font-medium">1. Scan with your authenticator app</div>
                {qr && (
                  <div className="mt-2 inline-block rounded-md border border-[#E5E9F1] bg-white p-2 dark:border-[#1E2A3A]">
                    <img src={qr} alt="2FA QR code" className="h-40 w-40" />
                  </div>
                )}
                {secret && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-[#9CA3AF]">
                    Or enter this key:{" "}
                    <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:bg-[#1E2A3A] dark:text-[#E5E7EB]">
                      {secret}
                    </code>
                  </div>
                )}
              </div>
              <form onSubmit={handleVerify}>
                <div className="font-medium">2. Enter the 6-digit code</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="block w-36 rounded-md border border-[#E5E9F1] bg-white px-3 py-2 text-center font-mono text-base tracking-widest text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-[#1E2A3A] dark:bg-[#0A0F1E] dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Verify & replace
                  </button>
                  <button
                    type="button"
                    onClick={cancelReenroll}
                    className="inline-flex items-center rounded-md border border-[#E5E9F1] bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#1E2A3A] dark:bg-[#0F1729] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
