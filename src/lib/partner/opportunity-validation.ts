import type { OpportunityType } from "@/generated/prisma/enums";

export const partnerOpportunityTypeOptions = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const satisfies readonly OpportunityType[];

export type PartnerOpportunityFormValues = {
  opportunityId: string;
  organizationId: string;
  title: string;
  description: string;
  type: OpportunityType | "";
  specialty: string;
  location: string;
  remoteType: string;
  paidStatus: string;
  deadline: string;
  capacity: string;
  eligibilityRequirements: string;
  requiredDocuments: string;
  applicationInstructions: string;
};

export type PartnerOpportunityFieldErrors = Partial<
  Record<keyof PartnerOpportunityFormValues, string>
>;

export type PartnerOpportunityActionState = {
  fieldErrors: PartnerOpportunityFieldErrors;
  formError: string | null;
  values: PartnerOpportunityFormValues;
};

export const emptyPartnerOpportunityFormValues: PartnerOpportunityFormValues = {
  opportunityId: "",
  organizationId: "",
  title: "",
  description: "",
  type: "",
  specialty: "",
  location: "",
  remoteType: "",
  paidStatus: "",
  deadline: "",
  capacity: "",
  eligibilityRequirements: "",
  requiredDocuments: "",
  applicationInstructions: "",
};

export const emptyPartnerOpportunityActionState: PartnerOpportunityActionState =
  {
    fieldErrors: {},
    formError: null,
    values: emptyPartnerOpportunityFormValues,
  };

function getString(
  formData: FormData,
  key: keyof PartnerOpportunityFormValues,
) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOpportunityType(value: string) {
  return partnerOpportunityTypeOptions.includes(value as OpportunityType)
    ? (value as OpportunityType)
    : "";
}

export function partnerOpportunityValuesFromFormData(
  formData: FormData,
): PartnerOpportunityFormValues {
  return {
    opportunityId: getString(formData, "opportunityId"),
    organizationId: getString(formData, "organizationId"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    type: parseOpportunityType(getString(formData, "type")),
    specialty: getString(formData, "specialty"),
    location: getString(formData, "location"),
    remoteType: getString(formData, "remoteType"),
    paidStatus: getString(formData, "paidStatus"),
    deadline: getString(formData, "deadline"),
    capacity: getString(formData, "capacity"),
    eligibilityRequirements: getString(formData, "eligibilityRequirements"),
    requiredDocuments: getString(formData, "requiredDocuments"),
    applicationInstructions: getString(formData, "applicationInstructions"),
  };
}

export function validatePartnerOpportunityForm(formData: FormData) {
  const values = partnerOpportunityValuesFromFormData(formData);
  const errors: PartnerOpportunityFieldErrors = {};

  if (!values.title) {
    errors.title = "Title is required.";
  }

  if (!values.organizationId) {
    errors.organizationId = "Choose one of your linked organizations.";
  }

  if (!values.type) {
    errors.type = "Choose an opportunity type.";
  }

  let deadline: Date | null = null;

  if (values.deadline) {
    deadline = new Date(`${values.deadline}T00:00:00`);

    if (Number.isNaN(deadline.getTime())) {
      errors.deadline = "Enter a valid deadline.";
    }
  }

  let capacity: number | null = null;

  if (values.capacity) {
    capacity = Number.parseInt(values.capacity, 10);

    if (!Number.isInteger(capacity) || capacity < 1) {
      errors.capacity = "Capacity must be a positive number.";
    }
  }

  if (Object.keys(errors).length > 0 || !values.type) {
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
      organizationId: values.organizationId,
      title: values.title,
      description: values.description || null,
      type: values.type,
      specialty: values.specialty || null,
      location: values.location || null,
      remoteType: values.remoteType || null,
      paidStatus: values.paidStatus || null,
      deadline,
      capacity,
      eligibilityRequirements: values.eligibilityRequirements || null,
      requiredDocuments: splitList(values.requiredDocuments),
      applicationInstructions: values.applicationInstructions || null,
    },
  };
}
