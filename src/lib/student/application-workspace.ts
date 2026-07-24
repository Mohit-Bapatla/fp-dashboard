import type { ApplicationStatus } from "@/generated/prisma/enums";
import type { ApplicationMethod } from "@/generated/prisma/enums";
import type { OpportunityRelationshipType } from "@/generated/prisma/enums";
import { isSafeExternalUrl } from "@/lib/security/safe-url";

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

export function parseApplicationTargetDate(value: string) {
  if (!value) {
    return { valid: true as const, date: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { valid: false as const, date: null };
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (!Number.isFinite(date.getTime())) {
    return { valid: false as const, date: null };
  }

  return date.toISOString().slice(0, 10) === value
    ? { valid: true as const, date }
    : { valid: false as const, date: null };
}

export function getOfficialApplicationAction({
  applicationMethod,
  officialApplicationUrl,
}: {
  applicationMethod: ApplicationMethod;
  officialApplicationUrl: string | null;
}) {
  if (
    applicationMethod !== "EXTERNAL_PORTAL" ||
    !isSafeExternalUrl(officialApplicationUrl)
  ) {
    return null;
  }

  return {
    href: officialApplicationUrl as string,
    label: "Open official application",
  };
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
