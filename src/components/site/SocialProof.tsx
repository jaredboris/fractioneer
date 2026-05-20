import { Section } from "./Section";
import abaco from "@/assets/logos/abaco.png";
import frandevco from "@/assets/logos/frandevco.png";
import homefront from "@/assets/logos/homefront-brands.png";
import patchmaster from "@/assets/logos/patchmaster.png";
import costaOil from "@/assets/logos/costa-oil.webp";
import frenchies from "@/assets/logos/frenchies.png";
import bishops from "@/assets/logos/bishops.png";
import gedLawyers from "@/assets/logos/ged-lawyers.jpg";
import pretium from "@/assets/logos/pretium.webp";
import mpk from "@/assets/logos/mpk-equity.png";
import riverside from "@/assets/logos/riverside.gif";
import lashLounge from "@/assets/logos/lash-lounge.webp";
import youngChefs from "@/assets/logos/young-chefs-academy.png";
import weaver from "@/assets/logos/weaver-materiel.webp";

type Logo = { name: string; src?: string; wordmark?: string; href: string };

const heroLogos: Logo[] = [
  { name: "Abaco", src: abaco, href: "https://abaco.co/" },
  { name: "Riverside", src: riverside, href: "https://www.riversidecompany.com/" },
  { name: "FranDevCo", src: frandevco, href: "https://www.frandev.co/" },
  { name: "HomeFront Brands", src: homefront, href: "https://homefrontbrands.com/" },
  { name: "PatchMaster", src: patchmaster, href: "https://patchmaster.com/" },
  { name: "The Lash Lounge", src: lashLounge, href: "https://franchise.thelashlounge.com/" },
  { name: "Young Chefs Academy", src: youngChefs, href: "https://franchise.youngchefsacademy.com/" },
  { name: "Costa Oil", src: costaOil, href: "https://costaoils.com/" },
];

const selectedLogos: Logo[] = [
  { name: "MPK Equity Partners", src: mpk, href: "https://mpkequitypartners.com/" },
  { name: "Pretium", src: pretium, href: "https://pretium.com/" },
  { name: "Frenchies", src: frenchies, href: "https://frenchiesnails.com/" },
  { name: "Bishops", src: bishops, href: "https://bishops.co/" },
  { name: "Weaver Materiel", src: weaver, href: "https://wmsinc.com/" },
  { name: "Ged Lawyers", src: gedLawyers, href: "https://www.gedlawyers.com/" },
];

const proofPoints = [
  { stat: "100+", label: "Client engagements" },
  { stat: "15+ yrs", label: "Fractional finance experience" },
  { stat: "Long-term", label: "Portfolio finance relationships" },
  { stat: "One team", label: "CFO, controller, accounting, payroll, AP/AR" },
];

function LogoCell({ logo, size = "lg" }: { logo: Logo; size?: "lg" | "sm" }) {
  const h = size === "lg" ? "h-8 md:h-9" : "h-6 md:h-7";
  return (
    <a
      href={logo.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${logo.name} website`}
      title={logo.name}
      className="group flex items-center justify-center px-3 py-2 rounded-md border border-transparent hover:border-border hover:-translate-y-0.5 hover:shadow-[0_4px_14px_-8px_rgba(10,31,68,0.25)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      {logo.src ? (
        <img
          src={logo.src}
          alt={logo.name}
          className={`${h} w-auto max-w-[140px] object-contain opacity-80 group-hover:opacity-100 transition-opacity`}
          loading="lazy"
        />
      ) : (
        <span
          className={`${
            size === "lg" ? "text-sm md:text-[15px]" : "text-xs md:text-sm"
          } font-semibold tracking-tight text-foreground/70 group-hover:text-foreground transition-colors text-center`}
        >
          {logo.wordmark}
        </span>
      )}
    </a>
  );
}

export function SocialProof() {
  return (
    <Section className="py-16 md:py-20">
      <p className="text-center text-sm md:text-base font-medium text-muted-foreground max-w-2xl mx-auto">
        Trusted by franchise brands, PE firms, and founder-owned operators.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 items-center gap-x-2 gap-y-4">
        {heroLogos.map((l) => (
          <LogoCell key={l.name} logo={l} size="lg" />
        ))}
      </div>

      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {proofPoints.map((p) => (
          <div key={p.label} className="bg-card p-6">
            <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {p.stat}
            </div>
            <div className="mt-2 text-sm text-muted-foreground leading-snug">
              {p.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 md:mt-20">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Selected client experience
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 items-center gap-x-2 gap-y-3 rounded-xl bg-muted/40 border border-border px-4 py-6">
          {selectedLogos.map((l) => (
            <LogoCell key={l.name} logo={l} size="sm" />
          ))}
        </div>
      </div>
    </Section>
  );
}
