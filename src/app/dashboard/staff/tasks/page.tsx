import { ListChecks } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import {
  NewOutreachTaskForm,
  StaffOutreachTaskList,
  type StaffOutreachTaskItem,
} from "@/components/staff/staff-outreach-task-list";
import { Prisma } from "@/generated/prisma/client";
import type { OutreachTaskStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  formatEnumLabel,
  isOutreachTaskPriority,
  isOutreachTaskStatus,
  type OutreachTaskPriority,
  outreachTaskPriorityOptions,
  outreachTaskStatusOptions,
} from "@/lib/staff/crm-validation";
import { getStaffNavItems } from "@/lib/staff/navigation";

type StaffTasksPageProps = {
  searchParams: Promise<{
    assignedToId?: string;
    priority?: string;
    status?: string;
    view?: string;
  }>;
};

const taskViews = [
  "all",
  "mine",
  "due-soon",
  "overdue",
  "blocked",
  "completed",
] as const;

type TaskView = (typeof taskViews)[number];

function isTaskView(value: string | undefined): value is TaskView {
  return taskViews.includes(value as TaskView);
}

function getDateBounds() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueSoonEnd = new Date(today);
  dueSoonEnd.setDate(dueSoonEnd.getDate() + 8);

  return {
    dueSoonEnd,
    today,
    tomorrow,
  };
}

