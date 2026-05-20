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

type Logo = { name: string; src?: string; wordmark?: string };

const heroLogos: Logo[] = [
  { name: "Abaco", src: abaco },
  { name: "Riverside", wordmark: "Riverside" },
  { name: "FranDevCo", src: frandevco },
  { name: "HomeFront Brands", src: homefront },
  { name: "PatchMaster", src: patchmaster },
  { name: "The Lash Lounge", wordmark: "The Lash Lounge" },
  { name: "Young Chefs Academy", wordmark: "Young Chefs Academy" },
  { name: "Costa Oil", src: costaOil },
];

const selectedLogos: Logo[] = [
  { name: "MPK Equity Partners", src: mpk },
  { name: "Pretium", src: pretium },
  { name: "Frenchies", src: frenchies },
  { name: "Bishops", src: bishops },
  { name: "Weaver Materiel", wordmark: "Weaver Materiel" },
  { name: "Ged Lawyers", src: gedLawyers },
];

const proofPoints = [
  { stat: "100+", label: "Client engagements" },
  { stat: "15+ yrs", label: "Fractional finance experience" },
  { stat: "Long-term", label: "Portfolio finance relationships" },
  { stat: "One team", label: "CFO, controller, accounting, payroll, AP/AR" },
];

function LogoCell({ logo, size = "lg" }: { logo: Logo; size?: "lg" | "sm" }) {
  const h = size === "lg" ? "h-8 md:h-9" : "h-6 md:h-7";
  if (logo.src) {
    return (
      <div className="flex items-center justify-center px-3 py-2">
        <img
          src={logo.src}
          alt={logo.name}
          className={`${h} w-auto max-w-[140px] object-contain opacity-80 hover:opacity-100 transition-opacity`}
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center px-3 py-2">
      <span
        className={`${
          size === "lg" ? "text-sm md:text-[15px]" : "text-xs md:text-sm"
        } font-semibold tracking-tight text-foreground/70 hover:text-foreground transition-colors text-center`}
      >
        {logo.wordmark}
      </span>
    </div>
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
