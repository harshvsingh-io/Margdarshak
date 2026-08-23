import React from "react";
import { getProfile } from "@/app/actions/profile";
import { getOpportunities, getApplications } from "@/app/actions/opportunities";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  FileText,
  UserCheck,
  Compass,
} from "lucide-react";
import ClientDashboardWrapper from "@/components/ClientDashboardWrapper";

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

export default async function DashboardPage() {
  const profileRes = await getProfile();

  if (profileRes.error || !profileRes.user) {
    redirect("/login");
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

  const missingFields: string[] = [];
  if (profile.income_bracket === null || profile.income_bracket === undefined)
    missingFields.push("annual family income");
  if (!profile.district) missingFields.push("domicile district");
  if (!profile.interests || profile.interests.length === 0)
    missingFields.push("academic interests");
  if (!profile.gender) missingFields.push("gender details");

  const eligibleNow = (oppsRes.eligibleNow as unknown as DBOpportunity[]) || [];
  const newOpps = eligibleNow.filter((opp) => {
    const created = new Date(opp.created_at);
    const diffHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
    return diffHours <= 72;
  });

  const kpiCards = [
    {
      label: "Eligible Now",
      count: eligibleNowCountString(eligibleCount),
      color: "text-growth-teal",
      linkColor: "text-growth-teal",
      href: "/opportunities",
      linkText: "View Feed",
    },
    {
      label: "Gaps to Clear",
      count: String(gapCount),
      color: "text-seal-gold",
      linkColor: "text-seal-gold",
      href: "/opportunities",
      linkText: "Resolve Gaps",
    },
    {
      label: "Future Schemes",
      count: String(futureCount),
      color: "text-horizon-slate",
      linkColor: "text-horizon-slate",
      href: "/opportunities",
      linkText: "See Milestones",
    },
    {
      label: "Registry Saved",
      count: String(totalAppsCount),
      color: "text-ink",
      linkColor: "text-ink",
      href: "/tracker",
      linkText: "Open Tracker",
    },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* ─── Navbar ─── */}
      <header className="border-b border-ink/8 bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-seal-gold/10 border border-seal-gold/30 rounded-full flex items-center justify-center transition-all group-hover:border-seal-gold/60 group-hover:shadow-gold-glow">
              <GraduationCap className="w-4 h-4 text-seal-gold" />
            </div>
            <div>
              <h1 className="font-heading text-[15px] font-bold leading-tight tracking-tight">Margdarshak</h1>
              <span className="text-[9px] font-mono text-horizon-slate/70 uppercase tracking-[0.15em] block">
                Govt Opportunity Navigator
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {profileRes.profile?.user_roles?.[0]?.role === "admin" ||
            profileRes.profile?.user_roles?.[0]?.role === "moderator" ? (
              <Link href="/admin/moderation">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-seal-gold/30 text-seal-gold hover:bg-seal-gold/5 rounded-md text-[10px] font-mono uppercase tracking-wider h-7"
                >
                  Admin
                </Button>
              </Link>
            ) : null}
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold block leading-tight">{profile.name}</span>
              <span className="text-[8px] font-mono text-horizon-slate/60 uppercase tracking-[0.12em]">
                {profile.current_stage}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 mt-8 space-y-8">
        {/* ─── Welcome Section ─── */}
        <div className="space-y-1.5 animate-fade-in-up">
          <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-ink leading-tight">
            Namaste, {profile.name?.split(" ")[0]}
          </h2>
          <p className="text-sm text-horizon-slate font-sans leading-relaxed">
            Here is your personalized education opportunities dashboard.
          </p>
        </div>

        {/* ─── KPI Grid ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {kpiCards.map((kpi, i) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group block bg-paper border border-ink/8 rounded-lg p-4 md:p-5 relative overflow-hidden transition-all duration-200 hover:border-ink/15 hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Subtle top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
                kpi.color === "text-growth-teal" ? "from-growth-teal/40 to-growth-teal/0" :
                kpi.color === "text-seal-gold" ? "from-seal-gold/40 to-seal-gold/0" :
                kpi.color === "text-horizon-slate" ? "from-horizon-slate/30 to-horizon-slate/0" :
                "from-ink/20 to-ink/0"
              }`} />

              <span className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.15em] block">
                {kpi.label}
              </span>
              <span className={`font-mono text-3xl md:text-4xl font-bold ${kpi.color} block mt-1.5 leading-none`}>
                {kpi.count}
              </span>
              <span className={`text-[10px] font-sans font-semibold ${kpi.linkColor} flex items-center gap-0.5 mt-3 group-hover:gap-1.5 transition-all`}>
                {kpi.linkText} <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>

        {/* ─── Dynamic Prompts ─── */}
        <ClientDashboardWrapper
          profile={profile}
          upcomingDeadlines={upcomingDeadlines}
          missingFields={missingFields}
          newOppsCount={newOpps.length}
        />

        {/* ─── Quick Actions ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/opportunities" className="group block bg-paper border border-ink/8 rounded-lg p-6 relative overflow-hidden transition-all duration-200 hover:border-ink/15 hover:shadow-card-hover hover:-translate-y-0.5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-growth-teal/40 to-growth-teal/0" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-growth-teal/8 border border-growth-teal/15 flex items-center justify-center">
                <FileText className="w-5 h-5 text-growth-teal" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
                  Find New Opportunities
                </h3>
                <p className="text-xs text-horizon-slate font-sans leading-relaxed">
                  Browse verified scholarships, fellowships, and internships sourced directly from central and state portals.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-1.5 bg-growth-teal text-white rounded-md text-xs font-semibold h-9 px-4 group-hover:bg-growth-teal/90 transition-colors">
                Explore Feed <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>

          <Link href="/tracker" className="group block bg-paper border border-ink/8 rounded-lg p-6 relative overflow-hidden transition-all duration-200 hover:border-ink/15 hover:shadow-card-hover hover:-translate-y-0.5">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-seal-gold/40 to-seal-gold/0" />
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-seal-gold/8 border border-seal-gold/15 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-seal-gold" />
              </div>
              <div className="space-y-1">
                <h3 className="font-heading text-lg font-bold text-ink flex items-center gap-2">
                  Track Application Registry
                </h3>
                <p className="text-xs text-horizon-slate font-sans leading-relaxed">
                  Organize your saved, in-progress, and submitted government applications. Log notes and track documents.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-1.5 bg-seal-gold text-white rounded-md text-xs font-semibold h-9 px-4 group-hover:bg-seal-gold/90 transition-colors">
                Open Tracker <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </Link>
        </div>

        {/* ─── Bottom nav links ─── */}
        <div className="flex items-center justify-center gap-6 pt-4 pb-4">
          {[
            { href: "/opportunities", label: "Opportunities" },
            { href: "/tracker", label: "Tracker" },
            { href: "/vault", label: "Document Vault" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-sans text-horizon-slate/60 hover:text-ink transition-colors flex items-center gap-1"
            >
              <Compass className="w-3 h-3" />
              {link.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

function eligibleNowCountString(count: number): string {
  if (count < 10) return `0${count}`;
  return `${count}`;
}
