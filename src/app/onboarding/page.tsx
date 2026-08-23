"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, createOrUpdateProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDIAN_STATES, STAGES } from "@/lib/validations/profile";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [currentStage, setCurrentStage] = useState<string>("");
  const [classOrYear, setClassOrYear] = useState("");
  const [marks, setMarks] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");

  useEffect(() => {
    async function load() {
      const res = await getProfile();
      if (res.error) {
        toast.error("Please sign in first");
        router.push("/login");
        return;
      }
      if (res.profile) {
        setName(res.profile.name || "");
        setCurrentStage(res.profile.current_stage || "");
        setClassOrYear(res.profile.class_or_year || "");
        setMarks(res.profile.marks_percentage_or_cgpa?.toString() || "");
        setCategory(res.profile.category || "");
        setState(res.profile.state || "");
        if (res.profile.current_stage) {
          router.push("/");
          return;
        }
      } else if (res.user) {
        setName(res.user.user_metadata?.name || "");
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) { toast.error("Please enter your name"); return; }
      if (!currentStage) { toast.error("Please select your educational stage"); return; }
      setStep(2);
    } else if (step === 2) {
      if (!classOrYear.trim()) { toast.error("Please specify your class or year"); return; }
      if (!marks || isNaN(Number(marks)) || Number(marks) < 0 || Number(marks) > 100) { toast.error("Please enter valid marks (0-100)"); return; }
      setStep(3);
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) { toast.error("Please select your state"); return; }
    if (!category) { toast.error("Please select your category"); return; }
    setSaving(true);
    try {
      const payload = {
        name,
        current_stage: currentStage as "school" | "12th" | "undergrad" | "postgrad" | "working",
        class_or_year: classOrYear,
        marks_percentage_or_cgpa: Number(marks),
        category,
        state,
      };
      const res = await createOrUpdateProfile(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile initialized! Welcome to Margdarshak.");
        router.push("/");
        router.refresh();
      }
    } catch {
      toast.error("An error occurred while saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-seal-gold" />
          <p className="text-xs text-horizon-slate font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  const stepLabels = ["Identity", "Academics", "Demographics"];

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-seal-gold/10 border border-seal-gold/30 rounded-full flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-seal-gold" />
        </div>
        <span className="font-heading text-sm font-bold text-ink tracking-tight">Margdarshak</span>
      </div>

      {/* Staircase Progress */}
      <div className="w-full max-w-md mb-8 px-4">
        <div className="flex items-end justify-center gap-1.5 h-16">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 flex flex-col items-center justify-center border transition-all duration-300 rounded-md ${
                s === 1 ? "h-8" : s === 2 ? "h-12" : "h-16"
              } ${
                step >= s
                  ? "bg-growth-teal text-white border-growth-teal shadow-depth-1"
                  : "bg-paper text-ink/30 border-ink/8"
              }`}
            >
              <span className="font-mono text-[10px] font-bold">{s}</span>
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-horizon-slate/60">
            Step {step} of 3 — {stepLabels[step - 1]}
          </span>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-md bg-paper border border-ink/8 rounded-xl p-6 md:p-8 relative overflow-hidden shadow-card">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-growth-teal/50 via-seal-gold/30 to-transparent" />

        <div className="mb-5">
          <h2 className="font-heading text-xl font-bold text-ink tracking-tight">
            Setup Student Registry
          </h2>
          <p className="text-xs text-horizon-slate font-sans mt-1">
            Complete these fields to find matching government opportunities.
          </p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Full Name (as per official documents)</Label>
              <Input id="name" type="text" placeholder="Rajesh Kumar" value={name} onChange={(e) => setName(e.target.value)} className="bg-background border-ink/10 rounded-md h-10 text-sm focus-visible:ring-seal-gold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Current Educational Stage</Label>
              <Select value={currentStage} onValueChange={(val) => setCurrentStage(val || "")}>
                <SelectTrigger className="bg-background border-ink/10 rounded-md h-10 text-sm focus:ring-seal-gold">
                  <SelectValue placeholder="Select current stage" />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/10">
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize text-sm font-sans">{s === "12th" ? "Class 12 Pass-out" : s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={handleNext} className="bg-ink hover:bg-ink/90 text-white rounded-md font-sans font-semibold text-sm h-9 px-5">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="classOrYear" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Current Class or Year of Study</Label>
              <Input id="classOrYear" type="text" placeholder="E.g. Class 10, B.Tech 2nd Year" value={classOrYear} onChange={(e) => setClassOrYear(e.target.value)} className="bg-background border-ink/10 rounded-md h-10 text-sm focus-visible:ring-seal-gold" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="marks" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Marks Percentage or CGPA</Label>
              <Input id="marks" type="number" placeholder="E.g. 85 or 8.5" value={marks} onChange={(e) => setMarks(e.target.value)} className="bg-background border-ink/10 rounded-md h-10 text-sm font-mono focus-visible:ring-seal-gold" />
              <span className="text-[10px] text-horizon-slate/60 font-sans block">
                Enter percentage (e.g. 78) or CGPA scaled to 10 (e.g. 8.4)
              </span>
            </div>
            <div className="pt-4 flex justify-between">
              <Button onClick={handleBack} variant="outline" className="border-ink/10 hover:bg-ink/[0.03] font-sans rounded-md text-sm h-9">Back</Button>
              <Button onClick={handleNext} className="bg-ink hover:bg-ink/90 text-white rounded-md font-sans font-semibold text-sm h-9 px-5">Continue</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Social Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || "")}>
                <SelectTrigger className="bg-background border-ink/10 rounded-md h-10 text-sm focus:ring-seal-gold">
                  <SelectValue placeholder="Select social category" />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/10">
                  <SelectItem value="General" className="font-sans text-sm">General</SelectItem>
                  <SelectItem value="OBC" className="font-sans text-sm">OBC</SelectItem>
                  <SelectItem value="SC" className="font-sans text-sm">SC</SelectItem>
                  <SelectItem value="ST" className="font-sans text-sm">ST</SelectItem>
                  <SelectItem value="EWS" className="font-sans text-sm">EWS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-[10px] text-ink/60 font-mono uppercase tracking-wider">Home State / Domicile</Label>
              <Select value={state} onValueChange={(val) => setState(val || "")}>
                <SelectTrigger className="bg-background border-ink/10 rounded-md h-10 text-sm focus:ring-seal-gold">
                  <SelectValue placeholder="Select home state" />
                </SelectTrigger>
                <SelectContent className="bg-paper border-ink/10">
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s} className="font-sans text-sm">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 flex justify-between">
              <Button type="button" onClick={handleBack} variant="outline" className="border-ink/10 hover:bg-ink/[0.03] font-sans rounded-md text-sm h-9">Back</Button>
              <Button type="submit" disabled={saving} className="bg-seal-gold hover:bg-seal-gold/90 text-white rounded-md font-sans font-semibold text-sm h-9 px-5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Verify & Submit
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
