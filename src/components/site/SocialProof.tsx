import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import abaco from "@/assets/logos/abaco.png";
import mpk from "@/assets/logos/mpk-equity.png";
import pretium from "@/assets/logos/pretium.webp";
import riverside from "@/assets/logos/riverside.gif";
import gedLawyers from "@/assets/logos/ged-lawyers.jpg";
import youngChefs from "@/assets/logos/young-chefs-academy.png";
import homefront from "@/assets/logos/homefront-brands.png";
import sequelBrands from "@/assets/logos/sequel-brands.webp";
import beem from "@/assets/logos/beem.svg";
import body20 from "@/assets/logos/body20.webp";
import iflex from "@/assets/logos/iflex.webp";
import pilatesAddiction from "@/assets/logos/pilates-addiction.webp";
import ultimateLongevity from "@/assets/logos/ultimate-longevity.svg";
import roofScientist from "@/assets/logos/roof-scientist.webp";
import theDesignery from "@/assets/logos/the-designery.webp";
import toprailFence from "@/assets/logos/toprail-fence.svg";
import tws from "@/assets/logos/tws.webp";
import windowHero from "@/assets/logos/window-hero.webp";
import stonework from "@/assets/logos/stonework.png";
import phoenix from "@/assets/logos/phoenix.svg";
import crashOverride from "@/assets/logos/crash-override.svg";
import subcontain from "@/assets/logos/subcontain.webp";
import mfs from "@/assets/logos/mfs.svg";
import patriotFleet from "@/assets/logos/patriot-fleet.avif";

type Logo = {
  name: string;
  src?: string;
  wordmark?: string;
  href?: string;
  invert?: boolean;
};

const mainLogos: Logo[] = [
  { name: "Riverside", src: riverside, href: "https://www.riversidecompany.com/" },
  { name: "MPK Equity Partners", src: mpk, href: "https://mpkequitypartners.com/", invert: true },
  { name: "Pretium", src: pretium, href: "https://pretium.com/" },
  { name: "Abaco", src: abaco, href: "https://abaco.co/" },
  { name: "Patriot Fleet Services", src: patriotFleet, href: "https://www.patriotfleetservices.com" },
  { name: "Meridian Fleet Services", src: mfs, href: "https://www.meridianfleetservices.com", invert: true },
  { name: "Crash Override", src: crashOverride, href: "https://crashoverride.com" },
  { name: "Phoenix Recovery", src: phoenix, href: "https://thephoenixrc.com", invert: true },
  { name: "Stonework Tile + Stone", src: stonework, href: "https://stoneworkinc.com" },
  { name: "Subcontain", src: subcontain, href: "https://subcontain.com" },
  { name: "Ged Lawyers", src: gedLawyers, href: "https://www.gedlawyers.com/" },
  { name: "Young Chefs Academy", src: youngChefs, href: "https://franchise.youngchefsacademy.com/" },
];

type Platform = {
  name: string;
  parentSrc: string;
  parentHref: string;
  parentInvert?: boolean;
  subBrands: Logo[];
};

const platforms: Platform[] = [
  {
    name: "Sequel Brands",
    parentSrc: sequelBrands,
    parentHref: "https://sequelbrands.com/",
    subBrands: [
      { name: "BODY20", src: body20, href: "https://www.body20.com" },
      { name: "iFlex Stretch Studios", src: iflex, href: "https://www.iflexstretchstudios.com" },
      { name: "Beem Light Sauna", src: beem, href: "https://www.beemlightsauna.com" },
      { name: "Pilates Addiction", src: pilatesAddiction, href: "https://pilatesaddiction.com" },
      { name: "Ultimate Longevity Center", src: ultimateLongevity, href: "https://sequelbrands.com/own-a-ultimate-longevity-center" },
    ],
  },
  {
    name: "HomeFront Brands",
    parentSrc: homefront,
    parentHref: "https://homefrontbrands.com/",
    subBrands: [
      { name: "Window Hero", src: windowHero, href: "https://windowhero.com" },
      { name: "Top Rail Fence", src: toprailFence, href: "https://toprailfences.com" },
      { name: "Temporary Wall Systems", src: tws, href: "https://tempwallsystems.com" },
      { name: "The Designery", src: theDesignery, href: "https://thedesignery.com" },
      { name: "Roof Scientist", src: roofScientist, href: "https://roofscientist.com" },
    ],
  },
];

