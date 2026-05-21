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
    a: "Fractioneer works best with franchisors, franchise platforms, multi-unit operators, PE-backed franchise brands, and founder-owned businesses that need a stronger finance function without building a full in-house team.",
  },
  {
    q: "Do you only work with franchise companies?",
    a: "No. Fractioneer has experience across franchise systems, private funds, PE-backed companies, and founder-owned businesses. The current focus is franchise and multi-location finance because those businesses often need clean reporting across entities, locations, payroll, royalties, and audits.",
  },
  {
    q: "Can you support multi-location or multi-entity businesses?",
    a: "Yes. Fractioneer is built for businesses where reporting, cash flow, payroll, vendors, and close processes need to be coordinated across multiple locations or entities.",
  },
  {
    q: "Do you replace our internal finance team?",
    a: "Not necessarily. Fractioneer can run the finance function directly or work alongside an existing internal team. The goal is to fill the gaps, strengthen the process, and give leadership cleaner financial visibility.",
  },
  {
    q: "What finance functions can you run?",
    a: "Fractioneer can support CFO leadership, controllership, bookkeeping, payroll, AP/AR, vendor coordination, cash flow, reporting, audit support, and franchise audit support for franchisors.",
  },
  {
    q: "How does onboarding work?",
    a: "The first step is a conversation to understand the current finance setup, systems, reporting needs, and pain points. From there, Fractioneer identifies the right support model and begins organizing the finance process around the business's needs.",
  },
  {
    q: "Do you work with PE-backed companies?",
    a: "Yes. Fractioneer has experience supporting PE and VC-backed companies, portfolio companies, franchise platforms, and businesses that need lender, investor, board, or diligence-ready reporting.",
  },
  {
    q: "Can you help with franchise audits?",
    a: "Yes. Fractioneer can support franchisors with franchise audit preparation, documentation, reporting coordination, and finance process support. The exact scope is confirmed with the team during onboarding.",
  },
];

export function FAQ() {
  return (
    <Section id="faq" muted>
      <SectionHeader
        eyebrow="FAQ"
        title="Common questions from growing operators."
      />
      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
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
