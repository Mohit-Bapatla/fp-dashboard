import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";
import type { ResumeAlignmentOpportunity } from "@/lib/student/resume-review";

const activeApplicationStatuses = [
  "DRAFT",
  "SAVED",
  "PLANNING",
  "PREPARING",
  "WAITING_FOR_RECOMMENDATION",
  "READY_TO_SUBMIT",
] as const;

export function resumeAlignmentOpportunityWhere(
  studentProfileId: string,
  now = new Date(),
): Prisma.OpportunityWhereInput {
  const activeApplication = {
    applications: {
      some: {
        status: { in: [...activeApplicationStatuses] },
        studentProfileId,
      },
    },
  } satisfies Prisma.OpportunityWhereInput;

  return {
    OR: [
      studentDirectoryOpportunityWhere(now),
      {
        AND: [
          activeApplication,
          {
            OR: [
              {
                organization: { isSystemPlaceholder: false },
                status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
                verificationStatus: { in: ["VERIFIED", "ARCHIVED"] },
                visibility: "PUBLIC_DIRECTORY",
              },
              {
                sourceType: "STUDENT_ADDED",
                status: "DRAFT",
                studentOwnerProfileId: studentProfileId,
                verificationStatus: "NEEDS_REVIEW",
                visibility: "STUDENT_PRIVATE",
              },
            ],
          },
        ],
      },
    ],
  };
}

export async function getResumeAlignmentOpportunities(
  studentProfileId: string,
): Promise<ResumeAlignmentOpportunity[]> {
  const opportunities = await prisma.opportunity.findMany({
    where: resumeAlignmentOpportunityWhere(studentProfileId),
    orderBy: [{ deadline: "asc" }, { updatedAt: "desc" }],
    take: 12,
    select: {
      applications: {
        where: {
          status: { in: [...activeApplicationStatuses] },
          studentProfileId,
        },
        select: { id: true },
        take: 1,
      },
      eligibilityRequirements: true,
      id: true,
      organization: { select: { name: true } },
      requiredCertifications: true,
      requiredExperience: true,
      shortDescription: true,
      specialty: true,
      studentOrganizationName: true,
      title: true,
    },
  });

  return opportunities.map((opportunity) => ({
    eligibilityRequirements: opportunity.eligibilityRequirements,
    id: opportunity.id,
    isActiveApplication: opportunity.applications.length > 0,
    organizationName:
      opportunity.studentOrganizationName ?? opportunity.organization.name,
    requiredCertifications: opportunity.requiredCertifications,
    requiredExperience: opportunity.requiredExperience,
    shortDescription: opportunity.shortDescription,
    specialty: opportunity.specialty,
    title: opportunity.title,
  }));
}
