-- Extend the existing application journey without renaming historical states.
ALTER TYPE "ApplicationStatus" ADD VALUE 'SAVED';
ALTER TYPE "ApplicationStatus" ADD VALUE 'PLANNING';
ALTER TYPE "ApplicationStatus" ADD VALUE 'PREPARING';
ALTER TYPE "ApplicationStatus" ADD VALUE 'WAITING_FOR_RECOMMENDATION';
ALTER TYPE "ApplicationStatus" ADD VALUE 'READY_TO_SUBMIT';
ALTER TYPE "ApplicationStatus" ADD VALUE 'WAITLISTED';

CREATE TYPE "OpportunityRelationshipType" AS ENUM ('EXTERNAL_PUBLIC', 'FP_PARTNER', 'FP_OWNED');
CREATE TYPE "OpportunityVerificationStatus" AS ENUM ('NEEDS_REVIEW', 'VERIFIED', 'STALE', 'BROKEN_LINK', 'REJECTED', 'ARCHIVED');
CREATE TYPE "OpportunityAvailabilityStatus" AS ENUM ('OPEN', 'OPENING_SOON', 'ROLLING', 'CLOSED', 'EXPIRED', 'ARCHIVED');
CREATE TYPE "OpportunityCorrectionCategory" AS ENUM ('BROKEN_LINK', 'INCORRECT_DEADLINE', 'ELIGIBILITY_ERROR', 'PROGRAM_CLOSED', 'DUPLICATE', 'OTHER');
CREATE TYPE "OpportunityCorrectionStatus" AS ENUM ('OPEN', 'RESOLVED', 'REJECTED');

ALTER TABLE "StudentProfile"
  ADD COLUMN "ageYears" INTEGER,
  ADD COLUMN "maximumTravelMiles" INTEGER,
  ADD COLUMN "paidOnlyPreference" BOOLEAN,
  ADD COLUMN "preferredSeasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "transportationNotes" TEXT;

ALTER TABLE "Opportunity"
  ADD COLUMN "shortDescription" TEXT,
  ADD COLUMN "fpSummary" TEXT,
  ADD COLUMN "relationshipType" "OpportunityRelationshipType" NOT NULL DEFAULT 'EXTERNAL_PUBLIC',
  ADD COLUMN "officialSourceUrl" TEXT,
  ADD COLUMN "officialApplicationUrl" TEXT,
  ADD COLUMN "relationshipNotes" TEXT,
  ADD COLUMN "verificationStatus" "OpportunityVerificationStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "nextVerificationAt" TIMESTAMP(3),
  ADD COLUMN "verifiedById" TEXT,
  ADD COLUMN "verificationNotes" TEXT,
  ADD COLUMN "brokenLinkDetectedAt" TIMESTAMP(3),
  ADD COLUMN "archivalReason" TEXT,
  ADD COLUMN "availabilityStatus" "OpportunityAvailabilityStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "opensAt" TIMESTAMP(3),
  ADD COLUMN "isRolling" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cycleLabel" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "state" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "geographicScope" TEXT,
  ADD COLUMN "transportationNotes" TEXT,
  ADD COLUMN "maximumTravelMiles" INTEGER,
  ADD COLUMN "minimumAge" INTEGER,
  ADD COLUMN "maximumAge" INTEGER,
  ADD COLUMN "acceptedGradeLevels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "minimumGpa" DOUBLE PRECISION,
  ADD COLUMN "residencyRequirement" TEXT,
  ADD COLUMN "citizenshipRequirement" TEXT,
  ADD COLUMN "requiredExperience" TEXT,
  ADD COLUMN "requiredCertifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "parentPermissionRequired" BOOLEAN,
  ADD COLUMN "workAuthorizationRequired" BOOLEAN,
  ADD COLUMN "eligibilityUnknowns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "estimatedApplicationMinutes" INTEGER,
  ADD COLUMN "essayQuestionCount" INTEGER,
  ADD COLUMN "scheduleRequirements" TEXT,
  ADD COLUMN "estimatedWeeklyHours" DOUBLE PRECISION;

ALTER TABLE "Application"
  ADD COLUMN "targetDeadline" TIMESTAMP(3),
  ADD COLUMN "completionPercent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAction" TEXT,
  ADD COLUMN "privateNotes" TEXT,
  ADD COLUMN "submissionConfirmation" TEXT,
  ADD COLUMN "outcomeNotes" TEXT,
  ADD COLUMN "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "SavedOpportunity" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "followReopening" BOOLEAN NOT NULL DEFAULT false,
  "dismissedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SavedOpportunity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationChecklistItem" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "completedAt" TIMESTAMP(3),
  "source" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OpportunityCorrectionReport" (
  "id" TEXT NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "category" "OpportunityCorrectionCategory" NOT NULL,
  "details" TEXT,
  "sourceUrl" TEXT,
  "status" "OpportunityCorrectionStatus" NOT NULL DEFAULT 'OPEN',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpportunityCorrectionReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Opportunity_verificationStatus_idx" ON "Opportunity"("verificationStatus");
CREATE INDEX "Opportunity_availabilityStatus_idx" ON "Opportunity"("availabilityStatus");
CREATE INDEX "Opportunity_relationshipType_idx" ON "Opportunity"("relationshipType");
CREATE INDEX "Opportunity_nextVerificationAt_idx" ON "Opportunity"("nextVerificationAt");
CREATE INDEX "Opportunity_deadline_idx" ON "Opportunity"("deadline");
CREATE INDEX "Opportunity_officialSourceUrl_idx" ON "Opportunity"("officialSourceUrl");
CREATE INDEX "Opportunity_organizationId_title_idx" ON "Opportunity"("organizationId", "title");
CREATE INDEX "Opportunity_verifiedById_idx" ON "Opportunity"("verifiedById");
CREATE UNIQUE INDEX "SavedOpportunity_studentProfileId_opportunityId_key" ON "SavedOpportunity"("studentProfileId", "opportunityId");
CREATE INDEX "SavedOpportunity_opportunityId_idx" ON "SavedOpportunity"("opportunityId");
CREATE INDEX "SavedOpportunity_studentProfileId_updatedAt_idx" ON "SavedOpportunity"("studentProfileId", "updatedAt");
CREATE UNIQUE INDEX "ApplicationChecklistItem_applicationId_label_key" ON "ApplicationChecklistItem"("applicationId", "label");
CREATE INDEX "ApplicationChecklistItem_applicationId_sortOrder_idx" ON "ApplicationChecklistItem"("applicationId", "sortOrder");
CREATE INDEX "OpportunityCorrectionReport_opportunityId_status_idx" ON "OpportunityCorrectionReport"("opportunityId", "status");
CREATE INDEX "OpportunityCorrectionReport_reporterId_idx" ON "OpportunityCorrectionReport"("reporterId");
CREATE INDEX "OpportunityCorrectionReport_reviewedById_idx" ON "OpportunityCorrectionReport"("reviewedById");
CREATE INDEX "OpportunityCorrectionReport_status_createdAt_idx" ON "OpportunityCorrectionReport"("status", "createdAt");

ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedOpportunity" ADD CONSTRAINT "SavedOpportunity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationChecklistItem" ADD CONSTRAINT "ApplicationChecklistItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpportunityCorrectionReport" ADD CONSTRAINT "OpportunityCorrectionReport_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpportunityCorrectionReport" ADD CONSTRAINT "OpportunityCorrectionReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OpportunityCorrectionReport" ADD CONSTRAINT "OpportunityCorrectionReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
