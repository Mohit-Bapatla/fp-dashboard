import { describe, expect, it } from "vitest";

import {
  buildResumeOpportunityAlignment,
  buildResumeReview,
  getSentencePreview,
} from "@/lib/student/resume-review";
import { extractStructuredResumeSections } from "@/lib/student/resume-structure";

const sections = extractStructuredResumeSections(`
Summary
Synthetic student interested in community health. synthetic.student@example.invalid 202-555-0100
Education
Example University, BS Biology, expected 2028
Experience
- Coordinated a health-literacy program serving 75 students.
- Helped with outreach.
- Analyzed survey results using SQL.
School
- Hosted CPR training for 45 students.
Skills
SQL, Community outreach, Data analysis
`);

describe("deterministic resume review", () => {
  it("creates explainable categories without OpenAI or an opaque score", () => {
    const review = buildResumeReview({
      analyzedAt: "2026-07-18T09:00:00.000Z",
      parsedSummary:
        "Synthetic student interested in community health. synthetic.student@example.invalid 202-555-0100",
      sections,
      sourceResumeUpdatedAt: "2026-07-18T08:00:00.000Z",
    });

    expect(review.categories).toHaveLength(6);
    expect(review.categories.map((item) => item.name)).toEqual([
      "STRUCTURE",
      "CLARITY",
      "SPECIFICITY",
      "EVIDENCE",
      "RELEVANCE",
      "CONSISTENCY",
    ]);
    expect(review.categories.every((item) => item.action.length > 0)).toBe(
      true,
    );
    expect(review.improvements.length).toBeGreaterThanOrEqual(3);
    expect(review).not.toHaveProperty("score");
  });

  it("removes contact information from the visible review summary", () => {
    const review = buildResumeReview({
      analyzedAt: "2026-07-18T09:00:00.000Z",
      parsedSummary:
        "Synthetic student interested in community health. synthetic.student@example.invalid 202-555-0100",
      sections,
      sourceResumeUpdatedAt: "2026-07-18T08:00:00.000Z",
    });

    expect(review.summary).toContain("community health");
    expect(review.summary).not.toContain("@");
    expect(review.summary).not.toContain("202-555-0100");
  });

  it("omits empty section-review cards", () => {
    const review = buildResumeReview({
      analyzedAt: "2026-07-18T09:00:00.000Z",
      parsedSummary: null,
      sections,
      sourceResumeUpdatedAt: "2026-07-18T08:00:00.000Z",
    });

    expect(review.sectionFeedback.map((item) => item.key)).not.toContain(
      "certifications",
    );
    expect(review.sectionFeedback.map((item) => item.key)).toContain(
      "leadership",
    );
  });

  it("aligns only approved opportunity facts with resume evidence", () => {
    const alignment = buildResumeOpportunityAlignment(sections, {
      eligibilityRequirements: "Comfort with community outreach",
      id: "opportunity_test",
      isActiveApplication: true,
      organizationName: "Example Community Center",
      requiredCertifications: ["Basic Life Support certification"],
      requiredExperience: "Health education or data analysis experience",
      shortDescription:
        "Support community health education and analyze outreach data.",
      specialty: "Community Health",
      title: "Community Health Program Intern",
    });

    expect(alignment.relevantResumeEvidence.join(" ")).toContain(
      "health-literacy",
    );
    expect(alignment.skillsWorthEmphasizing).toEqual(
      expect.arrayContaining(["Data analysis"]),
    );
    expect(alignment.missingOrUnclearEvidence.join(" ")).toContain(
      "Basic Life Support certification",
    );
    expect(JSON.stringify(alignment)).not.toMatch(/acceptance|rank|chance/i);
  });

  it("previews complete sentences or leaves a long single sentence intact", () => {
    const preview = getSentencePreview(
      "First complete sentence. Second complete sentence. Third complete sentence.",
      50,
    );

    expect(preview.truncated).toBe(true);
    expect(preview.text.endsWith(".")).toBe(true);

    const singleSentence =
      "A single sentence that is intentionally longer than the requested limit but should never be cut mid-sentence.";
    expect(getSentencePreview(singleSentence, 40)).toEqual({
      text: singleSentence,
      truncated: false,
    });
  });
});
