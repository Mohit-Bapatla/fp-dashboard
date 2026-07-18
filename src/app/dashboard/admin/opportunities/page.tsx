import { Plus } from "lucide-react";

import { OpportunityList } from "@/components/admin/opportunity-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import type {
  OpportunityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import {
  opportunityStatusOptions,
  opportunityTypeOptions,
} from "@/lib/admin/opportunity-validation";
import { prisma } from "@/lib/db/prisma";

type AdminOpportunitiesPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
  }>;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getFilterValue<T extends string>(
  value: string | undefined,
  options: readonly T[],
) {
  return value && options.includes(value as T) ? (value as T) : "";
}

export default async function AdminOpportunitiesPage({
  searchParams,
}: AdminOpportunitiesPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = getFilterValue<OpportunityStatus>(
    params.status,
    opportunityStatusOptions,
  );
  const type = getFilterValue<OpportunityType>(
    params.type,
    opportunityTypeOptions,
  );
  const where: Prisma.OpportunityWhereInput = {
    organization: { isSystemPlaceholder: false },
    visibility: "PUBLIC_DIRECTORY",
  };

  if (query) {
    where.OR = [
      {
        title: {
          contains: query,
        },
      },
      {
        specialty: {
          contains: query,
        },
      },
      {
        location: {
          contains: query,
        },
      },
      {
        organization: {
          name: {
            contains: query,
          },
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  const [opportunities, totalCount, publishedCount, draftCount, partnerCount] =
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
          specialty: true,
          status: true,
          location: true,
          remoteType: true,
          paidStatus: true,
          deadline: true,
          capacity: true,
          publishedAt: true,
          updatedAt: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.opportunity.count({
        where: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
      }),
      prisma.opportunity.count({
        where: {
          status: "PUBLISHED",
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
      }),
      prisma.opportunity.count({
        where: {
          status: "DRAFT",
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
      }),
      prisma.partnerOrganization.count({
        where: { isSystemPlaceholder: false },
      }),
    ]);

  const redirectSearchParams = new URLSearchParams();

  if (query) {
    redirectSearchParams.set("q", query);
  }

  if (status) {
    redirectSearchParams.set("status", status);
  }

  if (type) {
    redirectSearchParams.set("type", type);
  }

  const redirectTo = redirectSearchParams.toString()
    ? `/dashboard/admin/opportunities?${redirectSearchParams}`
    : "/dashboard/admin/opportunities";

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/opportunities")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-xl border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Admin management
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Opportunity Management
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Create partner-connected opportunities, keep listings in draft,
              and publish them when they are ready for student-facing workflows.
            </p>
          </div>
          <a
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            href="/dashboard/admin/opportunities/new"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New opportunity
          </a>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="All opportunity records in the database."
            label="Total opportunities"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Listings marked as visible for later student workflows."
            label="Published"
            value={publishedCount.toString()}
          />
          <StatCard
            helper="Draft listings still being prepared by admins."
            label="Drafts"
            value={draftCount.toString()}
          />
          <StatCard
            helper="Partner organizations available for opportunity setup."
            label="Partners"
            value={partnerCount.toString()}
          />
        </section>

        <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
                defaultValue={query}
                name="q"
                placeholder="Search title, specialty, location, or partner"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                defaultValue={status}
                name="status"
              >
                <option value="">All statuses</option>
                {opportunityStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Type
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                defaultValue={type}
                name="type"
              >
                <option value="">All types</option>
                {opportunityTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              type="submit"
            >
              Apply filters
            </button>
          </form>
        </section>

        <OpportunityList
          opportunities={opportunities}
          redirectTo={redirectTo}
        />
      </div>
    </DashboardShell>
  );
}
