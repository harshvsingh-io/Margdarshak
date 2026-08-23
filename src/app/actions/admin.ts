"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Server-side check for admin/moderator roles
async function verifyRole(requiredRoles: Array<"admin" | "moderator">) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!userRole || !requiredRoles.includes(userRole.role as "admin" | "moderator")) {
    return { error: "Unauthorized access" };
  }

  return { user, role: userRole.role };
}

export async function getPendingOpportunities() {
  const check = await verifyRole(["admin", "moderator"]);
  if (check.error) return { error: check.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  return { opportunities: data || [] };
}

export async function moderateOpportunity(
  opportunityId: string,
  action: "approved" | "rejected",
  edits?: Record<string, unknown>
) {
  const check = await verifyRole(["admin", "moderator"]);
  if (check.error || !check.user) return { error: check.error || "Unauthorized" };

  const adminClient = createAdminClient();

  // If edited, update the opportunity details first
  if (edits && Object.keys(edits).length > 0) {
    const { error: editErr } = await adminClient
      .from("opportunities")
      .update(edits)
      .eq("id", opportunityId);
    
    if (editErr) return { error: `Failed to apply edits: ${editErr.message}` };
  }

  // Update moderation status
  const { error: statusErr } = await adminClient
    .from("opportunities")
    .update({ moderation_status: action })
    .eq("id", opportunityId);

  if (statusErr) return { error: `Failed to update status: ${statusErr.message}` };

  // Log in moderation_audit_log
  const { error: logErr } = await adminClient.from("moderation_audit_log").insert({
    moderator_id: check.user.id,
    opportunity_id: opportunityId,
    action: edits ? "edited_and_approved" : action,
    edits: edits ? JSON.parse(JSON.stringify(edits)) : null,
  });

  if (logErr) {
    console.error("Failed to write moderation audit log:", logErr.message);
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function promoteUserByEmail(email: string, targetRole: "admin" | "moderator") {
  // Only admins can promote other users
  const check = await verifyRole(["admin"]);
  if (check.error || !check.user) return { error: check.error || "Unauthorized" };

  const adminClient = createAdminClient();

  // 1. Search for user by email in auth.users using adminClient
  const { data: userList, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) return { error: `Auth lookup failed: ${listErr.message}` };

  const targetUser = userList.users.find(
    (u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()
  );

  if (!targetUser) {
    return { error: `User with email "${email}" not found in auth logs. They must sign up first.` };
  }

  // 2. Ensure profile exists
  const { error: profileErr } = await adminClient.from("profiles").upsert({
    id: targetUser.id,
    name: targetUser.user_metadata?.name || "Promoted User",
  }, { onConflict: "id" });

  if (profileErr) return { error: `Failed to initialize profile: ${profileErr.message}` };

  // 3. Update role in user_roles
  const { error: roleErr } = await adminClient.from("user_roles").upsert({
    user_id: targetUser.id,
    role: targetRole,
    assigned_by: check.user.id,
  }, { onConflict: "user_id" });

  if (roleErr) return { error: `Failed to assign role: ${roleErr.message}` };

  revalidatePath("/", "layout");
  return { success: true };
}
