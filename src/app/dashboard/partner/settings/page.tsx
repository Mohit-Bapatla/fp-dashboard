import { AccountSettingsForm } from "@/components/dashboard/account-settings-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";

export default async function PartnerSettingsPage() {
  const { user } = await getCurrentPartnerContext();

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/settings")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="partner" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Settings
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Manage your app-level display name and review linked organization
            access from the organization page.
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
