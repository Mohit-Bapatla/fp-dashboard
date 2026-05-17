-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARTNER', 'STAFF', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('INTERNSHIP', 'SHADOWING', 'RESEARCH', 'VOLUNTEERING', 'MENTORSHIP', 'EVENT', 'PROGRAM');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PlacementRequestStatus" AS ENUM ('NEW', 'ASSIGNED', 'RESEARCHING', 'OUTREACH_IN_PROGRESS', 'PARTNER_CONTACTED', 'WAITING_FOR_PARTNER', 'OPPORTUNITY_FOUND', 'STUDENT_REFERRED', 'PLACED', 'CLOSED');

-- CreateEnum
CREATE TYPE "OutreachTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('NOT_CONTACTED', 'CONTACTED', 'FOLLOW_UP_NEEDED', 'INTERESTED', 'MEETING_SCHEDULED', 'PARTNERED', 'REJECTED', 'NO_RESPONSE', 'PAUSED');

-- CreateEnum
CREATE TYPE "ResumeParseStatus" AS ENUM ('NOT_STARTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "school" TEXT,
    "major" TEXT,
    "graduationYear" INTEGER,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT,
    "parseStatus" "ResumeParseStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "parsedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PartnerStatus" NOT NULL DEFAULT 'NOT_CONTACTED',
    "website" TEXT,
    "description" TEXT,
    "city" TEXT,
    "state" TEXT,
    "healthcareFocus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "OpportunityType" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "location" TEXT,
    "capacity" INTEGER,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "statement" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementRequest" (
    "id" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "partnerOrganizationId" TEXT,
    "requestedById" TEXT,
    "status" "PlacementRequestStatus" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachTask" (
    "id" TEXT NOT NULL,
    "contactId" TEXT,
    "partnerOrganizationId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OutreachTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "userId" TEXT,
    "studentProfileId" TEXT,
    "partnerOrganizationId" TEXT,
    "opportunityId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentProfile_graduationYear_idx" ON "StudentProfile"("graduationYear");

-- CreateIndex
CREATE INDEX "Resume_studentProfileId_idx" ON "Resume"("studentProfileId");

-- CreateIndex
CREATE INDEX "Resume_parseStatus_idx" ON "Resume"("parseStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerOrganization_name_key" ON "PartnerOrganization"("name");

-- CreateIndex
CREATE INDEX "PartnerOrganization_status_idx" ON "PartnerOrganization"("status");

-- CreateIndex
CREATE INDEX "PartnerOrganization_createdAt_idx" ON "PartnerOrganization"("createdAt");

-- CreateIndex
CREATE INDEX "PartnerMember_organizationId_idx" ON "PartnerMember"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerMember_userId_organizationId_key" ON "PartnerMember"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Opportunity_organizationId_idx" ON "Opportunity"("organizationId");

-- CreateIndex
CREATE INDEX "Opportunity_type_idx" ON "Opportunity"("type");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Application_studentProfileId_opportunityId_key" ON "Application"("studentProfileId", "opportunityId");

-- CreateIndex
CREATE INDEX "PlacementRequest_studentProfileId_idx" ON "PlacementRequest"("studentProfileId");

-- CreateIndex
CREATE INDEX "PlacementRequest_opportunityId_idx" ON "PlacementRequest"("opportunityId");

-- CreateIndex
CREATE INDEX "PlacementRequest_partnerOrganizationId_idx" ON "PlacementRequest"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "PlacementRequest_requestedById_idx" ON "PlacementRequest"("requestedById");

-- CreateIndex
CREATE INDEX "PlacementRequest_status_idx" ON "PlacementRequest"("status");

-- CreateIndex
CREATE INDEX "PlacementRequest_createdAt_idx" ON "PlacementRequest"("createdAt");

-- CreateIndex
CREATE INDEX "OutreachContact_organizationId_idx" ON "OutreachContact"("organizationId");

-- CreateIndex
CREATE INDEX "OutreachContact_email_idx" ON "OutreachContact"("email");

-- CreateIndex
CREATE INDEX "OutreachTask_contactId_idx" ON "OutreachTask"("contactId");

-- CreateIndex
CREATE INDEX "OutreachTask_partnerOrganizationId_idx" ON "OutreachTask"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "OutreachTask_assignedToId_idx" ON "OutreachTask"("assignedToId");

-- CreateIndex
CREATE INDEX "OutreachTask_createdById_idx" ON "OutreachTask"("createdById");

-- CreateIndex
CREATE INDEX "OutreachTask_status_idx" ON "OutreachTask"("status");

-- CreateIndex
CREATE INDEX "OutreachTask_dueAt_idx" ON "OutreachTask"("dueAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_readAt_idx" ON "Notification"("readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AdminNote_authorId_idx" ON "AdminNote"("authorId");

-- CreateIndex
CREATE INDEX "AdminNote_userId_idx" ON "AdminNote"("userId");

-- CreateIndex
CREATE INDEX "AdminNote_studentProfileId_idx" ON "AdminNote"("studentProfileId");

-- CreateIndex
CREATE INDEX "AdminNote_partnerOrganizationId_idx" ON "AdminNote"("partnerOrganizationId");

-- CreateIndex
CREATE INDEX "AdminNote_opportunityId_idx" ON "AdminNote"("opportunityId");

-- CreateIndex
CREATE INDEX "AdminNote_createdAt_idx" ON "AdminNote"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerMember" ADD CONSTRAINT "PartnerMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "PartnerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "PartnerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementRequest" ADD CONSTRAINT "PlacementRequest_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementRequest" ADD CONSTRAINT "PlacementRequest_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementRequest" ADD CONSTRAINT "PlacementRequest_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementRequest" ADD CONSTRAINT "PlacementRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachContact" ADD CONSTRAINT "OutreachContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "PartnerOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "OutreachContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_partnerOrganizationId_fkey" FOREIGN KEY ("partnerOrganizationId") REFERENCES "PartnerOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
