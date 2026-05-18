import { ArrowLeft, FileClock, UserRound } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentPlacementRequestForm } from "@/components/placement-requests/student-placement-request-form";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";

export default async function NewStudentPlacementRequestPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    return (
      <DashboardShell
        navItems={getStudentNavItems("/dashboard/student/placement-requests")}
        role="student"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="student" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              New Placement Request
            </h1>
          </header>
          <div className="space-y-4">
            <EmptyState
              description="Complete student onboarding before submitting a personalized placement request."
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
              Placement request
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              New Placement Request
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Share what you are looking for so staff can research personalized
              placement options.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <FileClock aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <StudentPlacementRequestForm />
        </section>

        <Link
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          href="/dashboard/student/placement-requests"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to placement requests
        </Link>
      </div>
    </DashboardShell>
  );
}
