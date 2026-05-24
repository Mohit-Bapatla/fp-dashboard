import { Archive, Send, XCircle } from "lucide-react";
import { notFound } from "next/navigation";

import {
  archivePartnerOpportunity,
  closePartnerOpportunity,
  submitPartnerOpportunityForApproval,
} from "@/app/dashboard/partner/opportunities/actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { PartnerOpportunityForm } from "@/components/partner/partner-opportunity-form";
import type { PartnerOpportunityFormValues } from "@/lib/partner/opportunity-validation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";

type EditPartnerOpportunityPageProps = {
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

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusFormButton({
  action,
  children,
  icon: Icon,
  opportunityId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  children: string;
  icon: typeof Send;
  opportunityId: string;
}) {
  return (
    <form action={action}>
      <input name="opportunityId" type="hidden" value={opportunityId} />
      <input
        name="redirectTo"
        type="hidden"
        value={`/dashboard/partner/opportunities/${opportunityId}/edit`}
      />
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        type="submit"
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
        {children}
      </button>
    </form>
  );
}

export default async function EditPartnerOpportunityPage({
  params,
}: EditPartnerOpportunityPageProps) {
  const context = await getCurrentPartnerContext();
  const { opportunityId } = await params;
  const opportunity = await prisma.opportunity.findFirst({
    where: {
      id: opportunityId,
      organizationId: {
        in: context.organizationIds,
      },
    },
    select: {
      id: true,
      organizationId: true,
      title: true,
      description: true,
      type: true,
      specialty: true,
      status: true,
      location: true,
      remoteType: true,
      paidStatus: true,
      deadline: true,
      capacity: true,
      eligibilityRequirements: true,
      requiredDocuments: true,
      applicationInstructions: true,
    },
  });

  if (!opportunity) {
    notFound();
  }

  const organizations = context.memberships.map((membership) => ({
    id: membership.organizationId,
    name: membership.organization.name,
  }));
  const canEdit =
    opportunity.status === "DRAFT" || opportunity.status === "REJECTED";
  const canSubmit = canEdit;
  const canCloseOrArchive = opportunity.status === "PUBLISHED";
  const initialValues: PartnerOpportunityFormValues = {
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
  };

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/opportunities")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge role="partner" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Edit Opportunity
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Draft and rejected opportunities can be edited before submitting
              for admin approval.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canSubmit ? (
              <StatusFormButton
                action={submitPartnerOpportunityForApproval}
                icon={Send}
                opportunityId={opportunity.id}
              >
                Submit for approval
              </StatusFormButton>
            ) : null}
            {canCloseOrArchive ? (
              <>
                <StatusFormButton
                  action={archivePartnerOpportunity}
                  icon={Archive}
                  opportunityId={opportunity.id}
                >
                  Archive
                </StatusFormButton>
                <StatusFormButton
                  action={closePartnerOpportunity}
                  icon={XCircle}
                  opportunityId={opportunity.id}
                >
                  Close
                </StatusFormButton>
              </>
            ) : null}
          </div>
        </header>

        <PartnerOpportunityForm
          canEdit={canEdit}
          initialValues={initialValues}
          organizations={organizations}
          statusLabel={formatEnumLabel(opportunity.status)}
        />
      </div>
    </DashboardShell>
  );
}
