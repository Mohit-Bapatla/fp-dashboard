import type { Prisma } from "@/generated/prisma/client";
import type { AppRole } from "@/lib/auth/roles";

const ACCOUNT_TRANSITION_LOCK_NAMESPACE = "account-transition:user";

export function accountTransitionLockKey(clerkUserId: string) {
  return `${ACCOUNT_TRANSITION_LOCK_NAMESPACE}:${clerkUserId}`;
}

export async function acquireAccountTransitionLock(
  transaction: Prisma.TransactionClient,
  clerkUserId: string,
) {
  await transaction.$queryRaw`
    SELECT pg_advisory_xact_lock(
      hashtext(${accountTransitionLockKey(clerkUserId)})
    )::text
  `;
}

export type StudentAccountTransitionBlockReason =
  "EXISTING_PARTNER_MEMBERSHIP" | "NON_STUDENT_ROLE";

export function getStudentAccountTransitionBlockReason({
  databaseRole,
  hasPartnerMembership,
}: {
  databaseRole: AppRole;
  hasPartnerMembership: boolean;
}): StudentAccountTransitionBlockReason | null {
  if (hasPartnerMembership) {
    return "EXISTING_PARTNER_MEMBERSHIP";
  }

  return databaseRole === "STUDENT" ? null : "NON_STUDENT_ROLE";
}

export function studentAccountTransitionBlockMessage(
  reason: StudentAccountTransitionBlockReason,
) {
  if (reason === "EXISTING_PARTNER_MEMBERSHIP") {
    return "This account is already connected to a partner organization and cannot create or update a student profile.";
  }

  return "This account is no longer eligible for student onboarding. Refresh your session or contact support if the role is incorrect.";
}
