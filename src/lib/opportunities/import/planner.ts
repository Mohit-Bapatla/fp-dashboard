import { createHash } from "node:crypto";

import {
  canonicalDuplicateUrl,
  compensationTypeLabel,
  normalizeMatchText,
  normalizeOpportunityRecord,
  opportunityCompositeKey,
  remoteTypeLabel,
} from "./normalization";
import {
  scoreOpportunityCompleteness,
  scoreOpportunityDataQuality,
} from "./quality";
import {
  opportunityImportActions,
  opportunityImportSchemaVersion,
  type ExistingOpportunityForImport,
  type OpportunityImportAction,
  type OpportunityImportPlan,
  type OpportunityImportPlanCounts,
  type OpportunityImportPlanRow,
  type RealOpportunityDataset,
  type RealOpportunityRecord,
} from "./types";
import { validateOpportunityRecord } from "./validation";

function stableValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([first], [second]) => first.localeCompare(second))
        .map(([key, child]) => [key, stableValue(child)]),
    );
  }
  return value;
}

export function stableJson(value: unknown) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashExistingOpportunityState(
  existing: ExistingOpportunityForImport[],
) {
  return sha256(
    stableJson(
      existing
        .map((item) => ({
          activeOverrideFields: [...item.activeOverrideFields].sort(),
          id: item.id,
          organizationId: item.organizationId,
          organizationName: item.organizationName,
          snapshot: item.snapshot,
        }))
        .sort((first, second) => first.id.localeCompare(second.id)),
    ),
  );
}

function dateOnly(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toISOString().slice(0, 10);
}

function nextVerificationDate(lastVerifiedAt: string) {
  const date = new Date(
    lastVerifiedAt.length === 10
      ? `${lastVerifiedAt}T12:00:00Z`
      : lastVerifiedAt,
  );
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString().slice(0, 10);
}

export function recordToOpportunityValues(
  record: RealOpportunityRecord,
  scores: { completenessScore: number; qualityScore: number },
) {
  return {
    acceptedGradeLevels: record.acceptedGradeLevels,
    additionalRestrictions: record.additionalRestrictions,
    address: record.address,
    adminReviewStatus: "PENDING",
    applicationContactEmail: record.applicationContactEmail,
    applicationInstructions: record.applicationInstructions,
    applicationMethod: record.applicationMethod,
    availabilityStatus: record.availabilityStatus,
    backgroundCheckRequirement: record.backgroundCheckRequirement,
    capacity: record.capacity,
    city: record.city,
    citizenshipRequirement: record.citizenshipRequirement,
    compensationAmount: record.compensationAmount,
    compensationType: record.compensationType,
    completenessScore: scores.completenessScore,
    country: record.country,
    cycleLabel: record.cycleLabel,
    dataQualityScore: scores.qualityScore,
    deadline: dateOnly(record.deadline),
    description: record.description,
    duration: record.duration,
    educationRequirement: record.educationRequirement,
    eligibilityNotes: record.eligibilityNotes,
    eligibilityUnknowns: record.unknownFields,
    endsAt: dateOnly(record.endsAt),
    estimatedWeeklyHours: record.estimatedWeeklyHours,
    feesOrCosts: record.feesOrCosts,
    geographicRequirement: record.geographicRequirement,
    geographicScope: record.geographicScope,
    healthClearanceRequirement: record.healthClearanceRequirement,
    housingInformation: record.housingInformation,
    interviewProcess: record.interviewProcess,
    isRolling: record.isRolling,
    lastVerifiedAt: dateOnly(record.lastVerifiedAt),
    location: record.location,
    maximumAge: record.maximumAge,
    minimumAge: record.minimumAge,
    nextVerificationAt: nextVerificationDate(record.lastVerifiedAt),
    officialApplicationUrl: record.officialApplicationUrl,
    officialSourceUrl: record.officialSourceUrl,
    opensAt: dateOnly(record.opensAt),
    originalImportedValues: record,
    paidStatus: compensationTypeLabel(record.compensationType),
    parentPermissionRequired: record.parentPermissionRequired,
    partnerSubmitted: false,
    prerequisiteCourses: record.prerequisiteCourses,
    priorityDeadline: dateOnly(record.priorityDeadline),
    publicNotes: record.publicNotes,
    relationshipType: record.relationshipType,
    remoteType: remoteTypeLabel(record.remoteType),
    requiredCertifications: record.requiredCertifications,
    requiredDocuments: record.requiredDocuments,
    requiredExperience: record.requiredExperience,
    residencyRequirement: record.residencyRequirement,
    responsibilities: record.responsibilities,
    scheduleRequirements: record.scheduleRequirements,
    schoolCreditAvailability: record.schoolCreditAvailability,
    secondarySourceUrl: record.secondarySourceUrl,
    selectionTimeline: record.selectionTimeline,
    shortDescription: record.shortDescription,
    skillsOffered: record.skillsOffered,
    slug: record.slug,
    sourceChangeFingerprint: sha256(
      stableJson({
        application: record.officialApplicationUrl,
        availability: record.availabilityStatus,
        deadline: record.deadline,
        source: record.officialSourceUrl,
        title: record.sourceTitle,
      }),
    ),
    sourceKey: record.sourceKey,
    sourceNotes: record.sourceNotes,
    sourceOrganization: record.sourceOrganization,
    sourceRetrievedAt: dateOnly(record.sourceRetrievedAt),
    sourceTitle: record.sourceTitle,
    specialty: record.specialty,
    startsAt: dateOnly(record.startsAt),
    state: record.state,
    stipendInformation: record.stipendInformation,
    title: record.title,
    transportationNotes: record.transportationNotes,
    travelRequirements: record.travelRequirements,
    type: record.type,
    verificationMethod: record.verificationMethod,
    verificationStatus: "VERIFIED",
    visibility: "PUBLIC_DIRECTORY",
    workAuthorizationRequired: record.workAuthorizationRequired,
  } as const;
}

