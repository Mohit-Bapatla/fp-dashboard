import { describe, expect, it } from "vitest";
import {
  canSubmitExistingApplication,
  getApplyPageDecision,
  getEffectiveApplicationMethod,
} from "@/lib/student/application-workspace";
describe("application workspace submission", () => {
  it("allows a preparing application to transition to submitted", () =>
    expect(canSubmitExistingApplication("PREPARING")).toBe(true));
  it("blocks duplicate submitted and outcome applications", () => {
    for (const status of [
      "SUBMITTED",
      "UNDER_REVIEW",
      "INTERVIEW",
      "WAITLISTED",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ] as const) {
      expect(canSubmitExistingApplication(status)).toBe(false);
      expect(
        getApplyPageDecision({
          applicationMethod: "FP_INTERNAL",
          existingStatus: status,
        }).kind,
      ).toBe("BLOCKED");
    }
  });
  it("keeps preparatory records in the configured submission flow", () => {
    for (const status of [
      "DRAFT",
      "SAVED",
      "PLANNING",
      "PREPARING",
      "WAITING_FOR_RECOMMENDATION",
      "READY_TO_SUBMIT",
    ] as const) {
      expect(
        getApplyPageDecision({
          applicationMethod: "FP_INTERNAL",
          existingStatus: status,
        }).kind,
      ).toBe("INTERNAL_SUBMISSION");
      expect(
        getApplyPageDecision({
          applicationMethod: "EXTERNAL_PORTAL",
          existingStatus: status,
        }).kind,
      ).toBe("EXTERNAL_CONFIRMATION");
    }
  });
  it("forces external public opportunities onto the host portal", () => {
    expect(
      getEffectiveApplicationMethod("EXTERNAL_PUBLIC", "FP_INTERNAL"),
    ).toBe("EXTERNAL_PORTAL");
    expect(getEffectiveApplicationMethod("FP_OWNED", "FP_INTERNAL")).toBe(
      "FP_INTERNAL",
    );
  });
});
