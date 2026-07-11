export type EligibilityCategory =
  | "STRONG_MATCH"
  | "POSSIBLE_MATCH"
  | "NOT_ELIGIBLE";

export type EligibilityResult = {
  category: EligibilityCategory;
  confirmedMatches: string[];
  concerns: string[];
  unknowns: string[];
  blockingReasons: string[];
};

export type EligibilityStudent = {
  ageYears?: number | null;
  gradeYear?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  certifications?: string[];
  interestedSpecialties?: string[];
  opportunityTypes?: string[];
} | null;

export type EligibilityOpportunity = {
  availabilityStatus?: string | null;
  deadline?: Date | null;
  minimumAge?: number | null;
  maximumAge?: number | null;
  acceptedGradeLevels?: string[];
  city?: string | null;
  state?: string | null;
  country?: string | null;
  geographicScope?: string | null;
  requiredCertifications?: string[];
  scheduleRequirements?: string | null;
  specialty?: string | null;
  type?: string | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") ?? "";
}
function overlaps(values: string[] | undefined, target: string | null | undefined) {
  const normalizedTarget = normalize(target);
  return Boolean(
    normalizedTarget &&
      values?.some((value) => {
        const normalizedValue = normalize(value);
        return (
          normalizedValue === normalizedTarget ||
          normalizedValue.includes(normalizedTarget) ||
          normalizedTarget.includes(normalizedValue)
        );
      }),
  );
}

export function evaluateOpportunityEligibility({
  now = new Date(),
  opportunity,
  student,
}: {
  now?: Date;
  opportunity: EligibilityOpportunity;
  student: EligibilityStudent;
}): EligibilityResult {
  const confirmedMatches: string[] = [];
  const concerns: string[] = [];
  const unknowns: string[] = [];
  const blockingReasons: string[] = [];

  if (["CLOSED", "EXPIRED", "ARCHIVED"].includes(opportunity.availabilityStatus ?? "")) {
    blockingReasons.push("This listing is not currently available.");
  } else if (opportunity.deadline && opportunity.deadline.getTime() < now.getTime()) {
    blockingReasons.push("The deadline has passed.");
  }

  if (opportunity.minimumAge == null && opportunity.maximumAge == null) {
    unknowns.push("The listing does not publish an age requirement.");
  } else if (student?.ageYears == null) {
    concerns.push("Add your age in years to check the published age requirement.");
  } else {
    if (opportunity.minimumAge != null && student.ageYears < opportunity.minimumAge) {
      blockingReasons.push(
        `The minimum age is ${opportunity.minimumAge}; your profile indicates ${student.ageYears}.`,
      );
    }
    if (opportunity.maximumAge != null && student.ageYears > opportunity.maximumAge) {
      blockingReasons.push(
        `The maximum age is ${opportunity.maximumAge}; your profile indicates ${student.ageYears}.`,
      );
    }
    if (
      (opportunity.minimumAge == null || student.ageYears >= opportunity.minimumAge) &&
      (opportunity.maximumAge == null || student.ageYears <= opportunity.maximumAge)
    ) {
      confirmedMatches.push("Meets the published age range.");
    }
  }

  const grades = opportunity.acceptedGradeLevels ?? [];
  if (grades.length === 0) {
    unknowns.push("The listing does not publish accepted grade levels.");
  } else if (!student?.gradeYear) {
    concerns.push("Add your grade level to check this requirement.");
  } else if (grades.some((grade) => normalize(grade) === normalize(student.gradeYear))) {
    confirmedMatches.push("Accepts your current grade level.");
  } else {
    blockingReasons.push(
      `Your grade level (${student.gradeYear}) is not in the published accepted grade levels.`,
    );
  }

  if (opportunity.geographicScope) {
    const requiredLocation = [opportunity.city, opportunity.state, opportunity.country]
      .filter(Boolean)
      .join(", ");
    const studentLocation = [student?.city, student?.state, student?.country]
      .filter(Boolean)
      .join(", ");
    if (!studentLocation) {
      concerns.push("Add your location to check the geographic restriction.");
    } else if (requiredLocation && !overlaps([studentLocation], requiredLocation)) {
      blockingReasons.push(`The listing is restricted to ${requiredLocation}.`);
    } else if (requiredLocation) {
      confirmedMatches.push("Your profile matches the published geographic scope.");
    } else {
      unknowns.push("The geographic restriction is not specific enough to confirm.");
    }
  }

  const requiredCertifications = opportunity.requiredCertifications ?? [];
  if (requiredCertifications.length > 0) {
    if (!student?.certifications?.length) {
      concerns.push("Add certifications to check the published certification requirements.");
    } else {
      const missing = requiredCertifications.filter(
        (required) => !overlaps(student.certifications, required),
      );
      if (missing.length > 0) {
        blockingReasons.push(`Missing required certification: ${missing.join(", ")}.`);
      } else {
        confirmedMatches.push("Meets the published certification requirements.");
      }
    }
  }

  if (opportunity.scheduleRequirements) {
    unknowns.push("Review the published schedule requirements before applying.");
  }

  if (student && overlaps(student.interestedSpecialties, opportunity.specialty)) {
    confirmedMatches.push(`Matches your interest in ${opportunity.specialty}.`);
  }
  if (student && overlaps(student.opportunityTypes, opportunity.type)) {
    confirmedMatches.push("Matches one of your preferred opportunity types.");
  }

  return {
    blockingReasons,
    category:
      blockingReasons.length > 0
        ? "NOT_ELIGIBLE"
        : confirmedMatches.length >= 2 && concerns.length === 0
          ? "STRONG_MATCH"
          : "POSSIBLE_MATCH",
    confirmedMatches,
    concerns,
    unknowns,
  };
}
