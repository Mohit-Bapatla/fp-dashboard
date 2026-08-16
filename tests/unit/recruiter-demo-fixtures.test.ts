import { describe, expect, it } from "vitest";

import {
  demoOpportunities,
  demoOrganization,
  demoStudent,
  recruiterDemoInitialState,
} from "@/lib/demo/recruiter-fixtures";

const fixtureJson = JSON.stringify({
  demoOpportunities,
  demoOrganization,
  demoStudent,
  recruiterDemoInitialState,
});

describe("recruiter demo synthetic fixtures", () => {
  it("provides the requested synthetic catalog, application stages, and applicants", () => {
    expect(demoOpportunities).toHaveLength(8);
    expect(new Set(demoOpportunities.map(({ category }) => category))).toEqual(
      new Set([
        "Biotechnology",
        "Clinical volunteering",
        "Healthcare internship",
        "Physician shadowing",
        "Public health",
        "Research",
      ]),
    );
    expect(
      recruiterDemoInitialState.applications.map(({ status }) => status),
    ).toEqual(["Planning", "In progress", "Submitted"]);
    expect(recruiterDemoInitialState.partnerApplicants).toHaveLength(8);
  });

  it("contains no email address, Clerk identifier, UUID, or production-shaped ID", () => {
    expect(fixtureJson).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(fixtureJson).not.toMatch(/(?:user|org|sess)_[A-Za-z0-9]+/);
    expect(fixtureJson).not.toMatch(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    );
    expect(fixtureJson).not.toContain("studentProfileId");
    expect(fixtureJson).not.toContain("clerkId");
    expect(fixtureJson).not.toContain("applicationId");
  });

  it("names every fixture ID with an explicit demo prefix", () => {
    const ids = [
      ...demoOpportunities.map(({ id }) => id),
      ...recruiterDemoInitialState.applications.flatMap((application) => [
        application.id,
        ...application.tasks.map(({ id }) => id),
      ]),
      ...recruiterDemoInitialState.partnerApplicants.map(({ id }) => id),
    ];
    expect(ids.every((id) => id.startsWith("demo-"))).toBe(true);
  });

  it("contains no resume body or unmarked partner note imported from production", () => {
    expect(fixtureJson).not.toMatch(
      /resumeText|resumeBody|parsedResume|privateProductionNote/i,
    );
    const comments = recruiterDemoInitialState.partnerApplicants
      .map(({ comment }) => comment)
      .filter(Boolean);
    expect(
      comments.every((comment) => comment.startsWith("Synthetic review note:")),
    ).toBe(true);
  });
});
