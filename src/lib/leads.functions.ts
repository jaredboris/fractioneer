import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const companyTypes = [
  "Franchisor",
  "Multi-unit franchise operator",
  "Franchise platform",
  "PE-backed company",
  "Founder-owned business",
  "Other",
] as const;

const locationOptions = [
  "1 to 5",
  "6 to 20",
  "21 to 50",
  "51+",
  "Not applicable",
] as const;

const helpOptions = [
  "Fractional CFO",
  "Bookkeeping/accounting",
  "Payroll",
  "AP/AR",
  "Cash flow management",
  "Audit support",
  "Not sure yet",
] as const;

const leadSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  work_email: z.string().trim().email().max(200),
  company_name: z.string().trim().min(1).max(120),
  company_type: z.enum(companyTypes),
  num_locations: z.enum(locationOptions),
  help_with: z.enum(helpOptions),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("leads").insert({
      first_name: data.first_name,
      last_name: data.last_name,
      work_email: data.work_email,
      company_name: data.company_name,
      company_type: data.company_type,
      num_locations: data.num_locations,
      help_with: data.help_with,
      message: data.message || null,
      source: "website_booking_modal",
    });
    if (error) {
      console.error("Failed to insert lead:", error);
      throw new Error("Unable to submit your request. Please try again.");
    }
    return { ok: true as const };
  });
