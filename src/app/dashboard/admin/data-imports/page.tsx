import { DatabaseZap, FileUp, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { DataImportPanel } from "@/components/admin/data-import-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { loadOpportunityImportAdminOverview } from "@/lib/opportunities/import/database";

export default async function AdminDataImportsPage() {
  await assertAdminAccess();

  const [stagedStudents, partners, opportunities, opportunityImports] =
    await Promise.all([
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
      loadOpportunityImportAdminOverview(),
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

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                <DatabaseZap aria-hidden="true" className="size-4" />
                Real opportunity pipeline
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                Auditable import runs and review queues
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Production-grade opportunity imports use a versioned
                official-source dataset, dry-run hash, duplicate review,
                manual-override preservation, and an explicit environment guard.
                The legacy CSV tool below remains draft-only.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href="/dashboard/admin/opportunities/verification"
            >
              Open verification queue
            </Link>
          </div>

          {opportunityImports.schemaReady ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <PipelineMetric
                  label="Recent runs"
                  value={opportunityImports.runs.length}
                />
                <PipelineMetric
                  label="Record review"
                  value={opportunityImports.reviewQueue}
                />
                <PipelineMetric
                  label="Link review"
                  value={opportunityImports.pendingVerificationChecks}
                />
                <PipelineMetric
                  label="Duplicate rows"
                  value={opportunityImports.rowCounts.DUPLICATE ?? 0}
                />
              </div>

              {opportunityImports.runs.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[48rem] text-left text-sm">
                    <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Source</th>
                        <th className="px-3 py-2 font-medium">Environment</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                        <th className="px-3 py-2 font-medium">Rows</th>
                        <th className="px-3 py-2 font-medium">Changes</th>
                        <th className="px-3 py-2 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {opportunityImports.runs.map((run) => (
                        <tr key={run.id}>
                          <td className="px-3 py-3">
                            <p className="font-medium text-foreground">
                              {run.sourceFileName}
                            </p>
                            <code className="text-xs text-muted-foreground">
                              {run.sourceFileHash.slice(0, 12)}
                            </code>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {run.environment.toLowerCase()}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {run.dryRun ? "dry run" : run.status.toLowerCase()}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {run.totalRows}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            +{run.createdCount} / ~{run.updatedCount} / -
                            {run.archivedCount}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(run.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No durable real-opportunity import has been committed in this
                  environment.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-5 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <ShieldAlert
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0"
              />
              <p>
                The additive opportunity-import migration is not installed in
                this environment. Browsing remains available, but import commits
                and durable review queues are fail-closed until an owner
                approves the migration and production write plan.
              </p>
            </div>
          )}
        </section>

        <DataImportPanel />
      </div>
    </DashboardShell>
  );
}

function PipelineMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
