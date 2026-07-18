import { describe, expect, it } from "vitest";

import { resumeAlignmentOpportunityWhere } from "@/lib/student/resume-review-data";

describe("resume alignment opportunity ownership", () => {
  it("limits active-application access and private opportunities to the current student", () => {
    const where = resumeAlignmentOpportunityWhere(
      "profile_student_a",
      new Date("2026-07-18T09:00:00.000Z"),
    );
    const serialized = JSON.stringify(where);

    expect(serialized).toContain("profile_student_a");
    expect(serialized).toContain("PUBLIC_DIRECTORY");
    expect(serialized).toContain("STUDENT_PRIVATE");
    expect(serialized).toContain("studentOwnerProfileId");
    expect(serialized).not.toContain("profile_student_b");
  });
});