function snapshotValue(value: unknown) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10);
  }
  return stableValue(value);
}

function getChanges(
  proposed: Record<string, unknown>,
  existing: ExistingOpportunityForImport,
) {
  const changes: Record<string, unknown> = {};
  const preservedOverrides: string[] = [];

  for (const [field, value] of Object.entries(proposed)) {
    if (existing.activeOverrideFields.has(field)) {
      preservedOverrides.push(field);
      continue;
    }

    if (
      stableJson(snapshotValue(existing.snapshot[field])) !==
      stableJson(snapshotValue(value))
    ) {
      changes[field] = value;
    }
  }

  return { changes, preservedOverrides };
}

function existingKey(existing: ExistingOpportunityForImport, field: string) {
  const value = existing.snapshot[field];
  return typeof value === "string" ? value : "";
}

function countRows(rows: OpportunityImportPlanRow[]) {
  const counts = Object.fromEntries(
    opportunityImportActions.map((action) => [action.toLowerCase(), 0]),
  ) as OpportunityImportPlanCounts;

  for (const row of rows) {
    const key = row.action.toLowerCase() as keyof OpportunityImportPlanCounts;
    counts[key] += 1;
  }
  return counts;
}

function assertDataset(dataset: RealOpportunityDataset) {
  if (dataset.schemaVersion !== opportunityImportSchemaVersion) {
    throw new Error(
      `Unsupported opportunity dataset schema: ${String(dataset.schemaVersion)}.`,
    );
  }
  if (dataset.sourcePolicy !== "OFFICIAL_SOURCES_ONLY") {
    throw new Error("Opportunity dataset must use OFFICIAL_SOURCES_ONLY.");
  }
  if (!Array.isArray(dataset.records)) {
    throw new Error("Opportunity dataset records must be an array.");
  }
}

function buildExistingIndexes(existing: ExistingOpportunityForImport[]) {
  const byApplicationUrl = new Map<string, ExistingOpportunityForImport>();
  const byComposite = new Map<string, ExistingOpportunityForImport>();
  const bySlug = new Map<string, ExistingOpportunityForImport>();
  const bySourceKey = new Map<string, ExistingOpportunityForImport>();
  const bySourceUrl = new Map<string, ExistingOpportunityForImport>();

  for (const item of existing) {
    const applicationUrl = canonicalDuplicateUrl(
      existingKey(item, "officialApplicationUrl"),
    );
    const sourceUrl = canonicalDuplicateUrl(
      existingKey(item, "officialSourceUrl"),
    );
    const sourceKey = existingKey(item, "sourceKey");
    const slug = existingKey(item, "slug");
    const composite = [
      item.organizationName,
      existingKey(item, "title"),
      existingKey(item, "location"),
    ]
      .map(normalizeMatchText)
      .join("|");

    if (applicationUrl) byApplicationUrl.set(applicationUrl, item);
    if (sourceUrl) bySourceUrl.set(sourceUrl, item);
    if (sourceKey) bySourceKey.set(sourceKey, item);
    if (slug) bySlug.set(slug, item);
    if (composite) byComposite.set(composite, item);
  }

  return { byApplicationUrl, byComposite, bySlug, bySourceKey, bySourceUrl };
}

