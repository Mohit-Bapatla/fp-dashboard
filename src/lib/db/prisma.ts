import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const fallbackDatabaseUrl =
  "postgresql://USER:PASSWORD@localhost:5432/fp_dashboard?schema=public";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Preview deployments currently share the production database. Keep
    // additive opportunity-import columns out of implicit model selections so
    // the branch can render safely before its migration is explicitly
    // approved and deployed. Import/admin loaders opt into these fields with
    // explicit selects after confirming schema readiness.
    omit: {
      opportunity: {
        additionalRestrictions: true,
        adminApprovedAt: true,
        adminReviewedAt: true,
        adminReviewedById: true,
        adminReviewStatus: true,
        applicationContactEmail: true,
        backgroundCheckRequirement: true,
        compensationAmount: true,
        compensationType: true,
        completenessScore: true,
        dataQualityScore: true,
        duplicateGroup: true,
        duration: true,
        educationRequirement: true,
        eligibilityNotes: true,
        featured: true,
        feesOrCosts: true,
        geographicRequirement: true,
        healthClearanceRequirement: true,
        housingInformation: true,
        internalNotes: true,
        interviewProcess: true,
        originalImportedValues: true,
        partnerSubmitted: true,
        prerequisiteCourses: true,
        priorityDeadline: true,
        publicNotes: true,
        responsibilities: true,
        schoolCreditAvailability: true,
        secondarySourceUrl: true,
        selectionTimeline: true,
        skillsOffered: true,
        slug: true,
        sourceChangeFingerprint: true,
        sourceKey: true,
        sourceNotes: true,
        sourceOrganization: true,
        sourceRetrievedAt: true,
        sourceTitle: true,
        stipendInformation: true,
        travelRequirements: true,
        verificationMethod: true,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
