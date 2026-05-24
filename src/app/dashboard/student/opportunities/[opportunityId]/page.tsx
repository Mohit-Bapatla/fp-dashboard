import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import {
  StudentOpportunityDetail,
  type SimilarOpportunityData,
} from "@/components/student/student-opportunity-detail";
import { getOpportunityMatchExplanation } from "@/lib/matching/explanations";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import {
  cosineSimilarity,
  getEmbeddingVectorForEntity,
  parseEmbedding,
} from "@/lib/matching/vector-similarity";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";

type StudentOpportunityDetailPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
  searchParams: Promise<{
    source?: string;
  }>;
};

export default async function StudentOpportunityDetailPage({
  params,
  searchParams,
}: StudentOpportunityDetailPageProps) {
  const { userId } = await assertStudentAccess();

  const { opportunityId } = await params;
  const query = await searchParams;
  const [user, opportunity] = await Promise.all([
    getCurrentStudentProfile(userId),
    prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        specialty: true,
        location: true,
        remoteType: true,
        paidStatus: true,
        deadline: true,
        capacity: true,
        eligibilityRequirements: true,
        requiredDocuments: true,
        applicationInstructions: true,
        publishedAt: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            website: true,
            description: true,
          },
        },
      },
    }),
  ]);

  if (!opportunity) {
    notFound();
  }

  const profile = user.studentProfile;
  const applicationState = profile
    ? await Promise.all([
        prisma.application.findUnique({
          where: {
            studentProfileId_opportunityId: {
              studentProfileId: profile.id,
              opportunityId: opportunity.id,
            },
          },
          select: {
            submittedAt: true,
          },
        }),
        prisma.resume.findFirst({
          where: {
            studentProfileId: profile.id,
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            extractedSkills: true,
          },
        }),
      ])
    : null;
  const applyState = !profile
    ? ({ kind: "needsProfile" } as const)
    : applicationState?.[0]
      ? ({
          kind: "alreadyApplied",
          submittedAt: applicationState[0].submittedAt,
        } as const)
      : applicationState?.[1]
        ? ({ kind: "canApply" } as const)
        : ({ kind: "needsResume" } as const);
  const match = profile
    ? getOpportunityMatchScore({
        opportunity,
        profile,
        resume: applicationState?.[1] ?? null,
      })
    : null;
  const explanation = match
    ? getOpportunityMatchExplanation({
        match,
        opportunitySkills: opportunity.specialty ? [opportunity.specialty] : [],
        resumeSkills: applicationState?.[1]?.extractedSkills ?? [],
      })
    : null;
  const currentOpportunityVector = await getEmbeddingVectorForEntity({
    entityId: opportunity.id,
    entityType: "OPPORTUNITY",
  });
  const similarOpportunities =
    currentOpportunityVector.length > 0
      ? (
          await Promise.all(
            (
              await prisma.embeddingRecord.findMany({
                where: {
                  entityId: {
                    not: opportunity.id,
                  },
                  entityType: "OPPORTUNITY",
                },
                select: {
                  embedding: true,
                  entityId: true,
                },
              })
            ).map(async (record) => {
              const similarity = cosineSimilarity(
                currentOpportunityVector,
                parseEmbedding(record.embedding),
              );

              if (similarity <= 0) {
                return null;
              }

              const similarOpportunity = await prisma.opportunity.findFirst({
                where: {
                  id: record.entityId,
                  status: "PUBLISHED",
                },
                select: {
                  id: true,
                  organization: {
                    select: {
                      name: true,
                    },
                  },
                  specialty: true,
                  title: true,
                  type: true,
                },
              });

              return similarOpportunity
                ? {
                    id: similarOpportunity.id,
                    organizationName: similarOpportunity.organization.name,
                    similarity,
                    specialty: similarOpportunity.specialty,
                    title: similarOpportunity.title,
                    type: similarOpportunity.type,
                  }
                : null;
            }),
          )
        )
          .filter((item): item is SimilarOpportunityData => Boolean(item))
          .sort((first, second) => second.similarity - first.similarity)
          .slice(0, 3)
      : [];

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/opportunities")}
      role="student"
    >
      <div className="space-y-8">
        <header>
          <RoleBadge role="student" />
        </header>
        <StudentOpportunityDetail
          applyState={applyState}
          explanation={explanation}
          match={match}
          opportunity={opportunity}
          similarOpportunities={similarOpportunities}
          source={query.source}
        />
      </div>
    </DashboardShell>
  );
}
