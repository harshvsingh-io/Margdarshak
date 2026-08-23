"use server";

import { createClient } from "@/lib/supabase/server";
import { evaluateEligibility, EligibilityResult } from "@/lib/eligibilityEngine";
import { revalidatePath } from "next/cache";

export interface ClassifiedOpportunity {
  id: string;
  title: string;
  type: "scholarship" | "fellowship" | "internship" | "program";
  provider: string;
  description: string | null;
  source_url: string;
  apply_url: string | null;
  source_domain: string;
  last_verified_at: string;
  extraction_confidence: "low" | "medium" | "high";
  moderation_status: "pending" | "approved" | "rejected";
  registration_open_date: string | null;
  registration_close_date: string | null;
  eligibility_rules: Record<string, unknown>;
  required_documents: string[];
  amount_or_benefit: string | null;
  created_at: string;
  
  // Evaluated properties
  evaluation: EligibilityResult;
  isSaved: boolean;
  applicationId?: string;
  applicationStatus?: string;
}

interface DBRecord {
  id: string;
  title: string;
  type: "scholarship" | "fellowship" | "internship" | "program";
  provider: string;
  description: string | null;
  source_url: string;
  apply_url: string | null;
  source_domain: string;
  last_verified_at: string;
  extraction_confidence: "low" | "medium" | "high";
  moderation_status: "pending" | "approved" | "rejected";
  registration_open_date: string | null;
  registration_close_date: string | null;
  eligibility_rules: Record<string, unknown>;
  required_documents: string[];
  amount_or_benefit: string | null;
  created_at: string;
}

export async function getOpportunities(filters?: {
  type?: string;
  state?: string;
  category?: string;
  stage?: string;
  search?: string;
}) {
  const supabase = createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Please complete your profile onboarding first" };
  }

  // 2. Fetch saved applications to mark isSaved
  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id);

  const savedMap = new Map<string, { id: string; status: string }>();
  applications?.forEach((app) => {
    savedMap.set(app.opportunity_id, { id: app.id, status: app.status });
  });

  // 3. Query opportunities
  const query = supabase.from("opportunities").select("*");

  if (filters?.type && filters.type !== "all") {
    query.eq("type", filters.type);
  }

  const { data: opportunities, error } = await query;

  if (error) {
    return { error: error.message };
  }

  // 4. Run eligibility evaluation and format
  let list: ClassifiedOpportunity[] = ((opportunities as unknown as DBRecord[]) || []).map((opp) => {
    const evaluation = evaluateEligibility(
      profile,
      opp.eligibility_rules,
      opp.extraction_confidence
    );
    
    const appInfo = savedMap.get(opp.id);

    return {
      ...opp,
      evaluation,
      isSaved: !!appInfo,
      applicationId: appInfo?.id,
      applicationStatus: appInfo?.status,
    };
  });

  // 5. Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    list = list.filter(
      (opp) =>
        opp.title.toLowerCase().includes(searchLower) ||
        opp.provider.toLowerCase().includes(searchLower) ||
        (opp.description && opp.description.toLowerCase().includes(searchLower))
    );
  }

  // 6. Apply filter rules for stage/category/state
  if (filters?.stage && filters.stage !== "all") {
    list = list.filter((opp) => {
      const stages = (opp.eligibility_rules.stages as string[]) || [];
      return stages.includes(filters.stage!);
    });
  }
  if (filters?.category && filters.category !== "all") {
    list = list.filter((opp) => {
      const cats = (opp.eligibility_rules.categories as string[]) || ["any"];
      return cats.includes("any") || cats.includes(filters.category!);
    });
  }
  if (filters?.state && filters.state !== "all") {
    list = list.filter((opp) => {
      const states = (opp.eligibility_rules.states as string[]) || ["any"];
      return states.includes("any") || states.includes(filters.state!);
    });
  }

  // Group into buckets
  const eligibleNow = list.filter((opp) => opp.evaluation.status === "eligible");
  const gapEligible = list.filter((opp) => opp.evaluation.status === "gap_eligible");
  const futureEligible = list.filter((opp) => opp.evaluation.status === "future_eligible");
  const ineligible = list.filter((opp) => opp.evaluation.status === "ineligible");

  return {
    success: true,
    all: list,
    eligibleNow,
    gapEligible,
    futureEligible,
    ineligible,
  };
}

export async function toggleSaveOpportunity(opportunityId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .single();

  if (existing) {
    // Delete application (unsave)
    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("id", existing.id);

    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    return { success: true, saved: false };
  } else {
    // Insert new application with status 'saved'
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      opportunity_id: opportunityId,
      status: "saved",
    });

    if (error) return { error: error.message };
    revalidatePath("/", "layout");
    return { success: true, saved: true };
  }
}

export async function getApplications() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data: apps, error } = await supabase
    .from("applications")
    .select("*, opportunity:opportunities(*)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { success: true, applications: apps || [] };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "saved" | "in_progress" | "submitted" | "result",
  notes?: string
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const updatePayload: {
    status: "saved" | "in_progress" | "submitted" | "result";
    updated_at: string;
    notes?: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (notes !== undefined) {
    updatePayload.notes = notes;
  }

  const { error } = await supabase
    .from("applications")
    .update(updatePayload)
    .eq("id", applicationId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
