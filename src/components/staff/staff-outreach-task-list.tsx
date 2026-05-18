import { CalendarDays, ListChecks, Search } from "lucide-react";

import { saveOutreachTask } from "@/app/dashboard/staff/crm-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { OutreachTaskStatusBadge } from "@/components/staff/crm-badges";
import type { OutreachTaskStatus } from "@/generated/prisma/enums";
import {
  formatDateInput,
  formatEnumLabel,
  outreachTaskStatusOptions,
} from "@/lib/staff/crm-validation";

export type StaffUserOption = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type StaffTaskContactOption = {
  id: string;
  firstName: string;
  lastName: string | null;
  organizationId: string;
  organization: {
    name: string;
  };
};

export type StaffTaskOrganizationOption = {
  id: string;
  name: string;
};

export type StaffPlacementRequestOption = {
  id: string;
  title: string;
  studentProfile: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
};

export type StaffOutreachTaskItem = {
  id: string;
  assignedToId: string | null;
  assignedTo: StaffUserOption | null;
  completedAt: Date | null;
  contactId: string | null;
  contact: {
    firstName: string;
    lastName: string | null;
  } | null;
  description: string | null;
  dueAt: Date | null;
  notes: string | null;
  partnerOrganizationId: string | null;
  partnerOrganization: {
    name: string;
  } | null;
  placementRequestId: string | null;
  placementRequest: {
    title: string;
  } | null;
  status: OutreachTaskStatus;
  title: string;
};

type StaffOutreachTaskListProps = {
  contacts: StaffTaskContactOption[];
  organizations: StaffTaskOrganizationOption[];
  placementRequests: StaffPlacementRequestOption[];
  redirectTo: string;
  staffUsers: StaffUserOption[];
  tasks: StaffOutreachTaskItem[];
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function getUserName(
  user: StaffUserOption | StaffPlacementRequestOption["studentProfile"]["user"],
) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

function getContactName(contact: {
  firstName: string;
  lastName: string | null;
}) {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ");
}

function TaskForm({
  contacts,
  organizations,
  placementRequests,
  redirectTo,
  staffUsers,
  task,
}: {
  contacts: StaffTaskContactOption[];
  organizations: StaffTaskOrganizationOption[];
  placementRequests: StaffPlacementRequestOption[];
  redirectTo: string;
  staffUsers: StaffUserOption[];
  task?: StaffOutreachTaskItem;
}) {
  return (
    <form
      action={saveOutreachTask}
      className="grid gap-4 rounded-lg border border-border bg-background p-4 lg:grid-cols-3"
    >
      <input name="redirectTo" type="hidden" value={redirectTo} />
      {task ? <input name="taskId" type="hidden" value={task.id} /> : null}
      <label className="text-sm font-medium text-foreground lg:col-span-2">
        Task title
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.title ?? ""}
          name="title"
          required
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Status
        <select
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.status ?? "NOT_STARTED"}
          name="status"
        >
          {outreachTaskStatusOptions.map((status) => (
            <option key={status} value={status}>
              {formatEnumLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Organization
        <select
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.partnerOrganizationId ?? ""}
          name="partnerOrganizationId"
        >
          <option value="">No organization</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Contact
        <select
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.contactId ?? ""}
          name="contactId"
        >
          <option value="">No contact</option>
          {contacts.map((contact) => (
            <option key={contact.id} value={contact.id}>
              {getContactName(contact)} - {contact.organization.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Assignee
        <select
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.assignedToId ?? ""}
          name="assignedToId"
        >
          <option value="">Unassigned</option>
          {staffUsers.map((staffUser) => (
            <option key={staffUser.id} value={staffUser.id}>
              {getUserName(staffUser)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground">
        Due date
        <input
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={formatDateInput(task?.dueAt)}
          name="dueAt"
          type="date"
        />
      </label>
      <label className="text-sm font-medium text-foreground lg:col-span-2">
        Placement request
        <select
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.placementRequestId ?? ""}
          name="placementRequestId"
        >
          <option value="">No placement request</option>
          {placementRequests.map((request) => (
            <option key={request.id} value={request.id}>
              {request.title} - {getUserName(request.studentProfile.user)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-foreground lg:col-span-3">
        Description
        <textarea
          className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.description ?? ""}
          name="description"
        />
      </label>
      <label className="text-sm font-medium text-foreground lg:col-span-3">
        Notes
        <textarea
          className="mt-2 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
          defaultValue={task?.notes ?? ""}
          name="notes"
        />
      </label>
      <div className="lg:col-span-3">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          type="submit"
        >
          {task ? "Save task" : "Create task"}
        </button>
      </div>
    </form>
  );
}

export function NewOutreachTaskForm(
  props: Omit<StaffOutreachTaskListProps, "tasks">,
) {
  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">
        Create outreach task
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Track a follow-up, outreach step, or placement-related task.
      </p>
      <div className="mt-5">
        <TaskForm {...props} />
      </div>
    </section>
  );
}

export function StaffOutreachTaskList({
  contacts,
  organizations,
  placementRequests,
  redirectTo,
  staffUsers,
  tasks,
}: StaffOutreachTaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        description="No outreach tasks match the current filters. Create a new task or clear filters."
        icon={Search}
        title="No outreach tasks found"
      />
    );
  }

  return (
    <div className="grid gap-5">
      {tasks.map((task) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
          key={task.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <OutreachTaskStatusBadge status={task.status} />
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                  Due {formatDate(task.dueAt)}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                {task.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {task.partnerOrganization?.name ?? "No organization"} |{" "}
                {task.contact ? getContactName(task.contact) : "No contact"}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 lg:min-w-80">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ListChecks
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                Assigned to{" "}
                {task.assignedTo ? getUserName(task.assignedTo) : "Unassigned"}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Completed {formatDate(task.completedAt)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Placement request: {task.placementRequest?.title ?? "None"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {task.description || "No task description."}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Notes</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {task.notes || "No task notes yet."}
              </p>
            </div>
          </div>

          <details className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              Edit outreach task
            </summary>
            <div className="mt-4">
              <TaskForm
                contacts={contacts}
                organizations={organizations}
                placementRequests={placementRequests}
                redirectTo={redirectTo}
                staffUsers={staffUsers}
                task={task}
              />
            </div>
          </details>
        </article>
      ))}
    </div>
  );
}
