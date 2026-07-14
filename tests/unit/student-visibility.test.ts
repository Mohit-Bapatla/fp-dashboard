import { describe, expect, it } from "vitest";
import {
  isOpportunityCurrentlyAvailable,
  studentApplicationOpportunityWhere,
  studentReadOnlyOpportunityWhere,
} from "@/lib/opportunities/student-visibility";

describe("student opportunity visibility", () => {
  it("requires verified, published, currently available records for application starts", () => {
    expect(
      studentApplicationOpportunityWhere("opp-1", new Date("2026-01-01")),
    ).toMatchObject({
      id: "opp-1",
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      availabilityStatus: { in: ["OPEN", "OPENING_SOON", "ROLLING"] },
    });
  });
  it("allows safe read-only saved details while disabling closed starts", () => {
    expect(studentReadOnlyOpportunityWhere("opp-1")).toMatchObject({
      id: "opp-1",
    });
    expect(isOpportunityCurrentlyAvailable("CLOSED")).toBe(false);
    expect(isOpportunityCurrentlyAvailable("EXPIRED")).toBe(false);
    expect(isOpportunityCurrentlyAvailable("ARCHIVED")).toBe(false);
  });
});
