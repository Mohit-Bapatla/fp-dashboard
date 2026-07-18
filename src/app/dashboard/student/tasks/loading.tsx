import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getStudentNavItems } from "@/lib/student/navigation";

export default function StudentTasksLoading() {
  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/tasks")}
      role="student"
    >
      <div
        aria-busy="true"
        aria-live="polite"
        className="space-y-6"
        role="status"
      >
        <span className="sr-only">Loading application tasks</span>
        <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
        <div className="h-52 animate-pulse rounded-xl border border-border bg-muted/30" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
          <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
        </div>
      </div>
    </DashboardShell>
  );
}
