import { isSafeExternalUrl } from "@/lib/security/safe-url";

import type { RealOpportunityRecord } from "./types";

const reservedExampleDomains = new Set([
  "example.com",
  "example.net",
  "example.org",
]);

function hostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isReservedExampleUrl(value: string) {
  const host = hostname(value);
  return (
    reservedExampleDomains.has(host) ||
    [...reservedExampleDomains].some((domain) => host.endsWith(`.${domain}`))
  );
}

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateUrl(value: string | null, label: string, errors: string[]) {
  if (!value || !isSafeExternalUrl(value)) {
    errors.push(`${label} must be a public HTTP(S) URL.`);
    return;
  }

  if (isReservedExampleUrl(value)) {
    errors.push(`${label} cannot use a reserved example domain.`);
  }
}

function validateOptionalUrl(
  value: string | null,
  label: string,
  errors: string[],
) {
  if (!value) return;
  validateUrl(value, label, errors);
}

export type OpportunityValidationResult = {
  errors: string[];
  warnings: string[];
};

export function validateOpportunityRecord(
  record: RealOpportunityRecord,
  now = new Date(),
): OpportunityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!record.sourceKey) errors.push("Stable sourceKey is required.");
  if (!record.slug) errors.push("Stable slug is required.");
  if (!record.title) errors.push("Title is required.");
  if (!record.organizationName) errors.push("Organization name is required.");
  if (!record.organizationType) errors.push("Organization type is required.");
  if (!record.sourceTitle) errors.push("Official source title is required.");
  if (!record.sourceOrganization)
    errors.push("Official source organization is required.");
  if (!record.verificationMethod)
    errors.push("Verification method is required.");
  if (!record.applicationInstructions)
    errors.push("Application instructions are required.");

  validateUrl(record.officialSourceUrl, "Official source URL", errors);
  validateUrl(
    record.officialApplicationUrl,
    "Official application URL",
    errors,
  );
  validateUrl(record.organizationWebsite, "Organization website", errors);
  validateOptionalUrl(
    record.secondarySourceUrl,
    "Secondary source URL",
    errors,
  );

  if (
    record.relationshipType === "EXTERNAL_PUBLIC" &&
    record.applicationMethod !== "EXTERNAL_PORTAL"
  ) {
    errors.push(
      "Externally sourced opportunities must use the external application method.",
    );
  }

  if (record.shortDescription.length < 40) {
    errors.push("Short description must contain at least 40 characters.");
  }
  if (record.shortDescription.length > 500) {
    errors.push("Short description must not exceed 500 characters.");
  }
  if (record.description.length < 60) {
    errors.push("Description must contain at least 60 characters.");
  }
  if (record.description.length > 2_000) {
    errors.push(
      "Description must not exceed 2,000 characters; summarize official copy instead.",
    );
  }

  if (
    record.minimumAge != null &&
    (!Number.isInteger(record.minimumAge) ||
      record.minimumAge < 10 ||
      record.minimumAge > 100)
  ) {
    errors.push("Minimum age must be a whole number between 10 and 100.");
  }
  if (
    record.maximumAge != null &&
    (!Number.isInteger(record.maximumAge) ||
      record.maximumAge < 10 ||
      record.maximumAge > 100)
  ) {
    errors.push("Maximum age must be a whole number between 10 and 100.");
  }
  if (
    record.minimumAge != null &&
    record.maximumAge != null &&
    record.maximumAge < record.minimumAge
  ) {
    errors.push("Maximum age cannot be lower than minimum age.");
  }
  if (
    record.estimatedWeeklyHours != null &&
    (record.estimatedWeeklyHours <= 0 || record.estimatedWeeklyHours > 168)
  ) {
    errors.push(
      "Estimated weekly hours must be greater than 0 and at most 168.",
    );
  }
  if (
    record.capacity != null &&
    (!Number.isInteger(record.capacity) || record.capacity < 1)
  ) {
    errors.push("Capacity must be a positive whole number when published.");
  }

  const retrievedAt = parseDate(record.sourceRetrievedAt);
  const verifiedAt = parseDate(record.lastVerifiedAt);
  const deadline = parseDate(record.deadline);
  const opensAt = parseDate(record.opensAt);
  const priorityDeadline = parseDate(record.priorityDeadline);
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1_000);

  if (!retrievedAt) errors.push("Source retrieval date is invalid.");
  if (!verifiedAt) errors.push("Last verified date is invalid.");
  if (retrievedAt && retrievedAt > oneDayFromNow)
    errors.push("Source retrieval date cannot be in the future.");
  if (verifiedAt && verifiedAt > oneDayFromNow)
    errors.push("Last verified date cannot be in the future.");
  if (deadline && opensAt && deadline < opensAt)
    errors.push(
      "Deadline cannot be earlier than the application opening date.",
    );
  if (deadline && priorityDeadline && priorityDeadline > deadline)
    errors.push("Priority deadline cannot be later than the final deadline.");
  if (
    deadline &&
    deadline < now &&
    ["OPEN", "OPENING_SOON", "ROLLING"].includes(record.availabilityStatus)
  ) {
    errors.push("An available opportunity cannot have a passed deadline.");
  }
  if (
    !deadline &&
    !record.isRolling &&
    record.availabilityStatus !== "ROLLING"
  ) {
    warnings.push(
      "No deadline is published and the listing is not marked rolling.",
    );
  }
  if (
    verifiedAt &&
    now.getTime() - verifiedAt.getTime() > 120 * 24 * 60 * 60 * 1_000
  ) {
    warnings.push("Verification is more than 120 days old.");
  }

  if (
    record.acceptedGradeLevels.length === 0 &&
    !record.educationRequirement &&
    !record.unknownFields.includes("educationRequirement")
  ) {
    warnings.push(
      "Education eligibility is neither stated nor marked unknown.",
    );
  }
  if (
    record.remoteType !== "REMOTE" &&
    !record.location &&
    !record.city &&
    !record.geographicScope
  ) {
    warnings.push("Non-remote opportunity has no public location information.");
  }
  if (record.compensationType === "UNKNOWN") {
    warnings.push("Compensation is explicitly unknown.");
  }

  return { errors, warnings };
}

export function isSpreadsheetFormula(value: string) {
  return /^[\t\r\n]*[=+\-@]/.test(value);
}

export function escapeSpreadsheetCell(value: string) {
  return isSpreadsheetFormula(value) ? `'${value}` : value;
}
