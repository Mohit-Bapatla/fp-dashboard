import { describe, expect, it } from "vitest";

import {
  buildSemanticOpportunityWhere,
  getExpandedSearchTokens,
  getSemanticOpportunityScore,
} from "@/lib/student/semantic-opportunity-search";

describe("semantic opportunity search", () => {
  it("expands common opportunity query synonyms", () => {
    expect(getExpandedSearchTokens("virtual lab")).toEqual(
      expect.arrayContaining([
        "virtual",
        "remote",
        "online",
        "lab",
        "research",
      ]),
    );
  });

  it("builds a Prisma where clause for expanded tokens", () => {
    const where = buildSemanticOpportunityWhere("remote cardiology");

    expect(where?.OR?.length).toBeGreaterThan(0);
  });

  it("weights title and specialty matches strongly", () => {
    const score = getSemanticOpportunityScore(
      {
        applicationInstructions: "Submit a short statement.",
        description: "Join a research team.",
        eligibilityRequirements: "Beginner friendly.",
        location: "Dallas",
        organization: {
          name: "Future Clinic",
        },
        paidStatus: "Unpaid",
        remoteType: "Remote",
        specialty: "Cardiology",
        title: "Remote Cardiology Research",
        type: "RESEARCH",
      },
      "remote cardiology research",
    );

    expect(score).toBeGreaterThan(20);
  });
});
