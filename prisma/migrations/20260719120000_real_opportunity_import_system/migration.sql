-- Production-grade opportunity provenance, import staging, manual overrides,
-- verification history, and query-backed directory indexes.

CREATE TYPE "OpportunityAdminReviewStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED'
);

CREATE TYPE "OpportunityImportEnvironment" AS ENUM (
  'DEVELOPMENT',
  'PREVIEW',
  'PRODUCTION'
);

CREATE TYPE "OpportunityImportRunStatus" AS ENUM (
  'DRY_RUN',
  'AWAITING_APPROVAL',
  'APPROVED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'REVERSED'
);

CREATE TYPE "OpportunityImportRowAction" AS ENUM (
  'CREATE',
  'UPDATE',
  'UNCHANGED',
  'REJECT',
  'DUPLICATE',
  'NEEDS_REVIEW',
  'ARCHIVE',
  'RESTORE'
);

CREATE TYPE "OpportunityVerificationCheckResult" AS ENUM (
  'HEALTHY',
  'REDIRECTED',
  'BROKEN',
  'TIMEOUT',
  'BLOCKED',
  'CONTENT_CHANGED',
  'UNKNOWN'
);

CREATE TYPE "OpportunityVerificationReviewStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DISMISSED'
);

ALTER TABLE "Opportunity"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "sourceKey" TEXT,
  ADD COLUMN "secondarySourceUrl" TEXT,
  ADD COLUMN "sourceTitle" TEXT,
  ADD COLUMN "sourceOrganization" TEXT,
  ADD COLUMN "sourceRetrievedAt" TIMESTAMP(3),
  ADD COLUMN "verificationMethod" TEXT,
  ADD COLUMN "sourceNotes" TEXT,
  ADD COLUMN "sourceChangeFingerprint" TEXT,
  ADD COLUMN "originalImportedValues" JSONB,
  ADD COLUMN "duplicateGroup" TEXT,
  ADD COLUMN "dataQualityScore" INTEGER,
  ADD COLUMN "completenessScore" INTEGER,
  ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "adminReviewStatus" "OpportunityAdminReviewStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "adminReviewedAt" TIMESTAMP(3),
  ADD COLUMN "adminReviewedById" TEXT,
  ADD COLUMN "partnerSubmitted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "adminApprovedAt" TIMESTAMP(3),
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "publicNotes" TEXT,
  ADD COLUMN "compensationType" TEXT,
  ADD COLUMN "compensationAmount" TEXT,
  ADD COLUMN "stipendInformation" TEXT,
  ADD COLUMN "feesOrCosts" TEXT,
  ADD COLUMN "travelRequirements" TEXT,
  ADD COLUMN "housingInformation" TEXT,
  ADD COLUMN "schoolCreditAvailability" TEXT,
  ADD COLUMN "priorityDeadline" TIMESTAMP(3),
  ADD COLUMN "educationRequirement" TEXT,
  ADD COLUMN "geographicRequirement" TEXT,
  ADD COLUMN "prerequisiteCourses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "backgroundCheckRequirement" TEXT,
  ADD COLUMN "healthClearanceRequirement" TEXT,
  ADD COLUMN "additionalRestrictions" TEXT,
  ADD COLUMN "eligibilityNotes" TEXT,
  ADD COLUMN "applicationContactEmail" TEXT,
  ADD COLUMN "interviewProcess" TEXT,
  ADD COLUMN "selectionTimeline" TEXT,
  ADD COLUMN "duration" TEXT,
  ADD COLUMN "responsibilities" TEXT,
  ADD COLUMN "skillsOffered" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE TABLE "OpportunityImportRun" (
  "id" TEXT NOT NULL,
  "sourceFileName" TEXT NOT NULL,
  "sourceFileHash" TEXT NOT NULL,
  "environment" "OpportunityImportEnvironment" NOT NULL,
  "targetProjectRef" TEXT NOT NULL,
  "targetDatabase" TEXT NOT NULL DEFAULT 'postgres',
  "targetSchema" TEXT NOT NULL DEFAULT 'public',
  "dryRun" BOOLEAN NOT NULL DEFAULT true,
  "status" "OpportunityImportRunStatus" NOT NULL DEFAULT 'DRY_RUN',
  "submittedById" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "totalRows" INTEGER NOT NULL DEFAULT 0,
  "createdCount" INTEGER NOT NULL DEFAULT 0,
  "updatedCount" INTEGER NOT NULL DEFAULT 0,
  "unchangedCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  "needsReviewCount" INTEGER NOT NULL DEFAULT 0,
  "publishedCount" INTEGER NOT NULL DEFAULT 0,
  "archivedCount" INTEGER NOT NULL DEFAULT 0,
  "restoredCount" INTEGER NOT NULL DEFAULT 0,
  "errorSummary" TEXT,
  "report" JSONB,
  "reversalOfImportId" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "reversedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpportunityImportRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityImportRow" (
  "id" TEXT NOT NULL,
  "importRunId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "sourceKey" TEXT,
  "slug" TEXT,
  "action" "OpportunityImportRowAction" NOT NULL,
  "opportunityId" TEXT,
  "duplicateOpportunityId" TEXT,
  "officialSourceUrl" TEXT,
  "officialApplicationUrl" TEXT,
  "originalData" JSONB NOT NULL,
  "normalizedData" JSONB,
  "proposedChanges" JSONB,
  "validationErrors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "warnings" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpportunityImportRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityFieldOverride" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "fieldName" TEXT NOT NULL,
  "value" JSONB,
  "reason" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpportunityFieldOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityChangeEvent" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "importRunId" TEXT,
  "action" TEXT NOT NULL,
  "actorId" TEXT,
  "previousData" JSONB,
  "nextData" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpportunityChangeEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityVerificationCheck" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "checkedUrl" TEXT NOT NULL,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "result" "OpportunityVerificationCheckResult" NOT NULL,
  "httpStatus" INTEGER,
  "redirectUrl" TEXT,
  "contentFingerprint" TEXT,
  "previousFingerprint" TEXT,
  "contentChanged" BOOLEAN NOT NULL DEFAULT false,
  "errorCode" TEXT,
  "suggestedAction" TEXT,
  "reviewStatus" "OpportunityVerificationReviewStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OpportunityVerificationCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Opportunity_slug_key" ON "Opportunity"("slug");
CREATE UNIQUE INDEX "Opportunity_sourceKey_key" ON "Opportunity"("sourceKey");
CREATE INDEX "Opportunity_officialApplicationUrl_idx" ON "Opportunity"("officialApplicationUrl");
CREATE INDEX "Opportunity_duplicateGroup_idx" ON "Opportunity"("duplicateGroup");
CREATE INDEX "Opportunity_adminReviewStatus_idx" ON "Opportunity"("adminReviewStatus");
CREATE INDEX "Opportunity_featured_publishedAt_idx" ON "Opportunity"("featured", "publishedAt");
CREATE INDEX "Opportunity_sourceRetrievedAt_idx" ON "Opportunity"("sourceRetrievedAt");
CREATE INDEX "PartnerOrganization_verifiedById_idx" ON "PartnerOrganization"("verifiedById");

-- These partial indexes match the public directory predicates used by the
-- Next.js loaders and remain compact when archived/import-review rows grow.
CREATE INDEX "Opportunity_public_directory_browse_idx"
  ON "Opportunity"("publishedAt" DESC, "id")
  WHERE "visibility" = 'PUBLIC_DIRECTORY'
    AND "status" = 'PUBLISHED'
    AND "verificationStatus" = 'VERIFIED'
    AND "availabilityStatus" IN ('OPEN', 'OPENING_SOON', 'ROLLING');

CREATE INDEX "Opportunity_public_directory_location_idx"
  ON "Opportunity"("state", "city", "type", "deadline")
  WHERE "visibility" = 'PUBLIC_DIRECTORY'
    AND "status" = 'PUBLISHED'
    AND "verificationStatus" = 'VERIFIED';

CREATE INDEX "OpportunityImportRun_status_createdAt_idx" ON "OpportunityImportRun"("status", "createdAt");
CREATE INDEX "OpportunityImportRun_environment_createdAt_idx" ON "OpportunityImportRun"("environment", "createdAt");
CREATE INDEX "OpportunityImportRun_sourceFileHash_idx" ON "OpportunityImportRun"("sourceFileHash");
CREATE INDEX "OpportunityImportRun_submittedById_idx" ON "OpportunityImportRun"("submittedById");
CREATE INDEX "OpportunityImportRun_approvedById_idx" ON "OpportunityImportRun"("approvedById");
CREATE INDEX "OpportunityImportRun_reversalOfImportId_idx" ON "OpportunityImportRun"("reversalOfImportId");

CREATE UNIQUE INDEX "OpportunityImportRow_importRunId_rowNumber_key" ON "OpportunityImportRow"("importRunId", "rowNumber");
CREATE INDEX "OpportunityImportRow_importRunId_action_idx" ON "OpportunityImportRow"("importRunId", "action");
CREATE INDEX "OpportunityImportRow_sourceKey_idx" ON "OpportunityImportRow"("sourceKey");
CREATE INDEX "OpportunityImportRow_opportunityId_idx" ON "OpportunityImportRow"("opportunityId");
CREATE INDEX "OpportunityImportRow_duplicateOpportunityId_idx" ON "OpportunityImportRow"("duplicateOpportunityId");

CREATE UNIQUE INDEX "OpportunityFieldOverride_opportunityId_fieldName_key" ON "OpportunityFieldOverride"("opportunityId", "fieldName");
CREATE INDEX "OpportunityFieldOverride_active_updatedAt_idx" ON "OpportunityFieldOverride"("active", "updatedAt");
CREATE INDEX "OpportunityFieldOverride_createdById_idx" ON "OpportunityFieldOverride"("createdById");

CREATE INDEX "OpportunityChangeEvent_opportunityId_createdAt_idx" ON "OpportunityChangeEvent"("opportunityId", "createdAt");
CREATE INDEX "OpportunityChangeEvent_importRunId_idx" ON "OpportunityChangeEvent"("importRunId");
CREATE INDEX "OpportunityChangeEvent_actorId_createdAt_idx" ON "OpportunityChangeEvent"("actorId", "createdAt");

CREATE INDEX "OpportunityVerificationCheck_opportunityId_checkedAt_idx" ON "OpportunityVerificationCheck"("opportunityId", "checkedAt");
CREATE INDEX "OpportunityVerificationCheck_reviewStatus_checkedAt_idx" ON "OpportunityVerificationCheck"("reviewStatus", "checkedAt");
CREATE INDEX "OpportunityVerificationCheck_result_checkedAt_idx" ON "OpportunityVerificationCheck"("result", "checkedAt");

ALTER TABLE "OpportunityImportRow"
  ADD CONSTRAINT "OpportunityImportRow_importRunId_fkey"
  FOREIGN KEY ("importRunId") REFERENCES "OpportunityImportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpportunityImportRow"
  ADD CONSTRAINT "OpportunityImportRow_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpportunityFieldOverride"
  ADD CONSTRAINT "OpportunityFieldOverride_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpportunityChangeEvent"
  ADD CONSTRAINT "OpportunityChangeEvent_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpportunityChangeEvent"
  ADD CONSTRAINT "OpportunityChangeEvent_importRunId_fkey"
  FOREIGN KEY ("importRunId") REFERENCES "OpportunityImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OpportunityVerificationCheck"
  ADD CONSTRAINT "OpportunityVerificationCheck_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_slug_format_check"
  CHECK ("slug" IS NULL OR "slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  ADD CONSTRAINT "Opportunity_quality_scores_check"
  CHECK (
    ("dataQualityScore" IS NULL OR "dataQualityScore" BETWEEN 0 AND 100)
    AND ("completenessScore" IS NULL OR "completenessScore" BETWEEN 0 AND 100)
  );

ALTER TABLE "OpportunityImportRun"
  ADD CONSTRAINT "OpportunityImportRun_counts_nonnegative_check"
  CHECK (
    "totalRows" >= 0
    AND "createdCount" >= 0
    AND "updatedCount" >= 0
    AND "unchangedCount" >= 0
    AND "rejectedCount" >= 0
    AND "duplicateCount" >= 0
    AND "needsReviewCount" >= 0
    AND "publishedCount" >= 0
    AND "archivedCount" >= 0
    AND "restoredCount" >= 0
  );

ALTER TABLE "OpportunityImportRow"
  ADD CONSTRAINT "OpportunityImportRow_rowNumber_check" CHECK ("rowNumber" > 0);

ALTER TABLE "OpportunityVerificationCheck"
  ADD CONSTRAINT "OpportunityVerificationCheck_httpStatus_check"
  CHECK ("httpStatus" IS NULL OR "httpStatus" BETWEEN 100 AND 599);

-- Clerk-backed application traffic uses server-side Prisma. Deny direct Data
-- API access to import/provenance tables unless explicit policies are added in
-- a separately reviewed Clerk-to-Supabase authorization design.
ALTER TABLE "OpportunityImportRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpportunityImportRow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpportunityFieldOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpportunityChangeEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpportunityVerificationCheck" ENABLE ROW LEVEL SECURITY;
