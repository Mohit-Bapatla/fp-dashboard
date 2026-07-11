import type { Prisma } from "@/generated/prisma/client";
import type { OpportunityAvailabilityStatus } from "@/generated/prisma/enums";

export const currentlyAvailableStatuses = [
  "OPEN",
  "OPENING_SOON",
  "ROLLING",
] as const satisfies readonly OpportunityAvailabilityStatus[];

export function isOpportunityCurrentlyAvailable(
  status: OpportunityAvailabilityStatus,
) {
  return currentlyAvailableStatuses.includes(
    status as (typeof currentlyAvailableStatuses)[number],
  );
}

export function studentDirectoryOpportunityWhere(
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    availabilityStatus: { in: [...currentlyAvailableStatuses] },
    OR: [{ deadline: null }, { deadline: { gte: now } }],
    status: "PUBLISHED",
    verificationStatus: "VERIFIED",
  };
}

export function studentApplicationOpportunityWhere(
  opportunityId: string,
  now = new Date(),
): Prisma.OpportunityWhereInput {
  return {
    ...studentDirectoryOpportunityWhere(now),
    id: opportunityId,
  };
}

export function studentReadOnlyOpportunityWhere(
  opportunityId: string,
): Prisma.OpportunityWhereInput {
  return {
    id: opportunityId,
    status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
    verificationStatus: { in: ["VERIFIED", "ARCHIVED"] },
  };
}
