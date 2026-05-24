-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "extractedCertifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extractedEducation" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extractedExperience" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "extractedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "parsedSummary" TEXT;
