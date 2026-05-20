import logo from "@/assets/fractioneer-logo.jpg";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="bg-white inline-flex rounded-md p-2">
              <img src={logo} alt="Fractioneer" className="h-7 w-auto" />
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              Finance operations for franchisors, franchise platforms, multi-unit operators, and PE-backed brands.
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Services
            </div>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#services" className="hover:text-accent">Fractional CFO</a></li>
              <li><a href="#services" className="hover:text-accent">Controller</a></li>
              <li><a href="#services" className="hover:text-accent">Bookkeeping</a></li>
              <li><a href="#services" className="hover:text-accent">Payroll & AP/AR</a></li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              Company
            </div>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#approach" className="hover:text-accent">Approach</a></li>
              <li><a href="#team" className="hover:text-accent">Team</a></li>
              <li><a href="#faq" className="hover:text-accent">FAQ</a></li>
              <li><a href="#contact" className="hover:text-accent">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-primary-foreground/60">
          <div>© {new Date().getFullYear()} Fractioneer. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent">Privacy</a>
            <a href="#" className="hover:text-accent">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