export function planOpportunityImport({
  dataset,
  existing,
  now = new Date(),
}: {
  dataset: RealOpportunityDataset;
  existing: ExistingOpportunityForImport[];
  now?: Date;
}): OpportunityImportPlan {
  assertDataset(dataset);
  const indexes = buildExistingIndexes(existing);
  const seenApplicationUrls = new Map<string, number>();
  const seenSlugs = new Map<string, number>();
  const seenSourceKeys = new Map<string, number>();
  const seenSourceUrls = new Map<string, number>();
  const rows: OpportunityImportPlanRow[] = [];

  dataset.records.forEach((original, index) => {
    const rowNumber = index + 1;
    const normalized = normalizeOpportunityRecord(original);
    const validation = validateOpportunityRecord(normalized, now);
    const sourceUrl = canonicalDuplicateUrl(normalized.officialSourceUrl);
    const applicationUrl = canonicalDuplicateUrl(
      normalized.officialApplicationUrl,
    );
    const duplicateRow =
      seenSourceKeys.get(normalized.sourceKey) ??
      seenSlugs.get(normalized.slug) ??
      seenSourceUrls.get(sourceUrl) ??
      seenApplicationUrls.get(applicationUrl);

    if (duplicateRow) {
      rows.push({
        action: "DUPLICATE",
        duplicateOpportunityId: null,
        existingOpportunityId: null,
        normalized,
        original,
        proposedChanges: {},
        qualityScore: null,
        completenessScore: null,
        rowNumber,
        sourceKey: normalized.sourceKey || null,
        validationErrors: validation.errors,
        warnings: [
          ...validation.warnings,
          `Duplicates dataset row ${duplicateRow}.`,
        ],
      });
      return;
    }

    if (normalized.sourceKey)
      seenSourceKeys.set(normalized.sourceKey, rowNumber);
    if (normalized.slug) seenSlugs.set(normalized.slug, rowNumber);
    if (sourceUrl) seenSourceUrls.set(sourceUrl, rowNumber);
    if (applicationUrl) seenApplicationUrls.set(applicationUrl, rowNumber);

    if (validation.errors.length > 0) {
      rows.push({
        action: "REJECT",
        duplicateOpportunityId: null,
        existingOpportunityId: null,
        normalized,
        original,
        proposedChanges: {},
        qualityScore: null,
        completenessScore: null,
        rowNumber,
        sourceKey: normalized.sourceKey || null,
        validationErrors: validation.errors,
        warnings: validation.warnings,
      });
      return;
    }

    const qualityScore = scoreOpportunityDataQuality(
      normalized,
      validation.warnings.length,
    );
    const completenessScore = scoreOpportunityCompleteness(normalized);
    const values = recordToOpportunityValues(normalized, {
      completenessScore,
      qualityScore,
    }) as Record<string, unknown>;
    const sourceKeyMatch = indexes.bySourceKey.get(normalized.sourceKey);
    const slugMatch = indexes.bySlug.get(normalized.slug);
    const sourceMatch = indexes.bySourceUrl.get(sourceUrl);
    const applicationMatch = indexes.byApplicationUrl.get(applicationUrl);
    const compositeMatch = indexes.byComposite.get(
      opportunityCompositeKey(normalized),
    );
    const stableMatch = sourceKeyMatch ?? slugMatch;
    const urlMatch = sourceMatch ?? applicationMatch;

    if (!stableMatch && urlMatch) {
      const titlesMatch =
        normalizeMatchText(existingKey(urlMatch, "title")) ===
        normalizeMatchText(normalized.title);
      rows.push({
        action: titlesMatch ? "DUPLICATE" : "NEEDS_REVIEW",
        duplicateOpportunityId: urlMatch.id,
        existingOpportunityId: null,
        normalized,
        original,
        proposedChanges: {},
        qualityScore,
        completenessScore,
        rowNumber,
        sourceKey: normalized.sourceKey,
        validationErrors: [],
        warnings: [
          ...validation.warnings,
          titlesMatch
            ? "Official source or application URL already belongs to an existing opportunity."
            : "An official URL matches an existing record with a different title; review whether this is another program on a shared page.",
        ],
      });
      return;
    }

    if (!stableMatch && compositeMatch) {
      rows.push({
        action: "NEEDS_REVIEW",
        duplicateOpportunityId: compositeMatch.id,
        existingOpportunityId: null,
        normalized,
        original,
        proposedChanges: {},
        qualityScore,
        completenessScore,
        rowNumber,
        sourceKey: normalized.sourceKey,
        validationErrors: [],
        warnings: [
          ...validation.warnings,
          "Organization, title, and location closely match an existing record.",
        ],
      });
      return;
    }

    if (!stableMatch) {
      rows.push({
        action: "CREATE",
        duplicateOpportunityId: null,
        existingOpportunityId: null,
        normalized,
        original,
        proposedChanges: { ...values, status: "PENDING_APPROVAL" },
        qualityScore,
        completenessScore,
        rowNumber,
        sourceKey: normalized.sourceKey,
        validationErrors: [],
        warnings: validation.warnings,
      });
      return;
    }

    const { changes, preservedOverrides } = getChanges(values, stableMatch);
    // Import refreshes never demote an already published record. Publication
    // remains an explicit admin decision, while closed/archived availability
    // can still be proposed from the verified source.
    delete changes.status;
    const wasArchived = ["ARCHIVED", "CLOSED"].includes(
      existingKey(stableMatch, "status"),
    );
    const shouldRestore =
      wasArchived &&
      ["OPEN", "OPENING_SOON", "ROLLING"].includes(
        normalized.availabilityStatus,
      );
    if (shouldRestore) {
      changes.status = "PENDING_APPROVAL";
      changes.archivalReason = null;
    }

    const action: OpportunityImportAction = shouldRestore
      ? "RESTORE"
      : Object.keys(changes).length > 0
        ? "UPDATE"
        : "UNCHANGED";
    rows.push({
      action,
      duplicateOpportunityId: null,
      existingOpportunityId: stableMatch.id,
      normalized,
      original,
      proposedChanges: changes,
      qualityScore,
      completenessScore,
      rowNumber,
      sourceKey: normalized.sourceKey,
      validationErrors: [],
      warnings: [
        ...validation.warnings,
        ...(preservedOverrides.length
          ? [
              `Preserved manual overrides: ${preservedOverrides.sort().join(", ")}.`,
            ]
          : []),
      ],
    });
  });

  const generatedAt = now.toISOString();
  const datasetHash = sha256(stableJson(dataset));
  return {
    counts: countRows(rows),
    datasetHash,
    existingStateHash: hashExistingOpportunityState(existing),
    generatedAt,
    rows,
    totalRows: rows.length,
  };
}

