import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import type { StudentOnboardingActionState } from "@/lib/student/onboarding-state";
import type { StudentProfileFormValues } from "@/lib/student/profile-validation";

export type StudentOnboardingErrorCategory =
  | "CONCURRENT_WRITE"
  | "DATABASE_CONSTRAINT"
  | "DATABASE_SCHEMA"
  | "DATABASE_WRITE"
  | "UNKNOWN";

export function classifyStudentOnboardingError(
  error: unknown,
): StudentOnboardingErrorCategory {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return "UNKNOWN";
  }

  switch (error.code) {
    case "P2002":
      return "DATABASE_CONSTRAINT";
    case "P2022":
      return "DATABASE_SCHEMA";
    case "P2034":
      return "CONCURRENT_WRITE";
    default:
      return "DATABASE_WRITE";
  }
}

export function createStudentOnboardingFailure({
  error,
  previousState,
  resumeStep,
  userId,
  values,
}: {
  error: unknown;
  previousState: StudentOnboardingActionState;
  resumeStep: number;
  userId: string;
  values: StudentProfileFormValues;
}): StudentOnboardingActionState {
  const referenceId = randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase();
  const errorCategory = classifyStudentOnboardingError(error);

  console.error("[student-onboarding] step save failed", {
    action: "save_student_onboarding_step",
    deployedSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    errorCategory,
    referenceId,
    route: "/dashboard/student/onboarding",
    timestamp: new Date().toISOString(),
    userIdHash: createHash("sha256").update(userId).digest("hex").slice(0, 12),
  });

  return {
    fieldErrors: {},
    formError:
      `We couldn't save this step. Your previously saved progress is still available. ` +
      `Try again. If the problem continues, contact support and include reference ${referenceId}.`,
    resumeStep,
    savedStep: null,
    saveSequence: previousState.saveSequence,
    saveStatus: "error",
    supportReference: referenceId,
    values,
  };
}