function getUserName(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

function buildRedirectTo({
  assignedToId,
  priority,
  status,
  view,
}: {
  assignedToId: string;
  priority: string;
  status: string;
  view: TaskView;
}) {
  const params = new URLSearchParams();

  if (view !== "all") {
    params.set("view", view);
  }

  if (status) {
    params.set("status", status);
  }

  if (priority) {
    params.set("priority", priority);
  }

  if (assignedToId) {
    params.set("assignedToId", assignedToId);
  }

  const search = params.toString();

  return search ? `/dashboard/staff/tasks?${search}` : "/dashboard/staff/tasks";
}

function buildViewHref({
  priority,
  status,
  view,
}: {
  priority: string;
  status: string;
  view: TaskView;
}) {
  return buildRedirectTo({
    assignedToId: "",
    priority,
    status,
    view,
  });
}

function applyViewFilter({
  currentUserId,
  dueSoonEnd,
  today,
  view,
  where,
}: {
  currentUserId: string | null;
  dueSoonEnd: Date;
  today: Date;
  view: TaskView;
  where: Prisma.OutreachTaskWhereInput;
}) {
  if (view === "mine") {
    where.assignedToId = currentUserId ?? "__missing_current_user__";
  }

  if (view === "due-soon") {
    where.dueAt = {
      gte: today,
      lt: dueSoonEnd,
    };
  }

  if (view === "overdue") {
    where.dueAt = {
      lt: today,
    };
  }

  if (view === "blocked") {
    where.status = "BLOCKED";
  }

  if (view === "completed") {
    where.status = "COMPLETED";
  }
}

export default async function StaffTasksPage({
  searchParams,
}: StaffTasksPageProps) {
  const { userId } = await assertPlacementQueueAccess();
  const params = await searchParams;
  const view = isTaskView(params.view) ? params.view : "all";
  const status =
    params.status && isOutreachTaskStatus(params.status) ? params.status : "";
  const priority =
    params.priority && isOutreachTaskPriority(params.priority)
      ? params.priority
      : "";
  const { dueSoonEnd, today } = getDateBounds();

  const [currentUser, organizations, contacts, staffUsers, placementRequests] =
    await Promise.all([
      prisma.user.findUnique({
        where: {
          clerkUserId: userId,
        },
        select: {
          id: true,
        },
      }),
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
  const staffIds = new Set(staffUsers.map((user) => user.id));
  const assignedToId =
    params.assignedToId && staffIds.has(params.assignedToId)
      ? params.assignedToId
      : "";
  const currentUserId = currentUser?.id ?? null;
  const where: Prisma.OutreachTaskWhereInput = {};

  applyViewFilter({
    currentUserId,
    dueSoonEnd,
    today,
    view,
    where,
  });

  if (view === "due-soon" || view === "overdue") {
    where.status =
      status && status !== "COMPLETED"
        ? (status as OutreachTaskStatus)
        : {
            not: "COMPLETED",
          };
  } else if (status && view !== "blocked" && view !== "completed") {
    where.status = status as OutreachTaskStatus;
  }

  if (priority) {
    where.priority = priority as OutreachTaskPriority;
  }

  if (assignedToId && view !== "mine") {
    where.assignedToId = assignedToId;
  }

  const [
    tasks,
    totalCount,
    myCount,
    dueSoonCount,
    overdueCount,
    blockedCount,
    completedCount,
  ] = await Promise.all([
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
    currentUserId
      ? prisma.outreachTask.count({
          where: {
            assignedToId: currentUserId,
            status: {
              not: "COMPLETED",
            },
          },
        })
      : Promise.resolve(0),
    prisma.outreachTask.count({
      where: {
        dueAt: {
          gte: today,
          lt: dueSoonEnd,
        },
        status: {
          not: "COMPLETED",
        },
      },
    }),
    prisma.outreachTask.count({
      where: {
        dueAt: {
          lt: today,
        },
        status: {
          not: "COMPLETED",
        },
      },
    }),
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
  const redirectTo = buildRedirectTo({
    assignedToId: view === "mine" ? "" : assignedToId,
    priority,
    status,
    view,
  });

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/tasks")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Staff workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Tasks
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Manage assigned work, due dates, priorities, partner outreach,
              placement request links, and blocked follow-ups.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <ListChecks aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <TaskViewCard
            active={view === "all"}
            helper="Every staff-visible task."
            href={buildViewHref({ priority, status, view: "all" })}
            label="All"
            value={totalCount}
          />
          <TaskViewCard
            active={view === "mine"}
            helper="Open tasks assigned to you."
            href={buildViewHref({ priority, status, view: "mine" })}
            label="My tasks"
            value={myCount}
          />
          <TaskViewCard
            active={view === "due-soon"}
            helper="Open tasks due in the next 7 days."
            href={buildViewHref({ priority, status, view: "due-soon" })}
            label="Due soon"
            value={dueSoonCount}
          />
          <TaskViewCard
            active={view === "overdue"}
            helper="Open tasks past their due date."
            href={buildViewHref({ priority, status, view: "overdue" })}
            label="Overdue"
            value={overdueCount}
          />
          <TaskViewCard
            active={view === "blocked"}
            helper="Tasks currently blocked."
            href={buildViewHref({ priority, status, view: "blocked" })}
            label="Blocked"
            value={blockedCount}
          />
          <TaskViewCard
            active={view === "completed"}
            helper="Finished task records."
            href={buildViewHref({ priority, status, view: "completed" })}
            label="Completed"
            value={completedCount}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[180px_180px_220px_auto] lg:items-end">
            <input name="view" type="hidden" value={view} />
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
              Priority
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={priority}
                name="priority"
              >
                <option value="">Any priority</option>
                {outreachTaskPriorityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Assignee
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={view === "mine" ? "" : assignedToId}
                disabled={view === "mine"}
                name="assignedToId"
              >
                <option value="">Anyone</option>
                {staffUsers.map((staffUser) => (
                  <option key={staffUser.id} value={staffUser.id}>
                    {getUserName(staffUser)}
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
                href="/dashboard/staff/tasks"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <NewOutreachTaskForm
          contacts={contacts}
          createDescription="Create a staff task with an owner, due date, priority, notes, and optional partner or placement request links."
          createTitle="Create staff task"
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
          tasks={tasks as StaffOutreachTaskItem[]}
        />
      </div>
    </DashboardShell>
  );
}

function TaskViewCard({
  active,
  helper,
  href,
  label,
  value,
}: {
  active: boolean;
  helper: string;
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      className={[
        "block rounded-lg border bg-background p-4 shadow-sm transition hover:bg-muted/50",
        active ? "border-primary" : "border-border",
      ].join(" ")}
      href={href}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-normal text-foreground">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </Link>
  );
}
