import { ExternalLink } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { ExternalOpportunityForm } from "@/components/student/external-opportunity-form";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getCompletedStudentProfile } from "@/lib/student/profile-completion";

export default async function AddExternalOpportunityPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const profile = getCompletedStudentProfile(user.studentProfile);

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/opportunities")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <RoleBadge className="mb-5" role="student" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                External application
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Add an opportunity you found
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                Keep a private application plan for a healthcare opportunity
                outside the verified FP directory. Continue where you left off
                without publishing the source to other students.
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
              <ExternalLink aria-hidden="true" className="h-6 w-6" />
            </div>
          </div>
        </header>

        {!profile ? (
          <section className="rounded-xl border border-border bg-background p-6">
            Complete student onboarding before creating a private application
            source.
          </section>
        ) : (
          <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <ExternalOpportunityForm />
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
