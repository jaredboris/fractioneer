import { Section } from "./Section";
import abaco from "@/assets/logos/abaco.png";
import homefront from "@/assets/logos/homefront-brands.png";
import youngChefs from "@/assets/logos/young-chefs-academy.png";
import gedLawyers from "@/assets/logos/ged-lawyers.jpg";
import pretium from "@/assets/logos/pretium.webp";
import mpk from "@/assets/logos/mpk-equity.png";
import riverside from "@/assets/logos/riverside.gif";

type Logo = {
  name: string;
  src?: string;
  wordmark?: string;
  href: string;
  invert?: boolean;
};

const heroLogos: Logo[] = [
  { name: "Abaco", src: abaco, href: "https://abaco.co/" },
  { name: "Riverside", src: riverside, href: "https://www.riversidecompany.com/" },
  { name: "HomeFront Brands", src: homefront, href: "https://homefrontbrands.com/" },
  { name: "Young Chefs Academy", src: youngChefs, href: "https://franchise.youngchefsacademy.com/" },
];

const selectedLogos: Logo[] = [
  { name: "MPK Equity Partners", src: mpk, href: "https://mpkequitypartners.com/", invert: true },
  { name: "Pretium", src: pretium, href: "https://pretium.com/" },
  { name: "Ged Lawyers", src: gedLawyers, href: "https://www.gedlawyers.com/" },
];

const proofPoints = [
  { stat: "100+", label: "Client engagements" },
  { stat: "15+ yrs", label: "Fractional finance experience" },
  { stat: "$10B+", label: "AUM client experience" },
  { stat: "Full team", label: "CFO, controller, accounting, payroll, AP/AR" },
];

function LogoCell({ logo, size = "lg" }: { logo: Logo; size?: "lg" | "sm" }) {
  const h = size === "lg" ? "h-10 md:h-12" : "h-8 md:h-9";
  const maxW = size === "lg" ? "max-w-[160px]" : "max-w-[140px]";
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
          style={logo.invert ? { filter: "invert(1) brightness(0.5)" } : undefined}
          className={`${h} ${maxW} w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity`}
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
    <Section id="clients" className="py-10 md:py-12">
      <p className="text-center text-sm md:text-base font-medium text-muted-foreground max-w-3xl mx-auto">
        Client and portfolio experience across franchise brands, PE firms, and founder-owned operators.
      </p>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 items-center gap-x-2 gap-y-4">
        {heroLogos.map((l) => (
          <LogoCell key={l.name} logo={l} size="lg" />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 items-center gap-x-2 gap-y-3 rounded-xl bg-muted/40 border border-border px-4 py-5">
        {selectedLogos.map((l) => (
          <LogoCell key={l.name} logo={l} size="sm" />
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
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
    </Section>
  );
}
