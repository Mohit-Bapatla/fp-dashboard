-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('STUDENT_APPLICATION_EXPERIENCE', 'STUDENT_PLACEMENT_REQUEST', 'PARTNER_APPLICANT_QUALITY', 'PARTNER_REVIEW_USEFULNESS', 'STAFF_MATCH_QUALITY', 'STAFF_PLACEMENT_DIFFICULTY');

-- CreateEnum
CREATE TYPE "FeedbackEntityType" AS ENUM ('APPLICATION', 'OPPORTUNITY', 'PLACEMENT_REQUEST', 'USER');

-- CreateEnum
CREATE TYPE "RecommendationEventType" AS ENUM ('IMPRESSION', 'CLICK', 'APPLICATION', 'SEARCH_RESULTS');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "feedbackType" "FeedbackType" NOT NULL,
    "entityType" "FeedbackEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "opportunityId" TEXT,
    "applicationId" TEXT,
    "eventType" "RecommendationEventType" NOT NULL,
    "source" TEXT NOT NULL,
    "matchScore" INTEGER,
    "searchQuery" TEXT,
    "resultCount" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityAcknowledgement" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "issueKey" TEXT NOT NULL,
    "acknowledgedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataQualityAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_authorId_idx" ON "Feedback"("authorId");

-- CreateIndex
CREATE INDEX "Feedback_feedbackType_idx" ON "Feedback"("feedbackType");

-- CreateIndex
CREATE INDEX "Feedback_entityType_entityId_idx" ON "Feedback"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Feedback_rating_idx" ON "Feedback"("rating");

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_authorId_feedbackType_entityType_entityId_key" ON "Feedback"("authorId", "feedbackType", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "RecommendationEvent_userId_idx" ON "RecommendationEvent"("userId");

-- CreateIndex
CREATE INDEX "RecommendationEvent_opportunityId_idx" ON "RecommendationEvent"("opportunityId");

-- CreateIndex
CREATE INDEX "RecommendationEvent_applicationId_idx" ON "RecommendationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "RecommendationEvent_eventType_idx" ON "RecommendationEvent"("eventType");

-- CreateIndex
CREATE INDEX "RecommendationEvent_source_idx" ON "RecommendationEvent"("source");

-- CreateIndex
CREATE INDEX "RecommendationEvent_createdAt_idx" ON "RecommendationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "DataQualityAcknowledgement_acknowledgedById_idx" ON "DataQualityAcknowledgement"("acknowledgedById");

-- CreateIndex
CREATE INDEX "DataQualityAcknowledgement_entityType_entityId_idx" ON "DataQualityAcknowledgement"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "DataQualityAcknowledgement_issueKey_idx" ON "DataQualityAcknowledgement"("issueKey");

-- CreateIndex
CREATE INDEX "DataQualityAcknowledgement_createdAt_idx" ON "DataQualityAcknowledgement"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DataQualityAcknowledgement_entityType_entityId_issueKey_key" ON "DataQualityAcknowledgement"("entityType", "entityId", "issueKey");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityAcknowledgement" ADD CONSTRAINT "DataQualityAcknowledgement_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
