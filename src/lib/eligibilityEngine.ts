import { STAGES } from "./validations/profile";
import type { ProfileInput } from "@/app/actions/profile";

export interface GapDetail {
  criterion: "marks" | "income" | "state" | "category" | "gender" | "stage";
  message: string;
  nextStep: string;
}

export interface EligibilityResult {
  status: "eligible" | "gap_eligible" | "future_eligible" | "ineligible";
  gaps: GapDetail[];
  readinessScore: number; // 0 to 100
}

const STAGE_ORDER = STAGES;

export function evaluateEligibility(
  profile: ProfileInput | null,
  eligibilityRules: Record<string, unknown> | null,
  extractionConfidence: "low" | "medium" | "high"
): EligibilityResult {
  const gaps: GapDetail[] = [];
  let readinessScore = 100;

  if (!profile || !eligibilityRules) {
    return { status: "ineligible", gaps: [], readinessScore: 0 };
  }

  // 1. Stage Check
  const currentStage = profile.current_stage || "student";
  const requiredStages = (eligibilityRules.stages as string[]) || [];

  const isStageMatch = requiredStages.length === 0 || requiredStages.includes(currentStage);
  let isFutureStage = false;

  if (!isStageMatch && requiredStages.length > 0) {
    // Check if ALL required stages are in the future relative to currentStage
    const currentIdx = STAGE_ORDER.indexOf(currentStage as "school" | "12th" | "undergrad" | "postgrad" | "working");
    const minRequiredIdx = Math.min(
      ...requiredStages.map((s: string) =>
        STAGE_ORDER.indexOf(s as "school" | "12th" | "undergrad" | "postgrad" | "working")
      )
    );

    if (minRequiredIdx > currentIdx) {
      isFutureStage = true;
    }
  }

  // 2. Marks/CGPA Check
  const profileMarks = Number(profile.marks_percentage_or_cgpa || 0);
  const requiredMarks = Number(eligibilityRules.min_percentage || 0);
  const hasMarksCheck = requiredMarks > 0;
  const isMarksMatch = !hasMarksCheck || profileMarks >= requiredMarks;

  if (hasMarksCheck && !isMarksMatch) {
    gaps.push({
      criterion: "marks",
      message: `You currently have ${profileMarks}%, but this opportunity requires a minimum of ${requiredMarks}%.`,
      nextStep: `Work on improving your marks this term! If you can raise your academic average to ${requiredMarks}% by next semester, you will qualify.`,
    });

    const percentDiff = ((requiredMarks - profileMarks) / requiredMarks) * 100;
    readinessScore -= Math.min(35, Math.max(10, Math.round(percentDiff * 1.5)));
  }

  // 3. Income Check
  const profileIncome = Number(profile.income_bracket || 0);
  const requiredIncome = Number(eligibilityRules.max_income || 0);
  const hasIncomeCheck = requiredIncome > 0;
  const isIncomeMatch =
    !hasIncomeCheck ||
    profile.income_bracket === null ||
    profile.income_bracket === undefined ||
    profileIncome <= requiredIncome;

  if (hasIncomeCheck && !isIncomeMatch) {
    gaps.push({
      criterion: "income",
      message: `Your reported annual family income is ₹${profileIncome.toLocaleString(
        "en-IN"
      )}, which exceeds the eligibility threshold of ₹${requiredIncome.toLocaleString("en-IN")}.`,
      nextStep: `Verify if your official household income certificate is up to date. If your family income has changed, you can apply for an updated certificate at your local Tehsil office (~7 days). Otherwise, look for merit-only schemes.`,
    });
    readinessScore -= 30;
  }

  // 4. Category Check
  const profileCategory = profile.category || "General";
  const requiredCategories = (eligibilityRules.categories as string[]) || ["any"];
  const isCategoryMatch =
    requiredCategories.includes("any") ||
    requiredCategories.some(
      (cat: string) => cat.toLowerCase().trim() === profileCategory.toLowerCase().trim()
    );

  if (!isCategoryMatch) {
    gaps.push({
      criterion: "category",
      message: `This scheme is reserved for students in the ${requiredCategories.join(
        ", "
      )} category. Your profile is set to ${profileCategory}.`,
      nextStep: `Look for similar scholarships that are open to the ${profileCategory} category or listed under 'General' schemes.`,
    });
    readinessScore -= 40;
  }

  // 5. State Check
  const profileState = profile.state || "any";
  const requiredStates = (eligibilityRules.states as string[]) || ["any"];
  const isStateMatch =
    requiredStates.includes("any") ||
    requiredStates.some(
      (s: string) => s.toLowerCase().trim() === profileState.toLowerCase().trim()
    );

  if (!isStateMatch) {
    gaps.push({
      criterion: "state",
      message: `This program is reserved for domicile residents of ${requiredStates.join(
        ", "
      )}. Your home state is set to ${profileState}.`,
      nextStep: `Check out state-level schemes offered directly by the government of ${profileState}.`,
    });
    readinessScore -= 40;
  }

  // 6. Gender Check
  const profileGender = profile.gender || "any";
  const requiredGender = (eligibilityRules.gender as string) || "any";
  const isGenderMatch =
    requiredGender.toLowerCase() === "any" ||
    requiredGender.toLowerCase() === profileGender.toLowerCase();

  if (!isGenderMatch) {
    gaps.push({
      criterion: "gender",
      message: `This opportunity is reserved specifically for ${requiredGender} candidates.`,
      nextStep: `Browse other opportunities in the system that are open to all genders.`,
    });
    readinessScore -= 40;
  }

  // Final Evaluation
  let status: "eligible" | "gap_eligible" | "future_eligible" | "ineligible" = "eligible";

  // Check future stage
  if (isFutureStage) {
    if (gaps.length <= 1) {
      status = "future_eligible";
      gaps.unshift({
        criterion: "stage",
        message: `This opportunity is for students at the ${requiredStages.join(
          ", "
        )} stage. You are currently in the ${currentStage} stage.`,
        nextStep: `This will unlock automatically once you enter ${requiredStages[0]}. We've placed it in your Future-Eligible bucket!`,
      });
      readinessScore = Math.max(50, readinessScore - 20);
      return { status, gaps, readinessScore };
    }
  }

  if (gaps.length === 0) {
    status = "eligible";
    readinessScore = 100;
  } else if (gaps.length <= 2) {
    status = "gap_eligible";
    readinessScore = Math.max(10, readinessScore);
  } else {
    status = "ineligible";
    readinessScore = Math.max(0, readinessScore);
  }

  if (status === "eligible" && extractionConfidence === "low") {
    readinessScore = 90;
  }

  return { status, gaps, readinessScore };
}
