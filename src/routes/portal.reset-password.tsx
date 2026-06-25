import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import logo from "@/assets/fractioneer-logo.jpg";

export const Route = createFileRoute("/portal/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — Fractioneer Client Portal" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands via the email link.
    // We also accept an existing session (e.g. clicked from a logged-in tab).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    })();
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Sign out so the recovery session can't slip past the 2FA gate.
    await supabase.auth.signOut();
    setDone(true);
    setLoading(false);
    setTimeout(() => navigate({ to: "/portal/login", replace: true }), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <img src={logo} alt="Fractioneer" className="h-8 w-auto" />
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Client Portal
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_3px_rgba(10,31,68,0.06)]">
          <h1 className="text-lg font-semibold text-foreground">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set a new password for your Fractioneer portal account.
          </p>

          {done ? (
            <div className="mt-5 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-sm text-foreground">
              Password updated — redirecting to sign in…
            </div>
          ) : !ready ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Waiting for the recovery link…
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-medium text-foreground">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-xs font-medium text-foreground">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/portal/login" className="hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
