import { ArrowRight, ClipboardCheck, FileText } from "lucide-react";
import Link from "next/link";

import { withdrawStudentApplication } from "@/app/dashboard/student/applications/actions";
import { RecordCommentThread } from "@/components/comments/record-comment-thread";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  FeedbackForm,
  type ExistingFeedback,
} from "@/components/feedback/feedback-form";
import { InterviewRequestPanel } from "@/components/interviews/interview-request-panel";
import {
  ApplicationOnboardingList,
  type ApplicationOnboardingItemView,
} from "@/components/onboarding/application-onboarding-list";
import { ServiceHourPanel } from "@/components/service-hours/service-hour-panel";
import { StudentApplicationStatusBadge } from "@/components/student/student-application-status-badge";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import type { RecordCommentThread as RecordCommentThreadData } from "@/lib/comments/record-comments";
import type { InterviewRequestView } from "@/lib/interviews/interviews";
import type { ServiceHourRecordView } from "@/lib/service-hours/service-hours";

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
  onboardingItems: ApplicationOnboardingItemView[];
  interviewRequests: InterviewRequestView[];
  serviceHourRecords: ServiceHourRecordView[];
  commentThread: RecordCommentThreadData;
  feedback: ExistingFeedback;
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
      <div className="space-y-4">
        <EmptyState
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
        {!hasAnyApplications ? (
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            href="/dashboard/student/opportunities"
          >
            Browse opportunities
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((application) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
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
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
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
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-red-200 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50"
                type="submit"
              >
                Withdraw application
              </button>
            </form>
          ) : null}

          {application.status === "ACCEPTED" ? (
            <div className="mt-5 space-y-5">
              <ApplicationOnboardingList
                applicationId={application.id}
                items={application.onboardingItems}
                mode="student"
                redirectTo="/dashboard/student/applications"
              />
              <ServiceHourPanel
                applicationId={application.id}
                mode="student"
                records={application.serviceHourRecords}
                redirectTo="/dashboard/student/applications"
              />
            </div>
          ) : null}

          <div className="mt-5">
            <InterviewRequestPanel
              applicationId={application.id}
              interviewRequests={application.interviewRequests}
              mode="student"
              redirectTo="/dashboard/student/applications"
            />
          </div>

          <RecordCommentThread
            entityId={application.id}
            entityType="APPLICATION"
            redirectTo="/dashboard/student/applications"
            thread={application.commentThread}
          />

          <div className="mt-5">
            <FeedbackForm
              description="Rate your application experience and share anything that would make the process clearer."
              entityId={application.id}
              entityType="APPLICATION"
              existingFeedback={application.feedback}
              feedbackType="STUDENT_APPLICATION_EXPERIENCE"
              redirectTo="/dashboard/student/applications"
              title="Application feedback"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
