import { Building2 } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";

export default async function PartnerOrganizationPage() {
  const { memberships, primaryOrganization } = await getCurrentPartnerContext();

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/organization")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="partner" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Organization profile
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Organization
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Review the partner organization records linked to your account.
          </p>
        </header>

        {!primaryOrganization ? (
          <EmptyState
            description="Your partner account is not linked to an organization yet. An admin can approve and link your account from the admin partners page."
            icon={Building2}
            title="Organization not connected"
          />
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <StatCard
                helper="Organizations linked to your account."
                label="Linked organizations"
                value={memberships.length.toString()}
              />
              <StatCard
                helper="Current verification state."
                label="Verification"
                value={primaryOrganization.verificationStatus}
              />
              <StatCard
                helper="Operational partner status."
                label="Partner status"
                value={primaryOrganization.status}
              />
            </section>

            <section className="rounded-xl border border-border bg-background p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-foreground">
                {primaryOrganization.name}
              </h2>
              <dl className="mt-6 grid gap-4 md:grid-cols-2">
                <OrganizationDetail
                  label="Type"
                  value={primaryOrganization.type}
                />
                <OrganizationDetail
                  label="Contact email"
                  value={primaryOrganization.contactEmail}
                />
                <OrganizationDetail
                  label="Website"
                  value={primaryOrganization.website}
                />
                <OrganizationDetail
                  label="Location"
                  value={
                    primaryOrganization.location ||
                    [
                      primaryOrganization.city,
                      primaryOrganization.state,
                      primaryOrganization.country,
                    ]
                      .filter(Boolean)
                      .join(", ")
                  }
                />
              </dl>
              <div className="mt-6 rounded-lg border border-border bg-muted/35 p-4">
                <p className="text-sm font-medium text-foreground">
                  Description
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {primaryOrganization.description || "Not provided."}
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function OrganizationDetail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-4">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-sm font-semibold text-foreground">
        {value || "Not provided"}
      </dd>
    </div>
  );
}
