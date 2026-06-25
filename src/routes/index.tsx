import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { SocialProof } from "@/components/site/SocialProof";
import { ProblemSection } from "@/components/site/ProblemSection";
import { ServicesFranchise } from "@/components/site/ServicesFranchise";
import { EngagementModels } from "@/components/site/EngagementModels";
import { LeadershipVisibility } from "@/components/site/LeadershipVisibility";
import { TeamGrid } from "@/components/site/TeamGrid";
import { Testimonials } from "@/components/site/Testimonials";
import { FAQ } from "@/components/site/FAQ";
import { FinalCTA } from "@/components/site/FinalCTA";
import { BookingProvider } from "@/components/site/BookingProvider";
import { WhoWeHelp } from "@/components/site/WhoWeHelp";
import { InlineCTA } from "@/components/site/InlineCTA";
import { HowItWorks } from "@/components/site/HowItWorks";

const faqItems = [
  { q: "Who does Fractioneer work best with?", a: "Fractioneer is built around franchise and multi-unit finance complexity, but also supports PE-backed operators and founder-owned businesses that need CFO, controller, accounting, payroll, AP/AR, reporting, cash flow, tax, and audit support." },
  { q: "Do you replace our internal finance team?", a: "Not necessarily. Fractioneer can run the finance function directly or work alongside an existing internal team. The goal is to fill the gaps, strengthen the process, and give leadership cleaner financial visibility." },
  { q: "What finance functions can you run?", a: "CFO leadership, controllership, accounting, bookkeeping, payroll, AP/AR, vendor coordination, cash flow, reporting, tax coordination, and audit support, including FDD-ready reporting for franchisors." },
  { q: "Can you support multi-location or multi-entity businesses?", a: "Yes. Fractioneer is built for businesses where reporting, cash flow, payroll, vendors, and close processes need to be coordinated across multiple locations or entities." },
  { q: "How does onboarding work?", a: "The first step is a conversation to understand the current finance setup, systems, reporting needs, and pain points. From there, Fractioneer identifies the right support model and begins organizing the finance process around the business's needs." },
  { q: "Can you help with FDD-ready reporting and audits?", a: "Yes. Fractioneer supports franchisors with FDD-ready reporting, tax coordination, audit preparation, documentation, and finance processes built to hold up under review." },
  { q: "Do you work with PE-backed companies?", a: "Yes. Fractioneer supports PE-backed operators, portfolio companies, franchise platforms, and businesses that need lender, investor, board, or diligence-ready reporting." },
  { q: "Do you only work with franchise companies?", a: "No. While Fractioneer is franchise focused, we also work closely with family offices and high net worth individuals who hold multi-entity operating businesses." },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fractioneer | Finance Operations for Growing Operators" },
      {
        name: "description",
        content:
          "Outsourced CFO, controller, bookkeeping, payroll, AP/AR, and audit support for franchise systems, multi-unit operators, and PE-backed brands.",
      },
      { property: "og:title", content: "Fractioneer | Finance Operations for Growing Operators" },
      {
        property: "og:description",
        content:
          "Outsourced CFO, controller, bookkeeping, payroll, AP/AR, and audit support for franchise systems and multi-unit operators.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://fractioneer.co/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "https://fractioneer.co/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <BookingProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <SocialProof />
          <WhoWeHelp />
          <ProblemSection />
          <ServicesFranchise />
          <InlineCTA
            title="Need help running these finance functions?"
            subtext="Talk through your current setup and see where Fractioneer can help. No pressure. We'll point you in the right direction."
            primaryLabel="Talk through your setup"
          />
          <LeadershipVisibility />
          <HowItWorks />
          <EngagementModels />
          <Testimonials />
          <InlineCTA
            title="Want to see if Fractioneer fits your business?"
            subtext="Share your current finance setup and we'll point you in the right direction."
            primaryLabel="Book a call"
            secondaryLabel="Send details instead"
          />
          <TeamGrid />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </BookingProvider>
  );
}
