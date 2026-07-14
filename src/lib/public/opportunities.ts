import "server-only";

import { prisma } from "@/lib/db/prisma";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";

export async function getPublicOpportunity(opportunityId: string) {
  return prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      ...studentDirectoryOpportunityWhere(),
    },
    select: {
      applicationInstructions: true,
      capacity: true,
      deadline: true,
      description: true,
      eligibilityRequirements: true,
      id: true,
      location: true,
      paidStatus: true,
      publishedAt: true,
      remoteType: true,
      requiredDocuments: true,
      specialty: true,
      title: true,
      type: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
}

export type PublicOpportunity = NonNullable<
  Awaited<ReturnType<typeof getPublicOpportunity>>
>;
