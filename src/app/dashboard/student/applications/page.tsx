import { ClipboardCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentApplicationList } from "@/components/student/student-application-list";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { getRecordCommentThread } from "@/lib/comments/record-comments";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";

type StudentApplicationsPageProps = {
  searchParams: Promise<{
    status?: string;
    view?: string;
  }>;
};

const activeStatuses: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
];
const historyStatuses: ApplicationStatus[] = ["REJECTED", "WITHDRAWN"];
const statusOptions: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "DRAFT",
];
const viewOptions = ["active", "history", "all"] as const;

type ApplicationView = (typeof viewOptions)[number];

function formatStatus(status: ApplicationStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusFilter(value: string | undefined) {
  return value && statusOptions.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : "";
}

function getViewFilter(value: string | undefined): ApplicationView {
  return value && viewOptions.includes(value as ApplicationView)
    ? (value as ApplicationView)
    : "active";
}

function statusWhereForView(view: ApplicationView) {
  if (view === "active") {
    return activeStatuses;
  }

  if (view === "history") {
    return historyStatuses;
  }

  return undefined;
}

export default async function StudentApplicationsPage({
  searchParams,
}: StudentApplicationsPageProps) {
  const { userId } = await assertStudentAccess();
  const params = await searchParams;
  const view = getViewFilter(params.view);
  const status = getStatusFilter(params.status);
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;

  if (!profile) {
    return (
      <DashboardShell
        navItems={getStudentNavItems("/dashboard/student/applications")}
        role="student"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="student" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Applications
            </h1>
          </header>
          <div className="space-y-4">
            <EmptyState
              description="Complete student onboarding before applying to opportunities or tracking application progress."
              icon={UserRound}
              title="Complete your profile first"
            />
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              href="/dashboard/student/onboarding"
            >
              Go to onboarding
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const statusScope = status ? [status] : statusWhereForView(view);
  const where = {
    studentProfileId: profile.id,
    ...(statusScope
      ? {
          status: {
            in: statusScope,
          },
        }
      : {}),
  };

  const [applications, totalCount, activeCount, historyCount] =
    await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: [
          {
            submittedAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          id: true,
          status: true,
          statement: true,
          submittedAt: true,
          createdAt: true,
          resume: {
            select: {
              fileName: true,
            },
          },
          onboardingItems: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              completedAt: true,
              description: true,
              id: true,
              required: true,
              reviewedAt: true,
              reviewerNotes: true,
              status: true,
              studentNotes: true,
              submittedAt: true,
              title: true,
            },
          },
          opportunity: {
            select: {
              id: true,
              title: true,
              organization: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.application.count({
        where: {
          studentProfileId: profile.id,
        },
      }),
      prisma.application.count({
        where: {
          studentProfileId: profile.id,
          status: {
            in: activeStatuses,
          },
        },
      }),
      prisma.application.count({
        where: {
          studentProfileId: profile.id,
          status: {
            in: historyStatuses,
          },
        },
      }),
    ]);
  const feedbackByApplicationId = new Map(
    (
      await prisma.feedback.findMany({
        where: {
          authorId: user.id,
          entityId: {
            in: applications.map((application) => application.id),
          },
          entityType: "APPLICATION",
          feedbackType: "STUDENT_APPLICATION_EXPERIENCE",
        },
        select: {
          entityId: true,
          notes: true,
          rating: true,
        },
      })
    ).map((feedback) => [feedback.entityId, feedback]),
  );
  const applicationsWithThreads = await Promise.all(
    applications.map(async (application) => ({
      ...application,
      feedback: feedbackByApplicationId.get(application.id) ?? null,
      commentThread: await getRecordCommentThread({
        entityId: application.id,
        entityType: "APPLICATION",
      }),
    })),
  );

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/applications")}
      role="student"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="student" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Application tracker
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Applications
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Track your submitted opportunity applications, attached resume,
              statements, and current review status.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <ClipboardCheck aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Application tracker stats"
          className="grid gap-4 md:grid-cols-3"
        >
          <StatCard
            helper="All applications submitted from your student profile."
            label="Total applications"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Applications still in process or accepted."
            label="Active"
            value={activeCount.toString()}
          />
          <StatCard
            helper="Withdrawn or rejected applications."
            label="History"
            value={historyCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[180px_220px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              View
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={view}
                name="view"
              >
                <option value="active">Active</option>
                <option value="history">History</option>
                <option value="all">All</option>
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">Any status</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatStatus(option)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                type="submit"
              >
                Apply filters
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/student/applications"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <StudentApplicationList
          applications={applicationsWithThreads}
          hasAnyApplications={totalCount > 0}
        />
      </div>
    </DashboardShell>
  );
}
