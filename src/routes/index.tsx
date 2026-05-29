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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fractioneer | Finance operations for small business growth" },
      {
        name: "description",
        content:
          "Fractioneer runs the CFO, controller, bookkeeping, payroll, AP/AR, cash flow, and audit support functions that franchisors, franchise platforms, and multi-unit operators need to scale.",
      },
      { property: "og:title", content: "Fractioneer | Finance operations for franchise growth" },
      {
        property: "og:description",
        content:
          "The outsourced finance department behind growing franchise systems. Fractional CFO, controller, accounting, payroll, AP/AR, cash flow, and audit support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
