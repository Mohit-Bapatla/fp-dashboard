import type { ApplicationStatus } from "@/generated/prisma/enums";
import type { ApplicationMethod } from "@/generated/prisma/enums";
import type { OpportunityRelationshipType } from "@/generated/prisma/enums";

export const preparatoryApplicationStatuses = [
  "DRAFT",
  "SAVED",
  "PLANNING",
  "PREPARING",
  "WAITING_FOR_RECOMMENDATION",
  "READY_TO_SUBMIT",
] as const satisfies readonly ApplicationStatus[];
export function canSubmitExistingApplication(status: ApplicationStatus) {
  return preparatoryApplicationStatuses.includes(
    status as (typeof preparatoryApplicationStatuses)[number],
  );
}

export type ApplyPageDecision =
  | { kind: "BLOCKED" }
  | { kind: "EXTERNAL_CONFIRMATION" }
  | { kind: "INTERNAL_SUBMISSION" }
  | { kind: "PREPARATION_ONLY" };

export function getEffectiveApplicationMethod(
  relationshipType: OpportunityRelationshipType,
  configuredMethod: ApplicationMethod,
) {
  return relationshipType === "EXTERNAL_PUBLIC"
    ? ("EXTERNAL_PORTAL" as const)
    : configuredMethod;
}

export function getApplyPageDecision({
  applicationMethod,
  existingStatus,
  submissionAllowed,
}: {
  applicationMethod: ApplicationMethod;
  existingStatus: ApplicationStatus | null;
  submissionAllowed: boolean;
}): ApplyPageDecision {
  if (existingStatus && !canSubmitExistingApplication(existingStatus)) {
    return { kind: "BLOCKED" };
  }
  if (!submissionAllowed) {
    return { kind: "PREPARATION_ONLY" };
  }
  return applicationMethod === "EXTERNAL_PORTAL"
    ? { kind: "EXTERNAL_CONFIRMATION" }
    : { kind: "INTERNAL_SUBMISSION" };
}
