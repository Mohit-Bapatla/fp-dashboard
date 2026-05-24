import { Archive, CheckCircle2, DatabaseZap } from "lucide-react";
import Link from "next/link";

import {
  acknowledgeDataQualityIssue,
  archiveExpiredOpportunity,
} from "@/app/dashboard/admin/data-quality/actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { getDataQualityBuckets } from "@/lib/data-quality/data-quality";

export default async function AdminDataQualityPage() {
  await assertAdminAccess();

  const buckets = await getDataQualityBuckets();
  const totalIssues = buckets.reduce(
    (total, bucket) => total + bucket.items.length,
    0,
  );
  const activeBuckets = buckets.filter((bucket) => bucket.items.length > 0);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/data-quality")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Data quality
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Data Quality Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Find incomplete, stale, duplicated, or overdue operational records
              without running destructive cleanup.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <DatabaseZap aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Issues still visible after acknowledgements."
            label="Open issues"
            value={totalIssues.toString()}
          />
          <StatCard
            helper="Issue categories currently needing attention."
            label="Active buckets"
            value={activeBuckets.length.toString()}
          />
          <StatCard
            helper="Archive expired opportunities or acknowledge known records."
            label="Safe actions"
            value="2"
          />
        </section>

        {activeBuckets.length > 0 ? (
          <div className="grid gap-5">
            {activeBuckets.map((bucket) => (
              <section
                className="rounded-lg border border-border bg-background p-5 shadow-sm"
                key={bucket.key}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {bucket.title}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {bucket.description}
                    </p>
                  </div>
                  <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {bucket.items.length} open
                  </span>
                </div>

                <div className="mt-5 divide-y divide-border">
                  {bucket.items.map((item) => (
                    <article
                      className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
                      key={`${item.entityType}-${item.entityId}-${item.issueKey}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {item.description}
                        </p>
                        <Link
                          className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
                          href={item.href}
                        >
                          Open related page
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-start gap-2">
                        {item.action === "ARCHIVE_EXPIRED_OPPORTUNITY" ? (
                          <form action={archiveExpiredOpportunity}>
                            <input
                              name="opportunityId"
                              type="hidden"
                              value={item.entityId}
                            />
                            <button
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted"
                              type="submit"
                            >
                              <Archive aria-hidden="true" className="h-4 w-4" />
                              Archive
                            </button>
                          </form>
                        ) : null}
                        <form action={acknowledgeDataQualityIssue}>
                          <input
                            name="entityType"
                            type="hidden"
                            value={item.entityType}
                          />
                          <input
                            name="entityId"
                            type="hidden"
                            value={item.entityId}
                          />
                          <input
                            name="issueKey"
                            type="hidden"
                            value={item.issueKey}
                          />
                          <button
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                            type="submit"
                          >
                            <CheckCircle2
                              aria-hidden="true"
                              className="h-4 w-4"
                            />
                            Acknowledge
                          </button>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-lg border border-dashed border-border bg-background p-8 text-sm leading-6 text-muted-foreground">
            No open data quality issues are currently visible.
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
