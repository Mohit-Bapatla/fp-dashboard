import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";

import { updatePartnerApplicationStatus } from "@/app/dashboard/partner/applicants/actions";
import { RecordCommentThread } from "@/components/comments/record-comment-thread";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  ApplicationOnboardingList,
  type ApplicationOnboardingItemView,
} from "@/components/onboarding/application-onboarding-list";
import { PartnerApplicantStatusBadge } from "@/components/partner/partner-applicant-status-badge";
import { PartnerResumeDownloadButton } from "@/components/partner/partner-resume-download-button";
import type {
  ApplicationStatus,
  OpportunityType,
} from "@/generated/prisma/enums";
import type { RecordCommentThread as RecordCommentThreadData } from "@/lib/comments/record-comments";

export type PartnerApplicantListItem = {
  aiReview: {
    fitScore: number;
    gaps: string[];
    interviewQuestions: string[];
    matchReasons: string[];
    strengths: string[];
    summary: string;
  };
  id: string;
  status: ApplicationStatus;
  statement: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  reviewedAt: Date | null;
  onboardingItems: ApplicationOnboardingItemView[];
  commentThread: RecordCommentThreadData;
  resume: {
    fileName: string;
  } | null;
  opportunity: {
    id: string;
    title: string;
    type: OpportunityType;
    organization: {
      name: string;
    };
  };
  studentProfile: {
    school: string | null;
    gradeYear: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    interestedSpecialties: string[];
    opportunityTypes: OpportunityType[];
    experienceLevel: string | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  };
};

type PartnerApplicantListProps = {
  applications: PartnerApplicantListItem[];
  hasAnyApplicants: boolean;
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

function getStudentName(application: PartnerApplicantListItem) {
  const { firstName, lastName, email } = application.studentProfile.user;
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || email;
}

function getStudentLocation(application: PartnerApplicantListItem) {
  const { city, country, state } = application.studentProfile;
  const location = [city, state, country].filter(Boolean).join(", ");

  return location || "Location not provided";
}

function canUpdateStatus(status: ApplicationStatus) {
  return status !== "WITHDRAWN";
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ListDetail({
  icon: Icon,
  label,
  values,
}: {
  icon: typeof GraduationCap;
  label: string;
  values: readonly string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
        {label}
      </div>
      {values.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  );
}

export function PartnerApplicantList({
  applications,
  hasAnyApplicants,
  redirectTo,
}: PartnerApplicantListProps) {
  if (applications.length === 0) {
    return (
      <EmptyState
        description={
          hasAnyApplicants
            ? "Try changing the opportunity or status filter to see more applicants."
            : "Submitted student applications will appear here after students apply to your published opportunities."
        }
        icon={BriefcaseBusiness}
        title={
          hasAnyApplicants
            ? "No applicants match these filters"
            : "No applicants yet"
        }
      />
    );
  }

  return (
    <div className="grid gap-5">
      {applications.map((application) => {
        const name = getStudentName(application);
        const statusUpdateAllowed = canUpdateStatus(application.status);

        return (
          <article
            className="rounded-lg border border-border bg-background p-5 shadow-sm"
            key={application.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <PartnerApplicantStatusBadge status={application.status} />
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                    Submitted{" "}
                    {formatDate(
                      application.submittedAt ?? application.createdAt,
                    )}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-semibold tracking-normal text-foreground">
                  {name}
                </h2>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {application.studentProfile.user.email}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 lg:min-w-72">
                <p className="text-sm font-semibold text-foreground">
                  {application.opportunity.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {application.opportunity.organization.name}
                </p>
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {formatEnumLabel(application.opportunity.type)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <DetailPill
                label="School"
                value={application.studentProfile.school ?? "Not provided"}
              />
              <DetailPill
                label="Grade year"
                value={application.studentProfile.gradeYear ?? "Not provided"}
              />
              <DetailPill
                label="Experience"
                value={
                  application.studentProfile.experienceLevel ?? "Not provided"
                }
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                  {getStudentLocation(application)}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ListDetail
                    icon={GraduationCap}
                    label="Specialties"
                    values={application.studentProfile.interestedSpecialties}
                  />
                  <ListDetail
                    icon={BriefcaseBusiness}
                    label="Opportunity types"
                    values={application.studentProfile.opportunityTypes}
                  />
                </div>
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
                <div className="mt-4">
                  <PartnerResumeDownloadButton
                    applicationId={application.id}
                    disabled={!application.resume}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <UserRound
                  aria-hidden="true"
                  className="h-4 w-4 text-primary"
                />
                Application statement
              </div>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {application.statement || "No statement submitted."}
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Applicant review assist
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    AI assists review; humans make final decisions.
                  </p>
                </div>
                <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {application.aiReview.fitScore}% fit
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {application.aiReview.summary}
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <ReviewList
                  items={application.aiReview.strengths}
                  title="Strengths"
                />
                <ReviewList
                  items={[
                    ...application.aiReview.matchReasons,
                    ...application.aiReview.gaps,
                  ]}
                  title="Explanation and gaps"
                />
                <ReviewList
                  items={application.aiReview.interviewQuestions}
                  title="Suggested questions"
                />
              </div>
            </div>

            {application.status === "ACCEPTED" ? (
              <ApplicationOnboardingList
                applicationId={application.id}
                items={application.onboardingItems}
                mode="reviewer"
                redirectTo={redirectTo}
              />
            ) : null}

            <RecordCommentThread
              entityId={application.id}
              entityType="APPLICATION"
              redirectTo={redirectTo}
              thread={application.commentThread}
            />

            <form
              action={updatePartnerApplicationStatus}
              className="mt-5 flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-end"
            >
              <input
                name="applicationId"
                type="hidden"
                value={application.id}
              />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <label className="text-sm font-medium text-foreground sm:w-56">
                Review status
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue=""
                  disabled={!statusUpdateAllowed}
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
                disabled={!statusUpdateAllowed}
                type="submit"
              >
                Update status
              </button>
              {!statusUpdateAllowed ? (
                <p className="text-sm text-muted-foreground">
                  Withdrawn applications cannot be changed by partners.
                </p>
              ) : null}
            </form>
          </article>
        );
      })}
    </div>
  );
}

function ReviewList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No details available yet.
        </p>
      )}
    </div>
  );
}
