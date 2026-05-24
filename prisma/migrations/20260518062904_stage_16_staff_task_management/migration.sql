-- AlterTable
ALTER TABLE "OutreachTask" ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE INDEX "OutreachTask_priority_idx" ON "OutreachTask"("priority");
