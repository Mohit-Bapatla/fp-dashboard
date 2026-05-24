import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentOpportunityDetail } from "@/components/student/student-opportunity-detail";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";

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
          match={match}
          opportunity={opportunity}
        />
      </div>
    </DashboardShell>
  );
}
