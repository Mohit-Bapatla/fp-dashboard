import { BriefcaseBusiness, Plus } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { roleNavigation } from "@/components/dashboard/role-config";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDashboardPage() {
  await assertAdminAccess();

  const [userCount, studentCount, partnerCount, opportunityCount, draftCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: "STUDENT",
        },
      }),
      prisma.partnerOrganization.count(),
      prisma.opportunity.count(),
      prisma.opportunity.count({
        where: {
          status: "DRAFT",
        },
      }),
    ]);

  return (
    <DashboardShell navItems={roleNavigation.admin} role="admin">
      <div className="space-y-8">
        <header>
          <RoleBadge role="admin" />
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
            Admin Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Oversee users, partner organizations, opportunity records, and
            platform operations for the FP Dashboard.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Database users connected to Clerk identities."
            label="Total users"
            value={userCount.toString()}
          />
          <StatCard
            helper="Student role records currently in the system."
            label="Students"
            value={studentCount.toString()}
          />
          <StatCard
            helper="Partner organizations available for outreach and listings."
            label="Partners"
            value={partnerCount.toString()}
          />
          <StatCard
            helper="Admin-managed records prepared for future student flows."
            label="Opportunities"
            value={opportunityCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Opportunity management
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create opportunities, connect them to partner organizations, and
                publish, archive, or close records from the admin workspace.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {draftCount} draft {draftCount === 1 ? "listing" : "listings"}{" "}
                need review before publishing.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/admin/opportunities"
              >
                View opportunities
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
                href="/dashboard/admin/opportunities/new"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                New opportunity
              </a>
            </div>
          </div>
        </section>

        <EmptyState
          description="User management, audit log review, and platform settings remain staged for later admin work."
          icon={BriefcaseBusiness}
          title="More admin tools coming soon"
        />
      </div>
    </DashboardShell>
  );
}
