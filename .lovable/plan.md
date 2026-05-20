# Fractioneer Homepage — Build Plan (revised)

Premium franchise-finance homepage built around the **existing Fractioneer brand**. No rebrand, no new accent. The visual upgrade comes from typography, spacing, composition, and restrained use of the brand's navy + bright blue.

## Brand + design system

Logo: I'll copy your uploaded file to `src/assets/fractioneer-logo.png` and use it in the navbar and footer (height ~28px in nav, ~32px in footer). No recoloring, no cropping.

Tokens in `src/styles.css` (all `oklch`, mapped to Tailwind semantic classes):

- `--background` white
- `--foreground` deep navy from the logo (~`#0A1F44`)
- `--primary` same deep navy (buttons, headings, footer)
- `--primary-foreground` white
- `--accent` bright logo blue (~`#1AA7FF`) — used sparingly: badge text, small icon marks, underlines on key numerals, link hovers, focus ring, active nav state
- `--accent-foreground` white
- `--muted` very light gray section band (~`#F5F7FA`)
- `--muted-foreground` slate gray for body copy
- `--border` hairline gray
- `--ring` accent blue at lower opacity
- `--gradient-navy` and `--gradient-blue` tokens for *very* minimal gradients (hero badge sheen, final CTA band, dashboard accent line only — never on body text or large surfaces)

No gold. No third accent color.

Typography: Inter via Google Fonts, weights 400/500/600/700. Display sizes use tight tracking (`-0.02em`), 16–17px body in `text-muted-foreground`. Strong hierarchy: eyebrow (uppercase, accent blue, tracked) → H2 (navy, large) → sub (slate) → cards.

Spacing rhythm: `py-24 md:py-32` sections, `max-w-6xl` container, hairline `border-border` dividers, alternating white / `bg-muted/40` bands.

Motion: restrained framer-motion fade+rise on section enter. No parallax, no bounce.

## File structure

```
src/assets/fractioneer-logo.png       ← copied from upload
src/routes/index.tsx                  ← assembles sections, sets head()
src/components/site/
  Navbar.tsx       Footer.tsx
  Section.tsx      SectionHeader.tsx
  Hero.tsx         DashboardVisual.tsx
  SocialProof.tsx  ProblemSection.tsx
  ServicesGrid.tsx FranchiseSection.tsx
  WhyFractioneer.tsx EngagementModels.tsx
  TeamGrid.tsx     Testimonials.tsx
  FAQ.tsx          FinalCTA.tsx
  ServiceCard.tsx  PersonCard.tsx  QuoteCard.tsx  LogoPlaceholder.tsx
```

## Section-by-section

1. **Hero** — left: bordered badge "Finance operations for franchise growth" (accent-blue text, white bg, hairline border); H1 in navy; subhead in slate; primary CTA navy "Book a consultation"; ghost CTA "Explore franchise finance support" with arrow. Right: `DashboardVisual` — HTML/SVG composed dashboard mock showing the six modules (unit-level reporting, monthly close, cash flow, payroll, AP/AR, audit support). Cards, hairline borders, one accent-blue sparkline + one accent dot indicator. Stacks on mobile.

2. **Social proof** — headline, 5-column logo strip using `LogoPlaceholder` cards each explicitly labeled "Client logo". Below: 4 proof points (100+, 15+, plus the two qualitative statements you supplied — rendered as statements, not invented numbers).

3. **Problem** — center header + 3 cards (Multi-location reporting, Cash flow visibility, Audit-ready operations). Small geometric accent-blue glyph per card.

4. **Services** — 3×2 grid of 6 cards (Fractional CFO, Fractional Controller, Bookkeeping, Payroll & Benefits, AP/AR Management, Cash Flow & Audit Support). One tight plain-English paragraph each, written to spec.

5. **Franchise-specific** — `bg-muted/40` band, 3×2 grid of 6 cards (Franchisor reporting, Multi-unit financial visibility, Royalty & fee tracking, Payroll & vendor coordination, Board & investor reporting, Audit & diligence support).

6. **Why Fractioneer** — 4 differentiators, numbered `01–04` in accent blue, 4-col desktop / 2-col tablet / 1-col mobile.

7. **Engagement models** — 3 tier cards (Finance Foundation, Controller-Led Operations, CFO Partnership). Middle card has a thin accent-blue top border for emphasis. Each: tier name, who it's for, 4–5 included capabilities as a check list. No prices.

8. **Team** — 6 cards for the named people. Each: navy monogram tile with initials (no fake headshots), name, role, 1–2 line bio focused on finance/PE/franchise/payroll experience. **Roles and bios are placeholders flagged for your review** — I won't invent credentials.

9. **Testimonials** — 3 quote cards for Michael C. Abdy (Abaco), Aakeem Andrada (Riverside), Paul Ferrara (PatchMaster). Quotes will be **neutral draft copy clearly marked for your approval/replacement** — no fabricated specifics.

10. **FAQ** — shadcn Accordion, 7 questions exactly as you listed, single-open, answers in the same direct tone.

11. **Final CTA** — full-width deep-navy band with a very subtle navy→blue gradient sheen, white headline + sub, single white-on-navy primary button "Book a consultation".

**Navbar**: white, sticky, hairline bottom border on scroll. Fractioneer logo left; links Services / Franchise / Approach / Team / FAQ (anchor scroll); "Book a consultation" CTA right. Mobile uses a sheet menu.

**Footer**: navy background, white text, logo + short positioning line, 3 link columns (Services / Company / Contact), legal row.

## SEO + a11y

- Single H1, semantic sections, `head()` in route sets title (`Fractioneer — Finance operations for franchise growth`), description, OG/Twitter tags. Logo used as `og:image`.
- Accent blue used only on non-body-text or large/bold text to keep WCAG AA contrast on white.
- Fully responsive: grids collapse to 1 col on mobile, hero stacks, nav becomes sheet.

## What I will NOT do

- No rebrand. No logo changes. No gold.
- No stock people photos.
- No invented metrics beyond the four proof points you provided.
- No lorem ipsum.
- No client logos invented — placeholders clearly labeled.
- Team bios and testimonial quotes shipped as **clearly-marked drafts** for your review.
