import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileText,
  ListChecks,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { startApplicationWorkspace } from "@/app/dashboard/student/applications/workspace-actions";
import {
  dismissRecommendation,
  saveOpportunity,
} from "@/app/dashboard/student/saved/actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { EligibilityBadge } from "@/components/opportunities/eligibility-badge";
import { OpportunityRelationshipBadge } from "@/components/opportunities/opportunity-relationship-badge";
import {
  RecommendationEventTracker,
  TrackedRecommendationLink,
} from "@/components/student/recommendation-event-tracker";
import { StudentResumeManager } from "@/components/student/student-resume-manager";
import { prisma } from "@/lib/db/prisma";
import { getRecommendationExplanation } from "@/lib/matching/explanations";
import { getRecommendedOpportunities } from "@/lib/matching/recommendations";
import {
  isStudentOpportunitySubmittable,
  studentDirectoryOpportunityWhere,
} from "@/lib/opportunities/student-visibility";
import {
  getApplicationNextAction,
  getApplicationTaskHref,
  getApplicationTaskProgress,
  getTaskWhyItMatters,
  groupApplicationTasks,
} from "@/lib/student/application-tasks";
import { canSubmitExistingApplication } from "@/lib/student/application-workspace";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getStudentNotificationPreference } from "@/lib/student/notification-preferences";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getStudentProfileCompletion } from "@/lib/student/profile-completion";
import { buildResumePresentation } from "@/lib/student/resume-presentation";
import { getResumeAlignmentOpportunities } from "@/lib/student/resume-review-data";

export const runtime = "nodejs";

const workspaceStatuses = new Set([
  "DRAFT",
  "SAVED",
  "PLANNING",
  "PREPARING",
  "WAITING_FOR_RECOMMENDATION",
  "READY_TO_SUBMIT",
]);

