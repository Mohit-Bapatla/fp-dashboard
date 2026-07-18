import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getStudentNavItems } from "@/lib/student/navigation";

export default function StudentApplicationWorkspaceLoading() {
  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/applications")}
      role="student"
    >
      <div
        aria-busy="true"
        aria-live="polite"
        className="space-y-6"
        role="status"
      >
        <span className="sr-only">Loading application workspace</span>
        <div className="h-52 animate-pulse rounded-xl border border-border bg-muted/40" />
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/30 xl:col-span-2" />
          <div className="h-72 animate-pulse rounded-xl border border-border bg-muted/30" />
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/30" />
      </div>
    </DashboardShell>
  );
}
