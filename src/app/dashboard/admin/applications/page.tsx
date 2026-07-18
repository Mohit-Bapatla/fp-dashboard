import { ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { AdminApplicationList } from "@/components/admin/admin-application-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Prisma } from "@/generated/prisma/client";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { getRecordCommentThread } from "@/lib/comments/record-comments";
import { prisma } from "@/lib/db/prisma";
import { getPageParam, getPagination, getTotalPages } from "@/lib/pagination";

type AdminApplicationsPageProps = {
  searchParams: Promise<{
    q?: string;
    organizationId?: string;
    opportunityId?: string;
    page?: string;
    status?: string;
  }>;
};

const statusOptions: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusFilter(value: string | undefined) {
  return value && statusOptions.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : "";
}

function buildRedirectTo({
  organizationId,
  opportunityId,
  query,
  status,
}: {
  organizationId: string;
  opportunityId: string;
  query: string;
  status: string;
}) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (status) {
    params.set("status", status);
  }

  if (organizationId) {
    params.set("organizationId", organizationId);
  }

  if (opportunityId) {
    params.set("opportunityId", opportunityId);
  }

  const search = params.toString();

  return search
    ? `/dashboard/admin/applications?${search}`
    : "/dashboard/admin/applications";
}

export default async function AdminApplicationsPage({
  searchParams,
}: AdminApplicationsPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = getStatusFilter(params.status);
  const page = getPageParam(params.page);
  const pagination = getPagination(page);
  const [organizations, opportunities] = await Promise.all([
    prisma.partnerOrganization.findMany({
      where: { isSystemPlaceholder: false },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.opportunity.findMany({
      where: {
        organization: { isSystemPlaceholder: false },
        visibility: "PUBLIC_DIRECTORY",
      },
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);
  const organizationIds = new Set(
    organizations.map((organization) => organization.id),
  );
  const opportunityIds = new Set(
    opportunities.map((opportunity) => opportunity.id),
  );
  const organizationId =
    params.organizationId && organizationIds.has(params.organizationId)
      ? params.organizationId
      : "";
  const opportunityId =
    params.opportunityId && opportunityIds.has(params.opportunityId)
      ? params.opportunityId
      : "";
  const where: Prisma.ApplicationWhereInput = {
    opportunity: {
      organization: { isSystemPlaceholder: false },
      visibility: "PUBLIC_DIRECTORY",
    },
  };

  if (query) {
    where.OR = [
      {
        studentProfile: {
          user: {
            email: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          user: {
            firstName: {
              contains: query,
            },
          },
        },
      },
      {
        studentProfile: {
          user: {
            lastName: {
              contains: query,
            },
          },
        },
      },
      {
        opportunity: {
          title: {
            contains: query,
          },
        },
      },
      {
        opportunity: {
          organization: {
            name: {
              contains: query,
            },
          },
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (organizationId || opportunityId) {
    where.opportunity = {
      organization: { isSystemPlaceholder: false },
      visibility: "PUBLIC_DIRECTORY",
      ...(organizationId ? { organizationId } : {}),
      ...(opportunityId ? { id: opportunityId } : {}),
    };
  }

  const [
    applications,
    platformApplicationCount,
    filteredCount,
    needsReviewCount,
    interviewCount,
  ] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: [
        {
          submittedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        status: true,
        statement: true,
        submittedAt: true,
        createdAt: true,
        reviewedAt: true,
        onboardingItems: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            completedAt: true,
            description: true,
            id: true,
            required: true,
            reviewedAt: true,
            reviewerNotes: true,
            status: true,
            studentNotes: true,
            submittedAt: true,
            title: true,
          },
        },
        interviewRequests: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            location: true,
            meetingLink: true,
            notes: true,
            selectedSlotId: true,
            status: true,
            studentResponseNotes: true,
            proposedSlots: {
              orderBy: {
                startsAt: "asc",
              },
              select: {
                endsAt: true,
                id: true,
                selected: true,
                startsAt: true,
              },
            },
          },
        },
        resume: {
          select: {
            fileName: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        studentProfile: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          organization: { isSystemPlaceholder: false },
          visibility: "PUBLIC_DIRECTORY",
        },
      },
    }),
    prisma.application.count({
      where,
    }),
    prisma.application.count({
      where: {
        opportunity: {
          organization: { isSystemPlaceholder: false },
          visibility: "PUBLIC_DIRECTORY",
        },
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          organization: { isSystemPlaceholder: false },
          visibility: "PUBLIC_DIRECTORY",
        },
        status: "INTERVIEW",
      },
    }),
  ]);
  const totalPages = getTotalPages(filteredCount, pagination.pageSize);
  const applicationsWithThreads = await Promise.all(
    applications.map(async (application) => ({
      ...application,
      commentThread: await getRecordCommentThread({
        entityId: application.id,
        entityType: "APPLICATION",
      }),
    })),
  );
  const redirectTo = buildRedirectTo({
    organizationId,
    opportunityId,
    query,
    status,
  });

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/applications")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Application operations
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Applications
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review submitted applications, selected resume filenames,
              statements, and safe status transitions across the platform.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <ClipboardCheck aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Admin application stats"
          className="grid gap-4 md:grid-cols-3"
        >
          <StatCard
            helper="All application records in the database."
            label="Applications"
            value={platformApplicationCount.toString()}
          />
          <StatCard
            helper="Submitted or under-review applications."
            label="Needs review"
            value={needsReviewCount.toString()}
          />
          <StatCard
            helper="Applications currently marked for interview."
            label="Interview"
            value={interviewCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_minmax(180px,0.8fr)_minmax(180px,0.8fr)_auto] lg:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search student, opportunity, or partner"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">Any status</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Partner
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={organizationId}
                name="organizationId"
              >
                <option value="">All partners</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Opportunity
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={opportunityId}
                name="opportunityId"
              >
                <option value="">All opportunities</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.title} - {opportunity.organization.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Apply
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/admin/applications"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <AdminApplicationList
          applications={applicationsWithThreads}
          redirectTo={redirectTo}
        />
        <PaginationControls
          page={page}
          pathname="/dashboard/admin/applications"
          searchParams={{
            ...(query ? { q: query } : {}),
            ...(status ? { status } : {}),
            ...(organizationId ? { organizationId } : {}),
            ...(opportunityId ? { opportunityId } : {}),
          }}
          totalCount={filteredCount}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}
