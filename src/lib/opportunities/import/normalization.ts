import { normalizeExternalUrl } from "@/lib/security/safe-url";

import {
  opportunityApplicationMethods,
  opportunityAvailabilityStatuses,
  opportunityFormats,
  opportunityRelationshipTypes,
  opportunityTypes,
  compensationTypes,
  gradeLevelCodes,
  type RealOpportunityRecord,
} from "./types";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function nullableString(value: unknown) {
  return cleanString(value) || null;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(new Set(value.map(cleanString).filter(Boolean)));
}

function nullableBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeUrl(value: unknown) {
  const cleaned = cleanString(value);
  return normalizeExternalUrl(cleaned) ?? cleaned;
}

function nullableUrl(value: unknown) {
  const cleaned = normalizeUrl(value);
  return cleaned || null;
}

function enumValue<TValue extends string>(
  value: unknown,
  allowed: readonly TValue[],
  fallback: TValue,
) {
  const normalized = cleanString(value)
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return allowed.includes(normalized as TValue)
    ? (normalized as TValue)
    : fallback;
}

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function normalizeSourceKey(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._:/-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function canonicalDuplicateUrl(value: string | null | undefined) {
  const normalized = normalizeExternalUrl(value);
  if (!normalized) return "";

  const url = new URL(normalized);
  for (const key of Array.from(url.searchParams.keys())) {
    if (
      key.toLowerCase().startsWith("utm_") ||
      ["ref", "source", "mc_cid", "mc_eid"].includes(key.toLowerCase())
    ) {
      url.searchParams.delete(key);
    }
  }
  return url.toString().replace(/\/$/, "");
}

export function normalizeMatchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(the|program|opportunity)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function opportunityCompositeKey({
  location,
  organizationName,
  title,
}: Pick<RealOpportunityRecord, "location" | "organizationName" | "title">) {
  return [organizationName, title, location].map(normalizeMatchText).join("|");
}

export function normalizeOpportunityRecord(
  input: unknown,
): RealOpportunityRecord {
  const value = asObject(input);
  const organizationName = cleanString(value.organizationName);
  const title = cleanString(value.title);
  const sourceKey = normalizeSourceKey(cleanString(value.sourceKey));
  const slug =
    slugify(cleanString(value.slug)) ||
    slugify([organizationName, title, cleanString(value.city)].join(" "));

  return {
    acceptedGradeLevels: stringArray(value.acceptedGradeLevels).filter((item) =>
      gradeLevelCodes.includes(item as (typeof gradeLevelCodes)[number]),
    ) as RealOpportunityRecord["acceptedGradeLevels"],
    additionalRestrictions: nullableString(value.additionalRestrictions),
    address: nullableString(value.address),
    applicationContactEmail: nullableString(value.applicationContactEmail),
    applicationInstructions: cleanString(value.applicationInstructions),
    applicationMethod: enumValue(
      value.applicationMethod,
      opportunityApplicationMethods,
      "EXTERNAL_PORTAL",
    ),
    availabilityStatus: enumValue(
      value.availabilityStatus,
      opportunityAvailabilityStatuses,
      "OPEN",
    ),
    backgroundCheckRequirement: nullableString(
      value.backgroundCheckRequirement,
    ),
    capacity: nullableNumber(value.capacity),
    city: nullableString(value.city),
    citizenshipRequirement: nullableString(value.citizenshipRequirement),
    compensationAmount: nullableString(value.compensationAmount),
    compensationType: enumValue(
      value.compensationType,
      compensationTypes,
      "UNKNOWN",
    ),
    country: nullableString(value.country),
    cycleLabel: nullableString(value.cycleLabel),
    deadline: nullableString(value.deadline),
    description: cleanString(value.description),
    duration: nullableString(value.duration),
    educationRequirement: nullableString(value.educationRequirement),
    eligibilityNotes: nullableString(value.eligibilityNotes),
    endsAt: nullableString(value.endsAt),
    estimatedWeeklyHours: nullableNumber(value.estimatedWeeklyHours),
    feesOrCosts: nullableString(value.feesOrCosts),
    geographicRequirement: nullableString(value.geographicRequirement),
    geographicScope: nullableString(value.geographicScope),
    healthClearanceRequirement: nullableString(
      value.healthClearanceRequirement,
    ),
    housingInformation: nullableString(value.housingInformation),
    interviewProcess: nullableString(value.interviewProcess),
    isRolling: value.isRolling === true,
    lastVerifiedAt: cleanString(value.lastVerifiedAt),
    location: nullableString(value.location),
    maximumAge: nullableNumber(value.maximumAge),
    minimumAge: nullableNumber(value.minimumAge),
    officialApplicationUrl: normalizeUrl(value.officialApplicationUrl),
    officialSourceUrl: normalizeUrl(value.officialSourceUrl),
    opensAt: nullableString(value.opensAt),
    organizationName,
    organizationType: cleanString(value.organizationType),
    organizationWebsite: normalizeUrl(value.organizationWebsite),
    parentPermissionRequired: nullableBoolean(value.parentPermissionRequired),
    prerequisiteCourses: stringArray(value.prerequisiteCourses),
    priorityDeadline: nullableString(value.priorityDeadline),
    publicNotes: nullableString(value.publicNotes),
    relationshipType: enumValue(
      value.relationshipType,
      opportunityRelationshipTypes,
      "EXTERNAL_PUBLIC",
    ),
    remoteType: enumValue(value.remoteType, opportunityFormats, "UNKNOWN"),
    requiredCertifications: stringArray(value.requiredCertifications),
    requiredDocuments: stringArray(value.requiredDocuments),
    requiredExperience: nullableString(value.requiredExperience),
    residencyRequirement: nullableString(value.residencyRequirement),
    responsibilities: nullableString(value.responsibilities),
    scheduleRequirements: nullableString(value.scheduleRequirements),
    schoolCreditAvailability: nullableString(value.schoolCreditAvailability),
    secondarySourceUrl: nullableUrl(value.secondarySourceUrl),
    selectionTimeline: nullableString(value.selectionTimeline),
    shortDescription: cleanString(value.shortDescription),
    skillsOffered: stringArray(value.skillsOffered),
    slug,
    sourceKey,
    sourceNotes: nullableString(value.sourceNotes),
    sourceOrganization: cleanString(value.sourceOrganization),
    sourceRetrievedAt: cleanString(value.sourceRetrievedAt),
    sourceTitle: cleanString(value.sourceTitle),
    specialty: nullableString(value.specialty),
    startsAt: nullableString(value.startsAt),
    state: nullableString(value.state),
    stipendInformation: nullableString(value.stipendInformation),
    title,
    transportationNotes: nullableString(value.transportationNotes),
    travelRequirements: nullableString(value.travelRequirements),
    type: enumValue(value.type, opportunityTypes, "PROGRAM"),
    unknownFields: stringArray(value.unknownFields),
    verificationMethod: cleanString(value.verificationMethod),
    workAuthorizationRequired: nullableBoolean(value.workAuthorizationRequired),
  };
}

export function remoteTypeLabel(value: RealOpportunityRecord["remoteType"]) {
  return value === "IN_PERSON"
    ? "In person"
    : value === "REMOTE"
      ? "Remote"
      : value === "HYBRID"
        ? "Hybrid"
        : null;
}

export function compensationTypeLabel(
  value: RealOpportunityRecord["compensationType"],
) {
  return value === "SCHOOL_CREDIT"
    ? "School credit"
    : value === "UNKNOWN"
      ? null
      : value.charAt(0) + value.slice(1).toLowerCase();
}
