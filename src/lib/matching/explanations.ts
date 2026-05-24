import type { MatchScoreResult } from "@/lib/matching/match-score";

export type MatchExplanation = {
  improvementTips: string[];
  matchedPreferences: string[];
  matchedSkills: string[];
  missingRequirements: string[];
  possibleGaps: string[];
  whyRecommended: string[];
};

export type ApplicantFitExplanation = {
  disclaimer: string;
  fitReasons: string[];
  possibleGaps: string[];
  strengths: string[];
  suggestedQuestions: string[];
};

const applicantDisclaimer = "AI assists review; humans make final decisions.";

function clean(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(clean(values)));
}

export function getOpportunityMatchExplanation({
  match,
  opportunitySkills,
  resumeSkills,
}: {
  match: MatchScoreResult;
  opportunitySkills?: string[];
  resumeSkills?: string[];
}): MatchExplanation {
  const normalizedOpportunitySkills = new Set(
    (opportunitySkills ?? []).map((skill) => skill.toLowerCase()),
  );
  const matchedSkills = (resumeSkills ?? []).filter((skill) =>
    normalizedOpportunitySkills.size > 0
      ? normalizedOpportunitySkills.has(skill.toLowerCase())
      : match.reasons.some((reason) =>
          reason.toLowerCase().includes(skill.toLowerCase()),
        ),
  );
  const matchedPreferences = match.reasons.filter(
    (reason) => !reason.toLowerCase().includes("resume skills"),
  );
  const possibleGaps = match.gaps;
  const missingRequirements = possibleGaps.filter(
    (gap) =>
      gap.toLowerCase().includes("not specified") ||
      gap.toLowerCase().includes("align") ||
      gap.toLowerCase().includes("complete"),
  );
  const improvementTips = [
    matchedSkills.length === 0
      ? "Add more resume skills or parse your latest resume to improve skill matching."
      : "",
    matchedPreferences.length < 2
      ? "Update specialties, opportunity types, location, remote preference, and availability in your profile."
      : "",
    missingRequirements.length > 0
      ? "Review the eligibility requirements and application instructions before applying."
      : "",
  ];

  return {
    improvementTips: unique(improvementTips),
    matchedPreferences: unique(matchedPreferences),
    matchedSkills: unique(matchedSkills),
    missingRequirements: unique(missingRequirements),
    possibleGaps: unique(possibleGaps),
    whyRecommended: unique(match.reasons),
  };
}

export function getRecommendationExplanation(match: MatchScoreResult) {
  return {
    improvementTips:
      match.gaps.length > 0
        ? match.gaps
        : [
            "Keep your profile and parsed resume current for stronger recommendations.",
          ],
    whyRecommended:
      match.reasons.length > 0
        ? match.reasons
        : [
            "This recommendation is based on available profile and opportunity data.",
          ],
  };
}

export function getApplicantFitExplanation({
  gaps,
  interviewQuestions,
  matchReasons,
  strengths,
}: {
  gaps: string[];
  interviewQuestions: string[];
  matchReasons: string[];
  strengths: string[];
}): ApplicantFitExplanation {
  return {
    disclaimer: applicantDisclaimer,
    fitReasons: unique(matchReasons),
    possibleGaps: unique(gaps),
    strengths: unique(strengths),
    suggestedQuestions: unique(interviewQuestions),
  };
}
