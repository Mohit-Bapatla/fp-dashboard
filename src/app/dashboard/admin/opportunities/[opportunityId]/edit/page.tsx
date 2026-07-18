import { notFound } from "next/navigation";

import { OpportunityForm } from "@/components/admin/opportunity-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import type { OpportunityFormValues } from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";

type EditAdminOpportunityPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

function formatDateInput(value: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export default async function EditAdminOpportunityPage({
  params,
}: EditAdminOpportunityPageProps) {
  await assertAdminAccess();

  const { opportunityId } = await params;
  const [opportunity, organizations] = await Promise.all([
    prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        organization: { isSystemPlaceholder: false },
        visibility: "PUBLIC_DIRECTORY",
      },
      select: {
        id: true,
        organizationId: true,
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
        status: true,
        relationshipType: true,
        applicationMethod: true,
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
        minimumAge: true,
        maximumAge: true,
        acceptedGradeLevels: true,
        requiredCertifications: true,
      },
    }),
    prisma.partnerOrganization.findMany({
      where: { isSystemPlaceholder: false },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    }),
  ]);

  if (!opportunity) {
    notFound();
  }

  const initialValues: OpportunityFormValues = {
    opportunityId: opportunity.id,
    organizationId: opportunity.organizationId,
    title: opportunity.title,
    description: opportunity.description ?? "",
    type: opportunity.type,
    specialty: opportunity.specialty ?? "",
    location: opportunity.location ?? "",
    remoteType: opportunity.remoteType ?? "",
    paidStatus: opportunity.paidStatus ?? "",
    deadline: formatDateInput(opportunity.deadline),
    capacity: opportunity.capacity?.toString() ?? "",
    eligibilityRequirements: opportunity.eligibilityRequirements ?? "",
    requiredDocuments: opportunity.requiredDocuments.join("\n"),
    applicationInstructions: opportunity.applicationInstructions ?? "",
    status: opportunity.status,
    relationshipType: opportunity.relationshipType,
    applicationMethod: opportunity.applicationMethod,
    officialSourceUrl: opportunity.officialSourceUrl ?? "",
    officialApplicationUrl: opportunity.officialApplicationUrl ?? "",
    verificationStatus: opportunity.verificationStatus,
    lastVerifiedAt: formatDateInput(opportunity.lastVerifiedAt),
    nextVerificationAt: formatDateInput(opportunity.nextVerificationAt),
    availabilityStatus: opportunity.availabilityStatus,
    opensAt: formatDateInput(opportunity.opensAt),
    startsAt: formatDateInput(opportunity.startsAt),
    endsAt: formatDateInput(opportunity.endsAt),
    city: opportunity.city ?? "",
    state: opportunity.state ?? "",
    country: opportunity.country ?? "",
    minimumAge: opportunity.minimumAge?.toString() ?? "",
    maximumAge: opportunity.maximumAge?.toString() ?? "",
    acceptedGradeLevels: opportunity.acceptedGradeLevels.join(", "),
    requiredCertifications: opportunity.requiredCertifications.join(", "),
  };

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/opportunities")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="admin" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Admin management
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Edit Opportunity
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Update listing details, partner ownership, and publication state.
          </p>
        </header>

        <OpportunityForm
          currentPath={`/dashboard/admin/opportunities/${opportunity.id}/edit`}
          initialValues={initialValues}
          organizations={organizations}
        />
      </div>
    </DashboardShell>
  );
}
