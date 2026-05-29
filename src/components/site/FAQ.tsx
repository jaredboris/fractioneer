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
    a: "Fractioneer is built around franchise and multi-unit finance complexity, but also supports PE-backed operators and founder-owned businesses that need CFO, controller, accounting, payroll, AP/AR, reporting, cash flow, tax, and audit support.",
  },
  {
    q: "Do you replace our internal finance team?",
    a: "Not necessarily. Fractioneer can run the finance function directly or work alongside an existing internal team. The goal is to fill the gaps, strengthen the process, and give leadership cleaner financial visibility.",
  },
  {
    q: "What finance functions can you run?",
    a: "CFO leadership, controllership, accounting, bookkeeping, payroll, AP/AR, vendor coordination, cash flow, reporting, tax coordination, and audit support, including FDD-ready reporting for franchisors.",
  },
  {
    q: "Can you support multi-location or multi-entity businesses?",
    a: "Yes. Fractioneer is built for businesses where reporting, cash flow, payroll, vendors, and close processes need to be coordinated across multiple locations or entities.",
  },
  {
    q: "How does onboarding work?",
    a: "The first step is a conversation to understand the current finance setup, systems, reporting needs, and pain points. From there, Fractioneer identifies the right support model and begins organizing the finance process around the business's needs.",
  },
  {
    q: "Can you help with FDD-ready reporting and audits?",
    a: "Yes. Fractioneer supports franchisors with FDD-ready reporting, tax coordination, audit preparation, documentation, and finance processes built to hold up under review.",
  },
  {
    q: "Do you work with PE-backed companies?",
    a: "Yes. Fractioneer supports PE-backed operators, portfolio companies, franchise platforms, and businesses that need lender, investor, board, or diligence-ready reporting.",
  },
  {
    q: "Do you only work with franchise companies?",
    a: "No. While Fractioneer is franchise focused, we also work closely with family offices and high net worth individuals who hold multi-entity operating businesses.",
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
