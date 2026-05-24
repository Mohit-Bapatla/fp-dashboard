import { AccountSettingsForm } from "@/components/dashboard/account-settings-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function AdminSettingsPage() {
  const { userId } = await assertAdminAccess();
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
      navItems={getAdminNavItems("/dashboard/admin/settings")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="admin" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Settings
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Manage the display name used for admin actions and audit context.
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
