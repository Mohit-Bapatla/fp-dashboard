import {
  emptyStudentProfileFormValues,
  type StudentProfileFieldErrors,
  type StudentProfileFormValues,
} from "./profile-validation";

export type StudentOnboardingActionState = {
  fieldErrors: StudentProfileFieldErrors;
  formError: string | null;
  resumeStep: number | null;
  savedStep: number | null;
  saveSequence: number;
  saveStatus: "idle" | "saved" | "error";
  supportReference: string | null;
  values: StudentProfileFormValues;
};

export const initialStudentOnboardingActionState: StudentOnboardingActionState =
  {
    fieldErrors: {},
    formError: null,
    resumeStep: null,
    savedStep: null,
    saveSequence: 0,
    saveStatus: "idle",
    supportReference: null,
    values: emptyStudentProfileFormValues,
  };
