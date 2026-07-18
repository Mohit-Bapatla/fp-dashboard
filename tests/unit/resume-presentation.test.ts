import { describe, expect, it } from "vitest";

import { buildResumePresentation } from "@/lib/student/resume-presentation";

describe("resume presentation", () => {
  it("does not reuse a legacy raw parsed summary when the resume has no summary section", () => {
    const presentation = buildResumePresentation({
      alignmentOpportunities: [],
      analyzedAt: new Date("2026-07-18T09:00:00.000Z"),
      parsedText: `
Synthetic Student
synthetic.student@example.invalid
202-555-0100

Education
Example University, BS Biology, expected 2028

Experience
- Coordinated a health-literacy program serving 75 students.
`,
      parseStatus: "COMPLETED",
      uploadedAt: new Date("2026-07-18T08:00:00.000Z"),
    });

    expect(presentation.review?.summary).toBeNull();
    expect(JSON.stringify(presentation.review)).not.toContain(
      "synthetic.student@example.invalid",
    );
    expect(JSON.stringify(presentation.review)).not.toContain("202-555-0100");
  });

  it("requires explicit re-analysis before showing a review", () => {
    const presentation = buildResumePresentation({
      alignmentOpportunities: [],
      analyzedAt: null,
      parsedText: "Education\nExample University, BS Biology, expected 2028",
      parseStatus: "COMPLETED",
      uploadedAt: new Date("2026-07-18T08:00:00.000Z"),
    });

    expect(presentation.review).toBeNull();
    expect(presentation.alignments).toEqual([]);
  });
});
