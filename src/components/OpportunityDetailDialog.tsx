"use client";

import React from "react";
import { ClassifiedOpportunity } from "@/app/actions/opportunities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import { translations, Language } from "@/lib/i18n";

interface OpportunityDetailDialogProps {
  opportunity: ClassifiedOpportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadedDocs?: string[];
  lang?: Language;
}

export default function OpportunityDetailDialog({
  opportunity,
  open,
  onOpenChange,
  uploadedDocs = [],
  lang = "en",
}: OpportunityDetailDialogProps) {
  if (!opportunity) return null;

  const {
    title,
    provider,
    type,
    amount_or_benefit,
    description,
    source_url,
    apply_url,
    required_documents,
    eligibility_rules,
    evaluation,
    extraction_confidence,
  } = opportunity;

  const t = translations[lang];
  const showVerificationWarning = extraction_confidence === "low" || extraction_confidence === "medium";

  const statusColor =
    evaluation.status === "eligible" ? "growth-teal" :
    evaluation.status === "gap_eligible" ? "seal-gold" : "horizon-slate";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-paper border border-ink/10 rounded-xl p-0 overflow-hidden font-sans max-h-[85vh] shadow-elevated">
        {/* Top accent bar */}
        <div className={`h-[3px] bg-gradient-to-r ${
          statusColor === "growth-teal" ? "from-growth-teal/60 via-growth-teal/30 to-transparent" :
          statusColor === "seal-gold" ? "from-seal-gold/60 via-seal-gold/30 to-transparent" :
          "from-horizon-slate/40 via-horizon-slate/20 to-transparent"
        }`} />

        <div className="overflow-y-auto max-h-[calc(85vh-12px)] px-6 py-6 space-y-6">
          {/* Header */}
          <DialogHeader className="space-y-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-ink/8 bg-ink/[0.02] text-ink/50 text-[9px] font-mono uppercase tracking-wider">
                {type}
              </span>
              {evaluation.status === "eligible" ? (
                <span className="inline-flex items-center gap-1 text-growth-teal border border-growth-teal/20 bg-growth-teal/5 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> {t.eligibleNow}
                </span>
              ) : evaluation.status === "gap_eligible" ? (
                <span className="inline-flex items-center gap-1 text-seal-gold border border-seal-gold/20 bg-seal-gold/5 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" /> {t.gapEligible}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-horizon-slate border border-horizon-slate/15 bg-horizon-slate/5 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  {t.futureEligible}
                </span>
              )}
            </div>
            <DialogTitle className="font-heading text-2xl md:text-[1.65rem] text-ink leading-snug pt-1">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs text-horizon-slate font-sans">
              Offered by <span className="font-semibold text-ink/80">{provider}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Verification warning */}
          {showVerificationWarning && (
            <div className="p-3.5 bg-stamp-red/[0.03] border border-stamp-red/15 text-stamp-red rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider block">
                  {t.verificationReq}
                </span>
                <p className="text-[11px] leading-relaxed opacity-80">
                  {t.verificationWarning}
                </p>
              </div>
            </div>
          )}

          {/* Financial award */}
          <div className="p-4 bg-seal-gold/[0.03] border border-seal-gold/10 rounded-lg">
            <span className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.15em] block mb-1">
              {t.financialAward}
            </span>
            <span className="font-mono text-xl font-bold text-seal-gold">
              {amount_or_benefit || "Refer official guidelines"}
            </span>
          </div>

          {/* Description */}
          {description && (
            <div className="space-y-1.5">
              <h4 className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.15em]">
                {t.oppDetails}
              </h4>
              <p className="text-xs leading-relaxed text-ink/80 whitespace-pre-line font-sans">
                {description}
              </p>
            </div>
          )}

          {/* Eligibility rules grid */}
          <div className="space-y-2">
            <h4 className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.15em]">
              {t.officialParams}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs bg-ink/[0.02] border border-ink/6 rounded-lg p-4 font-mono text-ink/75">
              {[
                { label: "Min. Marks", value: eligibility_rules.min_percentage ? `${eligibility_rules.min_percentage}%` : "No limit" },
                { label: "Max Income", value: eligibility_rules.max_income ? `₹${Number(eligibility_rules.max_income).toLocaleString("en-IN")}/yr` : "No cap" },
                { label: "Stages", value: (eligibility_rules.stages as string[])?.join(", ") || "Any stage" },
                { label: "Categories", value: (eligibility_rules.categories as string[])?.join(", ") || "Open to all" },
                { label: "States", value: (eligibility_rules.states as string[])?.join(", ") || "All India" },
                { label: "Gender", value: (eligibility_rules.gender as string) || "Any" },
              ].map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <span className="text-horizon-slate/60 font-sans text-[10px] block">{item.label}</span>
                  <span className="text-ink/90">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Eligibility gap advice */}
          {evaluation.gaps && evaluation.gaps.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.15em]">
                {t.mentorAdvice}
              </h4>
              <div className="space-y-2.5">
                {evaluation.gaps.map((gap, index) => (
                  <div
                    key={index}
                    className="p-3.5 bg-seal-gold/[0.03] border border-seal-gold/10 rounded-lg space-y-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-seal-gold flex-shrink-0" />
                      <span className="text-[10px] font-bold text-ink/80 uppercase tracking-wider font-mono">
                        {gap.criterion} check failed
                      </span>
                    </div>
                    <p className="text-xs text-ink/70 italic leading-relaxed font-sans">
                      &ldquo;{gap.message}&rdquo;
                    </p>
                    <div className="text-[11px] text-ink/80 flex items-start gap-1.5 leading-relaxed font-sans">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-growth-teal flex-shrink-0" />
                      <span>
                        <strong className="font-semibold text-growth-teal">Next step:</strong>{" "}
                        {gap.nextStep}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required documents */}
          {required_documents && required_documents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.15em]">
                {t.requiredDocsCheck}
              </h4>
              <ul className="space-y-1.5">
                {required_documents.map((doc, idx) => {
                  const isUploaded = uploadedDocs.includes(doc);
                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-xs font-sans text-ink/80 border border-ink/6 p-2.5 rounded-md bg-ink/[0.01]"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-horizon-slate/50" />
                        <span>{doc}</span>
                      </div>
                      {isUploaded ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-growth-teal font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t.vaultVerified}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-seal-gold font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t.missingUpload}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-6 py-4 border-t border-ink/6 bg-ink/[0.01]">
          <Button
            variant="outline"
            className="flex-1 border-ink/10 hover:bg-ink/[0.03] hover:border-ink/15 font-sans rounded-md text-sm h-9"
            onClick={() => onOpenChange(false)}
          >
            {t.close}
          </Button>
          <a
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              className="w-full bg-ink hover:bg-ink/90 text-white rounded-md text-sm font-semibold h-9 flex items-center justify-center gap-1.5"
            >
              {t.officialGuidelines}
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </a>
          {apply_url && (
            <a
              href={apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                className="w-full bg-growth-teal hover:bg-growth-teal/90 text-white rounded-md text-sm font-semibold h-9 flex items-center justify-center gap-1.5"
              >
                {t.applyDirect}
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
