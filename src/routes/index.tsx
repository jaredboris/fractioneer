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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fractioneer — Finance operations for franchise growth" },
      {
        name: "description",
        content:
          "Fractioneer runs the CFO, controller, bookkeeping, payroll, AP/AR, cash flow, and audit support functions that franchisors, franchise platforms, and multi-unit operators need to scale.",
      },
      { property: "og:title", content: "Fractioneer — Finance operations for franchise growth" },
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
          <ProblemSection />
          <ServicesFranchise />
          <LeadershipVisibility />
          <EngagementModels />
          <Testimonials />
          <TeamGrid />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </BookingProvider>
  );
}
