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
  { name: "Patriot Fleet", src: patriotFleet },
  { name: "Meridian Fleet Services", src: mfs, invert: true },
  { name: "Crash Override", src: crashOverride },
  { name: "Phoenix Recovery", src: phoenix, invert: true },
  { name: "Stonework Tile + Stone", src: stonework },
  { name: "Subcontain", src: subcontain },
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
      { name: "BODY20", src: body20 },
      { name: "iFlex Stretch Studios", src: iflex, href: "https://iflexstretchstudios.com/" },
      { name: "Pilates Addiction", src: pilatesAddiction },
      { name: "Ultimate Longevity Center", src: ultimateLongevity },
      { name: "Beem", src: beem },
    ],
  },
  {
    name: "HomeFront Brands",
    parentSrc: homefront,
    parentHref: "https://homefrontbrands.com/",
    subBrands: [
      { name: "Roof Scientist", src: roofScientist },
      { name: "The Designery", src: theDesignery },
      { name: "Toprail Fence", src: toprailFence },
      { name: "TWS", src: tws },
      { name: "Window Hero", src: windowHero },
    ],
  },
];

const proofPoints = [
  { stat: "100+", label: "Client engagements" },
  { stat: "15+ yrs", label: "Fractional finance experience" },
  { stat: "$10B+", label: "AUM client experience" },
  { stat: "Full team", label: "CFO, controller, accounting, payroll, AP/AR" },
];

function LogoCell({ logo, dark = false }: { logo: Logo; dark?: boolean }) {
  const content = logo.src ? (
    <img
      src={logo.src}
      alt={logo.name}
      style={logo.invert ? { filter: "invert(1) brightness(0.5)" } : undefined}
      className="h-9 md:h-10 max-w-[140px] w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
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

  const className = `group flex items-center justify-center px-3 py-2 rounded-md border border-transparent ${
    dark ? "hover:border-white/15" : "hover:border-border"
  } hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2`;

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
  const [expanded, setExpanded] = useState(false);
  const initialCount = 4;
  const hasMore = platform.subBrands.length > initialCount;
  const visible = expanded ? platform.subBrands : platform.subBrands.slice(0, initialCount);

  return (
    <div className="rounded-xl bg-primary text-primary-foreground border border-border p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
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
              alt={platform.name}
              style={platform.parentInvert ? { filter: "invert(1) brightness(2)" } : undefined}
              className="h-8 md:h-9 w-auto object-contain"
              loading="lazy"
            />
          </a>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="text-xs text-white/60 mb-3">Related franchise brands</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visible.map((l) => (
            <LogoCell key={l.name} logo={l} dark />
          ))}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded px-2 py-1 -mx-2"
          >
            {expanded ? "Show less" : `View all ${platform.subBrands.length} brands`}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export function SocialProof() {
  return (
    <Section id="clients" className="py-14 md:py-20">
      <SectionHeader
        eyebrow="Clients"
        title="Client and portfolio experience"
        description="Fractioneer supports franchise systems, PE-backed operators, and founder-owned businesses with finance operations that scale."
      />

      <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 items-center gap-x-2 gap-y-4">
        {mainLogos.map((l) => (
          <LogoCell key={l.name} logo={l} />
        ))}
      </div>

      <div className="mt-14">
        <div className="flex items-baseline justify-between mb-5">
          <h3 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            Platform relationships
          </h3>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Parent companies and their franchise brands
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {platforms.map((p) => (
            <PlatformCard key={p.name} platform={p} />
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {proofPoints.map((p) => (
          <div key={p.label} className="bg-card p-6">
            <div className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              {p.stat}
            </div>
            <div className="mt-2 text-sm text-muted-foreground leading-snug">{p.label}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
