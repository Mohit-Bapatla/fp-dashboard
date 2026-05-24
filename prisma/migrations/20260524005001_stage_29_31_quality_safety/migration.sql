-- CreateEnum
CREATE TYPE "ApplicationOnboardingItemStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'APPROVED', 'NEEDS_CHANGES', 'WAIVED');

-- CreateEnum
CREATE TYPE "RecordCommentEntityType" AS ENUM ('APPLICATION', 'PLACEMENT_REQUEST', 'OUTREACH_TASK');

-- CreateEnum
CREATE TYPE "RecordCommentVisibility" AS ENUM ('INTERNAL', 'PARTNER_VISIBLE', 'STUDENT_VISIBLE');

-- CreateEnum
CREATE TYPE "PartnerVerificationStatus" AS ENUM ('UNVERIFIED', 'IN_REVIEW', 'VERIFIED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "moderationFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "moderationNotes" TEXT;

-- AlterTable
ALTER TABLE "PartnerOrganization" ADD COLUMN     "verificationChecklist" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "verificationNotes" TEXT,
ADD COLUMN     "verificationStatus" "PartnerVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT;

-- CreateTable
CREATE TABLE "ApplicationOnboardingItem" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ApplicationOnboardingItemStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "studentNotes" TEXT,
    "reviewerNotes" TEXT,
    "dueAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationOnboardingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordComment" (
    "id" TEXT NOT NULL,
    "entityType" "RecordCommentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT,
    "visibility" "RecordCommentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecordComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationOnboardingItem_applicationId_idx" ON "ApplicationOnboardingItem"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationOnboardingItem_status_idx" ON "ApplicationOnboardingItem"("status");

-- CreateIndex
CREATE INDEX "ApplicationOnboardingItem_reviewerId_idx" ON "ApplicationOnboardingItem"("reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationOnboardingItem_applicationId_title_key" ON "ApplicationOnboardingItem"("applicationId", "title");

-- CreateIndex
CREATE INDEX "RecordComment_authorId_idx" ON "RecordComment"("authorId");

-- CreateIndex
CREATE INDEX "RecordComment_entityType_entityId_idx" ON "RecordComment"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RecordComment_visibility_idx" ON "RecordComment"("visibility");

-- CreateIndex
CREATE INDEX "RecordComment_createdAt_idx" ON "RecordComment"("createdAt");

-- CreateIndex
CREATE INDEX "Opportunity_moderatedById_idx" ON "Opportunity"("moderatedById");

-- CreateIndex
CREATE INDEX "PartnerOrganization_verificationStatus_idx" ON "PartnerOrganization"("verificationStatus");

-- AddForeignKey
ALTER TABLE "PartnerOrganization" ADD CONSTRAINT "PartnerOrganization_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOnboardingItem" ADD CONSTRAINT "ApplicationOnboardingItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationOnboardingItem" ADD CONSTRAINT "ApplicationOnboardingItem_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordComment" ADD CONSTRAINT "RecordComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
