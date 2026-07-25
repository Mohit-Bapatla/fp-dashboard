import {
  BarChart3,
  Building2,
  Handshake,
  LifeBuoy,
  Rocket,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PartnerDashboardSummary } from "@/components/partner/partner-dashboard-summary";
import { PartnerOpportunityList } from "@/components/partner/partner-opportunity-list";
import { prisma } from "@/lib/db/prisma";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";
import { loadOptionalWorkflowData } from "@/lib/reliability/workflow-errors";

export default async function PartnerDashboardPage() {
  const context = await getCurrentPartnerContext();
  const { organizationIds, primaryOrganization } = context;

  if (organizationIds.length === 0 || !primaryOrganization) {
    return (
      <DashboardShell
        navItems={getPartnerNavItems("/dashboard/partner")}
        role="partner"
      >
        <div className="space-y-8">
          <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
            <RoleBadge className="mb-5" role="partner" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Organization workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Partner Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              View organization details and opportunity activity once your
              partner account is connected to an organization.
            </p>
          </header>
          <EmptyState
            description="Your account is authenticated as a partner, but it is not linked to a partner organization yet. A Future Physicians administrator will connect your account before organization data appears here."
            icon={Building2}
            title="Organization not connected"
          />
        </div>
      </DashboardShell>
    );
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      visibility: "PUBLIC_DIRECTORY",
      organizationId: {
        in: organizationIds,
      },
      organization: {
        isSystemPlaceholder: false,
      },
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
    ],
    take: 8,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      deadline: true,
      capacity: true,
      updatedAt: true,
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
  });
  const statLoad = (action: string, load: () => Promise<number>) =>
    loadOptionalWorkflowData({
      action,
      fallback: 0,
      load,
      route: "/dashboard/partner",
      userId: context.user.id,
    });
  const [
    totalOpportunities,
    publishedOpportunities,
    closedOpportunities,
    totalApplications,
  ] = await Promise.all([
    statLoad("load_partner_total_opportunities", () =>
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
    ),
    statLoad("load_partner_published_opportunities", () =>
      prisma.opportunity.count({
        where: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
          status: "PUBLISHED",
        },
      }),
    ),
    statLoad("load_partner_closed_opportunities", () =>
      prisma.opportunity.count({
        where: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
          status: "CLOSED",
        },
      }),
    ),
    statLoad("load_partner_total_applications", () =>
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
    ),
  ]);

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-xl border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="partner" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Organization workspace
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Partner Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review your linked organization profile, opportunity inventory,
              and application volume across Future Physicians records.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
            <Handshake aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Partner opportunity stats"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            helper="All opportunities connected to your linked organization records."
            label="Total opportunities"
            value={
              totalOpportunities.available
                ? totalOpportunities.value.toString()
                : "Unavailable"
            }
          />
          <StatCard
            helper="Published opportunities visible in student workflows."
            label="Published"
            value={
              publishedOpportunities.available
                ? publishedOpportunities.value.toString()
                : "Unavailable"
            }
          />
          <StatCard
            helper="Closed opportunity records owned by your organization."
            label="Closed"
            value={
              closedOpportunities.available
                ? closedOpportunities.value.toString()
                : "Unavailable"
            }
          />
          <StatCard
            helper="Applications across your linked organization opportunities."
            label="Applications"
            value={
              totalApplications.available
                ? totalApplications.value.toString()
                : "Unavailable"
            }
          />
        </section>

        <PartnerDashboardSummary
          organization={primaryOrganization}
          organizationCount={organizationIds.length}
        />

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <BarChart3 aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Organization analytics
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review application volume, applicant statuses, and opportunity
                pipeline counts for your linked organizations.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/partner/analytics"
            >
              Open analytics
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <Handshake aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Partner success
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track applicant pipeline, interviews, service hours, and
                candidate quality feedback for your organization.
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/partner/success"
            >
              Open success dashboard
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <Rocket aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Partner beta readiness
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review the partner beta checklist, then use support to report
                blocker details with role, URL, steps, and expected behavior.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/partner/beta"
              >
                <Rocket aria-hidden="true" className="h-4 w-4" />
                Beta guide
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/support"
              >
                <LifeBuoy aria-hidden="true" className="h-4 w-4" />
                Support
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Organization opportunities
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Recent opportunities connected to your organization. Select an
              opportunity to review applicants and manage listings.
            </p>
          </div>
          <PartnerOpportunityList opportunities={opportunities} />
        </section>
      </div>
    </DashboardShell>
  );
}
