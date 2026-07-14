-- Additive data foundations for reusable student application profiles,
-- focused answer drafting, and private post-submission follow-through.
-- No prompt or generated output content is stored in AiGenerationRecord;
-- private narrative content remains in its owner-scoped domain record.

CREATE TYPE "StudentExperienceType" AS ENUM (
  'EMPLOYMENT',
  'VOLUNTEERING',
  'LEADERSHIP',
  'RESEARCH',
  'CLUB',
  'PROJECT',
  'COMMUNITY_SERVICE',
  'AWARD',
  'CERTIFICATION',
  'OTHER'
);

CREATE TYPE "StudentExperienceSource" AS ENUM ('STUDENT_ENTERED', 'RESUME_IMPORT', 'DATA_IMPORT');

CREATE TYPE "StudentStoryCategory" AS ENUM (
  'WHY_HEALTHCARE',
  'SERVICE',
  'LEADERSHIP',
  'TEAMWORK',
  'CHALLENGE',
  'PROBLEM_SOLVING',
  'COMMUNITY_IMPACT',
  'CAREER_GOALS',
  'RESEARCH_INTEREST',
  'DIVERSITY_OF_PERSPECTIVE',
  'LEARNING_GOAL',
  'OTHER'
);

CREATE TYPE "StudentStoryApprovalStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'APPROVED');
CREATE TYPE "ResumePurpose" AS ENUM ('GENERAL', 'RESEARCH', 'VOLUNTEERING', 'PUBLIC_HEALTH', 'LEADERSHIP', 'CUSTOM');
CREATE TYPE "StudentDocumentType" AS ENUM ('TRANSCRIPT', 'CERTIFICATION', 'PARENT_CONSENT', 'RECOMMENDATION_LETTER', 'PORTFOLIO', 'OTHER');
CREATE TYPE "StudentDocumentStatus" AS ENUM ('NOT_STARTED', 'REQUESTED', 'READY', 'UPLOADED', 'SUBMITTED_EXTERNALLY');
CREATE TYPE "ApplicationRecommendationStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'CONFIRMED', 'SUBMITTED', 'DECLINED', 'NO_LONGER_NEEDED');
CREATE TYPE "ApplicationQuestionSource" AS ENUM ('STUDENT_ENTERED', 'OPPORTUNITY_REQUIREMENT', 'IMPORTED', 'AI_SUGGESTED');
CREATE TYPE "ApplicationAnswerVersionSource" AS ENUM ('STUDENT', 'AI_DRAFT', 'AI_REVISION', 'IMPORTED', 'FINAL_APPROVED');
CREATE TYPE "ApplicationAnswerAuthor" AS ENUM ('STUDENT', 'AI', 'SYSTEM');
CREATE TYPE "ApplicationAnswerApprovalStatus" AS ENUM ('DRAFT', 'NEEDS_REVIEW', 'APPROVED', 'SUBMITTED');
CREATE TYPE "ApplicationInterviewStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW');
CREATE TYPE "ApplicationOutcomeType" AS ENUM ('ACCEPTED', 'WAITLISTED', 'REJECTED', 'WITHDRAWN', 'NO_RESPONSE', 'STILL_WAITING');
CREATE TYPE "ApplicationOutcomeModerationStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "ApplicationActivityType" AS ENUM (
  'WORKSPACE_STARTED',
  'STATUS_CHANGED',
  'TASK_STATUS_CHANGED',
  'RESUME_SELECTED',
  'EXPERIENCE_SELECTED',
  'ANSWER_VERSION_CREATED',
  'ANSWER_APPROVED',
  'RECOMMENDATION_STATUS_CHANGED',
  'SUBMITTED',
  'INTERVIEW_REPORTED',
  'OUTCOME_REPORTED',
  'CUSTOM'
);
CREATE TYPE "AiGenerationPurpose" AS ENUM (
  'STORY_DRAFT',
  'ANSWER_OUTLINE',
  'ANSWER_DRAFT',
  'ANSWER_REVISION',
  'RESUME_RECOMMENDATION',
  'INTERVIEW_QUESTIONS',
  'THANK_YOU_DRAFT',
  'OTHER'
);
CREATE TYPE "AiGenerationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELED');

ALTER TABLE "StudentProfile"
  ADD COLUMN "preferredName" TEXT,
  ADD COLUMN "legalName" TEXT,
  ADD COLUMN "phone" TEXT;

