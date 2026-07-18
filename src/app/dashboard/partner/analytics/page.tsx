import { BarChart3, BriefcaseBusiness, ClipboardCheck } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";

type CountByStatusItem = {
  _count: {
    _all: number;
  };
  status: string;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusCount(items: CountByStatusItem[], status: string) {
  return items.find((item) => item.status === status)?._count._all ?? 0;
}

export default async function PartnerAnalyticsPage() {
  const context = await getCurrentPartnerContext();
  const { organizationIds, primaryOrganization } = context;

  if (organizationIds.length === 0 || !primaryOrganization) {
    return (
      <DashboardShell
        navItems={getPartnerNavItems("/dashboard/partner/analytics")}
        role="partner"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="partner" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Partner Analytics
            </h1>
          </header>
          <EmptyState
            description="Analytics are available after your partner account is linked to at least one organization."
            icon={BriefcaseBusiness}
            title="Organization not connected"
          />
        </div>
      </DashboardShell>
    );
  }

  const [
    opportunityCount,
    applicationCount,
    opportunityStatusCounts,
    applicantStatusCounts,
    applicationsPerOpportunity,
  ] = await Promise.all([
    prisma.opportunity.count({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
    }),
    prisma.opportunity.groupBy({
      by: ["status"],
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.opportunity.findMany({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
      },
      orderBy: {
        applications: {
          _count: "desc",
        },
      },
      select: {
        id: true,
        status: true,
        title: true,
        organization: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    }),
  ]);
  const publishedCount = getStatusCount(opportunityStatusCounts, "PUBLISHED");
  const draftCount = getStatusCount(opportunityStatusCounts, "DRAFT");
  const pendingCount = getStatusCount(
    opportunityStatusCounts,
    "PENDING_APPROVAL",
  );
  const interviewCount = getStatusCount(applicantStatusCounts, "INTERVIEW");
  const acceptedCount = getStatusCount(applicantStatusCounts, "ACCEPTED");
  const rejectedCount = getStatusCount(applicantStatusCounts, "REJECTED");

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/analytics")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="partner" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Analytics v1
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Partner Analytics
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review opportunity volume, applicant status mix, and application
              counts for your linked partner organizations only.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <BarChart3 aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="All opportunities across your linked organizations."
            label="Opportunities"
            value={opportunityCount.toString()}
          />
          <StatCard
            helper="Applications attached to your opportunities."
            label="Applications"
            value={applicationCount.toString()}
          />
          <StatCard
            helper={`${draftCount} draft and ${pendingCount} pending approval.`}
            label="Published"
            value={publishedCount.toString()}
          />
          <StatCard
            helper={`${interviewCount} interview, ${acceptedCount} accepted, ${rejectedCount} rejected.`}
            label="Accepted"
            value={acceptedCount.toString()}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <StatusBreakdown
            icon={BriefcaseBusiness}
            items={opportunityStatusCounts}
            title="Opportunities by status"
          />
          <StatusBreakdown
            icon={ClipboardCheck}
            items={applicantStatusCounts}
            title="Applicants by status"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Applications per opportunity
          </h2>
          {applicationsPerOpportunity.length > 0 ? (
            <div className="mt-5 divide-y divide-border">
              {applicationsPerOpportunity.map((opportunity) => (
                <div
                  className="flex items-center justify-between gap-4 py-3"
                  key={opportunity.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {opportunity.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      {opportunity.organization.name} |{" "}
                      {formatEnumLabel(opportunity.status)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {opportunity._count.applications}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Opportunity application counts will appear after opportunities are
              created.
            </p>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function StatusBreakdown({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof BarChart3;
  items: CountByStatusItem[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      </div>
      {items.length > 0 ? (
        <div className="mt-5 divide-y divide-border">
          {items.map((item) => (
            <div
              className="flex items-center justify-between gap-4 py-3"
              key={item.status}
            >
              <p className="text-sm font-medium text-foreground">
                {formatEnumLabel(item.status)}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {item._count._all}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          No records yet.
        </p>
      )}
    </article>
  );
}
