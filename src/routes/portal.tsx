import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, FileText, Download, Wallet, TrendingUp, Receipt, LogOut, Settings } from "lucide-react";
import logo from "@/assets/fractioneer-logo.jpg";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/portal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Client Portal — Fractioneer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/portal/login" });
    return { user: data.user };
  },
  component: PortalPage,
});

type Tone = "ok" | "warn" | "info";

const FALLBACK_CARDS: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: React.ReactNode;
}[] = [
  { label: "Monthly Close", value: "—", detail: "Not set yet", tone: "info", icon: <CheckCircle2 className="h-5 w-5" /> },
  { label: "Cash Position", value: "—", detail: "Not set yet", tone: "info", icon: <Wallet className="h-5 w-5" /> },
  { label: "AP / AR Status", value: "—", detail: "Not set yet", tone: "info", icon: <Receipt className="h-5 w-5" /> },
];

function toneForMonthly(v: string): Tone {
  if (v === "Delayed") return "warn";
  return "ok";
}
function toneForApAr(v: string): Tone {
  return v === "Behind" ? "warn" : "ok";
}


function toneClasses(tone: Tone) {
  switch (tone) {
    case "ok":
      return "bg-accent/10 text-accent";
    case "warn":
      return "bg-destructive/10 text-destructive";
    case "info":
      return "bg-primary/10 text-primary";
  }
}

function PortalPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState<string>("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("company_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setCompanyName(profile?.company_name ?? "");
      setRole(roles && roles.length > 0 ? roles[0].role : null);
    })();
    return () => { cancelled = true; };
  }, [user.id]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/portal/login", replace: true });
  }

  const displayName = companyName || user.email || "Welcome";

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
              Client Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">{displayName}</div>
              <div className="text-xs text-muted-foreground">
                {user.email}
                {role && <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">{role}</span>}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back{companyName ? `, ${companyName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's the latest snapshot of your finance operations.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statusCards.map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(10,31,68,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${toneClasses(c.tone)}`}
                >
                  {c.icon}
                </span>
              </div>
              <div className="mt-4 text-2xl font-semibold text-foreground">{c.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.detail}</div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MiniMetric label="Revenue (MTD)" value="$612,480" trend="+8.2%" />
          <MiniMetric label="Operating margin" value="22.4%" trend="+1.1pt" />
          <MiniMetric label="Royalties collected" value="94%" trend="On pace" />
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent documents</h2>
              <p className="text-sm text-muted-foreground">
                Reports and reconciliations shared by your Fractioneer team.
              </p>
            </div>
            <button className="text-xs font-medium text-accent hover:underline">View all</button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {documents.map((doc) => (
                <li
                  key={doc.name}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{doc.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded {doc.date} · {doc.size}
                      </div>
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    aria-label={`Download ${doc.name}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Need something? Email your Fractioneer team at{" "}
          <a href="mailto:team@fractioneer.co" className="text-accent hover:underline">
            team@fractioneer.co
          </a>
        </footer>
      </main>
    </div>
  );
}

function MiniMetric({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-accent" />
        {label}
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xl font-semibold text-foreground">{value}</span>
        <span className="text-xs font-medium text-accent">{trend}</span>
      </div>
    </div>
  );
}
