import type { Prisma } from "@/generated/prisma/client";
import type {
  ApplicationMethod,
  OpportunityAvailabilityStatus,
  OpportunitySourceType,
  OpportunityStatus,
  OpportunityVerificationStatus,
  OpportunityVisibility,
} from "@/generated/prisma/enums";

export const preparableAvailabilityStatuses = [
  "OPEN",
  "OPENING_SOON",
  "ROLLING",
] as const satisfies readonly OpportunityAvailabilityStatus[];

export const submittableAvailabilityStatuses = [
  "OPEN",
  "ROLLING",
] as const satisfies readonly OpportunityAvailabilityStatus[];

export type StudentOpportunityAccessInput = {
  availabilityStatus: OpportunityAvailabilityStatus;
  deadline: Date | null;
  opensAt: Date | null;
  status: OpportunityStatus;
  verificationStatus: OpportunityVerificationStatus;
};

export type StudentOwnedOpportunityAccessInput =
  StudentOpportunityAccessInput & {
    applicationMethod: ApplicationMethod;
    sourceType: OpportunitySourceType;
    studentOwnerProfileId: string | null;
    visibility: OpportunityVisibility;
  };

function includesAvailabilityStatus<
  TStatuses extends readonly OpportunityAvailabilityStatus[],
>(statuses: TStatuses, status: OpportunityAvailabilityStatus) {
  return statuses.includes(status as TStatuses[number]);
}

export function isOpportunityDiscoverable(
  opportunity: StudentOpportunityAccessInput,
  now = new Date(),
) {
  return (
    opportunity.status === "PUBLISHED" &&
    opportunity.verificationStatus === "VERIFIED" &&
    includesAvailabilityStatus(
      preparableAvailabilityStatuses,
      opportunity.availabilityStatus,
    ) &&
    (!opportunity.deadline || opportunity.deadline.getTime() >= now.getTime())
  );
}

export const isOpportunityPreparable = isOpportunityDiscoverable;

export function isOpportunitySubmittable(
  opportunity: StudentOpportunityAccessInput,
  now = new Date(),
) {
  return (
    isOpportunityDiscoverable(opportunity, now) &&
    includesAvailabilityStatus(
      submittableAvailabilityStatuses,
      opportunity.availabilityStatus,
    ) &&
    (!opportunity.opensAt || opportunity.opensAt.getTime() <= now.getTime())
  );
}

function isOwnedPrivateOpportunity(
  opportunity: StudentOwnedOpportunityAccessInput,
  studentProfileId: string,
) {
  return (
    opportunity.visibility === "STUDENT_PRIVATE" &&
    opportunity.sourceType === "STUDENT_ADDED" &&
    opportunity.studentOwnerProfileId === studentProfileId &&
    opportunity.applicationMethod === "EXTERNAL_PORTAL" &&
    opportunity.status === "DRAFT" &&
    opportunity.verificationStatus === "NEEDS_REVIEW"
  );
}

export function isStudentOpportunityPreparable(
  opportunity: StudentOwnedOpportunityAccessInput,
  studentProfileId: string,
  now = new Date(),
) {
  if (opportunity.visibility === "PUBLIC_DIRECTORY") {
    return isOpportunityPreparable(opportunity, now);
  }

  return (
    isOwnedPrivateOpportunity(opportunity, studentProfileId) &&
    includesAvailabilityStatus(
      preparableAvailabilityStatuses,
      opportunity.availabilityStatus,
    ) &&
    (!opportunity.deadline || opportunity.deadline.getTime() >= now.getTime())
  );
}

export function isStudentOpportunitySubmittable(
  opportunity: StudentOwnedOpportunityAccessInput,
  studentProfileId: string,
  now = new Date(),
) {
  if (opportunity.visibility === "PUBLIC_DIRECTORY") {
    return isOpportunitySubmittable(opportunity, now);
  }

  return (
    isStudentOpportunityPreparable(opportunity, studentProfileId, now) &&
    includesAvailabilityStatus(
      submittableAvailabilityStatuses,
      opportunity.availabilityStatus,
    ) &&
    (!opportunity.opensAt || opportunity.opensAt.getTime() <= now.getTime())
  );
}

