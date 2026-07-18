import type {
  ApplicationMethod,
  OpportunityAvailabilityStatus,
  OpportunityRelationshipType,
  OpportunityStatus,
  OpportunityType,
  OpportunityVerificationStatus,
  PartnerStatus,
  PartnerVerificationStatus,
} from "@/generated/prisma/enums";
import {
  isSafeExternalUrl,
  optionalSafeExternalUrl,
} from "@/lib/security/safe-url";
import { parseGradeLevelCodes } from "@/lib/matching/grade-levels";

export type PublishReadinessInput = {
  relationshipType: OpportunityRelationshipType;
  officialSourceUrl: string | null;
  verificationStatus: OpportunityVerificationStatus;
  lastVerifiedAt: Date | null;
};

export function validateOpportunityPublishReadiness(
  input: PublishReadinessInput,
) {
  const errors: string[] = [];
  if (!isSafeExternalUrl(input.officialSourceUrl))
    errors.push("A valid official source URL is required before publishing.");
  if (input.verificationStatus !== "VERIFIED")
    errors.push("The opportunity must be verified before publishing.");
  if (!input.lastVerifiedAt)
    errors.push("A last verified date is required before publishing.");
  return { errors, ready: errors.length === 0 };
}

export type OpportunityOrganizationReadinessInput = {
  organizationVerificationStatus: PartnerVerificationStatus;
  status?: OpportunityStatus;
  verificationStatus?: OpportunityVerificationStatus;
};

export function validateOpportunityOrganizationReadiness({
  organizationVerificationStatus,
  status,
  verificationStatus,
}: OpportunityOrganizationReadinessInput) {
  const requiresVerifiedOrganization =
    status === "PUBLISHED" || verificationStatus === "VERIFIED";
  const errors =
    requiresVerifiedOrganization &&
    organizationVerificationStatus !== "VERIFIED"
      ? [
          "The partner organization must be verified before an opportunity can be verified or published.",
        ]
      : [];

  return { errors, ready: errors.length === 0 };
}

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

export const opportunityRelationshipTypeOptions = [
  "EXTERNAL_PUBLIC",
  "FP_PARTNER",
  "FP_OWNED",
] as const satisfies readonly OpportunityRelationshipType[];
export const opportunityVerificationStatusOptions = [
  "NEEDS_REVIEW",
  "VERIFIED",
  "STALE",
  "BROKEN_LINK",
  "REJECTED",
  "ARCHIVED",
] as const satisfies readonly OpportunityVerificationStatus[];
export const opportunityAvailabilityStatusOptions = [
  "OPEN",
  "OPENING_SOON",
  "ROLLING",
  "CLOSED",
  "EXPIRED",
  "ARCHIVED",
] as const satisfies readonly OpportunityAvailabilityStatus[];
export const applicationMethodOptions = [
  "EXTERNAL_PORTAL",
  "FP_INTERNAL",
  "FP_REFERRAL",
] as const satisfies readonly ApplicationMethod[];

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
  relationshipType: OpportunityRelationshipType | "";
  applicationMethod: ApplicationMethod | "";
  officialSourceUrl: string;
  officialApplicationUrl: string;
  verificationStatus: OpportunityVerificationStatus | "";
  lastVerifiedAt: string;
  nextVerificationAt: string;
  availabilityStatus: OpportunityAvailabilityStatus | "";
  opensAt: string;
  startsAt: string;
  endsAt: string;
  city: string;
  state: string;
  country: string;
  minimumAge: string;
  maximumAge: string;
  acceptedGradeLevels: string;
  requiredCertifications: string;
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
  relationshipType: "EXTERNAL_PUBLIC",
  applicationMethod: "EXTERNAL_PORTAL",
  officialSourceUrl: "",
  officialApplicationUrl: "",
  verificationStatus: "NEEDS_REVIEW",
  lastVerifiedAt: "",
  nextVerificationAt: "",
  availabilityStatus: "OPEN",
  opensAt: "",
  startsAt: "",
  endsAt: "",
  city: "",
  state: "",
  country: "",
  minimumAge: "",
  maximumAge: "",
  acceptedGradeLevels: "",
  requiredCertifications: "",
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