ALTER TABLE "Resume"
  ADD COLUMN "label" TEXT,
  ADD COLUMN "purpose" "ResumePurpose" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "customPurpose" TEXT,
  ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "duplicatedFromId" TEXT;

CREATE TABLE "StudentExperience" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "type" "StudentExperienceType" NOT NULL,
  "organization" TEXT,
  "roleTitle" TEXT,
  "startDate" DATE,
  "endDate" DATE,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "city" TEXT,
  "state" TEXT,
  "hoursPerWeek" DOUBLE PRECISION,
  "totalHours" DOUBLE PRECISION,
  "description" TEXT,
  "responsibilities" TEXT,
  "accomplishments" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "studentEnteredFacts" JSONB,
  "aiSuggestedText" TEXT,
  "studentApprovedText" TEXT,
  "factsConfirmedAt" TIMESTAMP(3),
  "studentApprovedTextAt" TIMESTAMP(3),
  "source" "StudentExperienceSource" NOT NULL DEFAULT 'STUDENT_ENTERED',
  "archivedAt" TIMESTAMP(3),
  "duplicatedFromId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationExperience" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "studentExperienceId" TEXT NOT NULL,
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentStory" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "category" "StudentStoryCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "factualNotes" TEXT,
  "studentDraft" TEXT,
  "aiDraft" TEXT,
  "approvedVersion" TEXT,
  "approvalStatus" "StudentStoryApprovalStatus" NOT NULL DEFAULT 'DRAFT',
  "aiDraftGeneratedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "duplicatedFromId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentStory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentStoryExperience" (
  "id" TEXT NOT NULL,
  "studentStoryId" TEXT NOT NULL,
  "studentExperienceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentStoryExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentDocument" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "applicationId" TEXT,
  "type" "StudentDocumentType" NOT NULL,
  "label" TEXT NOT NULL,
  "status" "StudentDocumentStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "requestedAt" TIMESTAMP(3),
  "readyAt" TIMESTAMP(3),
  "uploadedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "statusUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationContact" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "organization" TEXT,
  "relationship" TEXT,
  "privateNotes" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecommendationContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationRecommendation" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "recommendationContactId" TEXT NOT NULL,
  "status" "ApplicationRecommendationStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  "requestedAt" TIMESTAMP(3),
  "requestMessageSentAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "dueAt" DATE,
  "lastReminderAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationRecommendation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationQuestion" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "wordLimit" INTEGER,
  "characterLimit" INTEGER,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "source" "ApplicationQuestionSource" NOT NULL DEFAULT 'STUDENT_ENTERED',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationAnswer" (
  "id" TEXT NOT NULL,
  "applicationQuestionId" TEXT NOT NULL,
  "approvalStatus" "ApplicationAnswerApprovalStatus" NOT NULL DEFAULT 'DRAFT',
  "approvedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationAnswer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationAnswerVersion" (
  "id" TEXT NOT NULL,
  "applicationAnswerId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "source" "ApplicationAnswerVersionSource" NOT NULL,
  "createdBy" "ApplicationAnswerAuthor" NOT NULL,
  "wordCount" INTEGER,
  "characterCount" INTEGER,
  "factualBasisFingerprint" TEXT,
  "basisCapturedAt" TIMESTAMP(3),
  "promptTemplateKey" TEXT,
  "promptTemplateVersion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationAnswerVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationAnswerVersionExperience" (
  "id" TEXT NOT NULL,
  "applicationAnswerVersionId" TEXT NOT NULL,
  "studentExperienceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationAnswerVersionExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationAnswerVersionStory" (
  "id" TEXT NOT NULL,
  "applicationAnswerVersionId" TEXT NOT NULL,
  "studentStoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationAnswerVersionStory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationInterviewPreparation" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "roundLabel" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "durationMinutes" INTEGER,
  "format" TEXT,
  "location" TEXT,
  "meetingUrl" TEXT,
  "interviewerNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "ApplicationInterviewStatus" NOT NULL DEFAULT 'REQUESTED',
  "preparationNotes" TEXT,
  "practiceNotes" TEXT,
  "likelyQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "questionsToAsk" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "thankYouDraft" TEXT,
  "thankYouSentAt" TIMESTAMP(3),
  "followUpAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationInterviewPreparation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationOutcomeReport" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "outcome" "ApplicationOutcomeType" NOT NULL,
  "interviewReceived" BOOLEAN,
  "interviewFormat" TEXT,
  "applicationMinutes" INTEGER,
  "questionsAsked" TEXT,
  "whatHelped" TEXT,
  "wishKnown" TEXT,
  "privateLessons" TEXT,
  "recommendProgram" BOOLEAN,
  "allowAnonymousAggregateUse" BOOLEAN NOT NULL DEFAULT false,
  "aggregateConsentAt" TIMESTAMP(3),
  "moderationStatus" "ApplicationOutcomeModerationStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  "moderatedById" TEXT,
  "moderatedAt" TIMESTAMP(3),
  "moderationNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationOutcomeReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationActivity" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "eventType" "ApplicationActivityType" NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'SYSTEM',
  "actorUserId" TEXT,
  "relatedEntityType" TEXT,
  "relatedEntityId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiGenerationRecord" (
  "id" TEXT NOT NULL,
  "studentProfileId" TEXT NOT NULL,
  "applicationId" TEXT,
  "studentStoryId" TEXT,
  "applicationQuestionId" TEXT,
  "applicationAnswerVersionId" TEXT,
  "applicationInterviewId" TEXT,
  "purpose" "AiGenerationPurpose" NOT NULL,
  "status" "AiGenerationStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "promptTemplateKey" TEXT NOT NULL,
  "promptTemplateVersion" TEXT NOT NULL,
  "safetyPolicyVersion" TEXT NOT NULL,
  "approvedFactsOnly" BOOLEAN NOT NULL DEFAULT true,
  "externalContentIncluded" BOOLEAN NOT NULL DEFAULT false,
  "externalContentSanitized" BOOLEAN NOT NULL DEFAULT false,
  "inputTokenCount" INTEGER,
  "outputTokenCount" INTEGER,
  "errorCode" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiGenerationRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiGenerationExperience" (
  "id" TEXT NOT NULL,
  "aiGenerationId" TEXT NOT NULL,
  "studentExperienceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiGenerationExperience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiGenerationStory" (
  "id" TEXT NOT NULL,
  "aiGenerationId" TEXT NOT NULL,
  "studentStoryId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiGenerationStory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Resume_studentProfileId_archivedAt_idx" ON "Resume"("studentProfileId", "archivedAt");
CREATE INDEX "Resume_studentProfileId_isDefault_idx" ON "Resume"("studentProfileId", "isDefault");
CREATE INDEX "Resume_duplicatedFromId_idx" ON "Resume"("duplicatedFromId");

CREATE INDEX "StudentExperience_studentProfileId_archivedAt_idx" ON "StudentExperience"("studentProfileId", "archivedAt");
CREATE INDEX "StudentExperience_studentProfileId_type_idx" ON "StudentExperience"("studentProfileId", "type");
CREATE INDEX "StudentExperience_duplicatedFromId_idx" ON "StudentExperience"("duplicatedFromId");
CREATE INDEX "StudentExperience_createdAt_idx" ON "StudentExperience"("createdAt");

CREATE INDEX "ApplicationExperience_applicationId_selectedAt_idx" ON "ApplicationExperience"("applicationId", "selectedAt");
CREATE INDEX "ApplicationExperience_studentExperienceId_idx" ON "ApplicationExperience"("studentExperienceId");
CREATE UNIQUE INDEX "ApplicationExperience_applicationId_studentExperienceId_key" ON "ApplicationExperience"("applicationId", "studentExperienceId");

CREATE INDEX "StudentStory_studentProfileId_archivedAt_idx" ON "StudentStory"("studentProfileId", "archivedAt");
CREATE INDEX "StudentStory_studentProfileId_category_idx" ON "StudentStory"("studentProfileId", "category");
CREATE INDEX "StudentStory_studentProfileId_approvalStatus_idx" ON "StudentStory"("studentProfileId", "approvalStatus");
CREATE INDEX "StudentStory_duplicatedFromId_idx" ON "StudentStory"("duplicatedFromId");
CREATE INDEX "StudentStory_createdAt_idx" ON "StudentStory"("createdAt");

CREATE INDEX "StudentStoryExperience_studentStoryId_idx" ON "StudentStoryExperience"("studentStoryId");
CREATE INDEX "StudentStoryExperience_studentExperienceId_idx" ON "StudentStoryExperience"("studentExperienceId");
CREATE UNIQUE INDEX "StudentStoryExperience_studentStoryId_studentExperienceId_key" ON "StudentStoryExperience"("studentStoryId", "studentExperienceId");

CREATE INDEX "StudentDocument_studentProfileId_status_idx" ON "StudentDocument"("studentProfileId", "status");
CREATE INDEX "StudentDocument_studentProfileId_type_idx" ON "StudentDocument"("studentProfileId", "type");
CREATE INDEX "StudentDocument_applicationId_status_idx" ON "StudentDocument"("applicationId", "status");

CREATE INDEX "RecommendationContact_studentProfileId_archivedAt_idx" ON "RecommendationContact"("studentProfileId", "archivedAt");
CREATE INDEX "RecommendationContact_studentProfileId_email_idx" ON "RecommendationContact"("studentProfileId", "email");
CREATE INDEX "RecommendationContact_createdAt_idx" ON "RecommendationContact"("createdAt");

CREATE INDEX "ApplicationRecommendation_applicationId_status_idx" ON "ApplicationRecommendation"("applicationId", "status");
CREATE INDEX "ApplicationRecommendation_recommendationContactId_idx" ON "ApplicationRecommendation"("recommendationContactId");
CREATE INDEX "ApplicationRecommendation_status_dueAt_idx" ON "ApplicationRecommendation"("status", "dueAt");
CREATE UNIQUE INDEX "ApplicationRecommendation_applicationId_recommendationConta_key" ON "ApplicationRecommendation"("applicationId", "recommendationContactId");

CREATE INDEX "ApplicationQuestion_applicationId_sortOrder_idx" ON "ApplicationQuestion"("applicationId", "sortOrder");
CREATE INDEX "ApplicationQuestion_applicationId_required_idx" ON "ApplicationQuestion"("applicationId", "required");

CREATE UNIQUE INDEX "ApplicationAnswer_applicationQuestionId_key" ON "ApplicationAnswer"("applicationQuestionId");
CREATE INDEX "ApplicationAnswer_approvalStatus_idx" ON "ApplicationAnswer"("approvalStatus");
CREATE INDEX "ApplicationAnswer_createdAt_idx" ON "ApplicationAnswer"("createdAt");

CREATE INDEX "ApplicationAnswerVersion_applicationAnswerId_createdAt_idx" ON "ApplicationAnswerVersion"("applicationAnswerId", "createdAt");
CREATE INDEX "ApplicationAnswerVersion_source_idx" ON "ApplicationAnswerVersion"("source");

CREATE INDEX "ApplicationAnswerVersionExperience_applicationAnswerVersion_idx" ON "ApplicationAnswerVersionExperience"("applicationAnswerVersionId");
CREATE INDEX "ApplicationAnswerVersionExperience_studentExperienceId_idx" ON "ApplicationAnswerVersionExperience"("studentExperienceId");
CREATE UNIQUE INDEX "ApplicationAnswerVersionExperience_applicationAnswerVersion_key" ON "ApplicationAnswerVersionExperience"("applicationAnswerVersionId", "studentExperienceId");

CREATE INDEX "ApplicationAnswerVersionStory_applicationAnswerVersionId_idx" ON "ApplicationAnswerVersionStory"("applicationAnswerVersionId");
CREATE INDEX "ApplicationAnswerVersionStory_studentStoryId_idx" ON "ApplicationAnswerVersionStory"("studentStoryId");
CREATE UNIQUE INDEX "ApplicationAnswerVersionStory_applicationAnswerVersionId_st_key" ON "ApplicationAnswerVersionStory"("applicationAnswerVersionId", "studentStoryId");

CREATE INDEX "ApplicationInterviewPreparation_applicationId_scheduledAt_idx" ON "ApplicationInterviewPreparation"("applicationId", "scheduledAt");
CREATE INDEX "ApplicationInterviewPreparation_status_scheduledAt_idx" ON "ApplicationInterviewPreparation"("status", "scheduledAt");
CREATE INDEX "ApplicationInterviewPreparation_followUpAt_idx" ON "ApplicationInterviewPreparation"("followUpAt");

CREATE UNIQUE INDEX "ApplicationOutcomeReport_applicationId_key" ON "ApplicationOutcomeReport"("applicationId");
CREATE INDEX "ApplicationOutcomeReport_outcome_createdAt_idx" ON "ApplicationOutcomeReport"("outcome", "createdAt");
CREATE INDEX "ApplicationOutcomeReport_allowAnonymousAggregateUse_moderat_idx" ON "ApplicationOutcomeReport"("allowAnonymousAggregateUse", "moderationStatus");
CREATE INDEX "ApplicationOutcomeReport_moderatedById_idx" ON "ApplicationOutcomeReport"("moderatedById");

CREATE INDEX "ApplicationActivity_applicationId_occurredAt_idx" ON "ApplicationActivity"("applicationId", "occurredAt");
CREATE INDEX "ApplicationActivity_applicationId_eventType_idx" ON "ApplicationActivity"("applicationId", "eventType");
CREATE INDEX "ApplicationActivity_actorUserId_idx" ON "ApplicationActivity"("actorUserId");
CREATE INDEX "ApplicationActivity_eventType_occurredAt_idx" ON "ApplicationActivity"("eventType", "occurredAt");

CREATE UNIQUE INDEX "AiGenerationRecord_applicationAnswerVersionId_key" ON "AiGenerationRecord"("applicationAnswerVersionId");
CREATE INDEX "AiGenerationRecord_studentProfileId_createdAt_idx" ON "AiGenerationRecord"("studentProfileId", "createdAt");
CREATE INDEX "AiGenerationRecord_applicationId_createdAt_idx" ON "AiGenerationRecord"("applicationId", "createdAt");
CREATE INDEX "AiGenerationRecord_studentStoryId_idx" ON "AiGenerationRecord"("studentStoryId");
CREATE INDEX "AiGenerationRecord_applicationQuestionId_idx" ON "AiGenerationRecord"("applicationQuestionId");
CREATE INDEX "AiGenerationRecord_applicationInterviewId_idx" ON "AiGenerationRecord"("applicationInterviewId");
CREATE INDEX "AiGenerationRecord_purpose_status_idx" ON "AiGenerationRecord"("purpose", "status");
CREATE INDEX "AiGenerationRecord_status_createdAt_idx" ON "AiGenerationRecord"("status", "createdAt");

CREATE INDEX "AiGenerationExperience_aiGenerationId_idx" ON "AiGenerationExperience"("aiGenerationId");
CREATE INDEX "AiGenerationExperience_studentExperienceId_idx" ON "AiGenerationExperience"("studentExperienceId");
CREATE UNIQUE INDEX "AiGenerationExperience_aiGenerationId_studentExperienceId_key" ON "AiGenerationExperience"("aiGenerationId", "studentExperienceId");

CREATE INDEX "AiGenerationStory_aiGenerationId_idx" ON "AiGenerationStory"("aiGenerationId");
CREATE INDEX "AiGenerationStory_studentStoryId_idx" ON "AiGenerationStory"("studentStoryId");
CREATE UNIQUE INDEX "AiGenerationStory_aiGenerationId_studentStoryId_key" ON "AiGenerationStory"("aiGenerationId", "studentStoryId");

ALTER TABLE "Resume"
  ADD CONSTRAINT "Resume_duplicatedFromId_fkey"
  FOREIGN KEY ("duplicatedFromId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentExperience"
  ADD CONSTRAINT "StudentExperience_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentExperience"
  ADD CONSTRAINT "StudentExperience_duplicatedFromId_fkey"
  FOREIGN KEY ("duplicatedFromId") REFERENCES "StudentExperience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApplicationExperience"
  ADD CONSTRAINT "ApplicationExperience_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationExperience"
  ADD CONSTRAINT "ApplicationExperience_studentExperienceId_fkey"
  FOREIGN KEY ("studentExperienceId") REFERENCES "StudentExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentStory"
  ADD CONSTRAINT "StudentStory_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStory"
  ADD CONSTRAINT "StudentStory_duplicatedFromId_fkey"
  FOREIGN KEY ("duplicatedFromId") REFERENCES "StudentStory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentStoryExperience"
  ADD CONSTRAINT "StudentStoryExperience_studentStoryId_fkey"
  FOREIGN KEY ("studentStoryId") REFERENCES "StudentStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentStoryExperience"
  ADD CONSTRAINT "StudentStoryExperience_studentExperienceId_fkey"
  FOREIGN KEY ("studentExperienceId") REFERENCES "StudentExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentDocument"
  ADD CONSTRAINT "StudentDocument_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentDocument"
  ADD CONSTRAINT "StudentDocument_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RecommendationContact"
  ADD CONSTRAINT "RecommendationContact_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationRecommendation"
  ADD CONSTRAINT "ApplicationRecommendation_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationRecommendation"
  ADD CONSTRAINT "ApplicationRecommendation_recommendationContactId_fkey"
  FOREIGN KEY ("recommendationContactId") REFERENCES "RecommendationContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationQuestion"
  ADD CONSTRAINT "ApplicationQuestion_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationAnswer"
  ADD CONSTRAINT "ApplicationAnswer_applicationQuestionId_fkey"
  FOREIGN KEY ("applicationQuestionId") REFERENCES "ApplicationQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationAnswerVersion"
  ADD CONSTRAINT "ApplicationAnswerVersion_applicationAnswerId_fkey"
  FOREIGN KEY ("applicationAnswerId") REFERENCES "ApplicationAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationAnswerVersionExperience"
  ADD CONSTRAINT "ApplicationAnswerVersionExperience_applicationAnswerVersio_fkey"
  FOREIGN KEY ("applicationAnswerVersionId") REFERENCES "ApplicationAnswerVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationAnswerVersionExperience"
  ADD CONSTRAINT "ApplicationAnswerVersionExperience_studentExperienceId_fkey"
  FOREIGN KEY ("studentExperienceId") REFERENCES "StudentExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationAnswerVersionStory"
  ADD CONSTRAINT "ApplicationAnswerVersionStory_applicationAnswerVersionId_fkey"
  FOREIGN KEY ("applicationAnswerVersionId") REFERENCES "ApplicationAnswerVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationAnswerVersionStory"
  ADD CONSTRAINT "ApplicationAnswerVersionStory_studentStoryId_fkey"
  FOREIGN KEY ("studentStoryId") REFERENCES "StudentStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationInterviewPreparation"
  ADD CONSTRAINT "ApplicationInterviewPreparation_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ApplicationOutcomeReport"
  ADD CONSTRAINT "ApplicationOutcomeReport_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationOutcomeReport"
  ADD CONSTRAINT "ApplicationOutcomeReport_moderatedById_fkey"
  FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ApplicationActivity"
  ADD CONSTRAINT "ApplicationActivity_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationActivity"
  ADD CONSTRAINT "ApplicationActivity_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiGenerationRecord"
  ADD CONSTRAINT "AiGenerationRecord_studentProfileId_fkey"
  FOREIGN KEY ("studentProfileId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationRecord"
  ADD CONSTRAINT "AiGenerationRecord_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationRecord"
  ADD CONSTRAINT "AiGenerationRecord_studentStoryId_fkey"
  FOREIGN KEY ("studentStoryId") REFERENCES "StudentStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationRecord"
  ADD CONSTRAINT "AiGenerationRecord_applicationQuestionId_fkey"
  FOREIGN KEY ("applicationQuestionId") REFERENCES "ApplicationQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationRecord"
  ADD CONSTRAINT "AiGenerationRecord_applicationAnswerVersionId_fkey"
  FOREIGN KEY ("applicationAnswerVersionId") REFERENCES "ApplicationAnswerVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationRecord"
  ADD CONSTRAINT "AiGenerationRecord_applicationInterviewId_fkey"
  FOREIGN KEY ("applicationInterviewId") REFERENCES "ApplicationInterviewPreparation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiGenerationExperience"
  ADD CONSTRAINT "AiGenerationExperience_aiGenerationId_fkey"
  FOREIGN KEY ("aiGenerationId") REFERENCES "AiGenerationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationExperience"
  ADD CONSTRAINT "AiGenerationExperience_studentExperienceId_fkey"
  FOREIGN KEY ("studentExperienceId") REFERENCES "StudentExperience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiGenerationStory"
  ADD CONSTRAINT "AiGenerationStory_aiGenerationId_fkey"
  FOREIGN KEY ("aiGenerationId") REFERENCES "AiGenerationRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiGenerationStory"
  ADD CONSTRAINT "AiGenerationStory_studentStoryId_fkey"
  FOREIGN KEY ("studentStoryId") REFERENCES "StudentStory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
