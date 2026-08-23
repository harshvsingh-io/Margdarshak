"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressiveProfile from "./ProgressiveProfile";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PlusCircle, CheckCircle, Bell, ArrowRight, Loader2, Edit, LogOut } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { toast } from "sonner";
import { createOrUpdateProfile, type ProfileInput } from "@/app/actions/profile";
import { INDIAN_STATES, STAGES } from "@/lib/validations/profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClientDashboardWrapperProps {
  profile: ProfileInput;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    days: number;
    closeDate: string;
  }>;
  missingFields: string[];
  newOppsCount: number;
}

export default function ClientDashboardWrapper({
  profile,
  upcomingDeadlines,
  missingFields,
  newOppsCount,
}: ClientDashboardWrapperProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Profile Edit States
  const [name, setName] = useState(profile.name || "");
  const [currentStage, setCurrentStage] = useState(profile.current_stage || "undergrad");
  const [classOrYear, setClassOrYear] = useState(profile.class_or_year || "");
  const [marks, setMarks] = useState(profile.marks_percentage_or_cgpa?.toString() || "");
  const [category, setCategory] = useState(profile.category || "General");
  const [state, setState] = useState(profile.state || "Rajasthan");
  const [income, setIncome] = useState(profile.income_bracket?.toString() || "");
  const [district, setDistrict] = useState(profile.district || "");
  const [gender, setGender] = useState(profile.gender || "Female");
  const [firstGen, setFirstGen] = useState(profile.first_generation_learner || false);

  const handleProfileUpdated = () => {
    router.refresh();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!classOrYear.trim()) {
      toast.error("Class/Year is required");
      return;
    }
    if (!marks || isNaN(Number(marks)) || Number(marks) < 0 || Number(marks) > 100) {
      toast.error("Please enter a valid marks percentage (0 - 100)");
      return;
    }

    setSaving(true);
    try {
      const payload: ProfileInput = {
        name,
        current_stage: currentStage as "school" | "12th" | "undergrad" | "postgrad" | "working",
        class_or_year: classOrYear,
        marks_percentage_or_cgpa: Number(marks),
        category,
        state: state as typeof INDIAN_STATES[number],
        income_bracket: income ? Number(income) : null,
        district: district || null,
        gender: gender || null,
        first_generation_learner: firstGen,
      };

      const res = await createOrUpdateProfile(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile updated successfully!");
        setEditOpen(false);
        window.location.reload();
      }
    } catch {
      toast.error("Failed to save profile changes");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const res = await signOut();
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Signed out successfully!");
        window.location.href = "/";
      }
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Urgent Deadline Warning */}
      {upcomingDeadlines.length > 0 && (
        <div className="relative p-4 bg-stamp-red/[0.03] border border-stamp-red/15 rounded-lg overflow-hidden animate-fade-in-up">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-stamp-red/50 via-stamp-red/25 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-stamp-red/8 border border-stamp-red/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-stamp-red" />
            </div>
            <div className="space-y-2 flex-grow min-w-0">
              <h4 className="font-heading text-sm font-bold text-stamp-red uppercase tracking-wider">
                Urgent Deadline Warning
              </h4>
              <p className="text-xs text-ink/70 font-sans leading-relaxed">
                You have {upcomingDeadlines.length} saved {upcomingDeadlines.length === 1 ? "application" : "applications"} closing in less than a week:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-xs text-ink/70 font-sans">
                {upcomingDeadlines.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <strong className="text-ink">{item.title}</strong> closes in{" "}
                    <span className="font-mono text-stamp-red font-bold">{item.days} days</span>
                  </li>
                ))}
              </ul>
              <div className="pt-1">
                <Button
                  onClick={() => router.push("/tracker")}
                  className="bg-stamp-red hover:bg-stamp-red/90 text-white rounded-md text-[10px] font-semibold h-8 px-3"
                >
                  Go to Tracker
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. New Matching Opportunities */}
      {newOppsCount > 0 && (
        <div className="relative p-4 bg-growth-teal/[0.03] border border-growth-teal/15 rounded-lg overflow-hidden animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-growth-teal/50 via-growth-teal/25 to-transparent" />
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-growth-teal/8 border border-growth-teal/15 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-growth-teal" />
            </div>
            <div className="space-y-2 flex-grow min-w-0">
              <h4 className="font-heading text-sm font-bold text-growth-teal uppercase tracking-wider">
                New Openings Alert
              </h4>
              <p className="text-xs text-ink/70 font-sans leading-relaxed">
                We found <span className="font-mono font-bold text-growth-teal">{newOppsCount} new government opportunities</span> matching your profile in the last 72 hours.
              </p>
              <div className="pt-1">
                <Button
                  onClick={() => router.push("/opportunities")}
                  className="bg-growth-teal hover:bg-growth-teal/90 text-white rounded-md text-[10px] font-semibold h-8 px-3 flex items-center gap-1"
                >
                  Explore Matches <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Profile Completion */}
      {missingFields.length > 0 ? (
        <div className="space-y-3">
          <div className="p-3 bg-seal-gold/[0.03] border border-seal-gold/15 rounded-lg flex items-start gap-2.5">
            <PlusCircle className="w-4 h-4 text-seal-gold mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-seal-gold block">
                Unlock More Opportunities
              </span>
              <p className="text-[11px] leading-relaxed text-ink/70">
                {missingFields.length} field{missingFields.length === 1 ? "" : "s"} remaining. Adding your{" "}
                <strong className="text-ink/90">{missingFields[0]}</strong> could unlock more tailored matches.
              </p>
            </div>
          </div>

          <ProgressiveProfile
            profile={profile}
            onUpdate={handleProfileUpdated}
          />
        </div>
      ) : (
        <div className="p-3 bg-growth-teal/[0.03] border border-growth-teal/15 rounded-lg flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-growth-teal flex-shrink-0" />
          <span className="text-xs font-sans text-growth-teal font-medium">
            Student registry profile is 100% complete. All criteria matches unlocked.
          </span>
        </div>
      )}

      {/* 4. Settings Bar */}
      <div className="flex justify-between items-center pt-3 border-t border-ink/6">
        <span className="text-[10px] font-mono text-horizon-slate/50">
          Registry ID: <span className="text-horizon-slate/70">{profile.id ? profile.id.substring(0, 8) : "Guest"}...</span>
        </span>
        <div className="flex items-center gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger>
              <span className="text-[10px] text-growth-teal hover:text-growth-teal/80 font-semibold flex items-center gap-1 cursor-pointer transition-colors">
                <Edit className="w-3 h-3" /> Edit Profile
              </span>
            </DialogTrigger>
            <DialogContent className="bg-paper border border-ink/10 rounded-xl max-w-lg p-0 overflow-hidden font-sans shadow-elevated">
              <div className="h-[2px] bg-gradient-to-r from-growth-teal/50 via-growth-teal/25 to-transparent" />
              <div className="px-6 py-5">
                <DialogHeader className="mb-4">
                  <DialogTitle className="font-heading text-xl text-ink">Edit Student Registry Profile</DialogTitle>
                  <DialogDescription className="text-xs text-horizon-slate">
                    Update your details to instantly match eligible schemes.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveProfile} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-name" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Full Name</Label>
                      <Input id="edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-ink/10 rounded-md h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-gender" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Gender</Label>
                      <Select value={gender} onValueChange={(val) => setGender(val || "Female")}>
                        <SelectTrigger className="bg-background border-ink/10 rounded-md h-9 text-xs">
                          <SelectValue placeholder="Gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-paper border-ink/10">
                          <SelectItem value="Female" className="text-xs">Female</SelectItem>
                          <SelectItem value="Male" className="text-xs">Male</SelectItem>
                          <SelectItem value="Other" className="text-xs">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-stage" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Education Stage</Label>
                      <Select value={currentStage} onValueChange={(val) => setCurrentStage(val as "school" | "12th" | "undergrad" | "postgrad" | "working")}>
                        <SelectTrigger className="bg-background border-ink/10 rounded-md h-9 text-xs">
                          <SelectValue placeholder="Stage" />
                        </SelectTrigger>
                        <SelectContent className="bg-paper border-ink/10">
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">{s === "12th" ? "Class 12 Pass-out" : s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-class" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Class / Year</Label>
                      <Input id="edit-class" type="text" value={classOrYear} onChange={(e) => setClassOrYear(e.target.value)} placeholder="e.g. B.Tech 3rd Year" className="bg-background border-ink/10 rounded-md h-9 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-marks" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Marks %</Label>
                      <Input id="edit-marks" type="number" value={marks} onChange={(e) => setMarks(e.target.value)} className="bg-background border-ink/10 rounded-md h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-category" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Social Category</Label>
                      <Select value={category} onValueChange={(val) => setCategory(val || "General")}>
                        <SelectTrigger className="bg-background border-ink/10 rounded-md h-9 text-xs">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-paper border-ink/10">
                          <SelectItem value="General" className="text-xs">General</SelectItem>
                          <SelectItem value="OBC" className="text-xs">OBC</SelectItem>
                          <SelectItem value="SC" className="text-xs">SC</SelectItem>
                          <SelectItem value="ST" className="text-xs">ST</SelectItem>
                          <SelectItem value="EWS" className="text-xs">EWS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-state" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Domicile State</Label>
                      <Select value={state} onValueChange={(val) => setState(val as typeof INDIAN_STATES[number])}>
                        <SelectTrigger className="bg-background border-ink/10 rounded-md h-9 text-xs">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent className="bg-paper border-ink/10 max-h-48">
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-district" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">District</Label>
                      <Input id="edit-district" type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Jaipur" className="bg-background border-ink/10 rounded-md h-9 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-income" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Annual Household Income (₹)</Label>
                    <Input id="edit-income" type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 250000" className="bg-background border-ink/10 rounded-md h-9 text-xs" />
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <input id="edit-firstgen" type="checkbox" checked={firstGen} onChange={(e) => setFirstGen(e.target.checked)} className="w-3.5 h-3.5 rounded-sm border-ink/15 accent-growth-teal cursor-pointer" />
                    <Label htmlFor="edit-firstgen" className="text-[11px] text-ink/70 cursor-pointer select-none">
                      First-generation college student
                    </Label>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-ink/5">
                    <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="border-ink/10 hover:bg-ink/[0.03] rounded-md text-xs h-8 px-3">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving} className="bg-seal-gold hover:bg-seal-gold/90 text-white rounded-md text-xs font-semibold h-8 px-3 flex items-center">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                      Save Profile
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>

          <span className="text-ink/10">·</span>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-[10px] text-stamp-red/70 hover:text-stamp-red font-semibold flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
