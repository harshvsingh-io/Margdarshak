import React from "react";
import { getProfile } from "@/app/actions/profile";
import { redirect } from "next/navigation";
import ClientLandingPage from "@/components/ClientLandingPage";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const profileRes = await getProfile();

  // If authenticated → redirect directly to the logged-in dashboard
  if (profileRes.user) {
    redirect("/dashboard");
  }

  // If unauthenticated → render the premium public landing page
  return <ClientLandingPage />;
}
