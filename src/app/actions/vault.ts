"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUserDocuments() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("user_documents")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { documents: data || [] };
}

export async function uploadDocument(formData: FormData) {
  const file = formData.get("file") as File;
  const docType = formData.get("docType") as string;

  if (!file || !docType) {
    return { error: "File and Document Type are required" };
  }

  // 1. Validation: Only PDF, JPG, and PNG allowed (Backend Hardening Stage 2)
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Unsupported file type. Only PDF, JPG, and PNG are allowed." };
  }

  // 2. Validation: Max 5MB per file
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File size exceeds the maximum 5MB limit." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const fileExtension = file.name.split(".").pop() || "bin";
  // Store files in private user folders: user_id/doc_type.ext
  const storagePath = `${user.id}/${docType.replace(/\s+/g, "_").toLowerCase()}.${fileExtension}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to 'documents' bucket
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      return { error: `Storage upload failed: ${uploadErr.message}` };
    }

    // 3. Save to database table user_documents
    const { error: dbErr } = await supabase
      .from("user_documents")
      .upsert(
        {
          user_id: user.id,
          doc_type: docType,
          file_name: file.name,
          storage_path: storagePath,
          uploaded_at: new Date().toISOString(),
        },
        { onConflict: "user_id, doc_type" }
      );

    if (dbErr) {
      return { error: `Database reference logging failed: ${dbErr.message}` };
    }

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { error: `Upload processing failed: ${errMsg}` };
  }
}

export async function deleteDocument(docId: string, storagePath: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Delete from storage
  const { error: storageErr } = await supabase.storage
    .from("documents")
    .remove([storagePath]);

  if (storageErr) {
    return { error: `Storage deletion failed: ${storageErr.message}` };
  }

  // Delete from db reference
  const { error: dbErr } = await supabase
    .from("user_documents")
    .delete()
    .eq("id", docId)
    .eq("user_id", user.id);

  if (dbErr) {
    return { error: `Database reference deletion failed: ${dbErr.message}` };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
