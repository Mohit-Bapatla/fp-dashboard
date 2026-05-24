import { describe, expect, it } from "vitest";

import { getOpportunityMatchScore } from "@/lib/matching/match-score";

describe("getOpportunityMatchScore", () => {
  it("returns zero and a profile gap when no profile is available", () => {
    const result = getOpportunityMatchScore({
      opportunity: {
        description: "Cardiology research with remote chart review.",
        eligibilityRequirements: "Available evenings",
        location: "Dallas",
        remoteType: "Remote",
        specialty: "Cardiology",
        title: "Cardiology Research",
        type: "RESEARCH",
      },
      profile: null,
      resume: null,
    });

    expect(result.score).toBe(0);
    expect(result.gaps).toContain(
      "Complete your student profile to calculate a stronger fit score.",
    );
  });

  it("scores aligned specialties, types, location, remote format, availability, and skills", () => {
    const result = getOpportunityMatchScore({
      opportunity: {
        description: "Remote cardiology research using Excel and chart review.",
        eligibilityRequirements: "Available evenings",
        location: "Dallas",
        remoteType: "Remote",
        specialty: "Cardiology",
        title: "Cardiology Research",
        type: "RESEARCH",
      },
      profile: {
        availability: ["evenings"],
        city: "Dallas",
        country: "US",
        interestedSpecialties: ["Cardiology"],
        locationPreference: "Dallas",
        opportunityTypes: ["RESEARCH"],
        remotePreference: "Remote",
        state: "TX",
      },
      resume: {
        extractedSkills: ["Excel"],
      },
    });

    expect(result.score).toBe(100);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.gaps.length).toBe(0);
  });
});
