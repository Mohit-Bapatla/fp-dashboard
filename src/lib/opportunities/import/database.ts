import { randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

import { normalizeMatchText, normalizeSourceKey } from "./normalization";
import { hashExistingOpportunityState, stableJson } from "./planner";
import type {
  ExistingOpportunityForImport,
  OpportunityImportPlan,
  OpportunityImportPlanRow,
  ProductionWriteGuardInput,
  RealOpportunityRecord,
} from "./types";
import { validateProductionWriteGuard } from "./production-guard";

const legacyOpportunitySelect = {
  applicationMethod: true,
  availabilityStatus: true,
  archivalReason: true,
  city: true,
  country: true,
  cycleLabel: true,
  deadline: true,
  id: true,
  lastVerifiedAt: true,
  location: true,
  officialApplicationUrl: true,
  officialSourceUrl: true,
  organizationId: true,
  remoteType: true,
  sourceType: true,
  state: true,
  status: true,
  title: true,
  type: true,
  verificationStatus: true,
  visibility: true,
  organization: { select: { name: true } },
} satisfies Prisma.OpportunitySelect;

const additiveOpportunitySelect = {
  ...legacyOpportunitySelect,
  acceptedGradeLevels: true,
  address: true,
  additionalRestrictions: true,
  adminApprovedAt: true,
  adminReviewedAt: true,
  adminReviewedById: true,
  adminReviewStatus: true,
  applicationInstructions: true,
  applicationContactEmail: true,
  backgroundCheckRequirement: true,
  capacity: true,
  citizenshipRequirement: true,
  compensationAmount: true,
  compensationType: true,
  completenessScore: true,
  description: true,
  dataQualityScore: true,
  duplicateGroup: true,
  duration: true,
  educationRequirement: true,
  eligibilityNotes: true,
  eligibilityUnknowns: true,
  endsAt: true,
  estimatedWeeklyHours: true,
  featured: true,
  feesOrCosts: true,
  fieldOverrides: {
    select: { active: true, fieldName: true },
    where: { active: true },
  },
  geographicRequirement: true,
  geographicScope: true,
  healthClearanceRequirement: true,
  housingInformation: true,
  internalNotes: true,
  interviewProcess: true,
  isRolling: true,
  maximumAge: true,
  minimumAge: true,
  nextVerificationAt: true,
  opensAt: true,
  originalImportedValues: true,
  paidStatus: true,
  partnerSubmitted: true,
  parentPermissionRequired: true,
  prerequisiteCourses: true,
  priorityDeadline: true,
  publicNotes: true,
  relationshipType: true,
  requiredCertifications: true,
  requiredDocuments: true,
  requiredExperience: true,
  residencyRequirement: true,
  responsibilities: true,
  schoolCreditAvailability: true,
  secondarySourceUrl: true,
  selectionTimeline: true,
  scheduleRequirements: true,
  shortDescription: true,
  skillsOffered: true,
  slug: true,
  sourceChangeFingerprint: true,
  sourceKey: true,
  sourceNotes: true,
  sourceOrganization: true,
  sourceRetrievedAt: true,
  sourceTitle: true,
  specialty: true,
  startsAt: true,
  stipendInformation: true,
  travelRequirements: true,
  transportationNotes: true,
  verificationMethod: true,
  workAuthorizationRequired: true,
} satisfies Prisma.OpportunitySelect;

function isSchemaReadinessError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022"),
  );
}

function snapshotFromOpportunity(
  opportunity: Record<string, unknown> & {
    organization: { name: string };
  },
) {
  const { fieldOverrides, organization, ...snapshot } = opportunity;
  return {
    activeOverrideFields: new Set(
      Array.isArray(fieldOverrides)
        ? fieldOverrides
            .filter((item): item is { active: boolean; fieldName: string } =>
              Boolean(
                item &&
                typeof item === "object" &&
                "active" in item &&
                "fieldName" in item,
              ),
            )
            .filter((item) => item.active)
            .map((item) => item.fieldName)
        : [],
    ),
    id: String(snapshot.id),
    organizationId: String(snapshot.organizationId),
    organizationName: organization.name,
    snapshot,
  } satisfies ExistingOpportunityForImport;
}

