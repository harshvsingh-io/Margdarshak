"use client";

import React, { useState } from "react";
import { updateProgressiveProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProgressiveProfileProps {
  profile: {
    income_bracket?: number | null;
    district?: string | null;
    interests?: string[] | null;
    gender?: string | null;
    first_generation_learner?: boolean;
  };
  onUpdate: () => void;
}

const INTERESTS_OPTIONS = [
  "Engineering",
  "Medicine & Healthcare",
  "Pure Sciences",
  "Humanities & Arts",
  "Commerce & Finance",
  "Vocational & Diploma",
  "Law",
  "Agriculture",
  "Sports",
  "Social Work",
];

export default function ProgressiveProfile({
  profile,
  onUpdate,
}: ProgressiveProfileProps) {
  const [saving, setSaving] = useState(false);

  // Identify the first incomplete step
  const getIncompleteStep = () => {
    if (profile.income_bracket === null || profile.income_bracket === undefined) return 2;
    if (!profile.district) return 3;
    if (!profile.interests || profile.interests.length === 0) return 4;
    if (!profile.gender) return 5;
    return null; // Completed!
  };

  const currentStep = getIncompleteStep();

  // Field states
  const [income, setIncome] = useState("");
  const [district, setDistrict] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [gender, setGender] = useState("");
  const [firstGen, setFirstGen] = useState(false);

  if (currentStep === null) return null;

  const handleStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload: Record<string, unknown> = {};
      if (currentStep === 2) {
        if (!income || isNaN(Number(income)) || Number(income) < 0) {
          toast.error("Please enter a valid family income");
          setSaving(false);
          return;
        }
        payload = { income_bracket: Number(income) };
      } else if (currentStep === 3) {
        if (!district.trim()) {
          toast.error("Please enter your district");
          setSaving(false);
          return;
        }
        payload = { district: district.trim() };
      } else if (currentStep === 4) {
        if (selectedInterests.length === 0) {
          toast.error("Please select at least one interest");
          setSaving(false);
          return;
        }
        payload = { interests: selectedInterests };
      } else if (currentStep === 5) {
        if (!gender) {
          toast.error("Please specify your gender");
          setSaving(false);
          return;
        }
        payload = { gender, first_generation_learner: firstGen };
      }

      const res = await updateProgressiveProfile(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Progress saved! Staircase updated.");
        onUpdate();
      }
    } catch {
      toast.error("An error occurred while updating profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="w-full border border-ink/20 rounded-sm bg-paper p-6 relative overflow-hidden before:content-[''] before:absolute before:inset-1.5 before:border before:border-ink/5 before:pointer-events-none">
      {/* Dynamic staircase visual representing steps 1 to 5 */}
      <div className="mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest text-horizon-slate block mb-2 text-center">
          Registry Progress Staircase
        </span>
        <div className="flex items-end justify-center gap-1 h-14 max-w-sm mx-auto">
          {/* Step 1: Base */}
          <div className="flex-1 bg-growth-teal border border-growth-teal h-4 rounded-sm flex items-center justify-center text-[9px] text-white font-mono">
            1
          </div>
          {/* Step 2 */}
          <div
            className={`flex-1 h-6 rounded-sm flex items-center justify-center text-[9px] font-mono border ${
              currentStep > 2
                ? "bg-growth-teal border-growth-teal text-white"
                : currentStep === 2
                ? "bg-seal-gold border-seal-gold text-white animate-pulse"
                : "bg-paper border-ink/10 text-ink/30"
            }`}
          >
            2
          </div>
          {/* Step 3 */}
          <div
            className={`flex-1 h-8 rounded-sm flex items-center justify-center text-[9px] font-mono border ${
              currentStep > 3
                ? "bg-growth-teal border-growth-teal text-white"
                : currentStep === 3
                ? "bg-seal-gold border-seal-gold text-white animate-pulse"
                : "bg-paper border-ink/10 text-ink/30"
            }`}
          >
            3
          </div>
          {/* Step 4 */}
          <div
            className={`flex-1 h-10 rounded-sm flex items-center justify-center text-[9px] font-mono border ${
              currentStep > 4
                ? "bg-growth-teal border-growth-teal text-white"
                : currentStep === 4
                ? "bg-seal-gold border-seal-gold text-white animate-pulse"
                : "bg-paper border-ink/10 text-ink/30"
            }`}
          >
            4
          </div>
          {/* Step 5 */}
          <div
            className={`flex-1 h-12 rounded-sm flex items-center justify-center text-[9px] font-mono border ${
              currentStep === 5
                ? "bg-seal-gold border-seal-gold text-white animate-pulse"
                : "bg-paper border-ink/10 text-ink/30"
            }`}
          >
            5
          </div>
        </div>
      </div>

      {/* Form Questions */}
      <form onSubmit={handleStepSubmit} className="space-y-4">
        {currentStep === 2 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-heading text-lg text-ink font-semibold">
                Milestone 2: Annual Family Income
              </h4>
              <p className="text-xs text-horizon-slate font-sans">
                Many central and state government scholarships depend on family income limits. Add yours to unlock tailored matches.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="income" className="text-xs text-ink/70">
                Annual Household Income (in ₹)
              </Label>
              <Input
                id="income"
                type="number"
                placeholder="E.g. 250000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="bg-paper border-ink/20 rounded-sm font-mono h-10 text-sm focus-visible:ring-seal-gold"
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-heading text-lg text-ink font-semibold">
                Milestone 3: Domicile District
              </h4>
              <p className="text-xs text-horizon-slate font-sans">
                District-level schemes are highly targeted and have much less competition. Where do you reside?
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district" className="text-xs text-ink/70">
                District Name
              </Label>
              <Input
                id="district"
                type="text"
                placeholder="E.g. Jaipur, Pune, Patna"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="bg-paper border-ink/20 rounded-sm font-sans h-10 text-sm focus-visible:ring-seal-gold"
              />
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="font-heading text-lg text-ink font-semibold">
                Milestone 4: Academic Interests
              </h4>
              <p className="text-xs text-horizon-slate font-sans">
                Select your fields of study to narrow down technical fellowships or program internships.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {INTERESTS_OPTIONS.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-sm border text-xs font-sans transition-all ${
                      selected
                        ? "bg-growth-teal text-white border-growth-teal"
                        : "bg-paper text-ink/70 border-ink/20 hover:bg-ink/5"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-heading text-lg text-ink font-semibold">
                Milestone 5: Demographics & Learner Status
              </h4>
              <p className="text-xs text-horizon-slate font-sans">
                Provide gender details and first-generation learner status to access schemes reserved specifically for first-gen or women scholars.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-ink/70 block">Gender</Label>
              <div className="flex gap-2">
                {["Female", "Male", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-sm border text-xs font-sans text-center transition-all ${
                      gender === g
                        ? "bg-growth-teal text-white border-growth-teal font-semibold"
                        : "bg-paper text-ink/70 border-ink/20 hover:bg-ink/5"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t border-ink/5">
              <input
                id="firstGen"
                type="checkbox"
                checked={firstGen}
                onChange={(e) => setFirstGen(e.target.checked)}
                className="w-4 h-4 rounded-sm border-ink/20 accent-[#2F6F5E] cursor-pointer"
              />
              <Label
                htmlFor="firstGen"
                className="text-xs font-sans text-ink/80 select-none cursor-pointer leading-tight"
              >
                I am a first-generation college student (neither of my parents went to college)
              </Label>
            </div>
          </div>
        )}

        <div className="tear-off-stub pt-4 mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#C08A28] hover:bg-[#C08A28]/90 text-white rounded-sm font-sans font-semibold text-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Verify & Lock Step
          </Button>
        </div>
      </form>
    </div>
  );
}
