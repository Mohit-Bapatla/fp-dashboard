import {
  Building2,
  FileClock,
  LifeBuoy,
  ListChecks,
  MailCheck,
  Rocket,
  Users,
  Workflow,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffDashboardPage() {
  const { userId } = await assertPlacementQueueAccess();

  const currentUser = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
    },
  });

  const [
    totalRequests,
    activeRequests,
    partnerCount,
    contactCount,
    dueContactFollowUps,
    dueOutreachTasks,
    myOpenTasks,
    myCompletedTasks,
    myOverdueTasks,
    blockedTasks,
    completedTasks,
  ] = await Promise.all([
    prisma.placementRequest.count(),
    prisma.placementRequest.count({
      where: {
        status: {
          notIn: ["PLACED", "CLOSED"],
        },
      },
    }),
    prisma.partnerOrganization.count(),
    prisma.outreachContact.count(),
    prisma.outreachContact.count({
      where: {
        nextFollowUpAt: {
          lte: new Date(),
        },
      },
    }),
    prisma.outreachTask.count({
      where: {
        dueAt: {
          lte: new Date(),
        },
        status: {
          not: "COMPLETED",
        },
      },
    }),
    currentUser
      ? prisma.outreachTask.count({
          where: {
            assignedToId: currentUser.id,
            status: {
              not: "COMPLETED",
            },
          },
        })
      : Promise.resolve(0),
    currentUser
      ? prisma.outreachTask.count({
          where: {
            assignedToId: currentUser.id,
            status: "COMPLETED",
          },
        })
      : Promise.resolve(0),
    currentUser
      ? prisma.outreachTask.count({
          where: {
            assignedToId: currentUser.id,
            dueAt: {
              lte: new Date(),
            },
            status: {
              not: "COMPLETED",
            },
          },
        })
      : Promise.resolve(0),
    prisma.outreachTask.count({
      where: {
        status: "BLOCKED",
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
              Coordinate personalized placement requests, partner outreach,
              contacts, and follow-up tasks from the staff workspace.
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
            helper="Requests not yet placed or closed."
            label="Active requests"
            value={activeRequests.toString()}
          />
          <StatCard
            helper={`${contactCount} outreach contacts are linked to partner organizations.`}
            label="Partners"
            value={partnerCount.toString()}
          />
          <StatCard
            helper={`${myOverdueTasks} assigned tasks are overdue.`}
            label="Assigned tasks"
            value={myOpenTasks.toString()}
          />
          <StatCard
            helper="Tasks assigned to you that have been completed."
            label="My completed tasks"
            value={myCompletedTasks.toString()}
          />
          <StatCard
            helper={`${dueContactFollowUps} contact follow-ups and ${dueOutreachTasks} tasks are due.`}
            label="Due outreach"
            value={(dueContactFollowUps + dueOutreachTasks).toString()}
          />
          <StatCard
            helper="Tasks currently blocked across the staff workspace."
            label="Blocked tasks"
            value={blockedTasks.toString()}
          />
          <StatCard
            helper="Completed outreach tasks across staff operations."
            label="Completed tasks"
            value={completedTasks.toString()}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <StaffPanel
            description="Review partner status, follow-up dates, notes, and relationship activity."
            href="/dashboard/staff/partners"
            icon={Building2}
            title="Partner CRM"
          />
          <StaffPanel
            description="Create and edit partner outreach contacts with notes and follow-up dates."
            href="/dashboard/staff/contacts"
            icon={Users}
            title="Contacts"
          />
          <StaffPanel
            description="Create and manage outreach tasks, due dates, assignees, and placement request links."
            href="/dashboard/staff/outreach"
            icon={ListChecks}
            title="Outreach tasks"
          />
          <StaffPanel
            description="Manage assigned tasks, priority queues, overdue work, blocked items, and completed follow-ups."
            href="/dashboard/staff/tasks"
            icon={ListChecks}
            title="Task workspace"
          />
          <StaffPanel
            description="Run and inspect operational checks for expired opportunities, stale requests, follow-ups, and overdue tasks."
            href="/dashboard/staff/automations"
            icon={Workflow}
            title="Automations"
          />
          <StaffPanel
            description="Follow the internal launch quick start and move day-to-day operations into the dashboard."
            href="/dashboard/staff/launch"
            icon={Rocket}
            title="Launch"
          />
          <StaffPanel
            description="Report beta blockers with role, page URL, steps to reproduce, and expected behavior."
            href="/dashboard/support"
            icon={LifeBuoy}
            title="Support"
          />
          <StaffPanel
            description="Assign owners, update status, set priority, and maintain internal notes for student placement requests."
            href="/dashboard/staff/placement-requests"
            icon={FileClock}
            title="Placement queue"
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