export async function loadExistingOpportunityImportState() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { id: "asc" },
      select: additiveOpportunitySelect,
    });
    return {
      opportunities: opportunities.map((item) =>
        snapshotFromOpportunity(
          item as unknown as Record<string, unknown> & {
            organization: { name: string };
          },
        ),
      ),
      schemaReady: true,
    };
  } catch (error) {
    if (!isSchemaReadinessError(error)) throw error;
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { id: "asc" },
      select: legacyOpportunitySelect,
    });
    return {
      opportunities: opportunities.map((item) =>
        snapshotFromOpportunity(
          item as unknown as Record<string, unknown> & {
            organization: { name: string };
          },
        ),
      ),
      schemaReady: false,
    };
  }
}

export async function loadImportDatabaseIdentity() {
  const [identity] = await prisma.$queryRaw<
    Array<{ databaseName: string; schemaName: string }>
  >`SELECT current_database() AS "databaseName", current_schema() AS "schemaName"`;
  const count = await prisma.opportunity.count();
  return {
    database: identity?.databaseName ?? "unknown",
    opportunityCount: count,
    schema: identity?.schemaName ?? "unknown",
  };
}

export async function loadOpportunityImportAdminOverview() {
  try {
    const [runs, rowGroups, pendingVerificationChecks, reviewQueue] =
      await Promise.all([
        prisma.opportunityImportRun.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            archivedCount: true,
            createdAt: true,
            createdCount: true,
            dryRun: true,
            duplicateCount: true,
            environment: true,
            id: true,
            needsReviewCount: true,
            rejectedCount: true,
            sourceFileHash: true,
            sourceFileName: true,
            status: true,
            totalRows: true,
            unchangedCount: true,
            updatedCount: true,
          },
        }),
        prisma.opportunityImportRow.groupBy({
          by: ["action"],
          _count: { _all: true },
        }),
        prisma.opportunityVerificationCheck.count({
          where: { reviewStatus: "PENDING" },
        }),
        prisma.opportunity.count({
          where: {
            adminReviewStatus: "PENDING",
          },
        }),
      ]);

    return {
      pendingVerificationChecks,
      reviewQueue,
      rowCounts: Object.fromEntries(
        rowGroups.map((group) => [group.action, group._count._all]),
      ),
      runs,
      schemaReady: true as const,
    };
  } catch (error) {
    if (!isSchemaReadinessError(error)) throw error;
    return {
      pendingVerificationChecks: 0,
      reviewQueue: 0,
      rowCounts: {},
      runs: [],
      schemaReady: false as const,
    };
  }
}

function asDate(value: unknown) {
  if (value == null || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return value;
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : date;
}

const opportunityDateFields = new Set([
  "adminApprovedAt",
  "adminReviewedAt",
  "deadline",
  "endsAt",
  "lastVerifiedAt",
  "nextVerificationAt",
  "opensAt",
  "priorityDeadline",
  "sourceRetrievedAt",
  "startsAt",
]);

function toPrismaJson(value: unknown) {
  return JSON.parse(stableJson(value)) as Prisma.InputJsonValue;
}

function convertOpportunityData(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      opportunityDateFields.has(key)
        ? asDate(value)
        : key === "originalImportedValues"
          ? toPrismaJson(value)
          : value,
    ]),
  );
}

function organizationValues(record: RealOpportunityRecord) {
  return {
    city: record.city,
    country: record.country,
    description: null,
    isSystemPlaceholder: false,
    location: record.location,
    name: record.organizationName,
    state: record.state,
    status: "NOT_CONTACTED" as const,
    type: record.organizationType,
    verificationChecklist: [
      "Official organization website reviewed",
      "Official opportunity source reviewed",
    ],
    verificationNotes:
      "Verified as the host/source organization for a publicly listed program; this does not imply an FP partnership.",
    verificationStatus: "VERIFIED" as const,
    verifiedAt: asDate(record.lastVerifiedAt) as Date,
    website: record.organizationWebsite,
  };
}

