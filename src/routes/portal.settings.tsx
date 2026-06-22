import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { getMyRole, ensureMyRole } from "@/lib/portal.functions";

export const Route = createFileRoute("/portal/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/portal/login" });
    try {
      await ensureMyRole();
    } catch {}
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal) {
      if (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        throw redirect({ to: "/portal/verify-2fa" });
      }
      if (aal.nextLevel === "aal1" && aal.currentLevel === "aal1") {
        throw redirect({ to: "/portal/setup-2fa" });
      }
    }
    return { user: data.user };
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext() as {
    user: { id: string; email?: string | null };
  };
  const [companyName, setCompanyName] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setCompanyName(profile?.company_name ?? "");
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
      <PortalSidebar companyName={companyName} email={user.email ?? null} role={role} />
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
                <dt className="text-xs text-slate-500 dark:text-[#6B7280]">Email</dt>
                <dd className="mt-0.5 text-slate-900 dark:text-white">{user.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500 dark:text-[#6B7280]">Role</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex items-center rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                    {role ?? "—"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border p-5 bg-white border-[#E5E9F1] dark:bg-[#111827] dark:border-[#1E2A3A]">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-[#9CA3AF]">
              Security
            </h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-[#9CA3AF]">
              Two-factor authentication is enabled on your account. To re-enroll a new device,
              contact your Fractioneer team.
            </p>
            <a
              href="mailto:team@fractioneer.co"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors bg-white border-[#E5E9F1] text-slate-700 hover:bg-slate-50 dark:bg-[#0F1729] dark:border-[#1E2A3A] dark:text-[#E5E7EB] dark:hover:bg-[#1a2335]"
            >
              Contact team
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
