import { describe, expect, it } from "vitest";

import {
  createWorkflowSupportReference,
  isWorkflowSupportReference,
  WORKFLOW_CATEGORIES,
} from "@/lib/reliability/workflow-references";

describe("workflow support references", () => {
  it("uses a stable category, UTC date, and opaque suffix", () => {
    const date = new Date("2026-07-25T01:02:03.000Z");

    for (const category of WORKFLOW_CATEGORIES) {
      const reference = createWorkflowSupportReference(category, date);
      expect(reference).toMatch(
        new RegExp(`^FP-${category}-20260725-[A-Z0-9]{6}$`),
      );
      expect(isWorkflowSupportReference(reference)).toBe(true);
    }
  });

  it("rejects legacy digests and malformed user input", () => {
    for (const value of [
      "ABCDEF12",
      "FP-APP-20260725-private",
      "FP-UNKNOWN-20260725-ABC123",
      "FP-APP-20260725-ABC123?token=secret",
    ]) {
      expect(isWorkflowSupportReference(value)).toBe(false);
    }
  });
});
