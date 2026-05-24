import { MailCheck } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  NewOutreachTaskForm,
  StaffOutreachTaskList,
  type StaffOutreachTaskItem,
} from "@/components/staff/staff-outreach-task-list";
import { Prisma } from "@/generated/prisma/client";
import type { OutreachTaskStatus } from "@/generated/prisma/enums";
import { getRecordCommentThread } from "@/lib/comments/record-comments";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  formatEnumLabel,
  isOutreachTaskStatus,
  outreachTaskStatusOptions,
} from "@/lib/staff/crm-validation";
import { getStaffNavItems } from "@/lib/staff/navigation";

type StaffOutreachPageProps = {
  searchParams: Promise<{
    assignedToId?: string;
    organizationId?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function StaffOutreachPage({
  searchParams,
}: StaffOutreachPageProps) {
  await assertPlacementQueueAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status =
    params.status && isOutreachTaskStatus(params.status) ? params.status : "";
  const [organizations, contacts, staffUsers, placementRequests] =
    await Promise.all([
      prisma.partnerOrganization.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.outreachContact.findMany({
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          organizationId: true,
          organization: { select: { name: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: { in: ["STAFF", "ADMIN", "SUPER_ADMIN"] } },
        orderBy: [{ firstName: "asc" }, { email: "asc" }],
        select: { id: true, email: true, firstName: true, lastName: true },
      }),
      prisma.placementRequest.findMany({
        where: { status: { notIn: ["PLACED", "CLOSED"] } },
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true,
          title: true,
          studentProfile: {
            select: {
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
    ]);
  const organizationIds = new Set(organizations.map((org) => org.id));
  const staffIds = new Set(staffUsers.map((user) => user.id));
  const organizationId =
    params.organizationId && organizationIds.has(params.organizationId)
      ? params.organizationId
      : "";
  const assignedToId =
    params.assignedToId && staffIds.has(params.assignedToId)
      ? params.assignedToId
      : "";
  const where: Prisma.OutreachTaskWhereInput = {};

  if (query) {
    where.OR = [
      { title: { contains: query } },
      { description: { contains: query } },
      { notes: { contains: query } },
      { partnerOrganization: { name: { contains: query } } },
      { contact: { firstName: { contains: query } } },
      { contact: { lastName: { contains: query } } },
    ];
  }

  if (status) {
    where.status = status as OutreachTaskStatus;
  }

  if (organizationId) {
    where.partnerOrganizationId = organizationId;
  }

  if (assignedToId) {
    where.assignedToId = assignedToId;
  }

  const [tasks, totalCount, dueCount, blockedCount] = await Promise.all([
    prisma.outreachTask.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        assignedToId: true,
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        completedAt: true,
        contactId: true,
        contact: { select: { firstName: true, lastName: true } },
        description: true,
        dueAt: true,
        notes: true,
        partnerOrganizationId: true,
        partnerOrganization: { select: { name: true } },
        placementRequestId: true,
        placementRequest: { select: { title: true } },
        priority: true,
        status: true,
        title: true,
      },
    }),
    prisma.outreachTask.count(),
    prisma.outreachTask.count({
      where: {
        dueAt: { lte: new Date() },
        status: { not: "COMPLETED" },
      },
    }),
    prisma.outreachTask.count({
      where: { status: "BLOCKED" },
    }),
  ]);
  const redirectParams = new URLSearchParams();

  if (query) redirectParams.set("q", query);
  if (status) redirectParams.set("status", status);
  if (organizationId) redirectParams.set("organizationId", organizationId);
  if (assignedToId) redirectParams.set("assignedToId", assignedToId);

  const redirectTo = redirectParams.toString()
    ? `/dashboard/staff/outreach?${redirectParams}`
    : "/dashboard/staff/outreach";
  const tasksWithThreads = await Promise.all(
    tasks.map(async (task) => ({
      ...task,
      commentThread: await getRecordCommentThread({
        entityId: task.id,
        entityType: "OUTREACH_TASK",
      }),
    })),
  );

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/outreach")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Outreach pipeline
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Outreach Tasks
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Manage partner follow-ups, relationship tasks, due dates,
              assignees, notes, and optional placement request links.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/staff/outreach/assistant"
            >
              Open assistant
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
              <MailCheck aria-hidden="true" className="h-6 w-6" />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="All outreach task records."
            label="Tasks"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Open tasks due today or earlier."
            label="Due"
            value={dueCount.toString()}
          />
          <StatCard
            helper="Tasks currently blocked."
            label="Blocked"
            value={blockedCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_220px_220px_auto] lg:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search title, notes, organization, or contact"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">Any status</option>
                {outreachTaskStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Organization
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={organizationId}
                name="organizationId"
              >
                <option value="">All organizations</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Assignee
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={assignedToId}
                name="assignedToId"
              >
                <option value="">Anyone</option>
                {staffUsers.map((staffUser) => (
                  <option key={staffUser.id} value={staffUser.id}>
                    {[staffUser.firstName, staffUser.lastName]
                      .filter(Boolean)
                      .join(" ") || staffUser.email}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Apply
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/staff/outreach"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <NewOutreachTaskForm
          contacts={contacts}
          organizations={organizations}
          placementRequests={placementRequests}
          redirectTo={redirectTo}
          staffUsers={staffUsers}
        />
        <StaffOutreachTaskList
          contacts={contacts}
          organizations={organizations}
          placementRequests={placementRequests}
          redirectTo={redirectTo}
          staffUsers={staffUsers}
          tasks={tasksWithThreads as StaffOutreachTaskItem[]}
        />
      </div>
    </DashboardShell>
  );
}
