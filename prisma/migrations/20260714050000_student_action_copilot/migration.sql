-- Student action system, reminders, and private external opportunity sources.
-- This migration preserves the existing ApplicationChecklistItem table and
-- exposes it through Prisma as ApplicationTask so deployed checklist rows keep
-- their identifiers and history.

CREATE TYPE "OpportunityVisibility" AS ENUM ('PUBLIC_DIRECTORY', 'STUDENT_PRIVATE');
CREATE TYPE "OpportunitySourceType" AS ENUM ('FP_CATALOG', 'STUDENT_ADDED');
CREATE TYPE "ExternalOpportunityVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "ApplicationTaskType" AS ENUM (
  'REVIEW_ELIGIBILITY',
  'REVIEW_OFFICIAL_REQUIREMENTS',
  'UPLOAD_RESUME',
  'SELECT_RESUME',
  'REQUEST_RECOMMENDATION',
  'CONFIRM_RECOMMENDATION',
  'PREPARE_ESSAY',
  'REVIEW_ESSAY',
  'UPLOAD_TRANSCRIPT',
  'COMPLETE_PARENT_FORM',
  'OPEN_EXTERNAL_PORTAL',
  'SUBMIT_INTERNAL_APPLICATION',
  'CONFIRM_EXTERNAL_SUBMISSION',
  'SCHEDULE_INTERVIEW',
  'PREPARE_FOR_INTERVIEW',
  'SEND_FOLLOW_UP',
  'REPORT_OUTCOME',
  'CUSTOM'
);
CREATE TYPE "ApplicationTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETE', 'SKIPPED');
CREATE TYPE "StudentNotificationType" AS ENUM (
  'GENERAL',
  'OPPORTUNITY_OPENING_SOON',
  'OPPORTUNITY_OPENED',
  'APPLICATION_DEADLINE',
  'INTERNAL_TARGET_DEADLINE',
  'TASK_OVERDUE',
  'RECOMMENDATION_REQUEST',
  'RECOMMENDATION_DEADLINE',
  'INTERVIEW_REMINDER',
  'POST_INTERVIEW_THANK_YOU',
  'POST_SUBMISSION_FOLLOW_UP',
  'OUTCOME_REPORTING',
  'WEEKLY_DIGEST'
);

ALTER TABLE "Opportunity"
  ADD COLUMN "visibility" "OpportunityVisibility" NOT NULL DEFAULT 'PUBLIC_DIRECTORY',
  ADD COLUMN "sourceType" "OpportunitySourceType" NOT NULL DEFAULT 'FP_CATALOG',
  ADD COLUMN "studentOwnerProfileId" TEXT,
  ADD COLUMN "studentSourceUrlNormalized" TEXT,
  ADD COLUMN "studentOrganizationName" TEXT;

ALTER TABLE "PartnerOrganization"
  ADD COLUMN "isSystemPlaceholder" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ApplicationChecklistItem"
  ADD COLUMN "type" "ApplicationTaskType" NOT NULL DEFAULT 'CUSTOM',
  ADD COLUMN "status" "ApplicationTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
  ADD COLUMN "dueAt" DATE,
  ADD COLUMN "taskKey" TEXT,
  ADD COLUMN "studentControlled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "linkedEntityType" TEXT,
  ADD COLUMN "linkedEntityId" TEXT;

UPDATE "ApplicationChecklistItem"
SET
  "status" = CASE
    WHEN "completedAt" IS NOT NULL THEN 'COMPLETE'::"ApplicationTaskStatus"
    ELSE 'NOT_STARTED'::"ApplicationTaskStatus"
  END,
  "type" = CASE
    WHEN lower("label") = 'select a resume' THEN 'SELECT_RESUME'::"ApplicationTaskType"
    WHEN lower("label") LIKE '%essay%' THEN 'PREPARE_ESSAY'::"ApplicationTaskType"
    WHEN lower("label") LIKE '%transcript%' THEN 'UPLOAD_TRANSCRIPT'::"ApplicationTaskType"
    WHEN lower("label") LIKE '%parent%' OR lower("label") LIKE '%consent%' THEN 'COMPLETE_PARENT_FORM'::"ApplicationTaskType"
    WHEN lower("label") LIKE '%recommendation%' THEN 'REQUEST_RECOMMENDATION'::"ApplicationTaskType"
    WHEN lower("label") LIKE '%host portal%' THEN 'CONFIRM_EXTERNAL_SUBMISSION'::"ApplicationTaskType"
    WHEN lower("label") LIKE '%future physicians submission%' THEN 'SUBMIT_INTERNAL_APPLICATION'::"ApplicationTaskType"
    ELSE 'CUSTOM'::"ApplicationTaskType"
  END,
  "source" = COALESCE("source", 'LEGACY_CHECKLIST'),
  "taskKey" = 'legacy:' || "id";

