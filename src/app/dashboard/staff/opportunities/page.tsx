import { BriefcaseBusiness } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffOpportunitiesPage() {
  await assertPlacementQueueAccess();
  const [total, published, pending] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: "PUBLISHED" } }),
    prisma.opportunity.count({ where: { status: "PENDING_APPROVAL" } }),
  ]);

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/opportunities")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="staff" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Opportunity operations
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Opportunities
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Staff can monitor opportunity inventory here and use admin review
            pages for publishing workflows.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="All opportunity records."
            label="Total"
            value={total.toString()}
          />
          <StatCard
            helper="Visible to students."
            label="Published"
            value={published.toString()}
          />
          <StatCard
            helper="Waiting for review."
            label="Pending"
            value={pending.toString()}
          />
        </section>

        <EmptyState
          description="Detailed staff opportunity management is handled through partner and admin workflows. Use the admin opportunity queue if you have admin access."
          icon={BriefcaseBusiness}
          title="No separate staff queue"
        />
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          href="/dashboard/staff/partners"
        >
          Review partner records
        </Link>
      </div>
    </DashboardShell>
  );
}
