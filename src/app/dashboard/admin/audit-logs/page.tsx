import { LockKeyhole } from "lucide-react";

import { AuditLogList } from "@/components/admin/audit-log-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { getPageParam, getPagination, getTotalPages } from "@/lib/pagination";

type AdminAuditLogsPageProps = {
  searchParams: Promise<{
    page?: string;
  }>;
};

export default async function AdminAuditLogsPage({
  searchParams,
}: AdminAuditLogsPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const page = getPageParam(params.page);
  const pagination = getPagination(page);
  const [auditLogs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        action: true,
        actor: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdAt: true,
        entityId: true,
        entityType: true,
        id: true,
        metadata: true,
      },
    }),
    prisma.auditLog.count(),
  ]);
  const totalPages = getTotalPages(totalCount, pagination.pageSize);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/audit-logs")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Platform audit
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Audit Logs
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review successful workflow actions across applications,
              opportunities, placement requests, outreach CRM, resumes, and
              student profile updates.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <LockKeyhole aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Audit log stats"
          className="grid gap-4 md:grid-cols-2"
        >
          <StatCard
            helper="All audit records currently stored."
            label="Total events"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Most recent audit records shown on this page."
            label="Displayed"
            value={auditLogs.length.toString()}
          />
        </section>

        <AuditLogList auditLogs={auditLogs} />
        <PaginationControls
          page={page}
          pathname="/dashboard/admin/audit-logs"
          searchParams={{}}
          totalCount={totalCount}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}
