"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPendingOpportunities, moderateOpportunity } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ExternalLink, Check, X, Edit, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface OpportunityRecord {
  id: string;
  title: string;
  type: "scholarship" | "fellowship" | "internship" | "program";
  provider: string;
  description: string | null;
  source_url: string;
  apply_url: string | null;
  amount_or_benefit: string | null;
  registration_close_date: string | null;
  eligibility_rules: Record<string, unknown>;
  required_documents: string[];
}

export default function ModerationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingOpps, setPendingOpps] = useState<OpportunityRecord[]>([]);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  // Edit State
  const [editingOpp, setEditingOpp] = useState<OpportunityRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editProvider, setEditProvider] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCloseDate, setEditCloseDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getPendingOpportunities();
      if (res.error) {
        toast.error(res.error);
        router.push("/");
      } else {
        setPendingOpps((res.opportunities as unknown as OpportunityRecord[]) || []);
      }
    } catch {
      toast.error("Failed to load pending queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (oppId: string) => {
    setModeratingId(oppId);
    try {
      const res = await moderateOpportunity(oppId, "approved");
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Opportunity approved and visible to students!");
        setPendingOpps((prev) => prev.filter((o) => o.id !== oppId));
      }
    } catch {
      toast.error("Moderation action failed");
    } finally {
      setModeratingId(null);
    }
  };

  const handleReject = async (oppId: string) => {
    setModeratingId(oppId);
    try {
      const res = await moderateOpportunity(oppId, "rejected");
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Opportunity archived as rejected");
        setPendingOpps((prev) => prev.filter((o) => o.id !== oppId));
      }
    } catch {
      toast.error("Moderation action failed");
    } finally {
      setModeratingId(null);
    }
  };

  const startEditing = (opp: OpportunityRecord) => {
    setEditingOpp(opp);
    setEditTitle(opp.title);
    setEditProvider(opp.provider);
    setEditAmount(opp.amount_or_benefit || "");
    setEditDescription(opp.description || "");
    setEditCloseDate(opp.registration_close_date || "");
  };

  const handleSaveAndApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    setModeratingId(editingOpp.id);
    try {
      const edits = {
        title: editTitle,
        provider: editProvider,
        amount_or_benefit: editAmount || null,
        description: editDescription || null,
        registration_close_date: editCloseDate || null,
      };

      const res = await moderateOpportunity(editingOpp.id, "approved", edits);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Edits saved and opportunity approved!");
        setPendingOpps((prev) => prev.filter((o) => o.id !== editingOpp.id));
        setEditingOpp(null);
      }
    } catch {
      toast.error("Failed to save and approve");
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Navigation Header */}
      <header className="border-b border-ink/10 bg-paper sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button size="icon" variant="ghost" className="w-8 h-8 rounded-sm hover:bg-ink/5">
              <ArrowLeft className="w-4 h-4 text-ink" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight">Clearance Registry</h1>
            <span className="text-[10px] font-mono text-horizon-slate uppercase tracking-wider block">
              Moderator Queue
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/roles">
            <Button
              size="sm"
              variant="outline"
              className="border-ink/20 hover:bg-ink/5 rounded-sm text-xs font-sans"
            >
              Promote Users
            </Button>
          </Link>
          <Link href="/opportunities">
            <Button
              size="sm"
              variant="outline"
              className="border-ink/20 hover:bg-ink/5 rounded-sm text-xs font-sans"
            >
              Back to Feed
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-ink/5">
          <h2 className="font-heading text-2xl font-bold">
            Pending Queue ({pendingOpps.length})
          </h2>
          <span className="text-[10px] font-mono text-horizon-slate uppercase">
            Items require manual review
          </span>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-seal-gold" />
            <p className="text-xs text-horizon-slate font-sans mt-2">Loading pending clearance items...</p>
          </div>
        ) : pendingOpps.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-ink/20 rounded-sm bg-paper p-6">
            <ShieldAlert className="w-10 h-10 mx-auto text-ink/30 mb-2" />
            <h3 className="font-heading text-lg font-bold text-ink">Clearance Registry Empty</h3>
            <p className="text-xs text-horizon-slate font-sans max-w-sm mx-auto mt-1">
              All extracted opportunities have been moderated. New items will land here if they fail high-confidence auto-approval rules.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingOpps.map((opp) => (
              <Card
                key={opp.id}
                className="w-full border border-ink/20 rounded-sm bg-paper shadow-none relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-ink/5 before:pointer-events-none p-1"
              >
                <CardContent className="pt-5 pb-4 px-4 space-y-4">
                  {/* Edit view overlay if editing this opp */}
                  {editingOpp?.id === opp.id ? (
                    <form onSubmit={handleSaveAndApprove} className="space-y-4">
                      <h4 className="font-heading text-lg font-bold text-ink pb-2 border-b border-ink/10">
                        Edit & Approve Opportunity
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="editTitle" className="text-xs text-ink/80">Opportunity Title</Label>
                          <Input
                            id="editTitle"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-paper border-ink/20 rounded-sm font-sans h-9 text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="editProvider" className="text-xs text-ink/80">Provider / Organization</Label>
                          <Input
                            id="editProvider"
                            value={editProvider}
                            onChange={(e) => setEditProvider(e.target.value)}
                            className="bg-paper border-ink/20 rounded-sm font-sans h-9 text-sm"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="editAmount" className="text-xs text-ink/80">Benefit / Stipend Amount</Label>
                          <Input
                            id="editAmount"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="bg-paper border-ink/20 rounded-sm font-mono h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="editCloseDate" className="text-xs text-ink/80">Closing Date (YYYY-MM-DD)</Label>
                          <Input
                            id="editCloseDate"
                            value={editCloseDate}
                            placeholder="YYYY-MM-DD"
                            onChange={(e) => setEditCloseDate(e.target.value)}
                            className="bg-paper border-ink/20 rounded-sm font-mono h-9 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="editDescription" className="text-xs text-ink/80">Description</Label>
                        <textarea
                          id="editDescription"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows={4}
                          className="w-full text-xs font-sans bg-paper border border-ink/20 p-2 focus-visible:ring-seal-gold rounded-sm outline-none resize-none"
                        />
                      </div>

                      <div className="flex gap-2 justify-end pt-2 border-t border-ink/10">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingOpp(null)}
                          className="border-ink/20 hover:bg-ink/5 font-sans rounded-sm text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={moderatingId === opp.id}
                          className="bg-[#2F6F5E] hover:bg-[#2F6F5E]/90 text-white rounded-sm text-xs font-semibold"
                        >
                          {moderatingId === opp.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          ) : null}
                          Save & Approve
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Regular review view
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h3 className="font-heading text-lg font-bold text-ink">
                            {opp.title}
                          </h3>
                          <span className="text-xs font-sans text-horizon-slate">
                            By {opp.provider} • <span className="capitalize">{opp.type}</span>
                          </span>
                        </div>
                        <a
                          href={opp.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-seal-gold flex items-center gap-0.5 hover:underline font-semibold"
                        >
                          Verify Source <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {opp.description && (
                        <p className="text-xs leading-relaxed text-ink/80 whitespace-pre-line bg-ink/5 p-3 rounded-sm">
                          {opp.description}
                        </p>
                      )}

                      {/* Side by side stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-paper border border-ink/10 rounded-sm p-3 font-mono text-[11px] text-ink/80">
                        <div>
                          <span className="text-horizon-slate font-sans block text-[9px]">Benefit</span>
                          <span>{opp.amount_or_benefit || "Unspecified"}</span>
                        </div>
                        <div>
                          <span className="text-horizon-slate font-sans block text-[9px]">Deadline</span>
                          <span>{opp.registration_close_date || "Unspecified"}</span>
                        </div>
                        <div>
                          <span className="text-horizon-slate font-sans block text-[9px]">Category</span>
                          <span>{(opp.eligibility_rules?.categories as string[])?.join(", ") || "All"}</span>
                        </div>
                        <div>
                          <span className="text-horizon-slate font-sans block text-[9px]">State</span>
                          <span>{(opp.eligibility_rules?.states as string[])?.join(", ") || "All"}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="tear-off-stub pt-3 flex justify-between gap-2">
                        <Button
                          disabled={moderatingId === opp.id}
                          variant="outline"
                          onClick={() => startEditing(opp)}
                          className="border-ink/20 hover:bg-ink/5 font-sans rounded-sm text-xs h-9 flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5 text-seal-gold" />
                          Edit & Approve
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            disabled={moderatingId === opp.id}
                            onClick={() => handleReject(opp.id)}
                            className="bg-[#9E3B3B] hover:bg-[#9E3B3B]/90 text-white rounded-sm text-xs font-semibold h-9 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                          <Button
                            disabled={moderatingId === opp.id}
                            onClick={() => handleApprove(opp.id)}
                            className="bg-[#2F6F5E] hover:bg-[#2F6F5E]/90 text-white rounded-sm text-xs font-semibold h-9 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve As-Is
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
