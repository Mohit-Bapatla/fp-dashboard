import {
  emptyStudentProfileFormValues,
  type StudentProfileFieldErrors,
  type StudentProfileFormValues,
} from "./profile-validation";

export type StudentOnboardingActionState = {
  fieldErrors: StudentProfileFieldErrors;
  formError: string | null;
  values: StudentProfileFormValues;
};

export const initialStudentOnboardingActionState: StudentOnboardingActionState =
  {
    fieldErrors: {},
    formError: null,
    values: emptyStudentProfileFormValues,
  };
