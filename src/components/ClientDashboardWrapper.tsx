"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressiveProfile from "./ProgressiveProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PlusCircle, CheckCircle, Bell, ArrowRight, Loader2, Edit } from "lucide-react";
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
    // Reload the page to refresh server props on dashboard
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
        window.location.reload(); // Force full refresh to recalculate matching feed
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
        window.location.href = "/"; // Redirect to landing page after sign-out
      }
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Urgent Deadline Nudge Box (Stamp Red color) */}
      {upcomingDeadlines.length > 0 && (
        <Card className="border border-stamp-red/30 bg-stamp-red/5 rounded-sm p-4 shadow-none relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-stamp-red/10 before:pointer-events-none">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-stamp-red flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-grow">
              <h4 className="font-heading text-base font-bold text-stamp-red uppercase tracking-wide">
                Urgent Deadline Warning
              </h4>
              <p className="text-xs text-ink/90 font-sans leading-relaxed">
                You have {upcomingDeadlines.length} saved {upcomingDeadlines.length === 1 ? "application" : "applications"} closing in less than a week:
              </p>
              <ul className="space-y-1 pl-4 list-disc text-xs text-ink/80 font-sans">
                {upcomingDeadlines.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <strong className="text-ink">{item.title}</strong> closes in{" "}
                    <span className="font-mono text-stamp-red font-bold">{item.days} days</span> (
                    {item.closeDate})
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Button
                  onClick={() => router.push("/tracker")}
                  className="bg-stamp-red hover:bg-stamp-red/90 text-white rounded-sm text-xs font-semibold h-8"
                >
                  Go to Application Tracker
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. New matching opportunities alert */}
      {newOppsCount > 0 && (
        <Card className="border border-growth-teal/30 bg-growth-teal/5 rounded-sm p-4 shadow-none relative overflow-hidden before:content-[''] before:absolute before:inset-1 before:border before:border-growth-teal/10 before:pointer-events-none">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-growth-teal flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-grow">
              <h4 className="font-heading text-base font-bold text-growth-teal uppercase tracking-wide">
                New Openings Alert
              </h4>
              <p className="text-xs text-ink/90 font-sans leading-relaxed">
                We found <span className="font-mono font-bold text-growth-teal">{newOppsCount} new government opportunities</span> matching your profile that opened in the last 72 hours!
              </p>
              <div className="pt-1.5">
                <Button
                  onClick={() => router.push("/opportunities")}
                  className="bg-[#2F6F5E] hover:bg-[#2F6F5E]/90 text-white rounded-sm text-xs font-semibold h-8 flex items-center gap-1"
                >
                  Explore New Matches <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Incomplete Profile Prompt (Staircase Progressive Profile) */}
      {missingFields.length > 0 ? (
        <div className="space-y-3.5">
          <div className="p-3 bg-seal-gold/5 border border-seal-gold/20 text-[#C08A28] rounded-sm flex items-start gap-2.5">
            <PlusCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-sans text-xs font-bold uppercase tracking-wider block">
                Unlock More Opportunities
              </span>
              <p className="text-[11px] leading-relaxed text-ink/80">
                You have {missingFields.length} field{missingFields.length === 1 ? "" : "s"} left to complete. Adding your{" "}
                <strong>{missingFields[0]}</strong> could unlock up to 10 more tailored government scholarships!
              </p>
            </div>
          </div>

          <ProgressiveProfile
            profile={profile}
            onUpdate={handleProfileUpdated}
          />
        </div>
      ) : (
        <Card className="border border-growth-teal/20 rounded-sm bg-paper p-4 shadow-none flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-sans text-growth-teal">
            <CheckCircle className="w-5 h-5 text-growth-teal" />
            <span>Your student registry profile is 100% complete! All criteria matches unlocked.</span>
          </div>
        </Card>
      )}

      {/* Settings / Signout Stub */}
      <div className="flex justify-between items-center pt-2 border-t border-ink/10 text-xs font-sans text-horizon-slate">
        <span>Student Registry ID: <span className="font-mono">{profile.id ? profile.id.substring(0, 8) : "Guest"}...</span></span>
        <div className="flex items-center gap-3">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger className="text-growth-teal hover:underline font-semibold flex items-center gap-1">
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </DialogTrigger>
            <DialogContent className="bg-paper border border-ink/20 rounded-sm max-w-lg p-6 font-sans">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl text-ink">Edit Student Registry Profile</DialogTitle>
                <DialogDescription className="text-xs text-horizon-slate">
                  Update your educational and demographic details to instantly match eligible schemes.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveProfile} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-name" className="text-xs text-ink/75">Full Name</Label>
                    <Input
                      id="edit-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-paper border-ink/20 rounded-sm h-9 text-xs"
                    />
                  </div>
                  {/* Gender */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-gender" className="text-xs text-ink/75">Gender</Label>
                    <Select value={gender} onValueChange={(val) => setGender(val || "Female")}>
                      <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-paper border border-ink/15">
                        <SelectItem value="Female" className="text-xs">Female</SelectItem>
                        <SelectItem value="Male" className="text-xs">Male</SelectItem>
                        <SelectItem value="Other" className="text-xs">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Current Stage */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-stage" className="text-xs text-ink/75">Education Stage</Label>
                    <Select value={currentStage} onValueChange={(val) => setCurrentStage(val as "school" | "12th" | "undergrad" | "postgrad" | "working")}>
                      <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs">
                        <SelectValue placeholder="Stage" />
                      </SelectTrigger>
                      <SelectContent className="bg-paper border border-ink/15">
                        {STAGES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize text-xs">
                            {s === "12th" ? "Class 12 Pass-out" : s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Class or Year */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-class" className="text-xs text-ink/75">Class / Year</Label>
                    <Input
                      id="edit-class"
                      type="text"
                      value={classOrYear}
                      onChange={(e) => setClassOrYear(e.target.value)}
                      placeholder="e.g. B.Tech 3rd Year"
                      className="bg-paper border-ink/20 rounded-sm h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Marks */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-marks" className="text-xs text-ink/75">Marks % or CGPA</Label>
                    <Input
                      id="edit-marks"
                      type="number"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="bg-paper border-ink/20 rounded-sm h-9 text-xs"
                    />
                  </div>
                  {/* Social Category */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-category" className="text-xs text-ink/75">Social Category</Label>
                    <Select value={category} onValueChange={(val) => setCategory(val || "General")}>
                      <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-paper border border-ink/15">
                        <SelectItem value="General" className="text-xs">General</SelectItem>
                        <SelectItem value="OBC" className="text-xs">OBC</SelectItem>
                        <SelectItem value="SC" className="text-xs">SC</SelectItem>
                        <SelectItem value="ST" className="text-xs">ST</SelectItem>
                        <SelectItem value="EWS" className="text-xs">EWS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Domicile State */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-state" className="text-xs text-ink/75">Domicile State</Label>
                    <Select value={state} onValueChange={(val) => setState(val as typeof INDIAN_STATES[number])}>
                      <SelectTrigger className="bg-paper border-ink/20 rounded-sm h-9 text-xs">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent className="bg-paper border border-ink/15 max-h-48">
                        {INDIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* District */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-district" className="text-xs text-ink/75">District</Label>
                    <Input
                      id="edit-district"
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Jaipur"
                      className="bg-paper border-ink/20 rounded-sm h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Family Income */}
                  <div className="space-y-1">
                    <Label htmlFor="edit-income" className="text-xs text-ink/75">Annual Household Income (₹)</Label>
                    <Input
                      id="edit-income"
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="e.g. 250000"
                      className="bg-paper border-ink/20 rounded-sm h-9 text-xs"
                    />
                  </div>
                </div>

                {/* First Gen Checkbox */}
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    id="edit-firstgen"
                    type="checkbox"
                    checked={firstGen}
                    onChange={(e) => setFirstGen(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-ink/20 accent-[#2F6F5E] cursor-pointer"
                  />
                  <Label htmlFor="edit-firstgen" className="text-xs text-ink/80 cursor-pointer select-none">
                    I am a first-generation college student
                  </Label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-ink/5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                    className="border-ink/20 hover:bg-ink/5 rounded-sm text-xs h-9 px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-[#C08A28] hover:bg-[#C08A28]/90 text-white rounded-sm text-xs font-semibold h-9 px-4 flex items-center"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                    Save Profile Registry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <span className="text-ink/30">|</span>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-stamp-red hover:underline font-semibold"
          >
            {signingOut ? "Signing Out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