export function isExplicitFixtureOpportunity(
  opportunity: ExistingOpportunityForImport,
) {
  const id = opportunity.id.toLowerCase();
  const title = existingKey(opportunity, "title").toLowerCase();
  const organization = opportunity.organizationName.toLowerCase();
  const sourceUrl = existingKey(opportunity, "officialSourceUrl");

  return (
    id.includes("demo") ||
    id.includes("smoke") ||
    title === "tester" ||
    title.includes("smoke") ||
    organization.includes("demo") ||
    organization.includes("smoke") ||
    /https?:\/\/example\.(com|org|net)(?:\/|$)/i.test(sourceUrl)
  );
}

export function planFixtureArchives(
  existing: ExistingOpportunityForImport[],
  startRowNumber: number,
) {
  return existing
    .filter(isExplicitFixtureOpportunity)
    .filter((item) => existingKey(item, "visibility") === "PUBLIC_DIRECTORY")
    .filter((item) => existingKey(item, "status") !== "ARCHIVED")
    .map(
      (item, index): OpportunityImportPlanRow => ({
        action: "ARCHIVE",
        duplicateOpportunityId: null,
        existingOpportunityId: item.id,
        normalized: null,
        original: item.snapshot,
        proposedChanges: {
          adminReviewStatus: "REJECTED",
          archivalReason: "Replaced by real opportunity directory",
          availabilityStatus: "ARCHIVED",
          status: "ARCHIVED",
          verificationStatus: "ARCHIVED",
        },
        qualityScore: null,
        completenessScore: null,
        rowNumber: startRowNumber + index,
        sourceKey: existingKey(item, "sourceKey") || null,
        validationErrors: [],
        warnings: [
          "Explicit fixture record; preserve foreign-key history and archive instead of deleting.",
        ],
      }),
    );
}

export function withFixtureArchivePlan(
  plan: OpportunityImportPlan,
  existing: ExistingOpportunityForImport[],
) {
  const archiveRows = planFixtureArchives(existing, plan.rows.length + 1);
  const rows = [...plan.rows, ...archiveRows];
  return { ...plan, counts: countRows(rows), rows, totalRows: rows.length };
}