function parseEnum<T extends string>(value: string, options: readonly T[]) {
  return options.includes(value as T) ? (value as T) : "";
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
    relationshipType: parseEnum(
      getString(formData, "relationshipType"),
      opportunityRelationshipTypeOptions,
    ),
    applicationMethod: parseEnum(
      getString(formData, "applicationMethod"),
      applicationMethodOptions,
    ),
    officialSourceUrl: getString(formData, "officialSourceUrl"),
    officialApplicationUrl: getString(formData, "officialApplicationUrl"),
    verificationStatus: parseEnum(
      getString(formData, "verificationStatus"),
      opportunityVerificationStatusOptions,
    ),
    lastVerifiedAt: getString(formData, "lastVerifiedAt"),
    nextVerificationAt: getString(formData, "nextVerificationAt"),
    availabilityStatus: parseEnum(
      getString(formData, "availabilityStatus"),
      opportunityAvailabilityStatusOptions,
    ),
    opensAt: getString(formData, "opensAt"),
    startsAt: getString(formData, "startsAt"),
    endsAt: getString(formData, "endsAt"),
    city: getString(formData, "city"),
    state: getString(formData, "state"),
    country: getString(formData, "country"),
    minimumAge: getString(formData, "minimumAge"),
    maximumAge: getString(formData, "maximumAge"),
    acceptedGradeLevels: getString(formData, "acceptedGradeLevels"),
    requiredCertifications: getString(formData, "requiredCertifications"),
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
  if (!values.relationshipType)
    errors.relationshipType = "Choose a relationship type.";
  if (!values.applicationMethod)
    errors.applicationMethod = "Choose an application method.";
  if (!values.verificationStatus)
    errors.verificationStatus = "Choose a verification status.";
  if (!values.availabilityStatus)
    errors.availabilityStatus = "Choose an availability status.";
  if (
    values.relationshipType === "EXTERNAL_PUBLIC" &&
    values.applicationMethod !== "EXTERNAL_PORTAL"
  ) {
    errors.applicationMethod =
      "External public opportunities must use the external portal method.";
  }
  const acceptedGrades = parseGradeLevelCodes(
    splitList(values.acceptedGradeLevels),
  );
  if (acceptedGrades.unknownValues.length > 0) {
    errors.acceptedGradeLevels = `Unrecognized grade level: ${acceptedGrades.unknownValues.join(", ")}.`;
  }

  if (!optionalSafeExternalUrl(values.officialSourceUrl))
    errors.officialSourceUrl = "Enter a valid http:// or https:// URL.";
  if (!optionalSafeExternalUrl(values.officialApplicationUrl))
    errors.officialApplicationUrl = "Enter a valid http:// or https:// URL.";

  const parseDate = (value: string, field: keyof OpportunityFormValues) => {
    if (!value) return null;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) errors[field] = "Enter a valid date.";
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };
  const lastVerifiedAt = parseDate(values.lastVerifiedAt, "lastVerifiedAt");
  const nextVerificationAt = parseDate(
    values.nextVerificationAt,
    "nextVerificationAt",
  );
  const opensAt = parseDate(values.opensAt, "opensAt");
  const startsAt = parseDate(values.startsAt, "startsAt");
  const endsAt = parseDate(values.endsAt, "endsAt");
  const parseInteger = (value: string) => (value ? Number(value) : null);
  const minimumAge = parseInteger(values.minimumAge);
  const maximumAge = parseInteger(values.maximumAge);
  if (
    minimumAge != null &&
    (!Number.isInteger(minimumAge) || minimumAge < 13 || minimumAge > 100)
  )
    errors.minimumAge =
      "Minimum age must be a whole number between 13 and 100.";
  if (
    maximumAge != null &&
    (!Number.isInteger(maximumAge) || maximumAge < 13 || maximumAge > 100)
  )
    errors.maximumAge =
      "Maximum age must be a whole number between 13 and 100.";
  if (minimumAge != null && maximumAge != null && maximumAge < minimumAge)
    errors.maximumAge = "Maximum age must be at least the minimum age.";

  let deadline: Date | null = null;

  if (values.deadline) {
    deadline = parseDate(values.deadline, "deadline");
  }
  if (opensAt && deadline && deadline < opensAt)
    errors.deadline = "Deadline must be on or after the opening date.";
  if (startsAt && endsAt && endsAt < startsAt)
    errors.endsAt = "Program end must be on or after the start date.";
  if (
    values.status === "PUBLISHED" &&
    values.relationshipType &&
    values.verificationStatus
  ) {
    const readiness = validateOpportunityPublishReadiness({
      relationshipType: values.relationshipType,
      officialSourceUrl: values.officialSourceUrl || null,
      verificationStatus: values.verificationStatus,
      lastVerifiedAt,
    });
    if (!readiness.ready) errors.status = readiness.errors.join(" ");
  }

  let capacity: number | null = null;

  if (values.capacity) {
    capacity = Number(values.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      errors.capacity = "Capacity must be a positive number.";
    }
  }

  if (
    Object.keys(errors).length > 0 ||
    !values.type ||
    !values.status ||
    !values.relationshipType ||
    !values.applicationMethod ||
    !values.verificationStatus ||
    !values.availabilityStatus
  ) {
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
      relationshipType: values.relationshipType,
      applicationMethod: values.applicationMethod,
      officialSourceUrl: values.officialSourceUrl || null,
      officialApplicationUrl: values.officialApplicationUrl || null,
      verificationStatus:
        values.status === "ARCHIVED" ? "ARCHIVED" : values.verificationStatus,
      lastVerifiedAt,
      nextVerificationAt,
      availabilityStatus:
        values.status === "ARCHIVED"
          ? "ARCHIVED"
          : values.status === "CLOSED"
            ? "CLOSED"
            : values.availabilityStatus,
      opensAt,
      startsAt,
      endsAt,
      city: values.city || null,
      state: values.state || null,
      country: values.country || null,
      minimumAge,
      maximumAge,
      acceptedGradeLevels: acceptedGrades.codes,
      requiredCertifications: splitList(values.requiredCertifications),
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
