import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentOpportunityDetail } from "@/components/student/student-opportunity-detail";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { prisma } from "@/lib/db/prisma";

type StudentOpportunityDetailPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

export default async function StudentOpportunityDetailPage({
  params,
}: StudentOpportunityDetailPageProps) {
  await assertStudentAccess();

  const { opportunityId } = await params;
  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      status: "PUBLISHED",
    },
    select: {
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
  });

  if (!opportunity) {
    notFound();
  }

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/opportunities")}
      role="student"
    >
      <div className="space-y-8">
        <header>
          <RoleBadge role="student" />
        </header>
        <StudentOpportunityDetail opportunity={opportunity} />
      </div>
    </DashboardShell>
  );
}
