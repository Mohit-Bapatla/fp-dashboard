import { describe, expect, it } from "vitest";

import { validateStudentProfileForm } from "@/lib/student/profile-validation";

function validStudentProfileForm() {
  const form = new FormData();
  Object.entries({
    availability: "Weekends",
    careerGoals: "Explore clinical care",
    city: "Chicago",
    country: "United States",
    firstName: "Test",
    gradeYear: "High school junior",
    interestedSpecialties: "Pediatrics",
    lastName: "Student",
    school: "Test School",
    state: "Illinois",
  }).forEach(([key, value]) => form.set(key, value));
  form.append("opportunityTypes", "SHADOWING");
  return form;
}

describe("student minimum-age affirmation", () => {
  it("is required for first profile creation", () => {
    const result = validateStudentProfileForm(validStudentProfileForm(), {
      requireMinimumAgeAffirmation: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.minimumAgeAffirmation).toMatch(/at least 13/i);
    }
  });

  it("allows a first profile after affirmation and does not re-ask on edits", () => {
    const createForm = validStudentProfileForm();
    createForm.set("minimumAgeAffirmation", "on");
    expect(
      validateStudentProfileForm(createForm, {
        requireMinimumAgeAffirmation: true,
      }).success,
    ).toBe(true);
    expect(validateStudentProfileForm(validStudentProfileForm()).success).toBe(
      true,
    );
  });
});
