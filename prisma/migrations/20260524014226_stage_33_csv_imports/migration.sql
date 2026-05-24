-- CreateTable
CREATE TABLE "StudentImportRecord" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "school" TEXT,
    "gradeYear" TEXT,
    "major" TEXT,
    "graduationYear" INTEGER,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "locationPreference" TEXT,
    "remotePreference" TEXT,
    "interestedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "opportunityTypes" "OpportunityType"[] DEFAULT ARRAY[]::"OpportunityType"[],
    "availability" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careerGoals" TEXT,
    "experienceLevel" TEXT,
    "claimedAt" TIMESTAMP(3),
    "claimedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentImportRecord_normalizedEmail_key" ON "StudentImportRecord"("normalizedEmail");

-- CreateIndex
CREATE INDEX "StudentImportRecord_email_idx" ON "StudentImportRecord"("email");

-- CreateIndex
CREATE INDEX "StudentImportRecord_claimedAt_idx" ON "StudentImportRecord"("claimedAt");

-- CreateIndex
CREATE INDEX "StudentImportRecord_claimedById_idx" ON "StudentImportRecord"("claimedById");

-- AddForeignKey
ALTER TABLE "StudentImportRecord" ADD CONSTRAINT "StudentImportRecord_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