async function getOrCreateOrganization(
  tx: Prisma.TransactionClient,
  record: RealOpportunityRecord,
  organizationIds: Map<string, string>,
) {
  const normalizedName = normalizeMatchText(record.organizationName);
  const existingId = organizationIds.get(normalizedName);
  if (existingId) return existingId;

  const created = await tx.partnerOrganization.create({
    data: organizationValues(record),
    select: { id: true },
  });
  organizationIds.set(normalizedName, created.id);
  return created.id;
}

function runCounts(plan: OpportunityImportPlan) {
  return {
    archivedCount: plan.counts.archive,
    createdCount: plan.counts.create,
    duplicateCount: plan.counts.duplicate,
    needsReviewCount: plan.counts.needs_review,
    publishedCount: 0,
    rejectedCount: plan.counts.reject,
    restoredCount: plan.counts.restore,
    totalRows: plan.totalRows,
    unchangedCount: plan.counts.unchanged,
    updatedCount: plan.counts.update,
  };
}

function importRowData(
  runId: string,
  rowId: string,
  row: OpportunityImportPlanRow,
) {
  return {
    action: row.action,
    duplicateOpportunityId: row.duplicateOpportunityId,
    id: rowId,
    importRunId: runId,
    normalizedData: row.normalized
      ? toPrismaJson(row.normalized)
      : Prisma.JsonNull,
    officialApplicationUrl: row.normalized?.officialApplicationUrl ?? null,
    officialSourceUrl: row.normalized?.officialSourceUrl ?? null,
    opportunityId: row.existingOpportunityId,
    originalData: toPrismaJson(row.original),
    proposedChanges:
      Object.keys(row.proposedChanges).length > 0
        ? toPrismaJson(row.proposedChanges)
        : Prisma.JsonNull,
    rowNumber: row.rowNumber,
    slug: row.normalized?.slug ?? null,
    sourceKey: row.sourceKey,
    validationErrors: row.validationErrors,
    warnings: row.warnings,
  } satisfies Prisma.OpportunityImportRowUncheckedCreateInput;
}

