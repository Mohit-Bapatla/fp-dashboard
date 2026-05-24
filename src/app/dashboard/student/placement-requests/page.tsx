import { ArrowRight, FileClock, UserRound } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentPlacementRequestList } from "@/components/placement-requests/student-placement-request-list";
import { prisma } from "@/lib/db/prisma";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";

export default async function StudentPlacementRequestsPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;

  if (!profile) {
    return (
      <DashboardShell
        navItems={getStudentNavItems("/dashboard/student/placement-requests")}
        role="student"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="student" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Placement Requests
            </h1>
          </header>
          <div className="space-y-4">
            <EmptyState
              description="Complete student onboarding before asking the placement team to research personalized opportunities."
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

  const [requests, activeCount, closedCount] = await Promise.all([
    prisma.placementRequest.findMany({
      where: {
        studentProfileId: profile.id,
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
      ],
      select: {
        id: true,
        availability: true,
        createdAt: true,
        description: true,
        locationPreference: true,
        priority: true,
        remotePreference: true,
        requestedOpportunityTypes: true,
        requestedSpecialties: true,
        status: true,
        title: true,
        updatedAt: true,
        urgency: true,
      },
    }),
    prisma.placementRequest.count({
      where: {
        studentProfileId: profile.id,
        status: {
          notIn: ["PLACED", "CLOSED"],
        },
      },
    }),
    prisma.placementRequest.count({
      where: {
        studentProfileId: profile.id,
        status: {
          in: ["PLACED", "CLOSED"],
        },
      },
    }),
  ]);
  const feedbackByRequestId = new Map(
    (
      await prisma.feedback.findMany({
        where: {
          authorId: user.id,
          entityId: {
            in: requests.map((request) => request.id),
          },
          entityType: "PLACEMENT_REQUEST",
          feedbackType: "STUDENT_PLACEMENT_REQUEST",
        },
        select: {
          entityId: true,
          notes: true,
          rating: true,
        },
      })
    ).map((feedback) => [feedback.entityId, feedback]),
  );
  const requestsWithFeedback = requests.map((request) => ({
    ...request,
    feedback: feedbackByRequestId.get(request.id) ?? null,
  }));

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/placement-requests")}
      role="student"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="student" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Personalized support
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Placement Requests
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Ask the Future Physicians team to help research opportunities when
              the board does not have the right fit.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            href="/dashboard/student/placement-requests/new"
          >
            New request
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="All placement requests you have submitted."
            label="Total requests"
            value={requests.length.toString()}
          />
          <StatCard
            helper="Requests still being researched or coordinated."
            label="Active"
            value={activeCount.toString()}
          />
          <StatCard
            helper="Requests that resulted in placement or were closed."
            label="Completed"
            value={closedCount.toString()}
          />
        </section>

        <StudentPlacementRequestList requests={requestsWithFeedback} />

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <FileClock aria-hidden="true" className="h-5 w-5 text-primary" />
          <h2 className="mt-4 text-base font-semibold text-foreground">
            Resume recommended
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Placement requests can be submitted without a resume, but uploading
            one helps staff share stronger context with potential partners.
          </p>
          <Link
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            href="/dashboard/student"
          >
            Manage resume
          </Link>
        </section>
      </div>
    </DashboardShell>
  );
}
