import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { OpportunityRelationshipDisclaimer } from "@/components/opportunities/opportunity-relationship-badge";
import {
  StudentApplicationTaskList,
  type StudentApplicationTaskListItem,
} from "@/components/student/student-application-task-list";
import { prisma } from "@/lib/db/prisma";
import { isStudentOpportunitySubmittable } from "@/lib/opportunities/student-visibility";
import { loadOptionalWorkflowData } from "@/lib/reliability/workflow-errors";
import { isSafeExternalUrl } from "@/lib/security/safe-url";
import {
  getApplicationNextAction,
  getApplicationTaskProgress,
  groupApplicationTasks,
} from "@/lib/student/application-tasks";
import {
  canSubmitExistingApplication,
  getOfficialApplicationAction,
} from "@/lib/student/application-workspace";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import {
  getStudentNotificationPreference,
  resolveStudentNotificationPreference,
} from "@/lib/student/notification-preferences";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";

import {
  startApplicationWorkspace,
  updateApplicationWorkspace,
} from "../workspace-actions";

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(value)
    : "Not specified";
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ApplicationWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ applicationId: string }>;
  searchParams: Promise<{ reference?: string; workspace?: string }>;
}) {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const { applicationId } = await params;
  const profile = getCompletedStudentProfile(user.studentProfile);
  if (!profile) notFound();

  const application = await prisma.application.findFirst({
    where: { id: applicationId, studentProfileId: profile.id },
    include: {
      tasks: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      resume: { select: { fileName: true } },
      opportunity: {
        include: { organization: { select: { name: true } } },
      },
    },
  });
  if (!application) notFound();
  const [resumeResult, notificationPreferenceResult] = await Promise.all([
    loadOptionalWorkflowData({
      action: "load_application_resumes",
      fallback: [],
      load: () =>
        prisma.resume.findMany({
          where: { studentProfileId: profile.id },
          orderBy: { updatedAt: "desc" },
          select: { fileName: true, id: true },
        }),
      route: "/dashboard/student/applications/[applicationId]",
      userId: user.id,
    }),
    loadOptionalWorkflowData({
      action: "load_application_notification_preference",
      fallback: resolveStudentNotificationPreference(null),
      load: () => getStudentNotificationPreference(profile.id),
      route: "/dashboard/student/applications/[applicationId]",
      userId: user.id,
    }),
  ]);
  const resumes = resumeResult.value;
  const notificationPreference = notificationPreferenceResult.value;
  const optionalDataAvailable =
    resumeResult.available && notificationPreferenceResult.available;
  const workspaceParams = await searchParams;
  const workspaceStatus = workspaceParams.workspace;
  const reference = workspaceParams.reference;
  const safeReference =
    reference && /^[A-F0-9]{8}$/.test(reference) ? reference : null;

  const now = new Date();
  const opportunitySubmissionAllowed = isStudentOpportunitySubmittable(
    application.opportunity,
    profile.id,
    now,
  );
  const isPreSubmissionApplication = canSubmitExistingApplication(
    application.status,
  );
  const submissionAllowed =
    opportunitySubmissionAllowed && isPreSubmissionApplication;
  const organizationName =
    application.opportunity.studentOrganizationName ??
    application.opportunity.organization.name;
  const isPrivateStudentOpportunity =
    application.opportunity.visibility === "STUDENT_PRIVATE";
  const officialApplicationUrl = isSafeExternalUrl(
    application.opportunity.officialApplicationUrl,
  )
    ? application.opportunity.officialApplicationUrl
    : null;
  const officialApplicationAction = getOfficialApplicationAction({
    applicationMethod: application.applicationMethod,
    officialApplicationUrl,
  });
  const officialSourceUrl = isSafeExternalUrl(
    application.opportunity.officialSourceUrl,
  )
    ? application.opportunity.officialSourceUrl
    : null;
  const externalSubmissionUrl = isPrivateStudentOpportunity
    ? officialSourceUrl
    : officialApplicationUrl;
  const sourceLinkLabel = isPrivateStudentOpportunity
    ? "Open student-provided link"
    : "View official source";
  const progress = getApplicationTaskProgress(
    application.tasks,
    application.completionPercent,
  );
  const nextAction = getApplicationNextAction(
    application.tasks,
    {
      applicationId: application.id,
      canSubmit: submissionAllowed,
      opportunityId: application.opportunityId,
    },
    now,
    notificationPreference.timezone,
  );
  const taskItems: StudentApplicationTaskListItem[] = application.tasks.map(
    (task) => ({
      ...task,
      applicationStatus: application.status,
      opportunityId: application.opportunityId,
      opportunityTitle: application.opportunity.title,
      organizationName,
    }),
  );
  const taskGroups = groupApplicationTasks(
    taskItems,
    now,
    notificationPreference.timezone,
  );
  const hasStructuredPlan = application.tasks.some((task) => task.taskKey);
  const submissionUnavailableMessage =
    application.opportunity.opensAt && application.opportunity.opensAt > now
      ? `Applications open ${formatDate(application.opportunity.opensAt)}. Keep preparing your materials now.`
      : application.opportunity.availabilityStatus === "OPENING_SOON"
        ? application.opportunity.opensAt
          ? `This opportunity is marked opening soon. The opening date is ${formatDate(application.opportunity.opensAt)}.`
          : "Applications are opening soon. Keep preparing your materials now."
        : application.opportunity.deadline &&
            application.opportunity.deadline < now
          ? "The application deadline has passed."
          : "Submission is not currently available for this opportunity.";

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/applications")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Application workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            {application.opportunity.title}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {organizationName} {" · "}
            {formatStatus(application.status)}
          </p>
          {isPrivateStudentOpportunity ? (
            <p className="mt-3 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              Student-added external application · Private · Not verified by FP
            </p>
          ) : null}
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <OpportunityRelationshipDisclaimer
              relationshipType={application.opportunity.relationshipType}
            />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Official deadline:{" "}
              <span className="font-semibold text-foreground">
                {formatDate(application.opportunity.deadline)}
              </span>
            </p>
            {officialApplicationAction ? (
              <a
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                href={officialApplicationAction.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                {officialApplicationAction.label}
                <span className="sr-only"> for {organizationName}</span>
              </a>
            ) : null}
          </div>
        </header>

        {!optionalDataAvailable ? (
          <section
            className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
            role="status"
          >
            Your application is available, but some optional preferences or
            resume choices could not be loaded. You can keep working and try
            this page again later.
          </section>
        ) : null}

        {!hasStructuredPlan ? (
          <section className="rounded-xl border border-primary/20 bg-primary/[0.04] p-6">
            <h2 className="text-xl font-semibold">
              Build your application plan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This external application is saved, but its required preparation
              tasks have not been created yet.
            </p>
            <form action={startApplicationWorkspace} className="mt-4">
              <input
                name="opportunityId"
                type="hidden"
                value={application.opportunityId}
              />
              <button
                className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                type="submit"
              >
                Create preparation tasks
              </button>
            </form>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceFact
            label="Applications open"
            value={formatDate(application.opportunity.opensAt)}
          />
          <WorkspaceFact
            label="Official deadline"
            value={formatDate(application.opportunity.deadline)}
          />
          <WorkspaceFact
            label="Personal target"
            value={formatDate(application.targetDeadline)}
          />
          <div className="rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="mt-1 font-semibold">{progress.percent}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {progress.requiredTotal > 0
                ? `${progress.completedRequired} of ${progress.requiredTotal} required tasks`
                : "Calculated as tasks are added"}
            </p>
          </div>
        </section>

        {nextAction ? (
          <section className="rounded-xl border border-primary/20 bg-primary/[0.04] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Next best action
            </p>
            <h2 className="mt-2 text-xl font-semibold">
              {nextAction.task.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {nextAction.whyItMatters}
            </p>
            <Link
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              href={nextAction.href}
            >
              Open next action
            </Link>
          </section>
        ) : null}

        <form
          action={updateApplicationWorkspace}
          className="rounded-xl border border-border bg-background p-6"
          id="workspace-plan"
        >
          <input name="applicationId" type="hidden" value={application.id} />
          <input
            name="expectedUpdatedAt"
            type="hidden"
            value={application.updatedAt.toISOString()}
          />
          <h2 className="text-xl font-semibold">Your plan</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Progress and next actions are calculated from required tasks. Your
            notes and target date stay private.
          </p>
          {workspaceStatus ? (
            <WorkspaceSaveStatus
              reference={safeReference}
              status={workspaceStatus}
            />
          ) : null}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              Personal target date
              <input
                className="mt-2 min-h-10 w-full rounded-lg border border-border bg-background px-3"
                defaultValue={
                  application.targetDeadline?.toISOString().slice(0, 10) ?? ""
                }
                name="targetDeadline"
                type="date"
              />
            </label>
            <label className="block text-sm font-medium">
              Resume for this application
              <select
                className="mt-2 min-h-10 w-full rounded-lg border border-border bg-background px-3"
                defaultValue={application.resumeId ?? ""}
                name="resumeId"
              >
                <option value="">No resume selected</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.fileName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium">
            Private notes
            <textarea
              className="mt-2 w-full rounded-lg border border-border bg-background p-3"
              defaultValue={application.privateNotes ?? ""}
              maxLength={10000}
              name="privateNotes"
              rows={5}
            />
          </label>
          <button
            className="mt-4 min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
            type="submit"
          >
            Save workspace
          </button>
        </form>

        <section className="rounded-xl border border-border bg-background p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Application tasks</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Update statuses here or manage every application from the Tasks
                page.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium"
              href={`/dashboard/student/tasks?applicationId=${application.id}`}
            >
              Open task manager
            </Link>
          </div>
          <div className="mt-6">
            <StudentApplicationTaskList
              groups={taskGroups}
              now={now}
              timezone={notificationPreference.timezone}
            />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-muted/30 p-6">
          {submissionAllowed ? (
            <>
              <h2 className="font-semibold">
                Submission is always your action
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {application.applicationMethod === "EXTERNAL_PORTAL"
                  ? isPrivateStudentOpportunity
                    ? "Future Physicians does not verify or submit this private external application. Use the link you added, then explicitly confirm your submission here."
                    : "Future Physicians does not submit this external application. Submit in the host portal, then explicitly confirm it here."
                  : "Review your materials and explicitly submit through the configured Future Physicians workflow when ready."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {application.applicationMethod === "EXTERNAL_PORTAL" &&
                externalSubmissionUrl ? (
                  <a
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
                    href={externalSubmissionUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {isPrivateStudentOpportunity
                      ? "Open student-provided link"
                      : "Open official application"}
                  </a>
                ) : null}
                <Link
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  href={`/dashboard/student/opportunities/${application.opportunityId}/apply`}
                >
                  {application.applicationMethod === "EXTERNAL_PORTAL"
                    ? isPrivateStudentOpportunity
                      ? "Confirm external submission"
                      : "Confirm host submission"
                    : "Continue submission"}
                </Link>
              </div>
            </>
          ) : isPreSubmissionApplication ? (
            <>
              <h2 className="font-semibold">Continue preparation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {submissionUnavailableMessage} Submission and confirmation
                controls will appear only when the opportunity is open.
              </p>
              {officialSourceUrl ? (
                <a
                  className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium"
                  href={officialSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sourceLinkLabel}
                </a>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="font-semibold">
                Application {formatStatus(application.status).toLowerCase()}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Submission and confirmation controls are available only while an
                application is still in a pre-submission workspace. You can
                review this workspace, but you cannot submit the application
                again from here.
              </p>
              {officialSourceUrl ? (
                <a
                  className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium"
                  href={officialSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sourceLinkLabel}
                </a>
              ) : null}
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function WorkspaceSaveStatus({
  reference,
  status,
}: {
  reference: string | null;
  status: string;
}) {
  const messages: Record<string, string> = {
    conflict:
      "This workspace changed in another tab. Reload the page, review the latest values, and try again.",
    error: `We could not save your workspace. Your earlier data is still available. Try again.${reference ? ` If the problem continues, contact support with reference ${reference}.` : ""}`,
    invalid_date: "Choose a valid target date and try again.",
    rate_limited:
      "Too many updates were attempted. Wait a moment and try again.",
    saved: "Workspace saved.",
  };
  const message = messages[status];

  if (!message) {
    return null;
  }

  const isSuccess = status === "saved";

  return (
    <p
      className={`mt-4 rounded-lg border p-3 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-300 bg-amber-50 text-amber-950"
      }`}
      role={isSuccess ? "status" : "alert"}
    >
      {message}
    </p>
  );
}

function WorkspaceFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
