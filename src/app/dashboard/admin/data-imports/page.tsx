import { FileUp } from "lucide-react";

import { DataImportPanel } from "@/components/admin/data-import-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDataImportsPage() {
  await assertAdminAccess();

  const [stagedStudents, partners, opportunities] = await Promise.all([
    prisma.studentImportRecord.count({
      where: {
        claimedAt: null,
      },
    }),
    prisma.partnerOrganization.count({
      where: { isSystemPlaceholder: false },
    }),
    prisma.opportunity.count({
      where: { visibility: "PUBLIC_DIRECTORY" },
    }),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/data-imports")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              CSV import tools
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Data Imports
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Preview and import existing Future Physicians data from CSV
              without storing uploaded files or creating fake Clerk users.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <FileUp aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Imported students waiting for real account login."
            label="Staged students"
            value={stagedStudents.toString()}
          />
          <StatCard
            helper="Partner organization records currently stored."
            label="Partners"
            value={partners.toString()}
          />
          <StatCard
            helper="Opportunity records currently stored."
            label="Opportunities"
            value={opportunities.toString()}
          />
        </section>

        <DataImportPanel />
      </div>
    </DashboardShell>
  );
}
