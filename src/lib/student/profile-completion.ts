import type { StudentProfile } from "@/generated/prisma/client";

export type StudentProfileForCompletion = Pick<
  StudentProfile,
  | "school"
  | "gradeYear"
  | "city"
  | "state"
  | "country"
  | "interestedSpecialties"
  | "opportunityTypes"
  | "availability"
  | "careerGoals"
  | "experienceLevel"
>;

const completionFields = [
  "school",
  "gradeYear",
  "city",
  "state",
  "country",
  "interestedSpecialties",
  "opportunityTypes",
  "availability",
  "careerGoals",
  "experienceLevel",
] as const;

function hasValue(value: string | string[] | null) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value?.trim());
}

export function getStudentProfileCompletion(
  profile: StudentProfileForCompletion | null,
) {
  if (!profile) {
    return {
      completedFields: 0,
      totalFields: completionFields.length,
      percent: 0,
      isComplete: false,
    };
  }

  const completedFields = completionFields.filter((field) =>
    hasValue(profile[field]),
  ).length;
  const percent = Math.round((completedFields / completionFields.length) * 100);

  return {
    completedFields,
    totalFields: completionFields.length,
    percent,
    isComplete: completedFields === completionFields.length,
  };
}
