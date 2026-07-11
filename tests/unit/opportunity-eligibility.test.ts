import { describe, expect, it } from "vitest";

import { evaluateOpportunityEligibility } from "@/lib/matching/opportunity-eligibility";

const open = { availabilityStatus: "OPEN" };

describe("evaluateOpportunityEligibility", () => {
  it("treats a missing profile and requirements as unknown, not ineligible", () => {
    const result = evaluateOpportunityEligibility({
      opportunity: open,
      student: null,
    });
    expect(result.category).toBe("POSSIBLE_MATCH");
    expect(result.blockingReasons).toEqual([]);
    expect(result.unknowns.length).toBeGreaterThan(0);
  });

  it("blocks explicit minimum and maximum age failures", () => {
    expect(
      evaluateOpportunityEligibility({
        opportunity: { ...open, minimumAge: 18 },
        student: { ageYears: 16 },
      }).category,
    ).toBe("NOT_ELIGIBLE");
    expect(
      evaluateOpportunityEligibility({
        opportunity: { ...open, maximumAge: 18 },
        student: { ageYears: 20 },
      }).category,
    ).toBe("NOT_ELIGIBLE");
  });

  it("confirms an accepted grade and blocks an explicit mismatch", () => {
    const opportunity = { ...open, acceptedGradeLevels: ["11th", "12th"] };
    expect(
      evaluateOpportunityEligibility({
        opportunity,
        student: { gradeYear: "11th" },
      }).confirmedMatches,
    ).toContain("Accepts your current grade level.");
    expect(
      evaluateOpportunityEligibility({
        opportunity,
        student: { gradeYear: "10th" },
      }).category,
    ).toBe("NOT_ELIGIBLE");
  });

  it("blocks expired deadlines and closed listings", () => {
    expect(
      evaluateOpportunityEligibility({
        now: new Date("2026-02-01"),
        opportunity: { ...open, deadline: new Date("2026-01-01") },
        student: null,
      }).category,
    ).toBe("NOT_ELIGIBLE");
    expect(
      evaluateOpportunityEligibility({
        opportunity: { availabilityStatus: "CLOSED" },
        student: null,
      }).category,
    ).toBe("NOT_ELIGIBLE");
  });

  it("does not infer citizenship eligibility from unstructured requirements", () => {
    const result = evaluateOpportunityEligibility({
      opportunity: { ...open },
      student: {},
    });
    expect(result.blockingReasons).toEqual([]);
  });

  it("returns strong match for explicit and soft preference alignment", () => {
    const result = evaluateOpportunityEligibility({
      opportunity: {
        ...open,
        acceptedGradeLevels: ["HS_12"],
        minimumAge: 16,
        maximumAge: 20,
        specialty: "Pediatrics",
        type: "RESEARCH",
      },
      student: {
        ageYears: 18,
        gradeYear: "12",
        interestedSpecialties: ["Pediatrics"],
        opportunityTypes: ["RESEARCH"],
      },
    });
    expect(result.category).toBe("STRONG_MATCH");
  });

  it("does not return strong match while material requirements are unknown", () => {
    const result = evaluateOpportunityEligibility({
      opportunity: { ...open, specialty: "Pediatrics", type: "RESEARCH" },
      student: {
        interestedSpecialties: ["Pediatrics"],
        opportunityTypes: ["RESEARCH"],
      },
    });
    expect(result.confirmedMatches).toHaveLength(2);
    expect(result.unknowns.length).toBeGreaterThan(0);
    expect(result.category).toBe("POSSIBLE_MATCH");
  });

  it("never rejects when student information is missing", () => {
    const result = evaluateOpportunityEligibility({
      opportunity: { ...open, minimumAge: 18, requiredCertifications: ["CPR"] },
      student: {},
    });
    expect(result.category).toBe("POSSIBLE_MATCH");
    expect(result.blockingReasons).toEqual([]);
  });
});
