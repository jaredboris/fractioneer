import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { submitLead } from "@/lib/leads.functions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  "Controller support",
  "Bookkeeping/accounting",
  "Payroll",
  "AP/AR",
  "Cash flow management",
  "Audit support",
  "Not sure yet",
] as const;

const schema = z.object({
  first_name: z.string().trim().min(1, "Required").max(80),
  last_name: z.string().trim().min(1, "Required").max(80),
  work_email: z.string().trim().email("Enter a valid email").max(200),
  company_name: z.string().trim().min(1, "Required").max(120),
  company_type: z.enum(companyTypes, { required_error: "Select an option" }),
  num_locations: z.enum(locationOptions, { required_error: "Select an option" }),
  help_with: z.enum(helpOptions, { required_error: "Select an option" }),
  message: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

export function LeadForm() {
  const submit = useServerFn(submitLead);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      work_email: "",
      company_name: "",
      message: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await submit({ data: values });
      setSubmitted(true);
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Something went wrong. Please try again.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
        <p className="text-sm text-foreground">
          Thanks. We'll review your information and follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="given-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="family-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="work_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input type="email" {...field} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="organization" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="company_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companyTypes.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="num_locations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of locations</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locationOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="help_with"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What do you need help with?</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {helpOptions.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anything else? (optional)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Send request
        </button>
      </form>
    </Form>
  );
}
