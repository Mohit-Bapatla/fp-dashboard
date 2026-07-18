import { describe, expect, it } from "vitest";

import { extractStructuredResumeSections } from "@/lib/student/resume-structure";

const boundaryFixture = `
Synthetic Student
synthetic.student@example.invalid | 202-555-0100

Summary
Curious student focused on FP outreach, SQL, and community health education.

Education
Example University
Bachelor of Science in Biology, expected 2028

Honors/Awards
Community Science Scholarship

Experience
- Coordinated a health-literacy program serving 75 local
students every year.
- Analyzed survey results with SQL for program leaders.

School
Student Council Wellness Lead
- Hosted CPR training for 45 students and coordinated
volunteer instructors.

Skills
SQL, CPR education, GPA data analysis, FP outreach
`;

describe("structured resume extraction", () => {
  it("honors section stops Education collection", () => {
    const sections = extractStructuredResumeSections(boundaryFixture);

    expect(sections.education.join(" ")).toContain("Example University");
    expect(sections.education.join(" ")).not.toContain("Scholarship");
    expect(sections.honors).toEqual(["Community Science Scholarship"]);
  });

  it("keeps school leadership separate from Experience", () => {
    const sections = extractStructuredResumeSections(boundaryFixture);

    expect(sections.experience.join(" ")).not.toContain("Student Council");
    expect(sections.experience.join(" ")).not.toContain("Hosted CPR");
    expect(sections.school.join(" ")).toContain(
      "Student Council Wellness Lead",
    );
  });

  it("does not classify a hosted CPR workshop as a certification", () => {
    const sections = extractStructuredResumeSections(boundaryFixture);

    expect(sections.school.join(" ")).toContain(
      "Hosted CPR training for 45 students and coordinated volunteer instructors.",
    );
    expect(sections.certifications).toEqual([]);
  });

  it("reconstructs wrapped bullets without orphan fragments", () => {
    const sections = extractStructuredResumeSections(boundaryFixture);

    expect(sections.experience).toContain(
      "Coordinated a health-literacy program serving 75 local students every year.",
    );
    expect(sections.experience).not.toContain("students every year.");
    expect(sections.school).not.toContain("volunteer instructors.");
  });

  it("preserves acronyms, proper nouns, and numbers", () => {
    const sections = extractStructuredResumeSections(boundaryFixture);

    expect(sections.skills).toEqual(
      expect.arrayContaining([
        "SQL",
        "CPR education",
        "GPA data analysis",
        "FP outreach",
      ]),
    );
    expect(sections.education.join(" ")).toContain("Example University");
    expect(sections.school.join(" ")).toContain("45 students");
  });

  it("requires clear credential language outside a certification section", () => {
    const sections = extractStructuredResumeSections(`
Experience
- Hosted CPR training for neighbors.
- Certified in Basic Life Support through a synthetic provider.
`);

    expect(sections.certifications).toEqual([
      "Certified in Basic Life Support through a synthetic provider.",
    ]);
  });
});
