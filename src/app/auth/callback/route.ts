import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("AUTH CALLBACK:", {
    hasCode: !!code,
    next,
    error,
    errorDescription,
    origin,
  });

  // If Supabase returned an error in the URL
  if (error) {
    console.error("AUTH CALLBACK ERROR FROM SUPABASE:", {
      error,
      errorDescription,
    });
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(
        errorDescription || error || "Authentication failed"
      )}`
    );
  }

  // Exchange the auth code for a session
  if (code) {
    const supabase = createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("AUTH CALLBACK EXCHANGE ERROR:", exchangeError.message);
      return NextResponse.redirect(
        `${origin}/?error=${encodeURIComponent(
          "Failed to complete authentication. Please try again."
        )}`
      );
    }

    // Session created successfully — check if user needs onboarding
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, current_stage")
        .eq("id", user.id)
        .single();

      console.log("AUTH CALLBACK PROFILE CHECK:", {
        userId: user.id,
        hasProfile: !!profile,
        currentStage: profile?.current_stage,
        profileError: profileError?.message,
      });

      // If no profile or incomplete profile → onboarding
      if (!profile || !profile.current_stage) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }

    console.log("AUTH CALLBACK SUCCESS → redirecting to:", next);
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code and no error — something went wrong
  console.error("AUTH CALLBACK: No code and no error in URL");
  return NextResponse.redirect(
    `${origin}/?error=${encodeURIComponent(
      "Authentication failed. Please try signing in again."
    )}`
  );
}