function formatDate(value: Date | null) {
  if (!value) return "No date set";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(value);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function StudentDashboardPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profileCompletion = getStudentProfileCompletion(user.studentProfile);
  const profile = profileCompletion.isComplete ? user.studentProfile : null;
  const now = new Date();

  const data = profile
    ? await Promise.all([
        prisma.resume.findFirst({
          where: { studentProfileId: profile.id },
          orderBy: { updatedAt: "desc" },
        }),
        getRecommendedOpportunities(profile.id),
        prisma.application.findMany({
          where: {
            studentProfileId: profile.id,
            status: { notIn: ["REJECTED", "WITHDRAWN"] },
          },
          orderBy: { lastActivityAt: "desc" },
          take: 12,
          select: {
            completionPercent: true,
            id: true,
            lastActivityAt: true,
            opportunityId: true,
            status: true,
            tasks: {
              orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
                taskKey: true,
                title: true,
                type: true,
                updatedAt: true,
              },
            },
            opportunity: {
              select: {
                applicationMethod: true,
                availabilityStatus: true,
                deadline: true,
                id: true,
                opensAt: true,
                organization: { select: { name: true } },
                sourceType: true,
                status: true,
                studentOrganizationName: true,
                studentOwnerProfileId: true,
                title: true,
                verificationStatus: true,
                visibility: true,
              },
            },
          },
        }),
        prisma.opportunity.findMany({
          where: {
            ...studentDirectoryOpportunityWhere(now),
            availabilityStatus: "OPENING_SOON",
            OR: [
              {
                savedByStudents: {
                  some: { studentProfileId: profile.id, dismissedAt: null },
                },
              },
              ...(profile.interestedSpecialties.length > 0
                ? [{ specialty: { in: profile.interestedSpecialties } }]
                : []),
              ...(profile.opportunityTypes.length > 0
                ? [{ type: { in: profile.opportunityTypes } }]
                : []),
            ],
          },
          orderBy: [{ opensAt: "asc" }, { deadline: "asc" }],
          take: 4,
          select: {
            deadline: true,
            id: true,
            opensAt: true,
            organization: { select: { name: true } },
            savedByStudents: {
              where: { studentProfileId: profile.id, dismissedAt: null },
              select: { followReopening: true },
            },
            applications: {
              where: {
                studentProfileId: profile.id,
                status: {
                  in: [
                    "DRAFT",
                    "SAVED",
                    "PLANNING",
                    "PREPARING",
                    "WAITING_FOR_RECOMMENDATION",
                    "READY_TO_SUBMIT",
                  ],
                },
              },
              select: { id: true },
              take: 1,
            },
            specialty: true,
            title: true,
          },
        }),
        getStudentNotificationPreference(profile.id),
        getResumeAlignmentOpportunities(profile.id),
      ])
    : null;

  const resume = data?.[0] ?? null;
  const recommendations = (data?.[1] ?? []).slice(0, 6);
  const applications = data?.[2] ?? [];
  const openingSoon = data?.[3] ?? [];
  const timezone = data?.[4]?.timezone ?? "America/Chicago";
  const alignmentOpportunities = data?.[5] ?? [];
  const resumePresentation = resume
    ? buildResumePresentation({
        alignmentOpportunities,
        analyzedAt: resume.analyzedAt,
        parsedText: resume.parsedText,
        parseStatus: resume.parseStatus,
        uploadedAt: resume.uploadedAt,
      })
    : null;
  const applicationSummaries = applications.map((application) => {
    const submissionAllowed =
      profile && canSubmitExistingApplication(application.status)
        ? isStudentOpportunitySubmittable(
            application.opportunity,
            profile.id,
            now,
          )
        : false;
    return {
      ...application,
      nextAction: getApplicationNextAction(
        application.tasks,
        {
          applicationId: application.id,
          canSubmit: submissionAllowed,
          opportunityId: application.opportunityId,
        },
        now,
        timezone,
      ),
      organizationName:
        application.opportunity.studentOrganizationName ??
        application.opportunity.organization.name,
      progress: getApplicationTaskProgress(
        application.tasks,
        application.completionPercent,
      ),
    };
  });
  const recentWorkspace = applicationSummaries.find(
    (application) =>
      workspaceStatuses.has(application.status) &&
      application.tasks.some((task) => task.taskKey),
  );
  const openTasks = applications.flatMap((application) =>
    application.tasks
      .filter((task) => task.status !== "COMPLETE" && task.status !== "SKIPPED")
      .map((task) => ({
        ...task,
        opportunityId: application.opportunityId,
        opportunityTitle: application.opportunity.title,
        organizationName:
          application.opportunity.studentOrganizationName ??
          application.opportunity.organization.name,
      })),
  );
  const taskGroups = groupApplicationTasks(openTasks, now, timezone);
  const urgentTasks = [
    ...taskGroups.overdue,
    ...taskGroups.today,
    ...taskGroups.thisWeek,
    ...taskGroups.later,
  ].slice(0, 5);

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student")}
      role="student"
    >
      <div className="space-y-8">
        <header className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start">
          <div className="max-w-3xl">
            <RoleBadge className="mb-5" role="student" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Application copilot
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              What needs your attention
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Move applications forward, prepare before openings, and keep each
              required action in one private workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium"
              href="/dashboard/student/opportunities/add-external"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add external application
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              href="/dashboard/student/opportunities"
            >
              Browse opportunities
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </header>

        {!profile ? (
          <section className="rounded-xl border border-dashed border-border bg-background p-8">
            <UserRound aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">
              {user.studentProfile
                ? "Continue your application profile"
                : "Complete your application profile first"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add your school, location, interests, and goals to unlock private
              workspaces, task planning, and recommendations.
            </p>
            <Link
              className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              href="/dashboard/student/onboarding"
            >
              {user.studentProfile ? "Continue onboarding" : "Start onboarding"}
            </Link>
          </section>
        ) : (
          <>
            <DashboardSection
              actionHref="/dashboard/student/tasks"
              actionLabel="View all tasks"
              description="The most time-sensitive open actions across your applications."
              icon={ListChecks}
              title="Urgent actions"
            >
              {urgentTasks.length > 0 ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  {urgentTasks.map((task) => (
                    <article
                      className="rounded-lg border border-border bg-muted/20 p-4"
                      key={task.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {task.dueAt ? formatDate(task.dueAt) : "Plan next"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {task.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <h3 className="mt-2 font-semibold">{task.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {task.opportunityTitle} {" · "} {task.organizationName}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {getTaskWhyItMatters(task, now, timezone)}
                      </p>
                      <Link
                        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium"
                        href={getApplicationTaskHref(task, task.opportunityId)}
                      >
                        Open action
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <SectionEmpty message="No open application tasks yet. Start an application or add an external one to build a plan." />
              )}
            </DashboardSection>

            <DashboardSection
              description="Resume the workspace you touched most recently."
              icon={ClipboardCheck}
              title="Continue where you left off"
            >
              {recentWorkspace ? (
                <article className="rounded-lg border border-border bg-muted/20 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {recentWorkspace.organizationName}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {recentWorkspace.opportunity.title}
                      </h3>
                      {recentWorkspace.opportunity.visibility ===
                      "STUDENT_PRIVATE" ? (
                        <PrivateOpportunityLabels />
                      ) : null}
                      <p className="mt-2 text-sm text-muted-foreground">
                        {recentWorkspace.progress.percent}% ready
                        {recentWorkspace.nextAction
                          ? ` · Next: ${recentWorkspace.nextAction.task.title}`
                          : " · All required tasks complete"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatStatus(recentWorkspace.status)} · Deadline{" "}
                        {formatDate(recentWorkspace.opportunity.deadline)}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                      href={`/dashboard/student/applications/${recentWorkspace.id}`}
                    >
                      Continue workspace
                    </Link>
                  </div>
                </article>
              ) : (
                <SectionEmpty message="No preparation workspace yet. Browse opportunities or add an external application." />
              )}
            </DashboardSection>

            <DashboardSection
              actionHref="/dashboard/student/opportunities"
              actionLabel="Browse all"
              description="Up to six verified opportunities ranked from your profile and resume."
              icon={Sparkles}
              title="Recommended opportunities"
            >
              {recommendations.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  <RecommendationEventTracker
                    events={recommendations.map(({ match, opportunity }) => ({
                      eventType: "IMPRESSION",
                      matchScore: match.score,
                      opportunityId: opportunity.id,
                      source: "student_dashboard_recommendation",
                    }))}
                  />
                  {recommendations.map(
                    ({ eligibility, match, opportunity }) => {
                      const explanation = getRecommendationExplanation(match);
                      return (
                        <article
                          className="rounded-lg border border-border bg-background p-5"
                          key={opportunity.id}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <EligibilityBadge category={eligibility.category} />
                            <OpportunityRelationshipBadge
                              relationshipType={opportunity.relationshipType}
                            />
                          </div>
                          <p className="mt-4 text-xs font-medium text-muted-foreground">
                            {opportunity.organization.name}
                          </p>
                          <h3 className="mt-1 font-semibold">
                            {opportunity.title}
                          </h3>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {(explanation.whyRecommended.length > 0
                              ? explanation.whyRecommended.slice(0, 2)
                              : ["Matches details in your application profile."]
                            ).map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                          <p className="mt-3 text-xs font-medium text-muted-foreground">
                            {opportunity.opensAt
                              ? `Opens ${formatDate(opportunity.opensAt)}`
                              : opportunity.deadline
                                ? `Deadline ${formatDate(opportunity.deadline)}`
                                : "Rolling or date not published"}
                          </p>
                          <TrackedRecommendationLink
                            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium"
                            href={`/dashboard/student/opportunities/${opportunity.id}?source=recommendation`}
                            matchScore={match.score}
                            opportunityId={opportunity.id}
                            source="student_dashboard_recommendation"
                          >
                            View details
                            <ArrowRight
                              aria-hidden="true"
                              className="h-4 w-4"
                            />
                          </TrackedRecommendationLink>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <form action={saveOpportunity}>
                              <input
                                name="opportunityId"
                                type="hidden"
                                value={opportunity.id}
                              />
                              <button
                                className="rounded-lg border border-border px-3 py-2 text-sm"
                                type="submit"
                              >
                                Save
                              </button>
                            </form>
                            <form action={dismissRecommendation}>
                              <input
                                name="opportunityId"
                                type="hidden"
                                value={opportunity.id}
                              />
                              <button
                                className="rounded-lg border border-border px-3 py-2 text-sm"
                                type="submit"
                              >
                                Dismiss
                              </button>
                            </form>
                            <form action={startApplicationWorkspace}>
                              <input
                                name="opportunityId"
                                type="hidden"
                                value={opportunity.id}
                              />
                              <button
                                className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                                type="submit"
                              >
                                Start preparation
                              </button>
                            </form>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              ) : (
                <SectionEmpty message="Recommendations will appear as verified opportunities match your profile." />
              )}
            </DashboardSection>

            <DashboardSection
              actionHref="/dashboard/student/saved"
              actionLabel="View saved"
              description="Followed or relevant opportunities that are not accepting submissions yet."
              icon={CalendarClock}
              title="Opening soon"
            >
              {openingSoon.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {openingSoon.map((opportunity) => (
                    <article
                      className="rounded-lg border border-border bg-muted/20 p-4"
                      key={opportunity.id}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {opportunity.opensAt
                          ? `Opens ${formatDate(opportunity.opensAt)}`
                          : "Opening date pending"}
                      </p>
                      <h3 className="mt-2 font-semibold">
                        {opportunity.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {opportunity.organization.name}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {opportunity.savedByStudents[0]?.followReopening
                          ? "Following for an opening alert"
                          : opportunity.savedByStudents.length > 0
                            ? "Saved by you"
                            : opportunity.specialty
                              ? `Relevant to ${opportunity.specialty}`
                              : "Relevant to your profile"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Preparation:{" "}
                        {opportunity.applications.length > 0
                          ? "workspace started"
                          : "not started"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 text-sm font-medium"
                          href={`/dashboard/student/opportunities/${opportunity.id}`}
                        >
                          View details
                        </Link>
                        {opportunity.applications[0] ? (
                          <Link
                            className="inline-flex min-h-10 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
                            href={`/dashboard/student/applications/${opportunity.applications[0].id}`}
                          >
                            Continue preparation
                          </Link>
                        ) : (
                          <form action={startApplicationWorkspace}>
                            <input
                              name="opportunityId"
                              type="hidden"
                              value={opportunity.id}
                            />
                            <button
                              className="min-h-10 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
                              type="submit"
                            >
                              Start preparation
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <SectionEmpty message="No followed or relevant opportunities are opening soon." />
              )}
            </DashboardSection>

            <DashboardSection
              actionHref="/dashboard/student/applications"
              actionLabel="View all applications"
              description="Active applications with their calculated next action."
              icon={ClipboardCheck}
              title="Your applications"
            >
              {applicationSummaries.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {applicationSummaries.slice(0, 6).map((application) => (
                    <article
                      className="rounded-lg border border-border bg-background p-4"
                      key={application.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium">
                          {formatStatus(application.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {application.progress.percent}% complete
                        </span>
                      </div>
                      <h3 className="mt-3 font-semibold">
                        {application.opportunity.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {application.organizationName}
                      </p>
                      {application.opportunity.visibility ===
                      "STUDENT_PRIVATE" ? (
                        <PrivateOpportunityLabels />
                      ) : null}
                      <p className="mt-3 text-sm text-muted-foreground">
                        {application.nextAction
                          ? `Next: ${application.nextAction.task.title}`
                          : "No required preparation task is currently open."}
                      </p>
                      <Link
                        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium"
                        href={`/dashboard/student/applications/${application.id}`}
                      >
                        Open workspace
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <SectionEmpty message="You do not have an active application yet." />
              )}
            </DashboardSection>

            <DashboardSection
              description="Finish the reusable pieces that make every application faster."
              icon={FileText}
              title="Application readiness"
            >
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ReadinessCard
                  complete={Boolean(profile.school && profile.gradeYear)}
                  detail={
                    profile.school && profile.gradeYear
                      ? "School and education level saved"
                      : "Add school and education level"
                  }
                  href="/dashboard/student/profile"
                  label="Basic profile"
                />
                <ReadinessCard
                  complete={
                    profile.interestedSpecialties.length > 0 &&
                    profile.opportunityTypes.length > 0
                  }
                  detail="Healthcare interests and opportunity types"
                  href="/dashboard/student/profile"
                  label="Opportunity preferences"
                />
                <ReadinessCard
                  complete={Boolean(resume)}
                  detail={resume ? resume.fileName : "Upload a PDF or DOCX"}
                  href="/dashboard/student#resume"
                  label="Resume"
                />
                <ReadinessCard
                  complete={profile.availability.length > 0}
                  detail={
                    profile.availability.length > 0
                      ? "General availability saved"
                      : "Add reusable availability"
                  }
                  href="/dashboard/student/profile"
                  label="General availability"
                />
              </div>
              <div className="mt-5" id="resume">
                <StudentResumeManager
                  hasProfile
                  resume={
                    resume
                      ? {
                          alignments: resumePresentation?.alignments ?? [],
                          extractedSections:
                            resumePresentation?.extractedSections ?? null,
                          fileName: resume.fileName,
                          id: resume.id,
                          parseFailureReason: resume.parseFailureReason,
                          parseStatus: resume.parseStatus,
                          review: resumePresentation?.review ?? null,
                          uploadedAt: resume.uploadedAt,
                          updatedAt: resume.updatedAt,
                        }
                      : null
                  }
                />
              </div>
            </DashboardSection>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function DashboardSection({
  actionHref,
  actionLabel,
  children,
  description,
  icon: Icon,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  description: string;
  icon: typeof ListChecks;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {actionHref && actionLabel ? (
          <Link
            className="text-sm font-medium text-primary hover:underline"
            href={actionHref}
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
      {message}
    </p>
  );
}

function PrivateOpportunityLabels() {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
        Private
      </span>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
        Not verified
      </span>
    </div>
  );
}

function ReadinessCard({
  complete,
  detail,
  href,
  label,
}: {
  complete: boolean;
  detail: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      className="rounded-lg border border-border bg-muted/20 p-4 transition hover:bg-muted"
      href={href}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {complete ? "Ready" : "Needs attention"}
      </p>
      <h3 className="mt-2 font-semibold">{label}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </Link>
  );
}
