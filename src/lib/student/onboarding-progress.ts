import type { StudentProfileForCompletion } from "./profile-completion";

type StudentOnboardingProgressInput = {
  firstName: string | null;
  lastName: string | null;
  profile: StudentProfileForCompletion | null;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function hasItems(value: readonly unknown[] | null | undefined) {
  return Boolean(value?.length);
}

export function getStudentOnboardingProgress({
  firstName,
  lastName,
  profile,
}: StudentOnboardingProgressInput) {
  const completedSteps = [
    hasText(firstName) &&
      hasText(lastName) &&
      hasText(profile?.school) &&
      hasText(profile?.gradeYear),
    hasText(profile?.city) &&
      hasText(profile?.state) &&
      hasText(profile?.country),
    hasItems(profile?.interestedSpecialties) &&
      hasItems(profile?.opportunityTypes) &&
      hasItems(profile?.availability),
    hasText(profile?.careerGoals),
  ];
  const firstIncomplete = completedSteps.findIndex((complete) => !complete);

  return {
    completedSteps,
    firstIncompleteStep:
      firstIncomplete === -1 ? completedSteps.length - 1 : firstIncomplete,
    isComplete: firstIncomplete === -1,
  };
}
