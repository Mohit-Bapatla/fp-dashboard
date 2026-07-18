import type { AppRole } from "@/lib/auth/roles";
import { isSafeExternalUrl } from "@/lib/security/safe-url";

export const PARTNER_ONBOARDING_PATH = "/partner-onboarding";

export type PartnerOnboardingFormValues = {
  name: string;
  organizationType: string;
  title: string;
  website: string;
};

export type PartnerOnboardingFieldErrors = Partial<
  Record<keyof PartnerOnboardingFormValues, string>
>;

export type PartnerOnboardingActionState = {
  fieldErrors: PartnerOnboardingFieldErrors;
  formError: string | null;
  status: "idle" | "complete" | "activation_pending";
  values: PartnerOnboardingFormValues;
};

export const emptyPartnerOnboardingFormValues: PartnerOnboardingFormValues = {
  name: "",
  organizationType: "",
  title: "",
  website: "",
};

export const initialPartnerOnboardingActionState: PartnerOnboardingActionState =
  {
    fieldErrors: {},
    formError: null,
    status: "idle",
    values: emptyPartnerOnboardingFormValues,
  };

function normalizedField(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function partnerOnboardingValuesFromFormData(
  formData: FormData,
): PartnerOnboardingFormValues {
  return {
    name: normalizedField(formData, "name"),
    organizationType: normalizedField(formData, "organizationType"),
    title: normalizedField(formData, "title"),
    website: normalizedField(formData, "website"),
  };
}

function hasControlCharacters(value: string) {
  return /[\u0000-\u001F\u007F]/.test(value);
}

export function validatePartnerOnboardingForm(formData: FormData) {
  const values = partnerOnboardingValuesFromFormData(formData);
  const errors: PartnerOnboardingFieldErrors = {};

  if (!values.name) {
    errors.name = "Organization name is required.";
  } else if (values.name.length > 160) {
    errors.name = "Organization name must be 160 characters or fewer.";
  } else if (hasControlCharacters(values.name)) {
    errors.name = "Organization name contains unsupported characters.";
  }

  if (values.website.length > 2_048) {
    errors.website = "Website must be 2,048 characters or fewer.";
  } else if (values.website && !isSafeExternalUrl(values.website)) {
    errors.website =
      "Enter a complete http:// or https:// URL without embedded credentials.";
  }

  if (values.organizationType.length > 120) {
    errors.organizationType =
      "Organization type must be 120 characters or fewer.";
  } else if (hasControlCharacters(values.organizationType)) {
    errors.organizationType =
      "Organization type contains unsupported characters.";
  }

  if (values.title.length > 120) {
    errors.title = "Your title must be 120 characters or fewer.";
  } else if (hasControlCharacters(values.title)) {
    errors.title = "Your title contains unsupported characters.";
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
      name: values.name,
      normalizedName: values.name.toLocaleLowerCase("en-US"),
      organizationType: values.organizationType || null,
      title: values.title || null,
      website: values.website || null,
    },
    success: true as const,
    values,
  };
}

export type PartnerOnboardingAccountState = {
  clerkRole: AppRole;
  databaseRole?: AppRole | null;
  hasPartnerMembership: boolean;
  hasStudentProfile: boolean;
  sessionRole: AppRole;
};

export type PartnerOnboardingBlockReason =
  | "ELEVATED_ACCOUNT"
  | "EXISTING_PARTNER_ACCOUNT"
  | "EXISTING_STUDENT_PROFILE"
  | "INCONSISTENT_ROLE";

export function getPartnerOnboardingBlockReason({
  clerkRole,
  databaseRole,
  hasPartnerMembership,
  hasStudentProfile,
  sessionRole,
}: PartnerOnboardingAccountState): PartnerOnboardingBlockReason | null {
  const roles = [sessionRole, clerkRole, databaseRole].filter(
    (role): role is AppRole => Boolean(role),
  );

  if (
    roles.some(
      (role) => role === "STAFF" || role === "ADMIN" || role === "SUPER_ADMIN",
    )
  ) {
    return "ELEVATED_ACCOUNT";
  }

  if (hasStudentProfile) {
    return "EXISTING_STUDENT_PROFILE";
  }

  if (hasPartnerMembership || roles.some((role) => role === "PARTNER")) {
    return "EXISTING_PARTNER_ACCOUNT";
  }

  return roles.every((role) => role === "STUDENT") ? null : "INCONSISTENT_ROLE";
}

export function partnerOnboardingBlockMessage(
  reason: PartnerOnboardingBlockReason,
) {
  switch (reason) {
    case "EXISTING_STUDENT_PROFILE":
      return "This account already has a student profile and cannot be converted through partner self-onboarding. Use a separate organization account or contact support.";
    case "EXISTING_PARTNER_ACCOUNT":
      return "This account is already connected to a partner role or organization. Open the partner dashboard or contact support if the workspace is unavailable.";
    case "ELEVATED_ACCOUNT":
      return "Staff and administrator accounts cannot use partner self-onboarding. Contact support for organization access.";
    case "INCONSISTENT_ROLE":
      return "This account has conflicting role information. Contact support before creating a partner workspace.";
  }
}

export function withPartnerPublicMetadata(metadata: unknown) {
  const existing =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  return {
    ...existing,
    role: "PARTNER" as const,
  };
}
