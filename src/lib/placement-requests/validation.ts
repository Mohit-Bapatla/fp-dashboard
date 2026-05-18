import type {
  OpportunityType,
  PlacementRequestStatus,
} from "@/generated/prisma/enums";

export const placementRequestStatusOptions: PlacementRequestStatus[] = [
  "NEW",
  "ASSIGNED",
  "RESEARCHING",
  "OUTREACH_IN_PROGRESS",
  "PARTNER_CONTACTED",
  "WAITING_FOR_PARTNER",
  "OPPORTUNITY_FOUND",
  "STUDENT_REFERRED",
  "PLACED",
  "CLOSED",
];

export const placementRequestPriorityOptions = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
] as const;

export const placementRequestOpportunityTypeOptions: OpportunityType[] = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
];

export type PlacementRequestPriority =
  (typeof placementRequestPriorityOptions)[number];

export type StudentPlacementRequestFormValues = {
  availability: string;
  description: string;
  locationPreference: string;
  remotePreference: string;
  requestedOpportunityTypes: OpportunityType[];
  requestedSpecialties: string;
  title: string;
  urgency: string;
};

export type StudentPlacementRequestFieldErrors = Partial<
  Record<keyof StudentPlacementRequestFormValues, string>
>;

export type StudentPlacementRequestActionState = {
  fieldErrors: StudentPlacementRequestFieldErrors;
  formError: string | null;
  values: StudentPlacementRequestFormValues;
};

export const initialStudentPlacementRequestValues: StudentPlacementRequestFormValues =
  {
    availability: "",
    description: "",
    locationPreference: "",
    remotePreference: "",
    requestedOpportunityTypes: [],
    requestedSpecialties: "",
    title: "",
    urgency: "",
  };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getOpportunityTypes(formData: FormData) {
  return formData
    .getAll("requestedOpportunityTypes")
    .filter(
      (value): value is OpportunityType =>
        typeof value === "string" &&
        placementRequestOpportunityTypeOptions.includes(
          value as OpportunityType,
        ),
    );
}

export function parseTagInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isPlacementRequestStatus(
  value: string,
): value is PlacementRequestStatus {
  return placementRequestStatusOptions.includes(
    value as PlacementRequestStatus,
  );
}

export function isPlacementRequestPriority(
  value: string,
): value is PlacementRequestPriority {
  return placementRequestPriorityOptions.includes(
    value as PlacementRequestPriority,
  );
}

export function getStudentPlacementRequestValues(
  formData: FormData,
): StudentPlacementRequestFormValues {
  return {
    availability: getString(formData, "availability"),
    description: getString(formData, "description"),
    locationPreference: getString(formData, "locationPreference"),
    remotePreference: getString(formData, "remotePreference"),
    requestedOpportunityTypes: getOpportunityTypes(formData),
    requestedSpecialties: getString(formData, "requestedSpecialties"),
    title: getString(formData, "title"),
    urgency: getString(formData, "urgency"),
  };
}

export function validateStudentPlacementRequestForm(formData: FormData) {
  const values = getStudentPlacementRequestValues(formData);
  const errors: StudentPlacementRequestFieldErrors = {};
  const hasPreference =
    parseTagInput(values.requestedSpecialties).length > 0 ||
    values.requestedOpportunityTypes.length > 0 ||
    parseTagInput(values.availability).length > 0 ||
    Boolean(values.locationPreference) ||
    Boolean(values.remotePreference) ||
    Boolean(values.urgency) ||
    Boolean(values.description);

  if (values.title.length < 3) {
    errors.title = "Enter a short request title.";
  }

  if (!hasPreference) {
    errors.description =
      "Share at least one preference, availability note, or context detail.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      success: false as const,
      values,
    };
  }

  return {
    data: {
      availability: parseTagInput(values.availability),
      description: values.description || null,
      locationPreference: values.locationPreference || null,
      remotePreference: values.remotePreference || null,
      requestedOpportunityTypes: values.requestedOpportunityTypes,
      requestedSpecialties: parseTagInput(values.requestedSpecialties),
      title: values.title,
      urgency: values.urgency || null,
    },
    success: true as const,
    values,
  };
}
