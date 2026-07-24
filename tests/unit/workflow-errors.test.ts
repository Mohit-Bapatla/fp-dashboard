import { afterEach, describe, expect, it, vi } from "vitest";

import {
  classifyWorkflowError,
  loadOptionalWorkflowData,
  logWorkflowFailure,
} from "@/lib/reliability/workflow-errors";

describe("workflow reliability errors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses a bounded fallback and emits only structured safe context", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await loadOptionalWorkflowData({
      action: "load_optional_resumes",
      fallback: [],
      load: async () => {
        throw new Error("private note: do not log this");
      },
      route: "/dashboard/student/applications/[applicationId]",
      userId: "student@example.com",
    });

    expect(result.available).toBe(false);
    expect(result.value).toEqual([]);
    expect(result.referenceId).toMatch(/^[A-F0-9]{8}$/);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "private note",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "student@example.com",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "[workflow-reliability] operation failed",
      expect.objectContaining({
        action: "load_optional_resumes",
        errorCategory: "UNKNOWN",
        route: "/dashboard/student/applications/[applicationId]",
        userIdHash: expect.stringMatching(/^[a-f0-9]{12}$/),
      }),
    );
  });

  it("returns successful optional data without logging", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const result = await loadOptionalWorkflowData({
      action: "load_optional_data",
      fallback: 0,
      load: async () => 3,
      route: "/dashboard/partner",
    });

    expect(result).toEqual({
      available: true,
      referenceId: null,
      value: 3,
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("keeps primary rows usable when an optional row is malformed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const primaryRows = [{ id: "application-a", status: "SUBMITTED" }];
    const result = await loadOptionalWorkflowData({
      action: "load_partner_applicant_optional_details",
      fallback: primaryRows,
      load: async () => {
        throw new Error("malformed optional relation");
      },
      route: "/dashboard/partner/applicants",
    });

    expect(result.available).toBe(false);
    expect(result.value).toEqual(primaryRows);
  });

  it("classifies timeouts without serializing the original error", () => {
    const error = new Error("third-party payload");
    error.name = "TimeoutError";
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(classifyWorkflowError(error)).toBe("EXTERNAL_DEPENDENCY");
    logWorkflowFailure({
      action: "load_partner_summary",
      error,
      referenceId: "ABCDEF12",
      route: "/dashboard/partner/applicants",
    });

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "third-party payload",
    );
  });
});