export async function commitOpportunityImport({
  actorId,
  approvedById,
  guard,
  plan,
  report,
  sourceFileName,
}: {
  actorId: string | null;
  approvedById: string | null;
  guard: ProductionWriteGuardInput;
  plan: OpportunityImportPlan;
  report: unknown;
  sourceFileName: string;
}) {
  const guardResult = validateProductionWriteGuard(guard);
  if (!guardResult.allowed) {
    throw new Error(guardResult.errors.join(" "));
  }
  if (plan.totalRows > 500) {
    throw new Error("A single import may contain at most 500 planned rows.");
  }

  const readiness = await loadExistingOpportunityImportState();
  if (!readiness.schemaReady) {
    throw new Error(
      "Opportunity import schema is not deployed; commit remains blocked.",
    );
  }
  const identity = await loadImportDatabaseIdentity();
  if (identity.opportunityCount !== guard.observedOpportunityCount) {
    throw new Error(
      "Opportunity row count changed after guard validation; re-run the dry run.",
    );
  }

  const runId = randomUUID();
  const rowIds = new Map(plan.rows.map((row) => [row.rowNumber, randomUUID()]));

  await prisma.$transaction(
    async (tx) => {
      const organizations = await tx.partnerOrganization.findMany({
        where: { isSystemPlaceholder: false },
        select: { id: true, name: true },
      });
      const organizationIds = new Map(
        organizations.map((organization) => [
          normalizeMatchText(organization.name),
          organization.id,
        ]),
      );
      const lockIds = plan.rows
        .map((row) => row.existingOpportunityId)
        .filter((id): id is string => Boolean(id))
        .sort();
      if (lockIds.length > 0) {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "Opportunity" WHERE id IN (${Prisma.join(
            lockIds,
          )}) ORDER BY id FOR UPDATE`,
        );
      }

      const currentOpportunities = await tx.opportunity.findMany({
        orderBy: { id: "asc" },
        select: additiveOpportunitySelect,
      });
      const transactionState = currentOpportunities.map((item) =>
        snapshotFromOpportunity(
          item as unknown as Record<string, unknown> & {
            organization: { name: string };
          },
        ),
      );
      if (
        hashExistingOpportunityState(transactionState) !==
        plan.existingStateHash
      ) {
        throw new Error(
          "Opportunity data or manual overrides changed after the dry run; no changes were committed. Re-run the dry run.",
        );
      }

      await tx.opportunityImportRun.create({
        data: {
          ...runCounts(plan),
          approvedAt: guard.environment === "production" ? new Date() : null,
          approvedById,
          completedAt: null,
          dryRun: false,
          environment: guard.environment.toUpperCase() as
            | "DEVELOPMENT"
            | "PREVIEW"
            | "PRODUCTION",
          id: runId,
          report: toPrismaJson(report),
          sourceFileHash: plan.datasetHash,
          sourceFileName,
          startedAt: new Date(),
          status: "RUNNING",
          submittedById: actorId,
          targetDatabase: guard.database,
          targetProjectRef: guard.projectRef,
          targetSchema: guard.schema,
        },
        select: { id: true },
      });

      await tx.opportunityImportRow.createMany({
        data: plan.rows.map((row) =>
          importRowData(runId, rowIds.get(row.rowNumber)!, row),
        ),
      });

      for (const row of [...plan.rows].sort((first, second) =>
        (first.existingOpportunityId ?? first.sourceKey ?? "").localeCompare(
          second.existingOpportunityId ?? second.sourceKey ?? "",
        ),
      )) {
        if (!["CREATE", "UPDATE", "RESTORE", "ARCHIVE"].includes(row.action)) {
          continue;
        }

        let opportunityId = row.existingOpportunityId;
        const previousData = row.existingOpportunityId
          ? (transactionState.find(
              (item) => item.id === row.existingOpportunityId,
            )?.snapshot ?? null)
          : null;

        if (row.action === "CREATE") {
          if (!row.normalized) throw new Error("Create row is not normalized.");
          const organizationId = await getOrCreateOrganization(
            tx,
            row.normalized,
            organizationIds,
          );
          const data = {
            ...convertOpportunityData(row.proposedChanges),
            organizationId,
          } as unknown as Prisma.OpportunityUncheckedCreateInput;
          const created = await tx.opportunity.create({
            data,
            select: { id: true },
          });
          opportunityId = created.id;
          await tx.opportunityImportRow.update({
            where: { id: rowIds.get(row.rowNumber)! },
            data: { opportunityId },
            select: { id: true },
          });
        } else if (opportunityId) {
          await tx.opportunity.update({
            where: { id: opportunityId },
            data: convertOpportunityData(
              row.proposedChanges,
            ) as unknown as Prisma.OpportunityUncheckedUpdateInput,
            select: { id: true },
          });
        }

        if (opportunityId) {
          const nextOpportunity = await tx.opportunity.findUniqueOrThrow({
            where: { id: opportunityId },
            select: additiveOpportunitySelect,
          });
          const nextData = snapshotFromOpportunity(
            nextOpportunity as unknown as Record<string, unknown> & {
              organization: { name: string };
            },
          ).snapshot;
          await tx.opportunityChangeEvent.create({
            data: {
              action: `IMPORT_${row.action}`,
              actorId,
              importRunId: runId,
              metadata: toPrismaJson({
                rowNumber: row.rowNumber,
                sourceKey: normalizeSourceKey(row.sourceKey ?? ""),
              }),
              nextData: toPrismaJson(nextData),
              opportunityId,
              previousData: previousData
                ? toPrismaJson(previousData)
                : Prisma.JsonNull,
            },
            select: { id: true },
          });
        }
      }

      await tx.opportunityImportRun.update({
        where: { id: runId },
        data: { completedAt: new Date(), status: "COMPLETED" },
        select: { id: true },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 10_000,
      timeout: 60_000,
    },
  );

  return { importRunId: runId };
}
