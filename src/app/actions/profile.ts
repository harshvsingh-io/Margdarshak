"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { profileBaseSchema, profileFullSchema } from "@/lib/validations/profile";
import { revalidatePath } from "next/cache";

export interface ProfileInput {
  id?: string;
  name?: string;
  age?: number | null;
  current_stage?: "school" | "12th" | "undergrad" | "postgrad" | "working";
  class_or_year?: string;
  marks_percentage_or_cgpa?: number;
  category?: string;
  state?: string;
  income_bracket?: number | null;
  district?: string | null;
  interests?: string[];
  gender?: string | null;
  first_generation_learner?: boolean;
}

export async function getProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, user_roles!user_id(role)")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    return { error: error.message };
  }

  return { profile: profile || null, user };
}

export async function createOrUpdateProfile(data: ProfileInput) {
  const supabase = createClient();
  const adminClient = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Determine if it is a full profile update or the initial 5-field onboarding update
  const schema = data.current_stage && data.class_or_year && data.marks_percentage_or_cgpa && data.category && data.state
    ? profileBaseSchema
    : profileFullSchema;

  const result = schema.safeParse(data);

  if (!result.success) {
    const errorDetails = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    
    // Log the validation issue to data_issues (using adminClient to bypass user-level RLS restrictions)
    await adminClient.from("data_issues").insert({
      source: "profile_update",
      reason: errorDetails,
      raw_payload: JSON.parse(JSON.stringify(data)),
    });

    return { error: `Validation Failed: ${errorDetails}` };
  }

  const cleanData = result.data;

  // Insert or update
  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      ...cleanData,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateProgressiveProfile(data: Partial<ProfileInput>) {
  const supabase = createClient();
  const adminClient = createAdminClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Fetch current profile to merge
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const merged = { ...currentProfile, ...data };
  const result = profileFullSchema.safeParse(merged);

  if (!result.success) {
    const errorDetails = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    
    await adminClient.from("data_issues").insert({
      source: "profile_progressive_update",
      reason: errorDetails,
      raw_payload: JSON.parse(JSON.stringify(data)),
    });

    return { error: `Validation Failed: ${errorDetails}` };
  }

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
