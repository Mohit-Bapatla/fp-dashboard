import { BarChart3 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffAnalyticsPage() {
  await assertPlacementQueueAccess();
  const [openPlacementRequests, overdueTasks, completedTasks] =
    await Promise.all([
      prisma.placementRequest.count({
        where: {
          status: {
            notIn: ["PLACED", "CLOSED"],
          },
        },
      }),
      prisma.outreachTask.count({
        where: {
          dueAt: {
            lt: new Date(),
          },
          status: {
            not: "COMPLETED",
          },
        },
      }),
      prisma.outreachTask.count({
        where: {
          status: "COMPLETED",
        },
      }),
    ]);

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/analytics")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="staff" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Operations metrics
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Analytics
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Lightweight staff metrics for placement and outreach work.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Requests not yet placed or closed."
            label="Open placement requests"
            value={openPlacementRequests.toString()}
          />
          <StatCard
            helper="Follow-ups past due and not completed."
            label="Overdue outreach tasks"
            value={overdueTasks.toString()}
          />
          <StatCard
            helper="Completed outreach tasks."
            label="Completed tasks"
            value={completedTasks.toString()}
          />
        </section>

        <EmptyState
          description="Admin analytics remains the source for platform-wide reporting. This staff view focuses on day-to-day operations."
          icon={BarChart3}
          title="Staff metrics are intentionally lightweight"
        />
      </div>
    </DashboardShell>
  );
}
