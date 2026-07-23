import { describe, expect, it } from "vitest";

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
});
