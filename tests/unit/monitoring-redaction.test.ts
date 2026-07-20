import { describe, expect, it } from "vitest";

import {
  redactLogMessage,
  redactTelemetryValue,
} from "@/lib/monitoring/redaction";

describe("monitoring redaction", () => {
  it("removes emails, bearer credentials, and URL queries from messages", () => {
    const result = redactLogMessage(
      "student@example.com Bearer abc.def https://example.edu/app?token=secret",
    );
    expect(result).not.toContain("student@example.com");
    expect(result).not.toContain("abc.def");
    expect(result).not.toContain("token=secret");
  });

  it("redacts sensitive object keys recursively", () => {
    expect(
      redactTelemetryValue({
        nested: { resumeText: "private contents" },
        password: "secret",
        safeCount: 3,
      }),
    ).toEqual({
      nested: { resumeText: "[REDACTED]" },
      password: "[REDACTED]",
      safeCount: 3,
    });
  });
});