// Kept for callers that only need to classify the availability enum. New
// authorization decisions should use the full access predicates above.
export function isOpportunityCurrentlyAvailable(
  status: OpportunityAvailabilityStatus,
) {
  return includesAvailabilityStatus(preparableAvailabilityStatuses, status);
}

export function studentDirectoryOpportunityWhere(
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    availabilityStatus: { in: [...preparableAvailabilityStatuses] },
    OR: [{ deadline: null }, { deadline: { gte: now } }],
    organization: { isSystemPlaceholder: false },
    status: "PUBLISHED",
    verificationStatus: "VERIFIED",
    visibility: "PUBLIC_DIRECTORY",
  };
}

export function studentPreparationOpportunityWhere(
  opportunityId: string,
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    ...studentDirectoryOpportunityWhere(now),
    id: opportunityId,
  };
}

export function studentSubmittableOpportunityWhere(
  opportunityId: string,
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    AND: [
      { OR: [{ deadline: null }, { deadline: { gte: now } }] },
      { OR: [{ opensAt: null }, { opensAt: { lte: now } }] },
    ],
    availabilityStatus: { in: [...submittableAvailabilityStatuses] },
    id: opportunityId,
    organization: { isSystemPlaceholder: false },
    status: "PUBLISHED",
    verificationStatus: "VERIFIED",
    visibility: "PUBLIC_DIRECTORY",
  };
}

function studentOpportunityAccessWhere(
  studentProfileId: string,
): Prisma.OpportunityWhereInput {
  return {
    OR: [
      {
        organization: { isSystemPlaceholder: false },
        status: "PUBLISHED",
        verificationStatus: "VERIFIED",
        visibility: "PUBLIC_DIRECTORY",
      },
      {
        applicationMethod: "EXTERNAL_PORTAL",
        sourceType: "STUDENT_ADDED",
        status: "DRAFT",
        studentOwnerProfileId: studentProfileId,
        verificationStatus: "NEEDS_REVIEW",
        visibility: "STUDENT_PRIVATE",
      },
    ],
  };
}

export function studentAccessiblePreparationOpportunityWhere(
  opportunityId: string,
  studentProfileId: string,
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    AND: [
      studentOpportunityAccessWhere(studentProfileId),
      { OR: [{ deadline: null }, { deadline: { gte: now } }] },
    ],
    availabilityStatus: { in: [...preparableAvailabilityStatuses] },
    id: opportunityId,
  };
}

export function studentAccessibleSubmittableOpportunityWhere(
  opportunityId: string,
  studentProfileId: string,
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    AND: [
      studentOpportunityAccessWhere(studentProfileId),
      { OR: [{ deadline: null }, { deadline: { gte: now } }] },
      { OR: [{ opensAt: null }, { opensAt: { lte: now } }] },
    ],
    availabilityStatus: { in: [...submittableAvailabilityStatuses] },
    id: opportunityId,
  };
}

export function studentAccessibleReadOnlyOpportunityWhere(
  opportunityId: string,
  studentProfileId: string | null,
): Prisma.OpportunityWhereInput {
  return {
    id: opportunityId,
    OR: [
      {
        organization: { isSystemPlaceholder: false },
        status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
        verificationStatus: { in: ["VERIFIED", "ARCHIVED"] },
        visibility: "PUBLIC_DIRECTORY",
      },
      ...(studentProfileId
        ? [
            {
              sourceType: "STUDENT_ADDED" as const,
              status: "DRAFT" as const,
              studentOwnerProfileId: studentProfileId,
              verificationStatus: "NEEDS_REVIEW" as const,
              visibility: "STUDENT_PRIVATE" as const,
            },
          ]
        : []),
    ],
  };
}

// Backward-compatible alias for preparation workspace callers.
export const studentApplicationOpportunityWhere =
  studentPreparationOpportunityWhere;

export function studentReadOnlyOpportunityWhere(
  opportunityId: string,
): Prisma.OpportunityWhereInput {
  return {
    id: opportunityId,
    organization: { isSystemPlaceholder: false },
    status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
    verificationStatus: { in: ["VERIFIED", "ARCHIVED"] },
    visibility: "PUBLIC_DIRECTORY",
  };
}
