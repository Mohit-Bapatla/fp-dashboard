import { Workflow } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { AutomationRunPanel } from "@/components/staff/automation-run-panel";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

function daysAgo(days: number, now: Date) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);

  return date;
}

function hoursAgo(hours: number, now: Date) {
  const date = new Date(now);
  date.setHours(date.getHours() - hours);

  return date;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRunSummary(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const record = metadata as {
    durationMs?: unknown;
    errors?: unknown;
    source?: unknown;
    success?: unknown;
    totals?: unknown;
  };
  const totals =
    record.totals && typeof record.totals === "object"
      ? (record.totals as {
          changed?: unknown;
          deduped?: unknown;
          notificationsCreated?: unknown;
          scanned?: unknown;
        })
      : null;

  return {
    changed: typeof totals?.changed === "number" ? totals.changed : 0,
    deduped: typeof totals?.deduped === "number" ? totals.deduped : 0,
    durationMs:
      typeof record.durationMs === "number" ? `${record.durationMs}ms` : "-",
    errors: Array.isArray(record.errors) ? record.errors.length : 0,
    notifications:
      typeof totals?.notificationsCreated === "number"
        ? totals.notificationsCreated
        : 0,
    scanned: typeof totals?.scanned === "number" ? totals.scanned : 0,
    source: typeof record.source === "string" ? record.source : "-",
    success: record.success === true,
  };
}

export default async function StaffAutomationsPage() {
  await assertPlacementQueueAccess();

  const now = new Date();
  const stalePlacementCutoff = hoursAgo(48, now);
  const applicationReviewCutoff = daysAgo(7, now);
  const [
    expiredOpportunityCount,
    stalePlacementRequestCount,
    duePartnerFollowUpCount,
    dueContactFollowUpCount,
    delayedApplicationCount,
    overdueTaskCount,
    recentRuns,
  ] = await Promise.all([
    prisma.opportunity.count({
      where: {
        deadline: {
          lt: now,
        },
        status: {
          notIn: ["CLOSED", "ARCHIVED", "REJECTED"],
        },
      },
    }),
    prisma.placementRequest.count({
      where: {
        status: {
          notIn: ["PLACED", "CLOSED"],
        },
        updatedAt: {
          lte: stalePlacementCutoff,
        },
      },
    }),
    prisma.partnerOrganization.count({
      where: {
        nextFollowUpAt: {
          lte: now,
        },
      },
    }),
    prisma.outreachContact.count({
      where: {
        nextFollowUpAt: {
          lte: now,
        },
      },
    }),
    prisma.application.count({
      where: {
        OR: [
          {
            reviewedAt: {
              lte: applicationReviewCutoff,
            },
          },
          {
            reviewedAt: null,
            updatedAt: {
              lte: applicationReviewCutoff,
            },
          },
        ],
        status: "UNDER_REVIEW",
      },
    }),
    prisma.outreachTask.count({
      where: {
        dueAt: {
          lt: now,
        },
        status: {
          not: "COMPLETED",
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "AUTOMATION_RUN_COMPLETED",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        actor: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
        entityId: true,
        id: true,
        metadata: true,
      },
    }),
  ]);

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/automations")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Operational workflows
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Automations
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Run and inspect the hardcoded operational checks that keep
              opportunities, placement requests, partner follow-ups,
              applications, and outreach tasks from slipping through the cracks.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Workflow aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            helper="Expired opportunities eligible to close."
            label="Expired"
            value={expiredOpportunityCount.toString()}
          />
          <StatCard
            helper="Active requests unchanged for 48+ hours."
            label="Stale requests"
            value={stalePlacementRequestCount.toString()}
          />
          <StatCard
            helper="Partner and contact follow-ups due now."
            label="Follow-ups due"
            value={(
              duePartnerFollowUpCount + dueContactFollowUpCount
            ).toString()}
          />
          <StatCard
            helper="Applications under review for 7+ days."
            label="Review delays"
            value={delayedApplicationCount.toString()}
          />
          <StatCard
            helper="Open outreach tasks past due."
            label="Overdue tasks"
            value={overdueTaskCount.toString()}
          />
        </section>

        <AutomationRunPanel />

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h2
            className="text-base font-semibold text-foreground"
            id="recent-automation-runs-heading"
          >
            Recent automation runs
          </h2>
          {recentRuns.length > 0 ? (
            <div
              aria-labelledby="recent-automation-runs-heading"
              className="mt-4 overflow-x-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              role="region"
              tabIndex={0}
            >
              <table className="w-full min-w-[48rem] divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Started</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Scanned</th>
                    <th className="px-3 py-2 font-medium">Changed</th>
                    <th className="px-3 py-2 font-medium">Notified</th>
                    <th className="px-3 py-2 font-medium">Skipped</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRuns.map((run) => {
                    const summary = getRunSummary(run.metadata);

                    return (
                      <tr key={run.id}>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDateTime(run.createdAt)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {summary?.source ?? "-"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {summary?.scanned ?? 0}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {summary?.changed ?? 0}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {summary?.notifications ?? 0}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {summary?.deduped ?? 0}
                        </td>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {summary?.success ? "Completed" : "Needs review"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              No automation runs have been logged yet.
            </p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
