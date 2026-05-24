-- CreateTable
CREATE TABLE "ActionRateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionRateLimit_action_expiresAt_idx" ON "ActionRateLimit"("action", "expiresAt");

-- CreateIndex
CREATE INDEX "ActionRateLimit_expiresAt_idx" ON "ActionRateLimit"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActionRateLimit_key_action_key" ON "ActionRateLimit"("key", "action");

-- CreateIndex
CREATE INDEX "Application_status_submittedAt_idx" ON "Application"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Application_opportunityId_status_submittedAt_idx" ON "Application"("opportunityId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "Opportunity_status_deadline_idx" ON "Opportunity"("status", "deadline");

-- CreateIndex
CREATE INDEX "Opportunity_organizationId_status_createdAt_idx" ON "Opportunity"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PartnerOrganization_status_createdAt_idx" ON "PartnerOrganization"("status", "createdAt");

-- CreateIndex
CREATE INDEX "User_role_createdAt_idx" ON "User"("role", "createdAt");
