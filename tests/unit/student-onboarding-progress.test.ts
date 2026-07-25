import { describe, expect, it } from "vitest";

import { getStudentOnboardingProgress } from "@/lib/student/onboarding-progress";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";

function profile(overrides: Record<string, unknown> = {}) {
  return {
    availability: [],
    careerGoals: null,
    city: null,
    country: null,
    gradeYear: null,
    interestedSpecialties: [],
    opportunityTypes: [],
    school: null,
    state: null,
    ...overrides,
  };
}

describe("student onboarding progress", () => {
  it("resumes at the first incomplete step", () => {
    const progress = getStudentOnboardingProgress({
      firstName: "Avery",
      lastName: "Ng",
      profile: profile({
        gradeYear: "College freshman",
        school: "Example University",
      }),
    });

    expect(progress.completedSteps).toEqual([true, false, false, false]);
    expect(progress.firstIncompleteStep).toBe(1);
    expect(progress.isComplete).toBe(false);
  });

  it("requires every logical step before completion", () => {
    const completeProfile = profile({
      availability: ["Weekends"],
      careerGoals: "Explore clinical care",
      city: "Chicago",
      country: "United States",
      gradeYear: "College freshman",
      interestedSpecialties: ["Pediatrics"],
      opportunityTypes: ["SHADOWING"],
      school: "Example University",
      state: "Illinois",
    });
    const progress = getStudentOnboardingProgress({
      firstName: "Avery",
      lastName: "Ng",
      profile: completeProfile,
    });

    expect(progress.completedSteps).toEqual([true, true, true, true]);
    expect(progress.isComplete).toBe(true);
    expect(getCompletedStudentProfile(completeProfile)).toBe(completeProfile);
  });

  it("does not let a persisted draft count as a completed profile", () => {
    const partialProfile = profile({
      gradeYear: "College freshman",
      school: "Example University",
    });

    expect(getCompletedStudentProfile(partialProfile)).toBeNull();
  });
});
