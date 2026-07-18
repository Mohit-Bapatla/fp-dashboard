import { Building2, Plus } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PartnerOpportunityManagementList } from "@/components/partner/partner-opportunity-management-list";
import type { OpportunityStatus } from "@/generated/prisma/enums";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";
import { prisma } from "@/lib/db/prisma";

type PartnerOpportunitiesPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusOptions = [
  "DRAFT",
  "PENDING_APPROVAL",
  "PUBLISHED",
  "REJECTED",
  "CLOSED",
  "ARCHIVED",
] as const satisfies readonly OpportunityStatus[];

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusFilter(value: string | undefined) {
  return value && statusOptions.includes(value as OpportunityStatus)
    ? (value as OpportunityStatus)
    : "";
}

export default async function PartnerOpportunitiesPage({
  searchParams,
}: PartnerOpportunitiesPageProps) {
  const context = await getCurrentPartnerContext();
  const params = await searchParams;
  const status = getStatusFilter(params.status);
  const { organizationIds } = context;

  if (organizationIds.length === 0) {
    return (
      <DashboardShell
        navItems={getPartnerNavItems("/dashboard/partner/opportunities")}
        role="partner"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="partner" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Opportunities
            </h1>
          </header>
          <EmptyState
            description="Your account is not linked to a partner organization yet. A Future Physicians administrator must connect your account before you can create opportunities."
            icon={Building2}
            title="Organization not connected"
          />
        </div>
      </DashboardShell>
    );
  }

  const where = {
    visibility: "PUBLIC_DIRECTORY" as const,
    organizationId: {
      in: organizationIds,
    },
    organization: {
      isSystemPlaceholder: false,
    },
    ...(status ? { status } : {}),
  };
  const [opportunities, totalCount, draftCount, pendingCount, publishedCount] =
    await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: [
          {
            updatedAt: "desc",
          },
        ],
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          specialty: true,
          location: true,
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
      }),
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
      prisma.opportunity.count({
        where: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
          status: "DRAFT",
        },
      }),
      prisma.opportunity.count({
        where: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
          status: "PENDING_APPROVAL",
        },
      }),
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
    ]);
  const redirectTo = status
    ? `/dashboard/partner/opportunities?status=${status}`
    : "/dashboard/partner/opportunities";

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/opportunities")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge role="partner" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Opportunity Posting
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Create drafts for your linked organization and submit them for
              Future Physicians admin approval.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            href="/dashboard/partner/opportunities/new"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New opportunity
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="All opportunity records connected to your organization."
            label="Total"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Draft opportunities that can still be edited."
            label="Drafts"
            value={draftCount.toString()}
          />
          <StatCard
            helper="Submitted opportunities waiting for admin approval."
            label="Pending approval"
            value={pendingCount.toString()}
          />
          <StatCard
            helper="Published opportunities visible to students."
            label="Published"
            value={publishedCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[220px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Apply filter
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/partner/opportunities"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <PartnerOpportunityManagementList
          opportunities={opportunities}
          redirectTo={redirectTo}
        />
      </div>
    </DashboardShell>
  );
}
