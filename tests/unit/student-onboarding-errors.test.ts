import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyStudentOnboardingError,
  createStudentOnboardingFailure,
} from "@/lib/student/onboarding-errors";
import { initialStudentOnboardingActionState } from "@/lib/student/onboarding-state";
import { emptyStudentProfileFormValues } from "@/lib/student/profile-validation";

describe("student onboarding errors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a user-safe reference and logs no form payload", () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    const values = {
      ...emptyStudentProfileFormValues,
      careerGoals: "private resume-like text",
      school: "Private School",
    };

    const result = createStudentOnboardingFailure({
      error: new Error("database unavailable"),
      previousState: initialStudentOnboardingActionState,
      resumeStep: 2,
      userId: "database-user-a",
      values,
    });

    expect(result.formError).toMatch(/reference [A-F0-9]{8}/);
    expect(result.formError).toMatch(/previously saved progress/i);
    expect(result.supportReference).toMatch(/^[A-F0-9]{8}$/);
    expect(errorLog).toHaveBeenCalledOnce();

    const logged = JSON.stringify(errorLog.mock.calls[0]);
    expect(logged).not.toContain("private resume-like text");
    expect(logged).not.toContain("Private School");
    expect(logged).not.toContain("database-user-a");
    expect(logged).toContain("userIdHash");
  });

  it("does not expose unknown exception messages as categories", () => {
    expect(classifyStudentOnboardingError(new Error("secret details"))).toBe(
      "UNKNOWN",
    );
  });
});
