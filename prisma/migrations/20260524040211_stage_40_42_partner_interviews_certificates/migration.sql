-- CreateEnum
CREATE TYPE "InterviewRequestStatus" AS ENUM ('REQUESTED', 'STUDENT_RESPONDED', 'SCHEDULED', 'DECLINED', 'CANCELED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ServiceHourVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'CHANGES_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('NOT_REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'REVOKED');

-- CreateTable
CREATE TABLE "InterviewRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "InterviewRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "meetingLink" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "studentResponseNotes" TEXT,
    "selectedSlotId" TEXT,
    "createdById" TEXT,
    "canceledById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedInterviewSlot" (
    "id" TEXT NOT NULL,
    "interviewRequestId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposedInterviewSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHourRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "partnerOrganizationId" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "verificationStatus" "ServiceHourVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verificationNotes" TEXT,
    "certificateStatus" "CertificateStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "certificateNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceHourRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewRequest_applicationId_idx" ON "InterviewRequest"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewRequest_status_idx" ON "InterviewRequest"("status");

-- CreateIndex
CREATE INDEX "InterviewRequest_selectedSlotId_idx" ON "InterviewRequest"("selectedSlotId");

-- CreateIndex
CREATE INDEX "InterviewRequest_createdById_idx" ON "InterviewRequest"("createdById");

-- CreateIndex
CREATE INDEX "InterviewRequest_canceledById_idx" ON "InterviewRequest"("canceledById");

-- CreateIndex
CREATE INDEX "InterviewRequest_createdAt_idx" ON "InterviewRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ProposedInterviewSlot_interviewRequestId_idx" ON "ProposedInterviewSlot"("interviewRequestId");

-- CreateIndex
CREATE INDEX "ProposedInterviewSlot_startsAt_idx" ON "ProposedInterviewSlot"("startsAt");

-- CreateIndex
CREATE INDEX "ProposedInterviewSlot_selected_idx" ON "ProposedInterviewSlot"("selected");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_applicationId_idx" ON "ServiceHourRecord"("applicationId");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_studentProfileId_idx" ON "ServiceHourRecord"("studentProfileId");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_opportunityId_idx" ON "ServiceHourRecord"("opportunityId");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_partnerOrganizationId_idx" ON "ServiceHourRecord"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_verificationStatus_idx" ON "ServiceHourRecord"("verificationStatus");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_certificateStatus_idx" ON "ServiceHourRecord"("certificateStatus");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_verifiedById_idx" ON "ServiceHourRecord"("verifiedById");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_approvedById_idx" ON "ServiceHourRecord"("approvedById");

-- CreateIndex
CREATE INDEX "ServiceHourRecord_createdAt_idx" ON "ServiceHourRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "InterviewRequest" ADD CONSTRAINT "InterviewRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRequest" ADD CONSTRAINT "InterviewRequest_selectedSlotId_fkey" FOREIGN KEY ("selectedSlotId") REFERENCES "ProposedInterviewSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRequest" ADD CONSTRAINT "InterviewRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRequest" ADD CONSTRAINT "InterviewRequest_canceledById_fkey" FOREIGN KEY ("canceledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedInterviewSlot" ADD CONSTRAINT "ProposedInterviewSlot_interviewRequestId_fkey" FOREIGN KEY ("interviewRequestId") REFERENCES "InterviewRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHourRecord" ADD CONSTRAINT "ServiceHourRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHourRecord" ADD CONSTRAINT "ServiceHourRecord_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHourRecord" ADD CONSTRAINT "ServiceHourRecord_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHourRecord" ADD CONSTRAINT "ServiceHourRecord_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHourRecord" ADD CONSTRAINT "ServiceHourRecord_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHourRecord" ADD CONSTRAINT "ServiceHourRecord_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
