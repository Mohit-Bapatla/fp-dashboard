import { ListChecks, UserRound } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import {
  StudentApplicationTaskList,
  type StudentApplicationTaskListItem,
} from "@/components/student/student-application-task-list";
import { StudentCustomTaskForm } from "@/components/student/student-custom-task-form";
import type { ApplicationTaskType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import {
  applicationTaskTypes,
  filterApplicationTasks,
  formatApplicationTaskType,
  groupApplicationTasks,
  taskCompletionFilters,
  taskDueFilters,
  type TaskCompletionFilter,
  type TaskDueFilter,
} from "@/lib/student/application-tasks";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getStudentNotificationPreference } from "@/lib/student/notification-preferences";
import { getCurrentStudentProfile } from "@/lib/student/profile";

type StudentTasksPageProps = {
  searchParams: Promise<{
    applicationId?: string;
    completion?: string;
    due?: string;
    type?: string;
  }>;
};

function selectedTaskType(value: string | undefined) {
  return applicationTaskTypes.includes(value as ApplicationTaskType)
    ? (value as ApplicationTaskType)
    : undefined;
}

function selectedDueFilter(value: string | undefined): TaskDueFilter {
  return taskDueFilters.includes(value as TaskDueFilter)
    ? (value as TaskDueFilter)
    : "ALL";
}

function selectedCompletionFilter(
  value: string | undefined,
): TaskCompletionFilter {
  return taskCompletionFilters.includes(value as TaskCompletionFilter)
    ? (value as TaskCompletionFilter)
    : "ALL";
}

