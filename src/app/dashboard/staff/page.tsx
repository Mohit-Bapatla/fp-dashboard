import { FileClock, ListChecks, MailCheck, Users } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffDashboardPage() {
  await assertPlacementQueueAccess();

  const [totalRequests, newRequests, activeRequests, urgentRequests] =
    await Promise.all([
      prisma.placementRequest.count(),
      prisma.placementRequest.count({
        where: {
          status: "NEW",
        },
      }),
      prisma.placementRequest.count({
        where: {
          status: {
            notIn: ["PLACED", "CLOSED"],
          },
        },
      }),
      prisma.placementRequest.count({
        where: {
          priority: "URGENT",
          status: {
            notIn: ["PLACED", "CLOSED"],
          },
        },
      }),
    ]);

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff")}
      role="staff"
    >
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Operations workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Staff Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Coordinate personalized placement requests, triage student needs,
              and keep internal support work moving.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            href="/dashboard/staff/placement-requests"
          >
            Open placement queue
          </Link>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="All personalized placement requests submitted by students."
            label="Placement requests"
            value={totalRequests.toString()}
          />
          <StatCard
            helper="Requests waiting for first staff review."
            label="New"
            value={newRequests.toString()}
          />
          <StatCard
            helper="Requests not yet placed or closed."
            label="Active"
            value={activeRequests.toString()}
          />
          <StatCard
            helper="Active requests marked urgent."
            label="Urgent"
            value={urgentRequests.toString()}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <StaffPanel
            description="Assign owners, update status, set priority, and maintain internal notes for student placement requests."
            href="/dashboard/staff/placement-requests"
            icon={FileClock}
            title="Placement queue"
          />
          <StaffPanel
            description="Partner contact and outreach workflows remain staged for a later CRM-focused build."
            href="#"
            icon={Users}
            title="Partner contacts"
          />
          <StaffPanel
            description="Task and outreach logging will connect to placement requests in a later stage."
            href="#"
            icon={ListChecks}
            title="Tasks"
          />
        </section>
      </div>
    </DashboardShell>
  );
}

function StaffPanel({
  description,
  href,
  icon: Icon,
  title,
}: {
  description: string;
  href: string;
  icon: typeof MailCheck;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Link
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        href={href}
      >
        Open
      </Link>
    </article>
  );
}
