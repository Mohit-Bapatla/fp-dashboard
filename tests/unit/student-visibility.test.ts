import { describe, expect, it } from "vitest";
import type { OpportunityAvailabilityStatus } from "@/generated/prisma/enums";
import {
  isOpportunityCurrentlyAvailable,
  isOpportunityDiscoverable,
  isOpportunityPreparable,
  isOpportunitySubmittable,
  isStudentOpportunityPreparable,
  isStudentOpportunitySubmittable,
  studentAccessiblePreparationOpportunityWhere,
  studentApplicationOpportunityWhere,
  studentDirectoryOpportunityWhere,
  studentPreparationOpportunityWhere,
  studentReadOnlyOpportunityWhere,
  studentSubmittableOpportunityWhere,
  type StudentOpportunityAccessInput,
  type StudentOwnedOpportunityAccessInput,
} from "@/lib/opportunities/student-visibility";

const now = new Date("2026-08-01T12:00:00.000Z");

function opportunity(
  availabilityStatus: OpportunityAvailabilityStatus,
  overrides: Partial<StudentOpportunityAccessInput> = {},
): StudentOpportunityAccessInput {
  return {
    availabilityStatus,
    deadline: new Date("2026-09-01T12:00:00.000Z"),
    opensAt: null,
    status: "PUBLISHED",
    verificationStatus: "VERIFIED",
    ...overrides,
  };
}

describe("student opportunity visibility", () => {
  it("includes only verified, published records with a current status and deadline", () => {
    const queryTime = new Date("2026-01-01T00:00:00.000Z");

    expect(studentDirectoryOpportunityWhere(queryTime)).toEqual({
      availabilityStatus: { in: ["OPEN", "OPENING_SOON", "ROLLING"] },
      organization: {
        isSystemPlaceholder: false,
        verificationStatus: "VERIFIED",
      },
      OR: [{ deadline: null }, { deadline: { gte: queryTime } }],
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      visibility: "PUBLIC_DIRECTORY",
    });
    expect(isOpportunityCurrentlyAvailable("OPEN")).toBe(true);
    expect(isOpportunityCurrentlyAvailable("OPENING_SOON")).toBe(true);
    expect(isOpportunityCurrentlyAvailable("ROLLING")).toBe(true);
  });

  it("keeps OPENING_SOON discoverable and preparable", () => {
    const openingSoon = opportunity("OPENING_SOON", {
      opensAt: new Date("2026-08-15T12:00:00.000Z"),
    });

    expect(isOpportunityDiscoverable(openingSoon, now)).toBe(true);
    expect(isOpportunityPreparable(openingSoon, now)).toBe(true);
    expect(studentPreparationOpportunityWhere("opp-1", now)).toMatchObject({
      id: "opp-1",
      organization: {
        isSystemPlaceholder: false,
        verificationStatus: "VERIFIED",
      },
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      visibility: "PUBLIC_DIRECTORY",
      availabilityStatus: { in: ["OPEN", "OPENING_SOON", "ROLLING"] },
    });
    expect(studentApplicationOpportunityWhere("opp-1", now)).toEqual(
      studentPreparationOpportunityWhere("opp-1", now),
    );
  });

  it("never treats OPENING_SOON as submittable", () => {
    expect(
      isOpportunitySubmittable(
        opportunity("OPENING_SOON", {
          opensAt: new Date("2026-07-01T12:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(false);
  });

  it("blocks OPEN with a future opening date", () => {
    expect(
      isOpportunitySubmittable(
        opportunity("OPEN", {
          opensAt: new Date("2026-08-02T12:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(false);
  });

  it.each(["OPEN", "ROLLING"] as const)(
    "allows %s after its opening date",
    (availabilityStatus) => {
      expect(
        isOpportunitySubmittable(
          opportunity(availabilityStatus, {
            opensAt: new Date("2026-07-31T12:00:00.000Z"),
          }),
          now,
        ),
      ).toBe(true);
    },
  );

  it("allows an OPEN opportunity without a published opening date", () => {
    expect(isOpportunitySubmittable(opportunity("OPEN"), now)).toBe(true);
  });

  it("requires a current deadline plus published and verified state", () => {
    expect(
      isOpportunitySubmittable(
        opportunity("OPEN", {
          deadline: new Date("2026-07-31T12:00:00.000Z"),
        }),
        now,
      ),
    ).toBe(false);
    expect(
      isOpportunitySubmittable(
        opportunity("OPEN", { status: "PENDING_APPROVAL" }),
        now,
      ),
    ).toBe(false);
    expect(
      isOpportunitySubmittable(
        opportunity("OPEN", { verificationStatus: "STALE" }),
        now,
      ),
    ).toBe(false);
  });

  it("builds a submission query with independent opening and deadline guards", () => {
    expect(studentSubmittableOpportunityWhere("opp-1", now)).toEqual({
      AND: [
        {
          OR: [{ deadline: null }, { deadline: { gte: now } }],
        },
        {
          OR: [{ opensAt: null }, { opensAt: { lte: now } }],
        },
      ],
      availabilityStatus: { in: ["OPEN", "ROLLING"] },
      id: "opp-1",
      organization: {
        isSystemPlaceholder: false,
        verificationStatus: "VERIFIED",
      },
      status: "PUBLISHED",
      verificationStatus: "VERIFIED",
      visibility: "PUBLIC_DIRECTORY",
    });
  });

  it("allows safe read-only saved details while disabling closed starts", () => {
    expect(studentReadOnlyOpportunityWhere("opp-1")).toMatchObject({
      id: "opp-1",
      visibility: "PUBLIC_DIRECTORY",
    });
    expect(isOpportunityPreparable(opportunity("CLOSED"), now)).toBe(false);
    expect(isOpportunityPreparable(opportunity("EXPIRED"), now)).toBe(false);
    expect(isOpportunityPreparable(opportunity("ARCHIVED"), now)).toBe(false);
  });

  it("allows only the owning student to prepare and confirm a private external source", () => {
    const privateOpportunity: StudentOwnedOpportunityAccessInput = {
      applicationMethod: "EXTERNAL_PORTAL",
      availabilityStatus: "OPEN",
      deadline: new Date("2026-09-01T12:00:00.000Z"),
      opensAt: new Date("2026-07-31T12:00:00.000Z"),
      sourceType: "STUDENT_ADDED",
      status: "DRAFT",
      studentOwnerProfileId: "profile-owner",
      verificationStatus: "NEEDS_REVIEW",
      visibility: "STUDENT_PRIVATE",
    };

    expect(
      isStudentOpportunityPreparable(privateOpportunity, "profile-owner", now),
    ).toBe(true);
    expect(
      isStudentOpportunitySubmittable(privateOpportunity, "profile-owner", now),
    ).toBe(true);
    expect(
      isStudentOpportunityPreparable(
        privateOpportunity,
        "profile-attacker",
        now,
      ),
    ).toBe(false);
    expect(
      isStudentOpportunitySubmittable(
        privateOpportunity,
        "profile-attacker",
        now,
      ),
    ).toBe(false);
  });

  it("builds an owner-scoped private-or-public preparation query", () => {
    const where = studentAccessiblePreparationOpportunityWhere(
      "opp-private",
      "profile-owner",
      now,
    );
    expect(where.id).toBe("opp-private");
    expect(where.AND).toEqual(
      expect.arrayContaining([
        {
          OR: expect.arrayContaining([
            expect.objectContaining({
              sourceType: "STUDENT_ADDED",
              studentOwnerProfileId: "profile-owner",
              visibility: "STUDENT_PRIVATE",
            }),
          ]),
        },
      ]),
    );
  });
});
