import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/fractioneer-logo-dark.svg";
import { cn } from "@/lib/utils";
import { BookACallButton } from "./BookACallButton";

type NavLink = { href: string; label: string };

const desktopLinks: NavLink[] = [
  { href: "#services", label: "Services" },
  { href: "#who-we-help", label: "Who We Help" },
  { href: "#clients", label: "Clients" },
  { href: "#team", label: "Team" },
];

const mobileLinks: NavLink[] = [
  ...desktopLinks,
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-background/85 backdrop-blur transition-shadow",
        scrolled && "border-b border-border shadow-[0_1px_0_rgba(10,31,68,0.04)]",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
        <a href="#top" className="flex h-[40px] items-center overflow-hidden" aria-label="Fractioneer home">
          <img
            src={logo}
            alt="Fractioneer Finance Operations"
            className="h-full w-auto"
          />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {desktopLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-foreground/80 hover:text-accent transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <BookACallButton variant="nav" />
        </div>

        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col gap-1">
            {mobileLinks.map((l: { href: string; label: string }) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-foreground/80"
              >
                {l.label}
              </a>
            ))}
            <BookACallButton variant="nav" className="mt-3 w-full" />
          </div>
        </div>
      )}
    </header>
  );
}
