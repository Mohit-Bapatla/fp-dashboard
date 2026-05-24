-- CreateEnum
CREATE TYPE "ProgramEventType" AS ENUM ('SEMINAR', 'WORKSHOP', 'PANEL', 'VOLUNTEERING', 'NETWORKING', 'FUNDRAISER', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgramEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventRegistrationStatus" AS ENUM ('REGISTERED', 'WAITLISTED', 'CANCELED', 'ATTENDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SponsorStatus" AS ENUM ('PROSPECT', 'CONTACTED', 'IN_DISCUSSION', 'COMMITTED', 'ACTIVE', 'DECLINED', 'PAUSED', 'PAST');

-- CreateEnum
CREATE TYPE "SponsorshipCampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SponsorshipCommitmentStatus" AS ENUM ('PLEDGED', 'COMMITTED', 'RECEIVED', 'CANCELED', 'DECLINED');

-- CreateEnum
CREATE TYPE "SponsorDeliverableType" AS ENUM ('LOGO_PLACEMENT', 'EVENT_MENTION', 'NEWSLETTER_MENTION', 'SOCIAL_POST', 'THANK_YOU_EMAIL', 'OTHER');

-- CreateEnum
CREATE TYPE "SponsorDeliverableStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'WAIVED');

-- CreateEnum
CREATE TYPE "SponsorInteractionType" AS ENUM ('NOTE', 'EMAIL', 'CALL', 'MEETING', 'FOLLOW_UP');

-- CreateTable
CREATE TABLE "ProgramEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "ProgramEventType" NOT NULL DEFAULT 'OTHER',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "virtualLink" TEXT,
    "capacity" INTEGER,
    "registrationDeadline" TIMESTAMP(3),
    "status" "ProgramEventStatus" NOT NULL DEFAULT 'DRAFT',
    "speakerNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "status" "EventRegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "attendedAt" TIMESTAMP(3),
    "checkedInById" TEXT,
    "certificateStatus" "CertificateStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SponsorStatus" NOT NULL DEFAULT 'PROSPECT',
    "website" TEXT,
    "description" TEXT,
    "location" TEXT,
    "contactEmail" TEXT,
    "donationUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorContact" (
    "id" TEXT NOT NULL,
    "sponsorOrganizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goalAmountCents" INTEGER,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "status" "SponsorshipCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorshipCommitment" (
    "id" TEXT NOT NULL,
    "sponsorOrganizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amountCents" INTEGER,
    "status" "SponsorshipCommitmentStatus" NOT NULL DEFAULT 'PLEDGED',
    "committedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorshipCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorDeliverable" (
    "id" TEXT NOT NULL,
    "commitmentId" TEXT NOT NULL,
    "type" "SponsorDeliverableType" NOT NULL,
    "status" "SponsorDeliverableStatus" NOT NULL DEFAULT 'TODO',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorDeliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorInteraction" (
    "id" TEXT NOT NULL,
    "sponsorOrganizationId" TEXT NOT NULL,
    "contactId" TEXT,
    "authorId" TEXT,
    "type" "SponsorInteractionType" NOT NULL DEFAULT 'NOTE',
    "body" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgramEvent_status_idx" ON "ProgramEvent"("status");

-- CreateIndex
CREATE INDEX "ProgramEvent_eventType_idx" ON "ProgramEvent"("eventType");

-- CreateIndex
CREATE INDEX "ProgramEvent_startAt_idx" ON "ProgramEvent"("startAt");

-- CreateIndex
CREATE INDEX "ProgramEvent_registrationDeadline_idx" ON "ProgramEvent"("registrationDeadline");

-- CreateIndex
CREATE INDEX "ProgramEvent_createdById_idx" ON "ProgramEvent"("createdById");

-- CreateIndex
CREATE INDEX "EventRegistration_eventId_idx" ON "EventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "EventRegistration_studentProfileId_idx" ON "EventRegistration"("studentProfileId");

-- CreateIndex
CREATE INDEX "EventRegistration_status_idx" ON "EventRegistration"("status");

-- CreateIndex
CREATE INDEX "EventRegistration_checkedInById_idx" ON "EventRegistration"("checkedInById");

-- CreateIndex
CREATE INDEX "EventRegistration_createdAt_idx" ON "EventRegistration"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventRegistration_eventId_studentProfileId_key" ON "EventRegistration"("eventId", "studentProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "SponsorOrganization_name_key" ON "SponsorOrganization"("name");

-- CreateIndex
CREATE INDEX "SponsorOrganization_status_idx" ON "SponsorOrganization"("status");

-- CreateIndex
CREATE INDEX "SponsorOrganization_contactEmail_idx" ON "SponsorOrganization"("contactEmail");

-- CreateIndex
CREATE INDEX "SponsorOrganization_createdAt_idx" ON "SponsorOrganization"("createdAt");

-- CreateIndex
CREATE INDEX "SponsorContact_sponsorOrganizationId_idx" ON "SponsorContact"("sponsorOrganizationId");

-- CreateIndex
CREATE INDEX "SponsorContact_email_idx" ON "SponsorContact"("email");

-- CreateIndex
CREATE INDEX "SponsorContact_nextFollowUpAt_idx" ON "SponsorContact"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "SponsorshipCampaign_status_idx" ON "SponsorshipCampaign"("status");

-- CreateIndex
CREATE INDEX "SponsorshipCampaign_startAt_idx" ON "SponsorshipCampaign"("startAt");

-- CreateIndex
CREATE INDEX "SponsorshipCampaign_endAt_idx" ON "SponsorshipCampaign"("endAt");

-- CreateIndex
CREATE INDEX "SponsorshipCampaign_createdAt_idx" ON "SponsorshipCampaign"("createdAt");

-- CreateIndex
CREATE INDEX "SponsorshipCommitment_sponsorOrganizationId_idx" ON "SponsorshipCommitment"("sponsorOrganizationId");

-- CreateIndex
CREATE INDEX "SponsorshipCommitment_campaignId_idx" ON "SponsorshipCommitment"("campaignId");

-- CreateIndex
CREATE INDEX "SponsorshipCommitment_status_idx" ON "SponsorshipCommitment"("status");

-- CreateIndex
CREATE INDEX "SponsorshipCommitment_committedAt_idx" ON "SponsorshipCommitment"("committedAt");

-- CreateIndex
CREATE INDEX "SponsorshipCommitment_receivedAt_idx" ON "SponsorshipCommitment"("receivedAt");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_commitmentId_idx" ON "SponsorDeliverable"("commitmentId");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_type_idx" ON "SponsorDeliverable"("type");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_status_idx" ON "SponsorDeliverable"("status");

-- CreateIndex
CREATE INDEX "SponsorDeliverable_dueAt_idx" ON "SponsorDeliverable"("dueAt");

-- CreateIndex
CREATE INDEX "SponsorInteraction_sponsorOrganizationId_idx" ON "SponsorInteraction"("sponsorOrganizationId");

-- CreateIndex
CREATE INDEX "SponsorInteraction_contactId_idx" ON "SponsorInteraction"("contactId");

-- CreateIndex
CREATE INDEX "SponsorInteraction_authorId_idx" ON "SponsorInteraction"("authorId");

-- CreateIndex
CREATE INDEX "SponsorInteraction_type_idx" ON "SponsorInteraction"("type");

-- CreateIndex
CREATE INDEX "SponsorInteraction_occurredAt_idx" ON "SponsorInteraction"("occurredAt");

-- AddForeignKey
ALTER TABLE "ProgramEvent" ADD CONSTRAINT "ProgramEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ProgramEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRegistration" ADD CONSTRAINT "EventRegistration_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorContact" ADD CONSTRAINT "SponsorContact_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "SponsorOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipCommitment" ADD CONSTRAINT "SponsorshipCommitment_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "SponsorOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorshipCommitment" ADD CONSTRAINT "SponsorshipCommitment_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "SponsorshipCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorDeliverable" ADD CONSTRAINT "SponsorDeliverable_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "SponsorshipCommitment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorInteraction" ADD CONSTRAINT "SponsorInteraction_sponsorOrganizationId_fkey" FOREIGN KEY ("sponsorOrganizationId") REFERENCES "SponsorOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorInteraction" ADD CONSTRAINT "SponsorInteraction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "SponsorContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorInteraction" ADD CONSTRAINT "SponsorInteraction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
