import { AccountSettingsForm } from "@/components/dashboard/account-settings-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffSettingsPage() {
  const { userId } = await assertPlacementQueueAccess();
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      clerkUserId: userId,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/settings")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="staff" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Settings
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Manage the app-level display name used across staff workflows.
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