ALTER TABLE "Notification"
  ADD COLUMN "type" "StudentNotificationType" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "actionUrl" TEXT,
  ADD COLUMN "deduplicationKey" TEXT,
  ADD COLUMN "opportunityId" TEXT,
  ADD COLUMN "applicationId" TEXT,
  ADD COLUMN "applicationTaskId" TEXT,
  ADD COLUMN "dismissedAt" TIMESTAMP(3),
  ADD COLUMN "emailedAt" TIMESTAMP(3);

CREATE TABLE "StudentNotificationPreference" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "weeklyDigestEnabled" BOOLEAN NOT NULL DEFAULT false,
  "openingAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "deadlineAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "taskReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "recommendationReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "interviewReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "outcomeReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentNotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalOpportunityVerificationRequest" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "status" "ExternalOpportunityVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalOpportunityVerificationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Opportunity_studentOwnerProfileId_studentSourceUrlNormalize_key"
  ON "Opportunity"("studentOwnerProfileId", "studentSourceUrlNormalized");
CREATE INDEX "Opportunity_visibility_idx" ON "Opportunity"("visibility");
CREATE INDEX "Opportunity_sourceType_idx" ON "Opportunity"("sourceType");
CREATE INDEX "Opportunity_studentOwnerProfileId_idx" ON "Opportunity"("studentOwnerProfileId");
CREATE INDEX "PartnerOrganization_isSystemPlaceholder_idx" ON "PartnerOrganization"("isSystemPlaceholder");

CREATE UNIQUE INDEX "ApplicationChecklistItem_applicationId_taskKey_key"
  ON "ApplicationChecklistItem"("applicationId", "taskKey");
CREATE INDEX "ApplicationChecklistItem_applicationId_status_dueAt_idx"
  ON "ApplicationChecklistItem"("applicationId", "status", "dueAt");
CREATE INDEX "ApplicationChecklistItem_status_dueAt_idx"
  ON "ApplicationChecklistItem"("status", "dueAt");

CREATE UNIQUE INDEX "Notification_deduplicationKey_key" ON "Notification"("deduplicationKey");
CREATE INDEX "Notification_userId_dismissedAt_createdAt_idx" ON "Notification"("userId", "dismissedAt", "createdAt");
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");
CREATE INDEX "Notification_opportunityId_idx" ON "Notification"("opportunityId");
CREATE INDEX "Notification_applicationId_idx" ON "Notification"("applicationId");
CREATE INDEX "Notification_applicationTaskId_idx" ON "Notification"("applicationTaskId");

CREATE UNIQUE INDEX "StudentNotificationPreference_studentProfileId_key"
  ON "StudentNotificationPreference"("studentProfileId");
CREATE INDEX "StudentNotificationPreference_weeklyDigestEnabled_idx"
  ON "StudentNotificationPreference"("weeklyDigestEnabled");

CREATE UNIQUE INDEX "ExternalOpportunityVerificationRequest_opportunityId_key"
  ON "ExternalOpportunityVerificationRequest"("opportunityId");
CREATE INDEX "ExternalOpportunityVerificationRequest_studentProfileId_sta_idx"
  ON "ExternalOpportunityVerificationRequest"("studentProfileId", "status");
CREATE INDEX "ExternalOpportunityVerificationRequest_status_createdAt_idx"
  ON "ExternalOpportunityVerificationRequest"("status", "createdAt");
CREATE INDEX "ExternalOpportunityVerificationRequest_reviewedById_idx"
  ON "ExternalOpportunityVerificationRequest"("reviewedById");

ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_studentOwnerProfileId_fkey"
  FOREIGN KEY ("studentOwnerProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_applicationTaskId_fkey"
  FOREIGN KEY ("applicationTaskId") REFERENCES "ApplicationChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentNotificationPreference"
  ADD CONSTRAINT "StudentNotificationPreference_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalOpportunityVerificationRequest"
  ADD CONSTRAINT "ExternalOpportunityVerificationRequest_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalOpportunityVerificationRequest"
  ADD CONSTRAINT "ExternalOpportunityVerificationRequest_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalOpportunityVerificationRequest"
  ADD CONSTRAINT "ExternalOpportunityVerificationRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense in depth: a student-owned source cannot become a verified public
-- listing through a generic opportunity mutation. Verification acceptance must
-- create a separate reviewed catalog draft.
ALTER TABLE "Opportunity"
  ADD CONSTRAINT "Opportunity_student_private_invariant_check"
  CHECK (
    (
      "visibility" = 'PUBLIC_DIRECTORY'
      AND "sourceType" = 'FP_CATALOG'
      AND "studentOwnerProfileId" IS NULL
    )
    OR
    (
      "visibility" = 'STUDENT_PRIVATE'
      AND "sourceType" = 'STUDENT_ADDED'
      AND "studentOwnerProfileId" IS NOT NULL
      AND "studentSourceUrlNormalized" IS NOT NULL
      AND "studentOrganizationName" IS NOT NULL
      AND "relationshipType" = 'EXTERNAL_PUBLIC'
      AND "applicationMethod" = 'EXTERNAL_PORTAL'
      AND "status" = 'DRAFT'
      AND "verificationStatus" = 'NEEDS_REVIEW'
    )
  );
