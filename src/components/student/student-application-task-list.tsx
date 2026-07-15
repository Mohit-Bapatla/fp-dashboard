import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

import { StudentTaskControls } from "@/components/student/student-task-controls";
import type {
  ApplicationStatus,
  ApplicationTaskStatus,
  ApplicationTaskType,
} from "@/generated/prisma/enums";
import {
  formatApplicationTaskStatus,
  formatApplicationTaskType,
  getApplicationTaskHref,
  getTaskWhyItMatters,
  requiresAuthoritativeApplicationAction,
  type ApplicationTaskGroups,
  type ApplicationTaskLike,
} from "@/lib/student/application-tasks";
import { canSubmitExistingApplication } from "@/lib/student/application-workspace";
import { cn } from "@/lib/utils";

export type StudentApplicationTaskListItem = ApplicationTaskLike & {
  applicationStatus: ApplicationStatus;
  opportunityId: string;
  opportunityTitle: string;
  organizationName: string;
  type: ApplicationTaskType;
  status: ApplicationTaskStatus;
};

type StudentApplicationTaskListProps = {
  groups: ApplicationTaskGroups<StudentApplicationTaskListItem>;
  now: Date;
  timezone?: string;
};

const sections: Array<{
  key: keyof ApplicationTaskGroups<StudentApplicationTaskListItem>;
  title: string;
  description: string;
}> = [
  {
    key: "overdue",
    title: "Overdue",
    description: "Required actions whose due dates have passed.",
  },
  {
    key: "today",
    title: "Today",
    description: "Actions due today.",
  },
  {
    key: "thisWeek",
    title: "This week",
    description: "Actions due during the next seven days.",
  },
  {
    key: "later",
    title: "Later",
    description: "Future actions and tasks without a due date.",
  },
  {
    key: "completed",
    title: "Completed",
    description: "Completed and intentionally skipped tasks.",
  },
];

export function StudentApplicationTaskList({
  groups,
  now,
  timezone = "UTC",
}: StudentApplicationTaskListProps) {
  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const tasks = groups[section.key];
        return (
          <section aria-labelledby={`tasks-${section.key}`} key={section.key}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-semibold text-foreground"
                  id={`tasks-${section.key}`}
                >
                  {section.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
                {tasks.length}
              </span>
            </div>
            {tasks.length > 0 ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    now={now}
                    task={task}
                    timezone={timezone}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                No tasks in this section.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}

function TaskCard({
  now,
  task,
  timezone,
}: {
  now: Date;
  task: StudentApplicationTaskListItem;
  timezone: string;
}) {
  const href = getApplicationTaskHref(task, task.opportunityId);
  const dueAtValue = task.dueAt?.toISOString().slice(0, 10) ?? null;

  return (
    <article
      className="rounded-xl border border-border bg-background p-5 shadow-sm"
      id={`task-${task.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-xs font-semibold",
            getStatusClassName(task.status),
          )}
        >
          {formatApplicationTaskStatus(task.status)}
        </span>
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {task.required ? "Required" : "Optional"}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {formatApplicationTaskType(task.type)}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">
        {task.title}
      </h3>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        {task.opportunityTitle} - {task.organizationName}
      </p>
      {task.description ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            Due
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">
            {formatDueDate(task.dueAt)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/25 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {task.status === "BLOCKED" ? (
              <AlertTriangle aria-hidden="true" className="h-4 w-4" />
            ) : (
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            )}
            Why it matters
          </div>
          <p className="mt-2 text-sm leading-5 text-foreground">
            {getTaskWhyItMatters(task, now, timezone)}
          </p>
        </div>
      </div>

      <Link
        className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        href={href}
      >
        Open action
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>

      <StudentTaskControls
        completionRequiresApplicationAction={requiresAuthoritativeApplicationAction(
          task.type,
        )}
        customTaskEditable={
          task.source === "STUDENT" &&
          task.type === "CUSTOM" &&
          Boolean(task.studentControlled) &&
          canSubmitExistingApplication(task.applicationStatus)
        }
        description={task.description ?? null}
        dueAt={dueAtValue}
        required={task.required}
        status={task.status}
        taskId={task.id}
        title={task.title}
      />
    </article>
  );
}

function formatDueDate(value: Date | null) {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function getStatusClassName(status: ApplicationTaskStatus) {
  switch (status) {
    case "COMPLETE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "BLOCKED":
      return "border-red-200 bg-red-50 text-red-700";
    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "SKIPPED":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}
