import type { ApplicationStatus } from "@/generated/prisma/enums";

export const preparatoryApplicationStatuses = ["DRAFT", "SAVED", "PLANNING", "PREPARING", "WAITING_FOR_RECOMMENDATION", "READY_TO_SUBMIT"] as const satisfies readonly ApplicationStatus[];
export function canSubmitExistingApplication(status: ApplicationStatus) { return preparatoryApplicationStatuses.includes(status as (typeof preparatoryApplicationStatuses)[number]); }
