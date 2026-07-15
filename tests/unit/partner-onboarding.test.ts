import { describe, expect, it } from "vitest";

import {
  getPartnerOnboardingBlockReason,
  validatePartnerOnboardingForm,
  withPartnerPublicMetadata,
} from "@/lib/partner/onboarding";

function validForm() {
  const form = new FormData();
  form.set("name", "  Example   Health  ");
  form.set("website", "https://example.org/programs");
  form.set("organizationType", "Clinic");
  form.set("title", "Program Director");
  return form;
}

describe("partner onboarding validation", () => {
  it("normalizes and validates the minimal organization record", () => {
    const result = validatePartnerOnboardingForm(validForm());

    expect(result).toMatchObject({
      success: true,
      data: {
        name: "Example Health",
        organizationType: "Clinic",
        title: "Program Director",
        website: "https://example.org/programs",
      },
    });
  });

  it("requires a name and rejects unsafe website schemes and credentials", () => {
    const form = validForm();
    form.set("name", "");
    form.set("website", "https://user:secret@example.org");
    const result = validatePartnerOnboardingForm(form);

    expect(result).toMatchObject({
      success: false,
      errors: {
        name: expect.any(String),
        website: expect.any(String),
      },
    });
  });
});

describe("partner onboarding action helpers", () => {
  const eligible = {
    clerkRole: "STUDENT" as const,
    databaseRole: "STUDENT" as const,
    hasPartnerMembership: false,
    hasStudentProfile: false,
    sessionRole: "STUDENT" as const,
  };

  it("allows only a clean default-student account", () => {
    expect(getPartnerOnboardingBlockReason(eligible)).toBeNull();
    expect(
      getPartnerOnboardingBlockReason({
        ...eligible,
        hasStudentProfile: true,
      }),
    ).toBe("EXISTING_STUDENT_PROFILE");
    expect(
      getPartnerOnboardingBlockReason({
        ...eligible,
        databaseRole: "ADMIN",
      }),
    ).toBe("ELEVATED_ACCOUNT");
    expect(
      getPartnerOnboardingBlockReason({
        ...eligible,
        hasPartnerMembership: true,
      }),
    ).toBe("EXISTING_PARTNER_ACCOUNT");
  });

  it("preserves unrelated Clerk public metadata while setting the role", () => {
    expect(
      withPartnerPublicMetadata({ locale: "en-US", role: "STUDENT" }),
    ).toEqual({ locale: "en-US", role: "PARTNER" });
  });
});
