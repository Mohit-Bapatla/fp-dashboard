import { CheckCircle2, FileText, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentApplicationForm } from "@/components/student/student-application-form";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";

type StudentOpportunityApplyPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
  searchParams: Promise<{
    alreadyApplied?: string;
    source?: string;
    success?: string;
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

export default async function StudentOpportunityApplyPage({
  params,
  searchParams,
}: StudentOpportunityApplyPageProps) {
  const { userId } = await assertStudentAccess();
  const { opportunityId } = await params;
  const query = await searchParams;
  const [user, opportunity] = await Promise.all([
    getCurrentStudentProfile(userId),
    prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        status: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        location: true,
        remoteType: true,
        paidStatus: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  if (!opportunity) {
    notFound();
  }

  const profile = user.studentProfile;
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
  const isAlreadyApplied = query.alreadyApplied === "1" || existingApplication;

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
            Apply to Opportunity
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Submit your profile and selected resume for this published
            opportunity.
          </p>
        </header>

        <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            {opportunity.organization.name}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            {opportunity.title}
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              Application submitted
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6">
              Your application has been submitted. You can track your status in
              the Applications section of your dashboard.
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
              <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-600" />
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                Already applied
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              Application already submitted
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              You have already submitted an application for this opportunity.
              {existingApplication?.submittedAt
                ? ` Submitted ${formatDate(existingApplication.submittedAt)}.`
                : ""}
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
                href="/dashboard/student/applications"
              >
                View my applications
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
