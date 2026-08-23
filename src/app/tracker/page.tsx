"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getApplications, updateApplicationStatus, toggleSaveOpportunity } from "@/app/actions/opportunities";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Calendar, ArrowLeft, BookmarkCheck, Trash2, Edit3 } from "lucide-react";
import { getProfile } from "@/app/actions/profile";
import Link from "next/link";

interface TrackerApplication {
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
    apply_url: string | null;
  } | null;
}

export default function TrackerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<TrackerApplication[]>([]);
  const [activeStatus, setActiveStatus] = useState<"saved" | "in_progress" | "submitted" | "result">("saved");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const profRes = await getProfile();
      if (profRes.error) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }
      const res = await getApplications();
      if (res.error) {
        toast.error(res.error);
      } else {
        setApplications(res.applications || []);
      }
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (appId: string, newStatus: "saved" | "in_progress" | "submitted" | "result") => {
    setUpdatingId(appId);
    try {
      const res = await updateApplicationStatus(appId, newStatus);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Application moved to ${newStatus.replace("_", " ")}`);
        setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app)));
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnsave = async (oppId: string, appId: string) => {
    setUpdatingId(appId);
    try {
      const res = await toggleSaveOpportunity(oppId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Removed from registry");
        setApplications((prev) => prev.filter((app) => app.id !== appId));
      }
    } catch {
      toast.error("Failed to remove");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStartEditingNotes = (app: TrackerApplication) => {
    setEditingId(app.id);
    setEditingNotes(app.notes || "");
  };

  const handleSaveNotes = async (appId: string) => {
    setUpdatingId(appId);
    try {
      const app = applications.find((a) => a.id === appId);
      if (!app) return;
      const res = await updateApplicationStatus(appId, app.status, editingNotes);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Notes saved!");
        setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, notes: editingNotes } : a)));
        setEditingId(null);
      }
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApps = applications.filter((app) => app.status === activeStatus);

  const getDaysRemaining = (closeDateStr: string | null) => {
    if (!closeDateStr) return null;
    const close = new Date(closeDateStr);
    const now = new Date();
    return Math.ceil((close.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const tabs = [
    { key: "saved" as const, label: "Saved", color: "horizon-slate", height: "h-8" },
    { key: "in_progress" as const, label: "In Progress", color: "seal-gold", height: "h-10" },
    { key: "submitted" as const, label: "Submitted", color: "growth-teal", height: "h-12" },
    { key: "result" as const, label: "Result", color: "ink", height: "h-14" },
  ];

  return (
    <div className="min-h-screen bg-paper text-ink font-sans pb-16">
      {/* Navbar */}
      <header className="border-b border-ink/8 bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 hover:bg-ink/[0.03] rounded-md transition-colors">
              <ArrowLeft className="w-4 h-4 text-ink/60" />
            </Link>
            <div>
              <h1 className="font-heading text-[15px] font-bold leading-tight tracking-tight">My Registry</h1>
              <span className="text-[9px] font-mono text-horizon-slate/60 uppercase tracking-[0.12em] block">
                Application Tracker
              </span>
            </div>
          </div>
          <Link href="/opportunities">
            <Button size="sm" variant="outline" className="border-ink/10 hover:bg-ink/[0.03] rounded-md text-[10px] font-sans h-7 px-2.5">
              Explore Feed
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-5">
        {/* Staircase Status Tabs */}
        <div className="flex items-end gap-1 border-b border-ink/6 pb-1">
          {tabs.map((tab) => {
            const count = applications.filter((a) => a.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`flex-1 flex flex-col items-center justify-center border border-b-0 rounded-t-md transition-all text-[10px] font-bold uppercase font-mono tracking-wider ${
                  tab.height
                } ${
                  activeStatus === tab.key
                    ? `bg-${tab.color} text-white border-${tab.color} shadow-depth-1`
                    : `bg-paper text-${tab.color}/60 border-ink/6 hover:bg-ink/[0.02]`
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-seal-gold" />
            <p className="text-xs text-horizon-slate/60 font-mono">Loading tracker...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="py-12 border border-dashed border-ink/10 rounded-lg text-center p-6">
            <BookmarkCheck className="w-8 h-8 mx-auto text-ink/15 mb-3" />
            <h3 className="font-heading text-base font-bold text-ink">No items in this step</h3>
            <p className="text-xs text-horizon-slate/60 font-sans max-w-xs mx-auto mt-1.5 leading-relaxed">
              Move opportunities along as you prepare materials. Browse the feed to save new ones.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => {
              const opp = app.opportunity;
              if (!opp) return null;
              const daysRemaining = getDaysRemaining(opp.registration_close_date);
              const isUrgent = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;

              return (
                <div key={app.id} className="group bg-paper border border-ink/8 rounded-lg p-4 md:p-5 space-y-3 transition-all hover:border-ink/12 hover:shadow-card">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="font-heading text-base font-bold text-ink leading-snug truncate">{opp.title}</h3>
                      <p className="text-[11px] font-sans text-horizon-slate/70 mt-0.5">{opp.provider}</p>
                    </div>
                    <button
                      onClick={() => handleUnsave(opp.id, app.id)}
                      disabled={updatingId === app.id}
                      className="text-ink/25 hover:text-stamp-red transition-colors p-1 flex-shrink-0"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-ink/60 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-ink/35" />
                    <span>
                      Deadline:{" "}
                      <span className={`font-mono font-semibold ${isUrgent ? "text-stamp-red" : ""}`}>
                        {formatDate(opp.registration_close_date)}
                      </span>
                      {isUrgent && (
                        <span className="text-stamp-red font-bold ml-1 text-[10px]">({daysRemaining}d left!)</span>
                      )}
                    </span>
                  </div>

                  {/* Notes */}
                  <div className="p-3 bg-ink/[0.02] border border-ink/6 rounded-md space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-horizon-slate/50 uppercase tracking-[0.15em]">Notes</span>
                      {editingId !== app.id && (
                        <button onClick={() => handleStartEditingNotes(app)} className="text-[10px] text-seal-gold font-semibold flex items-center gap-0.5 hover:text-seal-gold/80 transition-colors">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    {editingId === app.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          rows={3}
                          className="w-full text-xs font-sans bg-background border border-ink/8 p-2.5 focus-visible:ring-seal-gold rounded-md outline-none resize-none"
                          placeholder="Add tracking details..."
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="text-[10px] h-7 px-2.5 border-ink/10 rounded-md">Cancel</Button>
                          <Button size="sm" onClick={() => handleSaveNotes(app.id)} className="bg-growth-teal hover:bg-growth-teal/90 text-white text-[10px] h-7 px-2.5 rounded-md">Save</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-ink/60 font-sans italic leading-relaxed">
                        {app.notes || "No notes yet."}
                      </p>
                    )}
                  </div>

                  {/* Status Mover */}
                  <div className="tear-off-stub pt-3 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono text-horizon-slate/50 uppercase tracking-[0.15em] block">Status</span>
                      <span className="text-[11px] font-semibold capitalize font-sans">{app.status.replace("_", " ")}</span>
                    </div>
                    <div className="w-36">
                      <Select
                        disabled={updatingId === app.id}
                        value={app.status}
                        onValueChange={(val) => { if (val) handleStatusChange(app.id, val as "saved" | "in_progress" | "submitted" | "result"); }}
                      >
                        <SelectTrigger className="bg-background border-ink/10 rounded-md h-8 text-[10px] focus:ring-seal-gold">
                          <SelectValue placeholder="Move..." />
                        </SelectTrigger>
                        <SelectContent className="bg-paper border-ink/10">
                          <SelectItem value="saved" className="text-xs">Saved</SelectItem>
                          <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                          <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
                          <SelectItem value="result" className="text-xs">Result</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
