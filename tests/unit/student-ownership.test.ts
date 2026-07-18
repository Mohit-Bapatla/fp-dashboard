import { describe, expect, it } from "vitest";
import {
  applicationOwnership,
  applicationTaskOwnership,
  savedOpportunityOwnership,
} from "@/lib/student/owned-records";

describe("student-owned record scopes", () => {
  it("always includes the authenticated profile for saved records", () => {
    expect(savedOpportunityOwnership("profile-a", "opportunity-1")).toEqual({
      studentProfileId: "profile-a",
      opportunityId: "opportunity-1",
    });
    expect(savedOpportunityOwnership("profile-b", "opportunity-1")).not.toEqual(
      savedOpportunityOwnership("profile-a", "opportunity-1"),
    );
  });
  it("always includes the authenticated profile for application workspaces", () => {
    expect(applicationOwnership("profile-a", "application-1")).toEqual({
      id: "application-1",
      studentProfileId: "profile-a",
    });
  });
  it("scopes task IDs through their parent application owner", () => {
    expect(applicationTaskOwnership("profile-a", "task-1")).toEqual({
      id: "task-1",
      application: {
        studentProfileId: "profile-a",
      },
    });
  });
});
