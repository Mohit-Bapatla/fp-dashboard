import { CalendarDays, ClipboardCheck, FileText, Search } from "lucide-react";

import { updateAdminApplicationStatus } from "@/app/dashboard/admin/applications/actions";
import { ApplicationStatusBadge } from "@/components/admin/application-status-badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export type AdminApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  statement: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  reviewedAt: Date | null;
  resume: {
    fileName: string;
  } | null;
  opportunity: {
    id: string;
    title: string;
    organization: {
      id: string;
      name: string;
    };
  };
  studentProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
};

type AdminApplicationListProps = {
  applications: AdminApplicationListItem[];
  redirectTo: string;
};

const updateStatuses: ApplicationStatus[] = [
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
];

function formatDate(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStudentName(application: AdminApplicationListItem) {
  const { firstName, lastName, email } = application.studentProfile.user;
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || email;
}

export function AdminApplicationList({
  applications,
  redirectTo,
}: AdminApplicationListProps) {
  if (applications.length === 0) {
    return (
      <EmptyState
        description="No applications match the current filters. Clear the filters to return to the full application list."
        icon={Search}
        title="No applications found"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => {
        const canUpdate = application.status !== "WITHDRAWN";

        return (
          <article
            className="rounded-lg border border-border bg-background p-5 shadow-sm"
            key={application.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ApplicationStatusBadge status={application.status} />
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                    Submitted{" "}
                    {formatDate(
                      application.submittedAt ?? application.createdAt,
                    )}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                  {getStudentName(application)}
                </h2>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {application.studentProfile.user.email}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 lg:min-w-80">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ClipboardCheck
                    aria-hidden="true"
                    className="h-4 w-4 text-primary"
                  />
                  {application.opportunity.title}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {application.opportunity.organization.name}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">Statement</p>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  {application.statement || "No statement submitted."}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText
                    aria-hidden="true"
                    className="h-4 w-4 text-primary"
                  />
                  Resume
                </div>
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  {application.resume?.fileName ?? "Resume no longer available"}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Reviewed {formatDate(application.reviewedAt)}
                </p>
              </div>
            </div>

            <form
              action={updateAdminApplicationStatus}
              className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
              <input
                name="applicationId"
                type="hidden"
                value={application.id}
              />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <label className="text-sm font-medium text-foreground sm:w-56">
                Admin status
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  disabled={!canUpdate}
                  name="status"
                  required
                >
                  <option value="">Choose status</option>
                  {updateStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatEnumLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canUpdate}
                type="submit"
              >
                Update status
              </button>
              {!canUpdate ? (
                <p className="text-sm text-muted-foreground">
                  Withdrawn applications cannot be changed by admins.
                </p>
              ) : null}
            </form>
          </article>
        );
      })}
    </div>
  );
}