export default async function StudentTasksPage({
  searchParams,
}: StudentTasksPageProps) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;

  if (!profile) {
    return (
      <DashboardShell
        navItems={getStudentNavItems("/dashboard/student/tasks")}
        role="student"
      >
        <div className="space-y-6">
          <EmptyState
            description="Complete your student profile before creating application workspaces and private tasks."
            icon={UserRound}
            title="Complete your profile first"
          />
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            href="/dashboard/student/onboarding"
          >
            Go to onboarding
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const params = await searchParams;
  const [applications, tasks, notificationPreference] = await Promise.all([
    prisma.application.findMany({
      where: { studentProfileId: profile.id },
      orderBy: { lastActivityAt: "desc" },
      select: {
        id: true,
        opportunity: {
          select: {
            studentOrganizationName: true,
            title: true,
            organization: { select: { name: true } },
          },
        },
      },
    }),
    prisma.applicationTask.findMany({
      where: {
        application: {
          studentProfileId: profile.id,
        },
      },
      orderBy: [{ dueAt: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        applicationId: true,
        completedAt: true,
        createdAt: true,
        description: true,
        dueAt: true,
        id: true,
        required: true,
        sortOrder: true,
        source: true,
        status: true,
        studentControlled: true,
        title: true,
        type: true,
        updatedAt: true,
        application: {
          select: {
            status: true,
            opportunityId: true,
            opportunity: {
              select: {
                studentOrganizationName: true,
                title: true,
                organization: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    getStudentNotificationPreference(profile.id),
  ]);
  const applicationIds = new Set(
    applications.map((application) => application.id),
  );
  const applicationId =
    params.applicationId && applicationIds.has(params.applicationId)
      ? params.applicationId
      : undefined;
  const type = selectedTaskType(params.type);
  const due = selectedDueFilter(params.due);
  const completion = selectedCompletionFilter(params.completion);
  const now = new Date();
  const taskItems: StudentApplicationTaskListItem[] = tasks.map((task) => ({
    applicationId: task.applicationId,
    applicationStatus: task.application.status,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    description: task.description,
    dueAt: task.dueAt,
    id: task.id,
    opportunityId: task.application.opportunityId,
    opportunityTitle: task.application.opportunity.title,
    organizationName:
      task.application.opportunity.studentOrganizationName ??
      task.application.opportunity.organization.name,
    required: task.required,
    sortOrder: task.sortOrder,
    source: task.source,
    status: task.status,
    studentControlled: task.studentControlled,
    title: task.title,
    type: task.type,
    updatedAt: task.updatedAt,
  }));
  const filteredTasks = filterApplicationTasks(
    taskItems,
    { applicationId, completion, due, type },
    now,
    notificationPreference.timezone,
  );
  const groups = groupApplicationTasks(
    filteredTasks,
    now,
    notificationPreference.timezone,
  );
  const applicationOptions = applications.map((application) => ({
    id: application.id,
    label: `${application.opportunity.title} - ${
      application.opportunity.studentOrganizationName ??
      application.opportunity.organization.name
    }`,
  }));

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/tasks")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Application action plan
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                Tasks
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                Complete required application steps, resolve blockers, and keep
                private tasks organized by due date.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <ListChecks aria-hidden="true" className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {filteredTasks.length} visible
                </p>
                <p className="text-xs text-muted-foreground">
                  {tasks.length} total tasks
                </p>
              </div>
            </div>
          </div>
        </header>

        {applications.length > 0 ? (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Filter tasks
            </h2>
            <form className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterLabel label="Application">
                <select defaultValue={applicationId ?? ""} name="applicationId">
                  <option value="">All applications</option>
                  {applicationOptions.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.label}
                    </option>
                  ))}
                </select>
              </FilterLabel>
              <FilterLabel label="Task type">
                <select defaultValue={type ?? ""} name="type">
                  <option value="">All task types</option>
                  {applicationTaskTypes.map((taskType) => (
                    <option key={taskType} value={taskType}>
                      {formatApplicationTaskType(taskType)}
                    </option>
                  ))}
                </select>
              </FilterLabel>
              <FilterLabel label="Due date">
                <select defaultValue={due} name="due">
                  <option value="ALL">Any due date</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="TODAY">Today</option>
                  <option value="THIS_WEEK">This week</option>
                  <option value="LATER">Later or no date</option>
                </select>
              </FilterLabel>
              <FilterLabel label="Completion">
                <select defaultValue={completion} name="completion">
                  <option value="ALL">Any status</option>
                  <option value="OPEN">Open</option>
                  <option value="COMPLETED">Completed or skipped</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </FilterLabel>
              <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  type="submit"
                >
                  Apply filters
                </button>
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  href="/dashboard/student/tasks"
                >
                  Clear filters
                </Link>
              </div>
            </form>
          </section>
        ) : null}

        {applications.length > 0 ? (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">
              Add a private task
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Custom task titles and descriptions remain inside your application
              workspace and are not included in audit logs.
            </p>
            <StudentCustomTaskForm applications={applicationOptions} />
          </section>
        ) : null}

        {applications.length === 0 ? (
          <section className="space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm">
            <EmptyState
              description="Save or start preparing for an opportunity to create an application workspace and its action plan."
              icon={ListChecks}
              title="No application tasks yet"
            />
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/dashboard/student/opportunities"
            >
              Explore opportunities
            </Link>
          </section>
        ) : filteredTasks.length === 0 ? (
          <section className="space-y-4 rounded-xl border border-dashed border-border bg-background p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              No tasks match these filters
            </h2>
            <p className="text-sm text-muted-foreground">
              Clear the filters to return to your complete application plan.
            </p>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/dashboard/student/tasks"
            >
              Clear filters
            </Link>
          </section>
        ) : (
          <StudentApplicationTaskList
            groups={groups}
            now={now}
            timezone={notificationPreference.timezone}
          />
        )}
      </div>
    </DashboardShell>
  );
}

function FilterLabel({
  children,
  label,
}: {
  children: React.ReactElement<{ className?: string }>;
  label: string;
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <span className="mt-2 block [&>select]:min-h-10 [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:border-border [&>select]:bg-background [&>select]:px-3 [&>select]:text-sm [&>select]:shadow-sm [&>select]:focus-visible:outline-none [&>select]:focus-visible:ring-2 [&>select]:focus-visible:ring-primary [&>select]:focus-visible:ring-offset-2">
        {children}
      </span>
    </label>
  );
}
