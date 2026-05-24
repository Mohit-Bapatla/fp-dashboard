import { AccountSettingsForm } from "@/components/dashboard/account-settings-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getStudentNavItems } from "@/lib/student/navigation";

export default async function StudentSettingsPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/settings")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Settings
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Manage the app-level display name used in dashboard records.
          </p>
        </header>

        <AccountSettingsForm
          email={user.email}
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
        />
      </div>
    </DashboardShell>
  );
}
