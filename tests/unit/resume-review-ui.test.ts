import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  fileURLToPath(
    new URL(
      "../../src/components/student/student-resume-review-panel.tsx",
      import.meta.url,
    ),
  ),
  "utf8",
);

describe("resume review presentation", () => {
  it("uses an explicit summary expand control without line clamping", () => {
    expect(source).toContain("aria-expanded={expanded}");
    expect(source).toContain('expanded ? "Show less" : "Show more"');
    expect(source).not.toContain("line-clamp");
  });

  it("labels extracted details as secondary and filters empty sections", () => {
    expect(source).toContain(
      "Automatically extracted details — review for accuracy.",
    );
    expect(source).toContain("values.length > 0");
  });

  it("includes the required AI-suggestion warning and no applicant score", () => {
    expect(source).toContain("Suggested edit — review before using");
    expect(source).not.toMatch(/applicant score|chance of acceptance/i);
  });
});
