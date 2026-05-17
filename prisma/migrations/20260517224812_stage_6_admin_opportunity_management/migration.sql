-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "applicationInstructions" TEXT,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "eligibilityRequirements" TEXT,
ADD COLUMN     "paidStatus" TEXT,
ADD COLUMN     "remoteType" TEXT,
ADD COLUMN     "requiredDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialty" TEXT;

-- AlterTable
ALTER TABLE "PartnerOrganization" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "specialtyAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" TEXT;
