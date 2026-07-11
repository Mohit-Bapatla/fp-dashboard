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
  gradeYearCustom: string;
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
  ageYears: string;
  maximumTravelMiles: string;
  paidOnlyPreference: string;
  preferredSeasons: string;
  certifications: string;
  transportationNotes: string;
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
        ageYears: number | null;
        maximumTravelMiles: number | null;
        paidOnlyPreference: boolean | null;
        preferredSeasons: string[];
        certifications: string[];
        transportationNotes: string | null;
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
  gradeYearCustom: "",
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
  ageYears: "",
  maximumTravelMiles: "",
  paidOnlyPreference: "",
  preferredSeasons: "",
  certifications: "",
  transportationNotes: "",
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

const gradeYearOptions = [
  "High school freshman",
  "High school sophomore",
  "High school junior",
  "High school senior",
  "College freshman",
  "College sophomore",
  "College junior",
  "College senior",
  "Graduate student",
  "Medical student",
  "Gap year / post-baccalaureate",
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
    gradeYearCustom: getString(formData, "gradeYearCustom"),
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
    ageYears: getString(formData, "ageYears"),
    maximumTravelMiles: getString(formData, "maximumTravelMiles"),
    paidOnlyPreference: getString(formData, "paidOnlyPreference"),
    preferredSeasons: getString(formData, "preferredSeasons"),
    certifications: getString(formData, "certifications"),
    transportationNotes: getString(formData, "transportationNotes"),
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

  if (values.gradeYear === "Other" && !values.gradeYearCustom) {
    errors.gradeYearCustom = "Tell us your academic stage.";
  }

  if (
    values.gradeYear &&
    values.gradeYear !== "Other" &&
    !gradeYearOptions.includes(
      values.gradeYear as (typeof gradeYearOptions)[number],
    )
  ) {
    errors.gradeYear = "Choose a listed grade year or select Other.";
  }

  for (const field of ["linkedinUrl", "githubUrl", "portfolioUrl"] as const) {
    if (!validateOptionalUrl(values[field])) {
      errors[field] = "Enter a valid URL starting with http:// or https://.";
    }
  }
  const ageYears = values.ageYears ? Number.parseInt(values.ageYears, 10) : null;
  const maximumTravelMiles = values.maximumTravelMiles ? Number.parseInt(values.maximumTravelMiles, 10) : null;
  if (ageYears != null && (!Number.isInteger(ageYears) || ageYears < 13 || ageYears > 100)) errors.ageYears = "Age must be between 13 and 100.";
  if (maximumTravelMiles != null && (!Number.isInteger(maximumTravelMiles) || maximumTravelMiles < 1 || maximumTravelMiles > 500)) errors.maximumTravelMiles = "Travel distance must be between 1 and 500 miles.";

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
      gradeYear:
        values.gradeYear === "Other"
          ? values.gradeYearCustom
          : values.gradeYear,
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
      ageYears,
      maximumTravelMiles,
      paidOnlyPreference: values.paidOnlyPreference === "" ? null : values.paidOnlyPreference === "true",
      preferredSeasons: splitList(values.preferredSeasons),
      certifications: splitList(values.certifications),
      transportationNotes: values.transportationNotes || null,
    },
  };
}
