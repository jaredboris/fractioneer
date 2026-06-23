import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/fractioneer-logo.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";


export const Route = createFileRoute("/portal/verify-2fa")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Verify 2FA — Fractioneer Client Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/portal/login" });
  },
  component: Verify2FAPage,
});

function Verify2FAPage() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (!verified) {
        navigate({ to: "/portal/setup-2fa", replace: true });
        return;
      }
      setFactorId(verified.id);
      setLoading(false);
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
      setCode("");
      return;
    }

    // Fire-and-forget login notification (does not block navigation).
    try {
      void supabase.functions.invoke("notify-login", {
        body: {
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          timezone:
            typeof Intl !== "undefined"
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : "UTC",
        },
      });
    } catch {
      /* never block sign-in on email failure */
    }

    navigate({ to: "/portal", replace: true });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md px-6 py-16">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-md bg-primary/10 p-3 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Two-factor verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app to continue.
          </p>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="block w-full rounded-md border border-input bg-background px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Verify
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
