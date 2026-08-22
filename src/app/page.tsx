import React from "react";
import { getProfile } from "@/app/actions/profile";
import { getOpportunities, getApplications } from "@/app/actions/opportunities";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  FileText,
  UserCheck,
} from "lucide-react";
import ClientDashboardWrapper from "@/components/ClientDashboardWrapper";
import ClientLandingPage from "@/components/ClientLandingPage";

export const dynamic = "force-dynamic";

interface DBApplication {
  id: string;
  user_id: string;
  opportunity_id: string;
  status: "saved" | "in_progress" | "submitted" | "result";
  notes: string | null;
  updated_at: string;
  opportunity: {
    id: string;
    title: string;
    provider: string;
    registration_close_date: string | null;
    amount_or_benefit: string | null;
    eligibility_rules: Record<string, unknown>;
  } | null;
}

interface DBOpportunity {
  id: string;
  title: string;
  provider: string;
  created_at: string;
}

export default async function RootPage() {
  const profileRes = await getProfile();

  // If not authenticated or error → show public landing page
  if (profileRes.error || !profileRes.user) {
    return <ClientLandingPage />;
  }

  const profile = profileRes.profile;

  // Redirect to onboarding if they haven't filled out the initial stage
  if (!profile || !profile.current_stage) {
    redirect("/onboarding");
  }

  // Fetch opportunities and applications
  const oppsRes = await getOpportunities();
  const appsRes = await getApplications();

  const eligibleCount = oppsRes.eligibleNow?.length || 0;
  const gapCount = oppsRes.gapEligible?.length || 0;
  const futureCount = oppsRes.futureEligible?.length || 0;
  const totalAppsCount = appsRes.applications?.length || 0;

  // Compute nudges
  // 1. Upcoming deadlines (saved or in_progress, closing <= 7 days)
  const applications = (appsRes.applications as unknown as DBApplication[]) || [];
  const upcomingDeadlines = applications
    .filter((app) => {
      if (app.status !== "saved" && app.status !== "in_progress") return false;
      const closeDateStr = app.opportunity?.registration_close_date;
      if (!closeDateStr) return false;
      const close = new Date(closeDateStr);
      const diff = close.getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    })
    .map((app) => {
      const closeDateStr = app.opportunity!.registration_close_date!;
      const close = new Date(closeDateStr);
      const diff = close.getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return {
        id: app.id,
        title: app.opportunity!.title,
        days,
        closeDate: closeDateStr,
      };
    });

  // 2. Profile completion nudge
  const missingFields: string[] = [];
  if (profile.income_bracket === null || profile.income_bracket === undefined)
    missingFields.push("annual family income");
  if (!profile.district) missingFields.push("domicile district");
  if (!profile.interests || profile.interests.length === 0)
    missingFields.push("academic interests");
  if (!profile.gender) missingFields.push("gender details");

  // 3. New opportunities (added in last 3 days)
  const eligibleNow = (oppsRes.eligibleNow as unknown as DBOpportunity[]) || [];
  const newOpps = eligibleNow.filter((opp) => {
    const created = new Date(opp.created_at);
    const diffHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return diffHours <= 72; // 3 days
  });

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Top Banner Navigation */}
      <header className="border-b border-ink/10 bg-paper sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-seal-gold/10 border border-seal-gold rounded-full flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-seal-gold" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight">Margdarshak</h1>
            <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
              Govt Opportunity Navigator
            </span>
          </div>
        </div>

        {/* User profile identifier */}
        <div className="flex items-center gap-2">
          {profileRes.profile?.user_roles?.[0]?.role === "admin" ||
          profileRes.profile?.user_roles?.[0]?.role === "moderator" ? (
            <Link href="/admin/moderation">
              <Button
                size="sm"
                variant="outline"
                className="border-seal-gold text-[#C08A28] hover:bg-seal-gold/5 rounded-sm text-xs"
              >
                Moderation Panel
              </Button>
            </Link>
          ) : null}
          <div className="text-right">
            <span className="text-xs font-semibold block">{profile.name}</span>
            <span className="text-[9px] font-mono text-horizon-slate uppercase">
              {profile.current_stage}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-ink">
            Namaste, {profile.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-horizon-slate font-sans">
            Here is your personalized education opportunities dashboard.
          </p>
        </div>

        {/* KPI Counter grid in IBM Plex Mono */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-ink/20 rounded-sm bg-paper p-4 relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-ink/5 before:pointer-events-none shadow-none">
            <span className="text-[9px] font-mono text-horizon-slate uppercase tracking-wider block">
              Eligible Now
            </span>
            <span className="font-mono text-3xl font-bold text-growth-teal block mt-1">
              {eligibleNowCountString(eligibleCount)}
            </span>
            <Link
              href="/opportunities"
              className="text-[10px] font-sans font-semibold text-growth-teal hover:underline flex items-center gap-0.5 mt-2"
            >
              View Feed <ArrowRight className="w-3 h-3" />
            </Link>
          </Card>

          <Card className="border border-ink/20 rounded-sm bg-paper p-4 relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-ink/5 before:pointer-events-none shadow-none">
            <span className="text-[9px] font-mono text-horizon-slate uppercase tracking-wider block">
              Gaps to Clear
            </span>
            <span className="font-mono text-3xl font-bold text-[#C08A28] block mt-1">
              {gapCount}
            </span>
            <Link
              href="/opportunities"
              className="text-[10px] font-sans font-semibold text-[#C08A28] hover:underline flex items-center gap-0.5 mt-2"
            >
              Resolve Gaps <ArrowRight className="w-3 h-3" />
            </Link>
          </Card>

          <Card className="border border-ink/20 rounded-sm bg-paper p-4 relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-ink/5 before:pointer-events-none shadow-none">
            <span className="text-[9px] font-mono text-horizon-slate uppercase tracking-wider block">
              Future Schemes
            </span>
            <span className="font-mono text-3xl font-bold text-[#5C7290] block mt-1">
              {futureCount}
            </span>
            <Link
              href="/opportunities"
              className="text-[10px] font-sans font-semibold text-horizon-slate hover:underline flex items-center gap-0.5 mt-2"
            >
              See Milestones <ArrowRight className="w-3 h-3" />
            </Link>
          </Card>

          <Card className="border border-ink/20 rounded-sm bg-paper p-4 relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-ink/5 before:pointer-events-none shadow-none">
            <span className="text-[9px] font-mono text-horizon-slate uppercase tracking-wider block">
              Registry Saved
            </span>
            <span className="font-mono text-3xl font-bold text-ink block mt-1">
              {totalAppsCount}
            </span>
            <Link
              href="/tracker"
              className="text-[10px] font-sans font-semibold text-ink hover:underline flex items-center gap-0.5 mt-2"
            >
              Open Tracker <ArrowRight className="w-3 h-3" />
            </Link>
          </Card>
        </div>

        {/* Client side dynamic prompts and notifications wrapper */}
        <ClientDashboardWrapper
          profile={profile}
          upcomingDeadlines={upcomingDeadlines}
          missingFields={missingFields}
          newOppsCount={newOpps.length}
        />

        {/* Quick actions row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-ink/20 rounded-sm bg-paper shadow-none p-6 relative overflow-hidden before:content-[''] before:absolute before:inset-1.5 before:border before:border-ink/5 before:pointer-events-none">
            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-ink flex items-center gap-2">
                <FileText className="w-5 h-5 text-growth-teal" />
                Find New Opportunities
              </h3>
              <p className="text-xs text-horizon-slate font-sans">
                Browse our registry of verified scholarships, fellowships, and internships sourced directly from central and state portals.
              </p>
            </div>
            <div className="mt-4">
              <Link href="/opportunities">
                <Button className="bg-[#2F6F5E] hover:bg-[#2F6F5E]/90 text-white rounded-sm text-xs font-semibold w-full">
                  Explore Opportunities Feed
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="border border-ink/20 rounded-sm bg-paper shadow-none p-6 relative overflow-hidden before:content-[''] before:absolute before:inset-1.5 before:border before:border-ink/5 before:pointer-events-none">
            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-ink flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#C08A28]" />
                Track Application Registry
              </h3>
              <p className="text-xs text-horizon-slate font-sans">
                Organize your saved, in-progress, and submitted government applications. Log notes and keep track of documents.
              </p>
            </div>
            <div className="mt-4">
              <Link href="/tracker">
                <Button className="bg-[#C08A28] hover:bg-[#C08A28]/90 text-white rounded-sm text-xs font-semibold w-full">
                  Open Kanban Registry
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function eligibleNowCountString(count: number): string {
  if (count < 10) return `0${count}`;
  return `${count}`;
}
