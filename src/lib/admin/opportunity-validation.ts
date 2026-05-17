import type {
  OpportunityStatus,
  OpportunityType,
  PartnerStatus,
} from "@/generated/prisma/enums";

export const opportunityTypeOptions = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const satisfies readonly OpportunityType[];

export const opportunityStatusOptions = [
  "DRAFT",
  "PENDING_APPROVAL",
  "PUBLISHED",
  "ARCHIVED",
  "CLOSED",
  "REJECTED",
] as const satisfies readonly OpportunityStatus[];

export const partnerStatusOptions = [
  "NOT_CONTACTED",
  "CONTACTED",
  "FOLLOW_UP_NEEDED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PARTNERED",
  "REJECTED",
  "NO_RESPONSE",
  "PAUSED",
] as const satisfies readonly PartnerStatus[];

export type OpportunityFormValues = {
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
  status: OpportunityStatus | "";
};

export type PartnerOrganizationFormValues = {
  name: string;
  website: string;
  type: string;
  location: string;
  city: string;
  state: string;
  country: string;
  specialtyAreas: string;
  status: PartnerStatus | "";
  description: string;
  contactEmail: string;
};

export type OpportunityFieldErrors = Partial<
  Record<keyof OpportunityFormValues, string>
>;

export type PartnerOrganizationFieldErrors = Partial<
  Record<keyof PartnerOrganizationFormValues, string>
>;

export type OpportunityActionState = {
  fieldErrors: OpportunityFieldErrors;
  formError: string | null;
  values: OpportunityFormValues;
};

export type PartnerOrganizationActionState = {
  fieldErrors: PartnerOrganizationFieldErrors;
  formError: string | null;
  values: PartnerOrganizationFormValues;
};

export const emptyOpportunityFormValues: OpportunityFormValues = {
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
  status: "DRAFT",
};

export const emptyPartnerOrganizationFormValues: PartnerOrganizationFormValues =
  {
    name: "",
    website: "",
    type: "",
    location: "",
    city: "",
    state: "",
    country: "",
    specialtyAreas: "",
    status: "NOT_CONTACTED",
    description: "",
    contactEmail: "",
  };

export const emptyOpportunityActionState: OpportunityActionState = {
  fieldErrors: {},
  formError: null,
  values: emptyOpportunityFormValues,
};

export const emptyPartnerOrganizationActionState: PartnerOrganizationActionState =
  {
    fieldErrors: {},
    formError: null,
    values: emptyPartnerOrganizationFormValues,
  };

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function validateOptionalEmail(value: string) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseOpportunityType(value: string) {
  return opportunityTypeOptions.includes(value as OpportunityType)
    ? (value as OpportunityType)
    : "";
}

function parseOpportunityStatus(value: string) {
  return opportunityStatusOptions.includes(value as OpportunityStatus)
    ? (value as OpportunityStatus)
    : "";
}

function parsePartnerStatus(value: string) {
  return partnerStatusOptions.includes(value as PartnerStatus)
    ? (value as PartnerStatus)
    : "";
}

export function opportunityValuesFromFormData(
  formData: FormData,
): OpportunityFormValues {
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
    status: parseOpportunityStatus(getString(formData, "status")),
  };
}

export function partnerOrganizationValuesFromFormData(
  formData: FormData,
): PartnerOrganizationFormValues {
  return {
    name: getString(formData, "name"),
    website: getString(formData, "website"),
    type: getString(formData, "type"),
    location: getString(formData, "location"),
    city: getString(formData, "city"),
    state: getString(formData, "state"),
    country: getString(formData, "country"),
    specialtyAreas: getString(formData, "specialtyAreas"),
    status: parsePartnerStatus(getString(formData, "status")),
    description: getString(formData, "description"),
    contactEmail: getString(formData, "contactEmail"),
  };
}

export function validateOpportunityForm(formData: FormData) {
  const values = opportunityValuesFromFormData(formData);
  const errors: OpportunityFieldErrors = {};

  if (!values.title) {
    errors.title = "Title is required.";
  }

  if (!values.organizationId) {
    errors.organizationId = "Choose a partner organization.";
  }

  if (!values.type) {
    errors.type = "Choose an opportunity type.";
  }

  if (!values.status) {
    errors.status = "Choose a status.";
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

  if (Object.keys(errors).length > 0 || !values.type || !values.status) {
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
      status: values.status,
    },
  };
}

export function validatePartnerOrganizationForm(formData: FormData) {
  const values = partnerOrganizationValuesFromFormData(formData);
  const errors: PartnerOrganizationFieldErrors = {};

  if (!values.name) {
    errors.name = "Organization name is required.";
  }

  if (!values.status) {
    errors.status = "Choose a partner status.";
  }

  if (!validateOptionalUrl(values.website)) {
    errors.website = "Enter a valid URL starting with http:// or https://.";
  }

  if (!validateOptionalEmail(values.contactEmail)) {
    errors.contactEmail = "Enter a valid contact email.";
  }

  if (Object.keys(errors).length > 0 || !values.status) {
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
      name: values.name,
      website: values.website || null,
      type: values.type || null,
      location: values.location || null,
      city: values.city || null,
      state: values.state || null,
      country: values.country || null,
      specialtyAreas: splitList(values.specialtyAreas),
      status: values.status,
      description: values.description || null,
      contactEmail: values.contactEmail || null,
    },
  };
}
