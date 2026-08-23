"use client";

import React from "react";
import { ClassifiedOpportunity } from "@/app/actions/opportunities";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Calendar, CheckCircle2, AlertCircle, HelpCircle, ExternalLink } from "lucide-react";
import { translations, Language } from "@/lib/i18n";

interface OpportunityCardProps {
  opportunity: ClassifiedOpportunity;
  onToggleSave: (id: string) => void;
  onViewDetails: (opp: ClassifiedOpportunity) => void;
  savingId: string | null;
  lang?: Language;
}

export default function OpportunityCard({
  opportunity,
  onToggleSave,
  onViewDetails,
  savingId,
  lang = "en",
}: OpportunityCardProps) {
  const {
    id,
    title,
    provider,
    type,
    amount_or_benefit,
    registration_close_date,
    source_domain,
    last_verified_at,
    isSaved,
    evaluation,
    extraction_confidence,
  } = opportunity;

  const t = translations[lang];

  const getDaysRemaining = () => {
    if (!registration_close_date) return null;
    const close = new Date(registration_close_date);
    const now = new Date();
    const diff = close.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();
  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEligibilityBadge = () => {
    switch (evaluation.status) {
      case "eligible":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-growth-teal/8 border border-growth-teal/20 text-growth-teal text-[10px] font-bold uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.eligibleNow}
          </span>
        );
      case "gap_eligible":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-seal-gold/8 border border-seal-gold/20 text-seal-gold text-[10px] font-bold uppercase tracking-wider font-mono">
            <AlertCircle className="w-3.5 h-3.5" />
            {t.gapEligible}
          </span>
        );
      case "future_eligible":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-horizon-slate/8 border border-horizon-slate/15 text-horizon-slate text-[10px] font-bold uppercase tracking-wider font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            {t.futureEligible}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-ink/5 border border-ink/10 text-ink/40 text-[10px] font-bold uppercase tracking-wider font-mono">
            Ineligible
          </span>
        );
    }
  };

  const getDaysAgoVerified = () => {
    const verified = new Date(last_verified_at);
    const now = new Date();
    const diff = now.getTime() - verified.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return t.verifiedToday;
    if (days === 1) return t.verifiedYesterday;
    return t.verifiedDaysAgo.replace("{days}", String(days));
  };

  return (
    <div
      className="group relative bg-paper border border-ink/8 rounded-lg overflow-hidden transition-all duration-200 hover:border-ink/15 hover:shadow-card-hover hover:-translate-y-0.5"
    >
      {/* Certificate-like layered depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-[3px] border border-ink/[0.03] rounded-lg" />
      </div>

      {/* Top accent bar based on eligibility */}
      <div className={`h-[2px] ${
        evaluation.status === "eligible" ? "bg-gradient-to-r from-growth-teal/50 via-growth-teal/30 to-transparent" :
        evaluation.status === "gap_eligible" ? "bg-gradient-to-r from-seal-gold/50 via-seal-gold/30 to-transparent" :
        "bg-gradient-to-r from-horizon-slate/30 via-horizon-slate/15 to-transparent"
      }`} />

      {/* Government verification seal watermark */}
      <div className="absolute top-4 right-4 w-11 h-11 rounded-full border border-growth-teal/15 flex items-center justify-center rotate-12 pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[4px] text-growth-teal/30 font-mono font-bold text-center leading-none uppercase">
          {lang === "hi" ? "सत्यापित" : "GOVT"}<br />{lang === "hi" ? "सरकार" : "VERIFIED"}
        </span>
      </div>

      <div className="p-5 md:p-6 flex flex-col justify-between min-h-[200px]">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              {getEligibilityBadge()}
              <span className="inline-flex items-center px-2 py-1 rounded-md border border-ink/8 bg-ink/[0.02] text-ink/50 text-[9px] font-mono uppercase tracking-wider">
                {type}
              </span>
            </div>

            <button
              onClick={() => onToggleSave(id)}
              disabled={savingId === id}
              className="text-ink/30 hover:text-seal-gold transition-colors p-1 -mt-0.5"
              title={isSaved ? "Saved" : "Save Opportunity"}
            >
              {isSaved ? (
                <BookmarkCheck className="w-5 h-5 text-seal-gold" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="space-y-1">
            <h3
              onClick={() => onViewDetails(opportunity)}
              className="font-heading text-lg md:text-xl font-bold text-ink leading-snug cursor-pointer group-hover:text-growth-teal transition-colors"
            >
              {title}
            </h3>
            <p className="text-xs font-sans text-horizon-slate">
              By <span className="font-medium">{provider}</span>
            </p>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/60 font-sans">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-ink/40" />
              <span>
                {t.closes}{" "}
                <span className={`font-mono font-semibold ${
                  isUrgent ? "text-stamp-red" : isExpired ? "text-ink/40 line-through" : "text-ink/80"
                }`}>
                  {formatDate(registration_close_date)}
                </span>
                {isUrgent && (
                  <span className="text-stamp-red font-bold ml-1 text-[10px] font-mono">
                    ({daysRemaining}d left)
                  </span>
                )}
              </span>
            </div>
            <div className="text-[10px] text-horizon-slate/70">
              Source: <span className="font-mono underline decoration-dotted">{source_domain}</span>
              {extraction_confidence !== "high" && (
                <span className="text-stamp-red/80 ml-1 font-medium">({t.unverified})</span>
              )}
              <span className="mx-1.5 text-ink/15">·</span>
              {getDaysAgoVerified()}
            </div>
          </div>
        </div>

        {/* Tear-off stub divider */}
        <div className="tear-off-stub my-4 pt-4 flex items-center justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[8px] font-mono text-horizon-slate/50 uppercase tracking-[0.15em] block">
              {t.benefitAmount}
            </span>
            <span className="font-mono text-sm font-bold text-seal-gold block truncate">
              {amount_or_benefit || "Stipend / Grant"}
            </span>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(opportunity)}
              className="border-ink/10 hover:bg-ink/[0.03] hover:border-ink/15 font-sans rounded-md text-xs h-8 px-3"
            >
              {t.verifyDetails}
            </Button>
            {opportunity.apply_url && (
              <a
                href={opportunity.apply_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="bg-growth-teal hover:bg-growth-teal/90 text-white rounded-md text-xs font-semibold h-8 px-3 flex items-center gap-1.5"
                >
                  {t.apply}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
