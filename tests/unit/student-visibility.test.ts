import { describe, expect, it } from "vitest";
import {
  isOpportunityCurrentlyAvailable,
  studentDirectoryOpportunityWhere,
  studentApplicationOpportunityWhere,
  studentReadOnlyOpportunityWhere,
} from "@/lib/opportunities/student-visibility";

describe("student opportunity visibility", () => {
  it("includes only verified, published records with a current status and deadline", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");

    expect(studentDirectoryOpportunityWhere(now)).toEqual({
      availabilityStatus: { in: ["OPEN", "OPENING_SOON", "ROLLING"] },
      organization: { verificationStatus: "VERIFIED" },
      OR: [{ deadline: null }, { deadline: { gte: now } }],
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
    });
    expect(isOpportunityCurrentlyAvailable("OPEN")).toBe(true);
    expect(isOpportunityCurrentlyAvailable("OPENING_SOON")).toBe(true);
    expect(isOpportunityCurrentlyAvailable("ROLLING")).toBe(true);
  });

  it("requires verified, published, currently available records for application starts", () => {
    expect(
      studentApplicationOpportunityWhere("opp-1", new Date("2026-01-01")),
    ).toMatchObject({
      id: "opp-1",
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      availabilityStatus: { in: ["OPEN", "OPENING_SOON", "ROLLING"] },
      organization: { verificationStatus: "VERIFIED" },
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