const proofPoints = [
  { stat: "17", label: "person finance bench", description: "CFO, controller, accounting, payroll, AP/AR, and reporting." },
  { stat: "$100M+", label: "revenue across supported clients", description: "Franchise systems, small business operators, and PE sponsors." },
  { stat: "4 yrs", label: "Average engagement", description: "Long-term finance operations support." },
  { stat: "15+", label: "M&A and diligence processes", description: "Diligence, audits, and transaction support." },
];

function LogoCell({ logo, dark = false }: { logo: Logo; dark?: boolean }) {
  const content = logo.src ? (
    <img
      src={logo.src}
      alt={`${logo.name} logo`}
      style={logo.invert ? { filter: "invert(1) brightness(0.5)" } : undefined}
      className="max-h-9 max-w-[120px] w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
      loading="lazy"
    />
  ) : (
    <span
      className={`text-sm md:text-[15px] font-semibold tracking-tight text-center ${
        dark ? "text-white/70 group-hover:text-white" : "text-foreground/70 group-hover:text-foreground"
      } transition-colors`}
    >
      {logo.wordmark}
    </span>
  );

  const className = `group flex h-16 items-center justify-center px-4 rounded-md border ${
    dark
      ? "border-white/10 bg-white/5 hover:border-white/25"
      : "border-border bg-card hover:border-accent/40"
  } transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`;

  if (logo.href) {
    return (
      <a
        href={logo.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${logo.name} website`}
        title={logo.name}
        className={className}
      >
        {content}
      </a>
    );
  }
  return (
    <div title={logo.name} className={className}>
      {content}
    </div>
  );
}

function PlatformCard({ platform }: { platform: Platform }) {
  return (
    <div className="rounded-xl bg-primary text-primary-foreground border border-border p-5 md:p-6 flex flex-col h-full">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/50 font-medium">
          Platform relationship
        </div>
        <a
          href={platform.parentHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit ${platform.name} website`}
          className="mt-3 inline-flex items-center"
        >
          <img
            src={platform.parentSrc}
            alt={`${platform.name} logo`}
            style={platform.parentInvert ? { filter: "invert(1) brightness(2)" } : undefined}
            className="h-8 md:h-9 w-auto object-contain"
            loading="lazy"
          />
        </a>
      </div>

      <div className="mt-5 pt-4 border-t border-white/10 flex-1">
        <div className="text-xs text-white/60 mb-3">Related franchise brands</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {platform.subBrands.map((l) => (
            <LogoCell key={l.name} logo={l} dark />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SocialProof() {
  return (
    <Section id="clients">
      <SectionHeader
        eyebrow="Clients"
        title="Client and portfolio experience"
        description="Fractioneer supports franchise systems, small business operators, PE sponsors, and other operators with finance operations that scale."
      />

      {/* Proof points — surface the 17-person bench early */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {proofPoints.map((p) => (
          <div key={p.label} className="bg-card p-6">
            <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {p.stat}
            </div>
            <div className="mt-2 text-sm font-medium text-foreground/90 leading-snug">{p.label}</div>
            {p.description && (
              <div className="mt-1 text-xs text-muted-foreground leading-snug">{p.description}</div>
            )}
          </div>
        ))}
      </div>

      {/* Platform relationships — strongest franchise proof, surfaced first */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            Franchise platform relationships
          </h3>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Parent companies and their franchise brands
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {platforms.map((p) => (
            <PlatformCard key={p.name} platform={p} />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            PE sponsors, operators, and franchise clients
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 items-stretch gap-3">
          {mainLogos.map((l) => (
            <LogoCell key={l.name} logo={l} />
          ))}
        </div>
      </div>
    </Section>
  );
}
