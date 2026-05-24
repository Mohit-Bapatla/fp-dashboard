import type { OpportunityType } from "@/generated/prisma/enums";

export type MatchStudentProfile = {
  availability: string[];
  city: string | null;
  country: string | null;
  interestedSpecialties: string[];
  locationPreference: string | null;
  opportunityTypes: OpportunityType[];
  remotePreference: string | null;
  state: string | null;
};

export type MatchResume = {
  extractedSkills: string[];
} | null;

export type MatchOpportunity = {
  description?: string | null;
  eligibilityRequirements?: string | null;
  location: string | null;
  remoteType: string | null;
  specialty: string | null;
  title: string;
  type: OpportunityType;
};

export type MatchScoreResult = {
  gaps: string[];
  reasons: string[];
  score: number;
};

function normalize(value: string | null | undefined) {
  return value?.toLowerCase().trim() ?? "";
}

function includesEither(
  first: string | null | undefined,
  second: string | null | undefined,
) {
  const normalizedFirst = normalize(first);
  const normalizedSecond = normalize(second);

  if (!normalizedFirst || !normalizedSecond) {
    return false;
  }

  return (
    normalizedFirst.includes(normalizedSecond) ||
    normalizedSecond.includes(normalizedFirst)
  );
}

function hasOverlap(values: string[], target: string | null | undefined) {
  const normalizedTarget = normalize(target);

  return values.some((value) =>
    includesEither(normalize(value), normalizedTarget),
  );
}

function textHasOverlap(values: string[], text: string) {
  const normalizedText = normalize(text);

  return values.some((value) => normalizedText.includes(normalize(value)));
}

function addScore({
  amount,
  gaps,
  matched,
  reason,
  reasons,
  total,
}: {
  amount: number;
  gaps: string[];
  matched: boolean;
  reason: string;
  reasons: string[];
  total: { value: number };
}) {
  if (matched) {
    total.value += amount;
    reasons.push(reason);
  } else {
    gaps.push(reason);
  }
}

export function getOpportunityMatchScore({
  opportunity,
  profile,
  resume,
}: {
  opportunity: MatchOpportunity;
  profile: MatchStudentProfile | null;
  resume: MatchResume;
}): MatchScoreResult {
  if (!profile) {
    return {
      gaps: [
        "Complete your student profile to calculate a stronger fit score.",
      ],
      reasons: [],
      score: 0,
    };
  }

  const total = { value: 0 };
  const reasons: string[] = [];
  const gaps: string[] = [];
  const opportunityText = [
    opportunity.title,
    opportunity.description,
    opportunity.eligibilityRequirements,
    opportunity.specialty,
  ]
    .filter(Boolean)
    .join(" ");
  const locationText = [
    profile.city,
    profile.state,
    profile.country,
    profile.locationPreference,
  ]
    .filter(Boolean)
    .join(" ");

  addScore({
    amount: 30,
    gaps,
    matched: hasOverlap(profile.interestedSpecialties, opportunity.specialty),
    reason: opportunity.specialty
      ? `Specialty aligns with ${opportunity.specialty}.`
      : "Opportunity specialty is not specified.",
    reasons,
    total,
  });
  addScore({
    amount: 20,
    gaps,
    matched: profile.opportunityTypes.includes(opportunity.type),
    reason: `Opportunity type matches ${opportunity.type.toLowerCase().replaceAll("_", " ")} preference.`,
    reasons,
    total,
  });
  addScore({
    amount: 15,
    gaps,
    matched: includesEither(locationText, normalize(opportunity.location)),
    reason: opportunity.location
      ? `Location aligns with ${opportunity.location}.`
      : "Opportunity location is not specified.",
    reasons,
    total,
  });
  addScore({
    amount: 15,
    gaps,
    matched: includesEither(profile.remotePreference, opportunity.remoteType),
    reason: opportunity.remoteType
      ? `Format aligns with ${opportunity.remoteType}.`
      : "Opportunity format is not specified.",
    reasons,
    total,
  });
  addScore({
    amount: 10,
    gaps,
    matched:
      profile.availability.length > 0 &&
      textHasOverlap(profile.availability, opportunityText),
    reason: "Availability appears to align with the opportunity details.",
    reasons,
    total,
  });
  addScore({
    amount: 10,
    gaps,
    matched:
      Boolean(resume?.extractedSkills.length) &&
      textHasOverlap(resume?.extractedSkills ?? [], opportunityText),
    reason: "Resume skills overlap with the opportunity description.",
    reasons,
    total,
  });

  return {
    gaps: gaps.slice(0, 4),
    reasons: reasons.slice(0, 4),
    score: Math.min(100, total.value),
  };
}
