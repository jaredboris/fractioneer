import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/fractioneer-logo.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/portal/setup-2fa")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set up 2FA — Fractioneer Client Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/portal/login" });
  },
  component: Setup2FAPage,
});

function Setup2FAPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Clean up any unverified leftovers from a previous attempt.
        const { data: list } = await supabase.auth.mfa.listFactors();
        const unverified = list?.all?.filter((f) => f.status === "unverified") ?? [];
        for (const f of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
        const verified = list?.totp?.find((f) => f.status === "verified");
        if (verified) {
          // Already enrolled — go verify instead.
          navigate({ to: "/portal/verify-2fa", replace: true });
          return;
        }

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Fractioneer ${Date.now()}`,
        });
        if (error) throw error;
        if (cancelled) return;
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to start 2FA setup");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setVerifying(true);
    setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    setVerifying(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/portal", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-xl px-6 py-12">
        <div className="rounded-xl border border-border bg-card p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Set up two-factor authentication</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Required to access your portal. Use Google Authenticator, Authy, or 1Password.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <ol className="space-y-4 text-sm text-foreground">
                <li>
                  <div className="font-medium">1. Scan this QR code with your authenticator app</div>
                  {qr && (
                    <div className="mt-3 inline-block rounded-md border border-border bg-white p-3">
                      <img src={qr} alt="2FA QR code" className="h-48 w-48" />
                    </div>
                  )}
                </li>
                <li>
                  <div className="font-medium">Can't scan? Enter this key manually:</div>
                  <code className="mt-2 inline-block break-all rounded bg-muted px-2 py-1 font-mono text-xs">
                    {secret}
                  </code>
                </li>
                <li>
                  <div className="font-medium">2. Enter the 6-digit code from your app</div>
                  <form onSubmit={handleVerify} className="mt-3 flex gap-2">
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
                      className="block w-40 rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-widest text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      disabled={verifying || code.length !== 6}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Verify & enable
                    </button>
                  </form>
                </li>
              </ol>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
