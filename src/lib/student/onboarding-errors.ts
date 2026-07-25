import "server-only";

import {
  classifyWorkflowError,
  logWorkflowFailure,
  type WorkflowErrorClassification,
} from "@/lib/reliability/workflow-errors";
import type { StudentOnboardingActionState } from "@/lib/student/onboarding-state";
import type { StudentProfileFormValues } from "@/lib/student/profile-validation";

export type StudentOnboardingErrorCategory = WorkflowErrorClassification;

export function classifyStudentOnboardingError(
  error: unknown,
): StudentOnboardingErrorCategory {
  return classifyWorkflowError(error);
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
  const referenceId = logWorkflowFailure({
    action: "save_student_onboarding_step",
    category: "ONB",
    error,
    route: "/dashboard/student/onboarding",
    userId,
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
