import { z } from "zod";
import { STAGES } from "./profile";

export const GOVT_ALLOWLIST = [
  "scholarships.gov.in",
  "ugc.gov.in",
  "aicte-india.org",
  "vidyalakshmi.co.in",
  "socialjustice.gov.in",
  "socialjustice.nic.in",
  "tribal.nic.in",
  "tribal.gov.in",
  "minorityaffairs.gov.in",
  "rajasthan.gov.in",
  // Trusted Private & Public-sector Aggregators
  "buddy4study.com",
  "tatatrusts.org",
  "reliancefoundation.org",
  "adityabirlacapital.com",
  "hdfcbank.com",
  "licindia.in",
  "colgate.com",
  "loreal.com",
  "infosys.com",
  "ongcfoundation.org",
] as const;

export const eligibilityRulesSchema = z.object({
  min_percentage: z.number().min(0).max(100).optional().nullable(),
  max_income: z.number().nonnegative().optional().nullable(),
  stages: z.array(z.enum(STAGES)).default([]),
  categories: z.array(z.string()).default(["any"]),
  states: z.array(z.string()).default(["any"]),
  gender: z.string().default("any"),
});

export const opportunitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["scholarship", "fellowship", "internship", "program"]),
  provider: z.string().min(2, "Provider is required"),
  description: z.string().optional().nullable(),
  source_url: z.string().url("Source URL must be valid"),
  apply_url: z.string().url("Apply URL must be valid").optional().nullable(),
  source_domain: z.string().refine(
    (domain) => {
      const cleanDomain = domain.toLowerCase().trim();
      return GOVT_ALLOWLIST.some((allowed) => cleanDomain.endsWith(allowed));
    },
    { message: "Source domain must match an entry in the government-only allowlist" }
  ),
  extraction_confidence: z.enum(["low", "medium", "high"]),
  registration_open_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
    .or(z.literal(""))
    .optional()
    .nullable(),
  registration_close_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
    .or(z.literal(""))
    .optional()
    .nullable(),
  eligibility_rules: eligibilityRulesSchema,
  required_documents: z.array(z.string()).default([]),
  amount_or_benefit: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (
      data.registration_open_date &&
      data.registration_close_date &&
      data.registration_open_date !== "" &&
      data.registration_close_date !== ""
    ) {
      const open = new Date(data.registration_open_date);
      const close = new Date(data.registration_close_date);
      return close >= open;
    }
    return true;
  },
  {
    message: "Registration close date must be greater than or equal to open date",
    path: ["registration_close_date"],
  }
);

export type OpportunityInput = z.infer<typeof opportunitySchema>;
