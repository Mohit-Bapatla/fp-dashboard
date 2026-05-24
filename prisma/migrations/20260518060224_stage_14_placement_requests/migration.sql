-- AlterTable
ALTER TABLE "PlacementRequest" ADD COLUMN     "assignedStaffId" TEXT,
ADD COLUMN     "availability" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "locationPreference" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "remotePreference" TEXT,
ADD COLUMN     "requestedOpportunityTypes" "OpportunityType"[] DEFAULT ARRAY[]::"OpportunityType"[],
ADD COLUMN     "requestedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "urgency" TEXT;

-- CreateIndex
CREATE INDEX "PlacementRequest_assignedStaffId_idx" ON "PlacementRequest"("assignedStaffId");

-- CreateIndex
CREATE INDEX "PlacementRequest_priority_idx" ON "PlacementRequest"("priority");

-- CreateIndex
CREATE INDEX "PlacementRequest_status_priority_idx" ON "PlacementRequest"("status", "priority");

-- AddForeignKey
ALTER TABLE "PlacementRequest" ADD CONSTRAINT "PlacementRequest_assignedStaffId_fkey" FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
