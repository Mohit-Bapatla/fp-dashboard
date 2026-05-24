import { Bookmark } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";

export default async function StudentSavedPage() {
  await assertStudentAccess();

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/saved")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Saved opportunities
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Saved
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Saved opportunity tracking is not enabled yet. This page stays
            available so the sidebar does not lead to a dead end.
          </p>
        </header>

        <EmptyState
          description="Use the opportunity board to browse current listings. A future saved-list workflow can store favorites when the data model supports it."
          icon={Bookmark}
          title="No saved opportunities yet"
        />
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          href="/dashboard/student/opportunities"
        >
          Browse opportunities
        </Link>
      </div>
    </DashboardShell>
  );
}
