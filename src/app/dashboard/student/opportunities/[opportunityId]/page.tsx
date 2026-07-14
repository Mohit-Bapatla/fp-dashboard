import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  StudentOpportunityDetail,
  type SimilarOpportunityData,
} from "@/components/student/student-opportunity-detail";
import { getOpportunityMatchExplanation } from "@/lib/matching/explanations";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import { evaluateOpportunityEligibility } from "@/lib/matching/opportunity-eligibility";
import { isSafeExternalUrl } from "@/lib/security/safe-url";
import {
  cosineSimilarity,
  getEmbeddingVectorForEntity,
  parseEmbedding,
} from "@/lib/matching/vector-similarity";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";
import {
  isStudentOpportunityPreparable,
  isStudentOpportunitySubmittable,
  studentAccessibleReadOnlyOpportunityWhere,
  studentDirectoryOpportunityWhere,
} from "@/lib/opportunities/student-visibility";

type StudentOpportunityDetailPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function StudentOpportunityDetailPage({
  params,
}: StudentOpportunityDetailPageProps) {
  const { userId } = await assertStudentAccess();

  const { opportunityId } = await params;
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;
  const opportunity = await prisma.opportunity.findFirst({
    where: studentAccessibleReadOnlyOpportunityWhere(
      opportunityId,
      profile?.id ?? null,
    ),
    select: {
      applicationMethod: true,
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
      relationshipType: true,
      officialSourceUrl: true,
      officialApplicationUrl: true,
      verificationStatus: true,
      lastVerifiedAt: true,
      nextVerificationAt: true,
      availabilityStatus: true,
      opensAt: true,
      startsAt: true,
      endsAt: true,
      city: true,
      state: true,
      country: true,
      geographicScope: true,
      minimumAge: true,
      maximumAge: true,
      acceptedGradeLevels: true,
      requiredCertifications: true,
      eligibilityUnknowns: true,
      estimatedApplicationMinutes: true,
      essayQuestionCount: true,
      scheduleRequirements: true,
      estimatedWeeklyHours: true,
      status: true,
      sourceType: true,
      studentOrganizationName: true,
      studentOwnerProfileId: true,
      visibility: true,
      organization: {
        select: {
          name: true,
          website: true,
          description: true,
        },
      },
    },
  });

  if (!opportunity) {
    notFound();
  }

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
            id: true,
            status: true,
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
  const now = new Date();
  const preparationAllowed = isStudentOpportunityPreparable(
    opportunity,
    profile?.id ?? "",
    now,
  );
  const submissionAllowed = isStudentOpportunitySubmittable(
    opportunity,
    profile?.id ?? "",
    now,
  );
  const awaitingOpening =
    !submissionAllowed &&
    (opportunity.availabilityStatus === "OPENING_SOON" ||
      Boolean(opportunity.opensAt && opportunity.opensAt > now));
  const applyState = !preparationAllowed
    ? ({ kind: "unavailable" } as const)
    : !profile
      ? ({ kind: "needsProfile" } as const)
      : applicationState?.[0] &&
          [
            "DRAFT",
            "SAVED",
            "PLANNING",
            "PREPARING",
            "WAITING_FOR_RECOMMENDATION",
            "READY_TO_SUBMIT",
          ].includes(applicationState[0].status)
        ? ({
            kind: "workspace",
            applicationId: applicationState[0].id,
            submissionAllowed,
          } as const)
        : applicationState?.[0]
          ? ({
              kind: "alreadyApplied",
              status: applicationState[0].status,
              submittedAt: applicationState[0].submittedAt,
            } as const)
          : ({ kind: "canPrepare", submissionAllowed } as const);
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
  const eligibility = evaluateOpportunityEligibility({
    opportunity,
    student: profile,
  });
  const saved =
    profile && opportunity.visibility === "PUBLIC_DIRECTORY"
      ? await prisma.savedOpportunity.findUnique({
          where: {
            studentProfileId_opportunityId: {
              studentProfileId: profile.id,
              opportunityId,
            },
          },
          select: { followReopening: true },
        })
      : null;
  const safeOpportunity = {
    ...opportunity,
    officialSourceUrl: isSafeExternalUrl(opportunity.officialSourceUrl)
      ? opportunity.officialSourceUrl
      : null,
    officialApplicationUrl: isSafeExternalUrl(
      opportunity.officialApplicationUrl,
    )
      ? opportunity.officialApplicationUrl
      : null,
  };
  const currentOpportunityVector =
    opportunity.visibility === "PUBLIC_DIRECTORY"
      ? await getEmbeddingVectorForEntity({
          entityId: opportunity.id,
          entityType: "OPPORTUNITY",
        })
      : [];
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
                  ...studentDirectoryOpportunityWhere(),
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
        <StudentOpportunityDetail
          applyState={applyState}
          awaitingOpening={awaitingOpening}
          explanation={explanation}
          match={match}
          opportunity={safeOpportunity}
          eligibility={eligibility}
          isSaved={Boolean(saved)}
          followReopening={saved?.followReopening ?? false}
          submissionAllowed={submissionAllowed}
          similarOpportunities={similarOpportunities}
        />
      </div>
    </DashboardShell>
  );
}
