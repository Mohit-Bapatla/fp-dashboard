-- CreateEnum
CREATE TYPE "EmbeddingEntityType" AS ENUM ('OPPORTUNITY', 'STUDENT_PROFILE', 'RESUME', 'PARTNER_ORGANIZATION');

-- CreateTable
CREATE TABLE "EmbeddingRecord" (
    "id" TEXT NOT NULL,
    "entityType" "EmbeddingEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmbeddingRecord_entityType_idx" ON "EmbeddingRecord"("entityType");

-- CreateIndex
CREATE INDEX "EmbeddingRecord_entityId_idx" ON "EmbeddingRecord"("entityId");

-- CreateIndex
CREATE INDEX "EmbeddingRecord_contentHash_idx" ON "EmbeddingRecord"("contentHash");

-- CreateIndex
CREATE INDEX "EmbeddingRecord_updatedAt_idx" ON "EmbeddingRecord"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingRecord_entityType_entityId_key" ON "EmbeddingRecord"("entityType", "entityId");
