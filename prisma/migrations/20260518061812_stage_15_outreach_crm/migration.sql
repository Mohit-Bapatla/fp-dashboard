-- AlterTable
ALTER TABLE "OutreachContact" ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OutreachTask" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "placementRequestId" TEXT;

-- AlterTable
ALTER TABLE "PartnerOrganization" ADD COLUMN     "lastContactedAt" TIMESTAMP(3),
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OutreachContact_nextFollowUpAt_idx" ON "OutreachContact"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "OutreachTask_placementRequestId_idx" ON "OutreachTask"("placementRequestId");

-- CreateIndex
CREATE INDEX "OutreachTask_status_dueAt_idx" ON "OutreachTask"("status", "dueAt");

-- CreateIndex
CREATE INDEX "PartnerOrganization_nextFollowUpAt_idx" ON "PartnerOrganization"("nextFollowUpAt");

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_placementRequestId_fkey" FOREIGN KEY ("placementRequestId") REFERENCES "PlacementRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
