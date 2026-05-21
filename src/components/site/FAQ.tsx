import { Section } from "./Section";
import { SectionHeader } from "./SectionHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who does Fractioneer work best with?",
    a: "Franchisors, franchise platforms, multi-unit operators, PE-backed franchise brands, and founder-owned businesses that need a finance function built for scale.",
  },
  {
    q: "Do you only work with franchise companies?",
    a: "Franchise is our focus, but we also support PE-backed and founder-owned operating companies with similar financial complexity.",
  },
  {
    q: "Can you support multi-location or multi-entity businesses?",
    a: "Yes. Multi-location and multi-entity work is core to what we do — consolidations, intercompany activity, and unit-level reporting included.",
  },
  {
    q: "Do you replace our internal finance team?",
    a: "We can fully run the function or work alongside an internal team — many clients use us to extend the capacity and seniority of what they already have.",
  },
  {
    q: "What finance functions can you run?",
    a: "CFO, controller, accounting, bookkeeping, payroll, benefits administration, AP/AR, cash flow management, board reporting, and audit support.",
  },
  {
    q: "How does onboarding work?",
    a: "We start with a structured assessment of books, systems, and reporting, then build a transition plan so the engagement is operating cleanly within the first cycles.",
  },
  {
    q: "Do you work with PE-backed companies?",
    a: "Yes. We support sponsor-owned platforms with reporting cadences, board packages, and the documentation needed for diligence and audits.",
  },
];

export function FAQ() {
  return (
    <Section id="faq" muted>
      <SectionHeader
        eyebrow="FAQ"
        title="Common questions from franchise leaders."
      />
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline py-5">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
