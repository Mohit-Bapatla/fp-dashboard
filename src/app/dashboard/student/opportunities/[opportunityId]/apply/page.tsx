import { CheckCircle2, FileText, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentApplicationForm } from "@/components/student/student-application-form";
import { ExternalApplicationConfirmationForm } from "@/components/student/external-application-confirmation-form";
import { startApplicationWorkspace } from "@/app/dashboard/student/applications/workspace-actions";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";
import {
  getApplyPageDecision,
  getEffectiveApplicationMethod,
} from "@/lib/student/application-workspace";
import {
  isStudentOpportunitySubmittable,
  studentAccessiblePreparationOpportunityWhere,
  studentPreparationOpportunityWhere,
} from "@/lib/opportunities/student-visibility";
import { isSafeExternalUrl } from "@/lib/security/safe-url";

type StudentOpportunityApplyPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
  searchParams: Promise<{
    alreadyApplied?: string;
    source?: string;
    success?: string;
    external?: string;
  }>;
};

function formatDate(value: Date | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function StudentOpportunityApplyPage({
  params,
  searchParams,
}: StudentOpportunityApplyPageProps) {
  const { userId } = await assertStudentAccess();
  const { opportunityId } = await params;
  const query = await searchParams;
  const now = new Date();
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;
  const opportunity = await prisma.opportunity.findFirst({
    where: profile
      ? studentAccessiblePreparationOpportunityWhere(
          opportunityId,
          profile.id,
          now,
        )
      : studentPreparationOpportunityWhere(opportunityId, now),
    select: {
      applicationMethod: true,
      availabilityStatus: true,
      relationshipType: true,
      officialApplicationUrl: true,
      officialSourceUrl: true,
      id: true,
      title: true,
      deadline: true,
      opensAt: true,
      location: true,
      remoteType: true,
      paidStatus: true,
      sourceType: true,
      status: true,
      studentOrganizationName: true,
      studentOwnerProfileId: true,
      verificationStatus: true,
      visibility: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!opportunity) {
    notFound();
  }

  const [resumes, existingApplication] = profile
    ? await Promise.all([
        prisma.resume.findMany({
          where: {
            studentProfileId: profile.id,
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
            fileName: true,
            updatedAt: true,
          },
        }),
        prisma.application.findUnique({
          where: {
            studentProfileId_opportunityId: {
              studentProfileId: profile.id,
              opportunityId: opportunity.id,
            },
          },
          select: {
            id: true,
            status: true,
            applicationMethod: true,
            submittedAt: true,
            resume: {
              select: {
                fileName: true,
              },
            },
          },
        }),
      ])
    : [[], null];

  const isSuccess = query.success === "1";
  const submissionAllowed = isStudentOpportunitySubmittable(
    opportunity,
    profile?.id ?? "",
    now,
  );
  const decision = getApplyPageDecision({
    applicationMethod: getEffectiveApplicationMethod(
      opportunity.relationshipType,
      opportunity.applicationMethod,
    ),
    existingStatus: existingApplication?.status ?? null,
    submissionAllowed,
  });
  const isAlreadyApplied =
    query.alreadyApplied === "1" || decision.kind === "BLOCKED";
  const officialApplicationUrl = isSafeExternalUrl(
    opportunity.officialApplicationUrl,
  )
    ? opportunity.officialApplicationUrl
    : null;
  const officialSourceUrl = isSafeExternalUrl(opportunity.officialSourceUrl)
    ? opportunity.officialSourceUrl
    : null;
  const preparationOnly = decision.kind === "PREPARATION_ONLY";
  const openingMessage = opportunity.opensAt
    ? `Applications open ${formatDate(opportunity.opensAt)}`
    : "Applications are opening soon";
  const organizationName =
    opportunity.studentOrganizationName ?? opportunity.organization.name;
  const isPrivateStudentOpportunity =
    opportunity.visibility === "STUDENT_PRIVATE";
  const hasRecordedSubmission = Boolean(existingApplication?.submittedAt);
  const externalSubmissionUrl = isPrivateStudentOpportunity
    ? officialSourceUrl
    : officialApplicationUrl;
  const sourceLinkLabel = isPrivateStudentOpportunity
    ? "Open student-provided link"
    : "View official source";

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/opportunities")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Application
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {isAlreadyApplied
              ? "Application status"
              : preparationOnly
                ? "Prepare for Opportunity"
                : "Apply to Opportunity"}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {isAlreadyApplied
              ? "Review the application status and continue from your existing workspace."
              : preparationOnly
                ? `${openingMessage}. You can organize your materials now and return when submission opens.`
                : isPrivateStudentOpportunity
                  ? "Submit outside Future Physicians, then explicitly confirm your submission here."
                  : "Complete the final submission step for this opportunity and confirm it explicitly."}
          </p>
        </header>

        <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            {organizationName}
          </p>
          {isPrivateStudentOpportunity ? (
            <p className="mt-3 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              Student-added external application · Private · Not verified by FP
            </p>
          ) : null}
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {opportunity.title}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ApplyFact
              label="Applications open"
              value={formatDate(opportunity.opensAt)}
            />
            <ApplyFact
              label="Deadline"
              value={formatDate(opportunity.deadline)}
            />
            <ApplyFact
              label="Location"
              value={opportunity.location ?? "Not specified"}
            />
            <ApplyFact
              label="Format"
              value={opportunity.remoteType ?? "Not specified"}
            />
            <ApplyFact
              label="Paid status"
              value={opportunity.paidStatus ?? "Not specified"}
            />
          </div>
        </section>

        {isSuccess ? (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6" />
            <h2 className="mt-4 text-xl font-semibold">
              {query.external === "1"
                ? isPrivateStudentOpportunity
                  ? "External submission confirmed"
                  : "Host submission confirmed"
                : "Application submitted"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">
              {query.external === "1"
                ? isPrivateStudentOpportunity
                  ? "You confirmed that you personally submitted this student-added application outside Future Physicians. FP did not submit or verify the external form."
                  : "You confirmed submission through the host organization’s portal. Future Physicians did not submit the external form."
                : "Your application has been submitted through the configured Future Physicians workflow."}{" "}
              You can track your status in the Applications section of your
              dashboard.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                href={`/dashboard/student/opportunities/${opportunity.id}`}
              >
                Back to opportunity
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-300 px-4 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                href="/dashboard/student/applications"
              >
                View applications
              </Link>
            </div>
          </section>
        ) : isAlreadyApplied ? (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2
                aria-hidden="true"
                className="h-5 w-5 text-emerald-600"
              />
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                {hasRecordedSubmission
                  ? "Already submitted"
                  : "Existing application"}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {hasRecordedSubmission
                ? "Application already submitted"
                : "Application workspace already exists"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {hasRecordedSubmission && existingApplication?.submittedAt
                ? `You submitted this application on ${formatDate(existingApplication.submittedAt)}.`
                : existingApplication
                  ? `This application is currently ${formatStatus(existingApplication.status).toLowerCase()}. Continue in its workspace to review the next step.`
                  : "No duplicate application was created. Review your existing applications before trying again."}
            </p>
            {existingApplication?.resume?.fileName ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Resume attached: {existingApplication.resume.fileName}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                href={`/dashboard/student/opportunities/${opportunity.id}`}
              >
                Back to opportunity
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                href={
                  existingApplication
                    ? `/dashboard/student/applications/${existingApplication.id}`
                    : "/dashboard/student/applications"
                }
              >
                {existingApplication
                  ? "Open workspace"
                  : "View my applications"}
              </Link>
            </div>
          </section>
        ) : !profile ? (
          <section className="space-y-4">
            <EmptyState
              description="Complete student onboarding before applying so Future Physicians can submit your profile details with the application."
              icon={UserRound}
              title="Complete your profile first"
            />
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/dashboard/student/onboarding"
            >
              Go to onboarding
            </Link>
          </section>
        ) : decision.kind === "PREPARATION_ONLY" ? (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <FileText aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {openingMessage}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Start or continue preparing your documents and application plan.
              Internal submission and external submission confirmation stay
              unavailable until this opportunity is open.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {existingApplication ? (
                <Link
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                  href={`/dashboard/student/applications/${existingApplication.id}`}
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
                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
                    type="submit"
                  >
                    Start preparation
                  </button>
                </form>
              )}
              {officialSourceUrl ? (
                <a
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground"
                  href={officialSourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {sourceLinkLabel}
                </a>
              ) : null}
            </div>
          </section>
        ) : decision.kind === "EXTERNAL_CONFIRMATION" &&
          externalSubmissionUrl ? (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <ExternalApplicationConfirmationForm
              officialApplicationUrl={externalSubmissionUrl}
              opportunityId={opportunity.id}
              studentProvided={isPrivateStudentOpportunity}
            />
          </section>
        ) : decision.kind === "EXTERNAL_CONFIRMATION" ? (
          <EmptyState
            description={
              isPrivateStudentOpportunity
                ? "The student-provided link is missing or invalid. Return to the private source details before confirming a submission."
                : "The host application link is missing or invalid. Save this listing and report the issue so Future Physicians can verify it."
            }
            icon={FileText}
            title={
              isPrivateStudentOpportunity
                ? "Student-provided link unavailable"
                : "Official application link unavailable"
            }
          />
        ) : resumes.length === 0 ? (
          <section className="space-y-4">
            <EmptyState
              description="Upload a PDF or DOCX resume from your student dashboard before applying."
              icon={FileText}
              title="Upload a resume first"
            />
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/dashboard/student"
            >
              Go to resume upload
            </Link>
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <StudentApplicationForm
              opportunityId={opportunity.id}
              recommendationSource={
                query.source === "recommendation" ? "recommendation" : ""
              }
              resumes={resumes}
            />
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

function ApplyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
