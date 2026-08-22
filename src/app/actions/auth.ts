"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    console.error("SIGNUP ERROR:", error.message);
    return { error: error.message };
  }

  console.log("SIGNUP SUCCESS:", { userId: data.user?.id, email });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("EMAIL SIGNIN ERROR:", error.message);
    return { error: error.message };
  }

  console.log("EMAIL SIGNIN SUCCESS:", { userId: data.user?.id });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient();

  // Build the callback URL - must match exactly what's in Supabase dashboard
  // under Authentication > Providers > Google > Authorized Redirect URIs
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const nextPath = redirectTo || "/";

  const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  console.log("GOOGLE OAUTH INIT:", {
    siteUrl,
    callbackUrl,
    nextPath,
  });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("GOOGLE OAUTH ERROR:", error.message);
    return { error: error.message };
  }

  console.log("GOOGLE OAUTH REDIRECT:", { url: data.url });
  return { url: data.url };
}

function formatPhone(raw: string): string {
  // Strip all non-digit characters except leading +
  let cleaned = raw.trim();

  // Remove spaces, dashes, parentheses, dots
  cleaned = cleaned.replace(/[\s\-().]/g, "");

  // If it starts with 00, replace with +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.substring(2);
  }

  // If it doesn't start with +, assume Indian number
  if (!cleaned.startsWith("+")) {
    // If it starts with 0, remove it (local format)
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    cleaned = "+91" + cleaned;
  }

  return cleaned;
}

export async function sendOtp(phone: string) {
  const supabase = createClient();
  const formattedPhone = formatPhone(phone);

  console.log("SEND OTP:", { original: phone, formatted: formattedPhone });

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  if (error) {
    console.error("SEND OTP ERROR:", error.message, {
      phone: formattedPhone,
    });
    return { error: error.message };
  }

  console.log("SEND OTP SUCCESS:", { phone: formattedPhone });
  return { success: true };
}

export async function verifyOtp(phone: string, token: string) {
  const supabase = createClient();
  const formattedPhone = formatPhone(phone);

  console.log("VERIFY OTP:", { phone: formattedPhone, tokenLength: token.length });

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: "sms",
  });

  if (error) {
    console.error("VERIFY OTP ERROR:", error.message);
    return { error: error.message };
  }

  console.log("VERIFY OTP SUCCESS:", { userId: data.user?.id });
  revalidatePath("/", "layout");
  return { success: true, user: data.user };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("SIGNOUT ERROR:", error.message);
    return { error: error.message };
  }
  revalidatePath("/", "layout");
  return { success: true };
}
