import type { OpportunityType } from "@/generated/prisma/enums";

export const opportunityTypeOptions = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const satisfies readonly OpportunityType[];

export type StudentProfileFormValues = {
  firstName: string;
  lastName: string;
  school: string;
  gradeYear: string;
  city: string;
  state: string;
  country: string;
  locationPreference: string;
  remotePreference: string;
  interestedSpecialties: string;
  opportunityTypes: OpportunityType[];
  availability: string;
  languages: string;
  careerGoals: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
};

export type StudentProfileFieldErrors = Partial<
  Record<keyof StudentProfileFormValues, string>
>;

export type StudentProfileValidationResult =
  | {
      success: true;
      data: {
        firstName: string;
        lastName: string;
        school: string;
        gradeYear: string;
        city: string;
        state: string;
        country: string;
        locationPreference: string | null;
        remotePreference: string | null;
        interestedSpecialties: string[];
        opportunityTypes: OpportunityType[];
        availability: string[];
        languages: string[];
        careerGoals: string;
        linkedinUrl: string | null;
        githubUrl: string | null;
        portfolioUrl: string | null;
      };
      values: StudentProfileFormValues;
    }
  | {
      success: false;
      errors: StudentProfileFieldErrors;
      values: StudentProfileFormValues;
    };

export const emptyStudentProfileFormValues: StudentProfileFormValues = {
  firstName: "",
  lastName: "",
  school: "",
  gradeYear: "",
  city: "",
  state: "",
  country: "",
  locationPreference: "",
  remotePreference: "",
  interestedSpecialties: "",
  opportunityTypes: [],
  availability: "",
  languages: "",
  careerGoals: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
};

const requiredFields = [
  "firstName",
  "lastName",
  "school",
  "gradeYear",
  "city",
  "state",
  "country",
  "interestedSpecialties",
  "availability",
  "careerGoals",
] as const;

function getString(formData: FormData, key: keyof StudentProfileFormValues) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function splitList(value: string) {
  return value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSpecialty(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();

      if (["in", "and", "of"].includes(lower)) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function splitSpecialtyList(value: string) {
  const seen = new Set<string>();

  return splitList(value).flatMap((item) => {
    const normalized = normalizeSpecialty(item);
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      return [];
    }

    seen.add(key);

    return [normalized];
  });
}

function getOpportunityTypes(formData: FormData) {
  return formData
    .getAll("opportunityTypes")
    .filter((value): value is OpportunityType => {
      return (
        typeof value === "string" &&
        opportunityTypeOptions.includes(value as OpportunityType)
      );
    });
}

function validateOptionalUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function valuesFromFormData(
  formData: FormData,
): StudentProfileFormValues {
  return {
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    school: getString(formData, "school"),
    gradeYear: getString(formData, "gradeYear"),
    city: getString(formData, "city"),
    state: getString(formData, "state"),
    country: getString(formData, "country"),
    locationPreference: getString(formData, "locationPreference"),
    remotePreference: getString(formData, "remotePreference"),
    interestedSpecialties: getString(formData, "interestedSpecialties"),
    opportunityTypes: getOpportunityTypes(formData),
    availability: getString(formData, "availability"),
    languages: getString(formData, "languages"),
    careerGoals: getString(formData, "careerGoals"),
    linkedinUrl: getString(formData, "linkedinUrl"),
    githubUrl: getString(formData, "githubUrl"),
    portfolioUrl: getString(formData, "portfolioUrl"),
  };
}

export function validateStudentProfileForm(
  formData: FormData,
): StudentProfileValidationResult {
  const values = valuesFromFormData(formData);
  const errors: StudentProfileFieldErrors = {};

  for (const field of requiredFields) {
    if (!values[field]) {
      errors[field] = "This field is required.";
    }
  }

  if (values.opportunityTypes.length === 0) {
    errors.opportunityTypes = "Choose at least one opportunity type.";
  }

  for (const field of ["linkedinUrl", "githubUrl", "portfolioUrl"] as const) {
    if (!validateOptionalUrl(values[field])) {
      errors[field] = "Enter a valid URL starting with http:// or https://.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
      values,
    };
  }

  return {
    success: true,
    values,
    data: {
      firstName: values.firstName,
      lastName: values.lastName,
      school: values.school,
      gradeYear: values.gradeYear,
      city: values.city,
      state: values.state,
      country: values.country,
      locationPreference: values.locationPreference || null,
      remotePreference: values.remotePreference || null,
      interestedSpecialties: splitSpecialtyList(values.interestedSpecialties),
      opportunityTypes: values.opportunityTypes,
      availability: splitList(values.availability),
      languages: splitList(values.languages),
      careerGoals: values.careerGoals,
      linkedinUrl: values.linkedinUrl || null,
      githubUrl: values.githubUrl || null,
      portfolioUrl: values.portfolioUrl || null,
    },
  };
}
