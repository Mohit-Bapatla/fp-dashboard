import { describe, expect, it } from "vitest";

import { getPublicOpportunityRelationshipLabel } from "@/lib/opportunities/public-relationship";

describe("public opportunity relationship labels", () => {
  it("uses partner wording only for confirmed partner organizations", () => {
    expect(
      getPublicOpportunityRelationshipLabel({
        organizationStatus: "PARTNERED",
        relationshipType: "FP_PARTNER",
      }),
    ).toBe("Confirmed FP partner opportunity");
    expect(
      getPublicOpportunityRelationshipLabel({
        organizationStatus: "NOT_CONTACTED",
        relationshipType: "FP_PARTNER",
      }),
    ).toBe("Listed host organization");
  });

  it("distinguishes public listings and FP-owned programs", () => {
    expect(
      getPublicOpportunityRelationshipLabel({
        organizationStatus: "NOT_CONTACTED",
        relationshipType: "EXTERNAL_PUBLIC",
      }),
    ).toBe("Publicly sourced listing");
    expect(
      getPublicOpportunityRelationshipLabel({
        organizationStatus: "NOT_CONTACTED",
        relationshipType: "FP_OWNED",
      }),
    ).toBe("Future Physicians program");
  });
});
