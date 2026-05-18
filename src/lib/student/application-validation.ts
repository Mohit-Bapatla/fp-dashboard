export const applicationStatementMaxLength = 1000;

export type StudentApplicationFormValues = {
  resumeId: string;
  statement: string;
};

export type StudentApplicationFieldErrors = Partial<
  Record<keyof StudentApplicationFormValues, string>
>;

export type StudentApplicationActionState = {
  fieldErrors: StudentApplicationFieldErrors;
  formError: string | null;
  values: StudentApplicationFormValues;
};

export const emptyStudentApplicationFormValues: StudentApplicationFormValues = {
  resumeId: "",
  statement: "",
};

export const emptyStudentApplicationActionState: StudentApplicationActionState =
  {
    fieldErrors: {},
    formError: null,
    values: emptyStudentApplicationFormValues,
  };

function getString(
  formData: FormData,
  key: keyof StudentApplicationFormValues,
) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export function validateStudentApplicationForm(formData: FormData) {
  const values: StudentApplicationFormValues = {
    resumeId: getString(formData, "resumeId"),
    statement: getString(formData, "statement"),
  };
  const errors: StudentApplicationFieldErrors = {};

  if (!values.resumeId) {
    errors.resumeId = "Choose a resume.";
  }

  if (values.statement.length > applicationStatementMaxLength) {
    errors.statement = `Keep your response under ${applicationStatementMaxLength} characters.`;
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false as const,
      errors,
      values,
    };
  }

  return {
    success: true as const,
    values,
    data: {
      resumeId: values.resumeId,
      statement: values.statement || null,
    },
  };
}
