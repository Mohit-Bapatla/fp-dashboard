import { describe, expect, it } from "vitest";

import { requiresMinimumAgeControl } from "@/lib/student/onboarding-state";
import { validateStudentProfileStep } from "@/lib/student/profile-validation";

function basicStep() {
  const form = new FormData();
  form.set("firstName", "Avery");
  form.set("lastName", "Ng");
  form.set("school", "Example University");
  form.set("gradeYear", "College freshman");
  form.set("minimumAgeAffirmation", "on");
  return form;
}

describe("step-level student onboarding validation", () => {
  it("does not let a hidden age control block later steps", () => {
    expect(requiresMinimumAgeControl(0)).toBe(true);
    expect(requiresMinimumAgeControl(1)).toBe(false);
    expect(requiresMinimumAgeControl(2)).toBe(false);
    expect(requiresMinimumAgeControl(3)).toBe(false);
  });

  it("saves a valid basic step without requiring later fields", () => {
    const result = validateStudentProfileStep(basicStep(), 0, {
      requireMinimumAgeAffirmation: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.school).toBe("Example University");
      expect(result.data.city).toBe("");
    }
  });

  it("validates only the active step while keeping allowed-value checks", () => {
    const form = new FormData();
    form.set("city", "Chicago");
    form.set("state", "Illinois");
    form.set("country", "United States");
    form.set("remotePreference", "Teleportation");

    const result = validateStudentProfileStep(form, 1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.remotePreference).toMatch(/listed/i);
      expect(result.errors.careerGoals).toBeUndefined();
    }
  });

  it("bounds field and array input sizes on the server", () => {
    const form = new FormData();
    form.set("interestedSpecialties", "Pediatrics");
    form.set("availability", "x".repeat(1_001));
    form.append("opportunityTypes", "SHADOWING");

    const result = validateStudentProfileStep(form, 2);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.availability).toMatch(/1,000/);
    }
  });

  it("rejects mixed invalid opportunity types instead of silently dropping them", () => {
    const form = new FormData();
    form.set("interestedSpecialties", "Pediatrics");
    form.set("availability", "Weekends");
    form.append("opportunityTypes", "SHADOWING");
    form.append("opportunityTypes", "NOT_A_REAL_TYPE");

    const result = validateStudentProfileStep(form, 2);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.opportunityTypes).toMatch(/only listed/i);
    }
  });

  it("deduplicates valid opportunity types and preserves empty optional arrays", () => {
    const form = new FormData();
    form.set("interestedSpecialties", "Pediatrics, pediatrics");
    form.set("availability", "Weekends");
    form.append("opportunityTypes", "SHADOWING");
    form.append("opportunityTypes", "SHADOWING");

    const result = validateStudentProfileStep(form, 2);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.interestedSpecialties).toEqual(["Pediatrics"]);
      expect(result.data.opportunityTypes).toEqual(["SHADOWING"]);
      expect(result.data.languages).toEqual([]);
      expect(result.data.certifications).toEqual([]);
      expect(result.data.preferredSeasons).toEqual([]);
    }
  });
});
