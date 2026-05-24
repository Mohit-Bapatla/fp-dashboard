import { ArrowRight, ClipboardCheck, FileText } from "lucide-react";
import Link from "next/link";

import { withdrawStudentApplication } from "@/app/dashboard/student/applications/actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { StudentApplicationStatusBadge } from "@/components/student/student-application-status-badge";
import type { ApplicationStatus } from "@/generated/prisma/enums";

export type StudentApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  statement: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  resume: {
    fileName: string;
  } | null;
  opportunity: {
    id: string;
    title: string;
    organization: {
      name: string;
    };
  };
};

type StudentApplicationListProps = {
  applications: StudentApplicationListItem[];
  hasAnyApplications: boolean;
};

const withdrawableStatuses = new Set<ApplicationStatus>([
  "SUBMITTED",
  "UNDER_REVIEW",
]);

function formatDate(value: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

export function StudentApplicationList({
  applications,
  hasAnyApplications,
}: StudentApplicationListProps) {
  if (applications.length === 0) {
    return (
      <EmptyState
        action={
          !hasAnyApplications
            ? {
                label: "Browse opportunities",
                href: "/dashboard/student/opportunities",
              }
            : undefined
        }
        description={
          hasAnyApplications
            ? "Try changing the view or status filter to see more applications."
            : "Submitted applications will appear here after you apply to a published opportunity."
        }
        icon={ClipboardCheck}
        title={
          hasAnyApplications
            ? "No applications match these filters"
            : "No applications yet"
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <article
          className="rounded-xl border border-border bg-background p-5 shadow-sm"
          key={application.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StudentApplicationStatusBadge status={application.status} />
                <span className="text-xs font-medium text-muted-foreground">
                  Submitted{" "}
                  {formatDate(application.submittedAt ?? application.createdAt)}
                </span>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                {application.opportunity.title}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {application.opportunity.organization.name}
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href={`/dashboard/student/opportunities/${application.opportunity.id}`}
            >
              View opportunity
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">
                Short statement
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {application.statement || "No statement submitted."}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <FileText aria-hidden="true" className="h-4 w-4" />
                Resume
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {application.resume?.fileName ?? "Resume no longer available"}
              </p>
            </div>
          </div>

          {withdrawableStatuses.has(application.status) ? (
            <form action={withdrawStudentApplication} className="mt-5">
              <input
                name="applicationId"
                type="hidden"
                value={application.id}
              />
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                type="submit"
              >
                Withdraw application
              </button>
            </form>
          ) : null}
        </article>
      ))}
    </div>
  );
}
