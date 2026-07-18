import type { OpportunityType } from "@/generated/prisma/enums";
import { normalizeExternalUrl } from "@/lib/security/safe-url";

const opportunityTypes = [
  "INTERNSHIP",
  "SHADOWING",
  "RESEARCH",
  "VOLUNTEERING",
  "MENTORSHIP",
  "EVENT",
  "PROGRAM",
] as const satisfies readonly OpportunityType[];

export type ExternalOpportunityValues = {
  sourceUrl: string;
  title: string;
  organizationName: string;
  deadline: string;
  opensAt: string;
  location: string;
  opportunityType: string;
  notes: string;
  requiredDocuments: string;
  createWorkspace: boolean;
  requestVerification: boolean;
};

export type ExternalOpportunityActionState = {
  fieldErrors: Partial<Record<keyof ExternalOpportunityValues, string>>;
  formError: string | null;
  values: ExternalOpportunityValues;
};

export const emptyExternalOpportunityValues: ExternalOpportunityValues = {
  sourceUrl: "",
  title: "",
  organizationName: "",
  deadline: "",
  opensAt: "",
  location: "",
  opportunityType: "",
  notes: "",
  requiredDocuments: "",
  createWorkspace: true,
  requestVerification: false,
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function splitRequiredDocuments(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function validateExternalOpportunity(formData: FormData) {
  const values: ExternalOpportunityValues = {
    sourceUrl: text(formData, "sourceUrl"),
    title: text(formData, "title"),
    organizationName: text(formData, "organizationName"),
    deadline: text(formData, "deadline"),
    opensAt: text(formData, "opensAt"),
    location: text(formData, "location"),
    opportunityType: text(formData, "opportunityType"),
    notes: text(formData, "notes"),
    requiredDocuments: text(formData, "requiredDocuments"),
    createWorkspace: formData.get("createWorkspace") === "on",
    requestVerification: formData.get("requestVerification") === "on",
  };
  const fieldErrors: ExternalOpportunityActionState["fieldErrors"] = {};
  const normalizedSourceUrl = normalizeExternalUrl(values.sourceUrl);

  if (!normalizedSourceUrl) {
    fieldErrors.sourceUrl =
      "Enter a public HTTP(S) link without credentials or a local/private address.";
  }
  if (!values.title || values.title.length > 160) {
    fieldErrors.title = "Enter a title between 1 and 160 characters.";
  }
  if (!values.organizationName || values.organizationName.length > 160) {
    fieldErrors.organizationName =
      "Enter an organization name between 1 and 160 characters.";
  }
  if (values.location.length > 200) {
    fieldErrors.location = "Keep the location under 200 characters.";
  }
  if (values.notes.length > 5_000) {
    fieldErrors.notes = "Keep private notes under 5,000 characters.";
  }

  const deadline = values.deadline ? parseDateOnly(values.deadline) : null;
  const opensAt = values.opensAt ? parseDateOnly(values.opensAt) : null;
  if (values.deadline && !deadline) {
    fieldErrors.deadline = "Enter a valid deadline date.";
  }
  if (values.opensAt && !opensAt) {
    fieldErrors.opensAt = "Enter a valid opening date.";
  }
  if (deadline && opensAt && deadline < opensAt) {
    fieldErrors.deadline = "The deadline must be on or after the opening date.";
  }

  const opportunityType = opportunityTypes.includes(
    values.opportunityType as OpportunityType,
  )
    ? (values.opportunityType as OpportunityType)
    : values.opportunityType
      ? null
      : "PROGRAM";
  if (!opportunityType) {
    fieldErrors.opportunityType = "Choose a valid opportunity type.";
  }

  const requiredDocuments = splitRequiredDocuments(values.requiredDocuments);
  if (
    requiredDocuments.length > 15 ||
    requiredDocuments.some((item) => item.length > 100)
  ) {
    fieldErrors.requiredDocuments =
      "List at most 15 documents, each under 100 characters.";
  }

  if (Object.keys(fieldErrors).length > 0 || !normalizedSourceUrl) {
    return { fieldErrors, success: false as const, values };
  }

  return {
    data: {
      ...values,
      deadline,
      normalizedSourceUrl,
      opensAt,
      opportunityType: opportunityType as OpportunityType,
      requiredDocuments,
    },
    fieldErrors: {},
    success: true as const,
    values,
  };
}
