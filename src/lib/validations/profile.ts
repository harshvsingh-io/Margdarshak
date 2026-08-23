import { z } from "zod";

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const STAGES = ["school", "12th", "undergrad", "postgrad", "working"] as const;

export const profileBaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  age: z.coerce.number().int().min(5, "Age must be >= 5").max(100, "Age must be <= 100").optional().nullable(),
  current_stage: z.enum(STAGES as unknown as [string, ...string[]], {
    message: "Please select a valid stage",
  }),
  class_or_year: z.string().min(1, "Class/Year is required"),
  marks_percentage_or_cgpa: z.coerce
    .number()
    .min(0, "Marks/CGPA cannot be negative")
    .max(100, "Marks/CGPA cannot exceed 100"),
  category: z.string().min(1, "Category is required"),
  state: z.enum(INDIAN_STATES as unknown as [string, ...string[]], {
    message: "Please select a valid Indian State/UT",
  }),
});

export const profileFullSchema = profileBaseSchema.extend({
  income_bracket: z.coerce
    .number()
    .nonnegative("Income bracket must be non-negative")
    .optional()
    .nullable(),
  district: z.string().optional().nullable(),
  interests: z.array(z.string()).default([]),
  gender: z.string().optional().nullable(),
  first_generation_learner: z.boolean().default(false),
});
