import type { GradeLevelCode } from "@/generated/prisma/enums";

export const gradeLevelCodes = [
  "HS_9",
  "HS_10",
  "HS_11",
  "HS_12",
  "COLLEGE_1",
  "COLLEGE_2",
  "COLLEGE_3",
  "COLLEGE_4",
  "GRADUATE",
  "MEDICAL",
  "GAP_YEAR_POST_BACC",
] as const satisfies readonly GradeLevelCode[];

const aliases: Record<string, GradeLevelCode> = {
  "9": "HS_9",
  "9th": "HS_9",
  "9th grade": "HS_9",
  "grade 9": "HS_9",
  freshman: "HS_9",
  "high school freshman": "HS_9",
  "10": "HS_10",
  "10th": "HS_10",
  "10th grade": "HS_10",
  "grade 10": "HS_10",
  sophomore: "HS_10",
  "high school sophomore": "HS_10",
  "11": "HS_11",
  "11th": "HS_11",
  "11th grade": "HS_11",
  "grade 11": "HS_11",
  junior: "HS_11",
  "high school junior": "HS_11",
  "12": "HS_12",
  "12th": "HS_12",
  "12th grade": "HS_12",
  "grade 12": "HS_12",
  senior: "HS_12",
  "high school senior": "HS_12",
  "college freshman": "COLLEGE_1",
  "first year college": "COLLEGE_1",
  "college sophomore": "COLLEGE_2",
  "second year college": "COLLEGE_2",
  "college junior": "COLLEGE_3",
  "third year college": "COLLEGE_3",
  "college senior": "COLLEGE_4",
  "fourth year college": "COLLEGE_4",
  "graduate student": "GRADUATE",
  graduate: "GRADUATE",
  "medical student": "MEDICAL",
  "med student": "MEDICAL",
  "gap year": "GAP_YEAR_POST_BACC",
  "post baccalaureate": "GAP_YEAR_POST_BACC",
  "gap year post baccalaureate": "GAP_YEAR_POST_BACC",
};

function normalizeAlias(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[–—/]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGradeLevelCode(value: string | null | undefined) {
  if (!value) return null;
  if (gradeLevelCodes.includes(value as GradeLevelCode)) {
    return value as GradeLevelCode;
  }
  return aliases[normalizeAlias(value)] ?? null;
}

export function parseGradeLevelCodes(values: string[]) {
  const parsed = values.map(parseGradeLevelCode);
  return {
    codes: Array.from(
      new Set(
        parsed.filter((value): value is GradeLevelCode => Boolean(value)),
      ),
    ),
    unknownValues: values.filter((_, index) => !parsed[index]),
  };
}

export function formatGradeLevelCode(code: GradeLevelCode) {
  const labels: Record<GradeLevelCode, string> = {
    HS_9: "9th grade",
    HS_10: "10th grade",
    HS_11: "11th grade",
    HS_12: "12th grade",
    COLLEGE_1: "College freshman",
    COLLEGE_2: "College sophomore",
    COLLEGE_3: "College junior",
    COLLEGE_4: "College senior",
    GRADUATE: "Graduate student",
    MEDICAL: "Medical student",
    GAP_YEAR_POST_BACC: "Gap year / post-baccalaureate",
  };
  return labels[code];
}
