export const studentExternalOrganizationName =
  "FP private external opportunity sources";

export function isStudentExternalOrganizationName(value: string) {
  return (
    value.trim().toLocaleLowerCase() ===
    studentExternalOrganizationName.toLocaleLowerCase()
  );
}
