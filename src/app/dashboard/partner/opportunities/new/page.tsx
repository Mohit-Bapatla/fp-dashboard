import { Building2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { PartnerOpportunityForm } from "@/components/partner/partner-opportunity-form";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";
import { emptyPartnerOpportunityFormValues } from "@/lib/partner/opportunity-validation";

export default async function NewPartnerOpportunityPage() {
  const context = await getCurrentPartnerContext();
  const organizations = context.memberships.map((membership) => ({
    id: membership.organizationId,
    name: membership.organization.name,
  }));

  if (organizations.length === 0) {
    return (
      <DashboardShell
        navItems={getPartnerNavItems("/dashboard/partner/opportunities")}
        role="partner"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="partner" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              New Opportunity
            </h1>
          </header>
          <EmptyState
            description="Your account is not linked to a partner organization yet. A Future Physicians administrator must connect your account before you can create opportunities."
            icon={Building2}
            title="Organization not connected"
          />
        </div>
      </DashboardShell>
    );
  }

  const initialValues = {
    ...emptyPartnerOpportunityFormValues,
    organizationId: organizations[0]?.id ?? "",
  };

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/opportunities")}
      role="partner"
    >
      <div className="space-y-8">
        <header>
          <RoleBadge role="partner" />
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
            New Opportunity
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Create a draft opportunity for one of your linked organizations. You
            can submit it for admin approval when it is ready.
          </p>
        </header>

        <PartnerOpportunityForm
          canEdit
          initialValues={initialValues}
          organizations={organizations}
          statusLabel="Draft"
        />
      </div>
    </DashboardShell>
  );
}
