import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { OpportunityForm } from "@/components/admin/opportunity-form";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { emptyOpportunityFormValues } from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";

export default async function NewAdminOpportunityPage() {
  await assertAdminAccess();

  const organizations = await prisma.partnerOrganization.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/opportunities")}
      role="admin"
    >
      <div className="space-y-8">
        <header>
          <RoleBadge role="admin" />
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
            New Opportunity
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Add an admin-managed opportunity and connect it to a partner
            organization before publishing.
          </p>
        </header>

        <OpportunityForm
          currentPath="/dashboard/admin/opportunities/new"
          initialValues={emptyOpportunityFormValues}
          organizations={organizations}
        />
      </div>
    </DashboardShell>
  );
}
