import { Building2 } from "lucide-react";
import Link from "next/link";

import {
  createAdminPartnerOrganization,
  linkPartnerUserToOrganization,
} from "@/app/dashboard/admin/partners/actions";
import {
  AdminPartnerList,
  type AdminPartnerListItem,
} from "@/components/admin/admin-partner-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Prisma } from "@/generated/prisma/client";
import type { PartnerStatus } from "@/generated/prisma/enums";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { getPageParam, getPagination, getTotalPages } from "@/lib/pagination";

type AdminPartnersPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

const partnerStatusOptions: PartnerStatus[] = [
  "NOT_CONTACTED",
  "CONTACTED",
  "FOLLOW_UP_NEEDED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "PARTNERED",
  "REJECTED",
  "NO_RESPONSE",
  "PAUSED",
];

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusFilter(value: string | undefined) {
  return value && partnerStatusOptions.includes(value as PartnerStatus)
    ? (value as PartnerStatus)
    : "";
}

export default async function AdminPartnersPage({
  searchParams,
}: AdminPartnersPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = getStatusFilter(params.status);
  const page = getPageParam(params.page);
  const pagination = getPagination(page);
  const where: Prisma.PartnerOrganizationWhereInput = {};

  if (query) {
    where.OR = [
      {
        name: {
          contains: query,
        },
      },
      {
        contactEmail: {
          contains: query,
        },
      },
      {
        type: {
          contains: query,
        },
      },
      {
        location: {
          contains: query,
        },
      },
      {
        city: {
          contains: query,
        },
      },
      {
        state: {
          contains: query,
        },
      },
      {
        country: {
          contains: query,
        },
      },
    ];
  }

  if (status) {
    where.status = status;
  }

  const [
    partners,
    totalCount,
    filteredCount,
    partneredCount,
    opportunityCount,
    pendingPartnerUsers,
    organizationOptions,
  ] = await Promise.all([
    prisma.partnerOrganization.findMany({
      where,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
        location: true,
        city: true,
        state: true,
        country: true,
        contactEmail: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            opportunities: true,
          },
        },
        opportunities: {
          select: {
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
    }),
    prisma.partnerOrganization.count(),
    prisma.partnerOrganization.count({
      where,
    }),
    prisma.partnerOrganization.count({
      where: {
        status: "PARTNERED",
      },
    }),
    prisma.opportunity.count(),
    prisma.user.findMany({
      where: {
        role: "PARTNER",
        partnerMemberships: {
          none: {},
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    }),
    prisma.partnerOrganization.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);
  const totalPages = getTotalPages(filteredCount, pagination.pageSize);

  const partnerItems: AdminPartnerListItem[] = partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    status: partner.status,
    type: partner.type,
    location: partner.location,
    city: partner.city,
    state: partner.state,
    country: partner.country,
    contactEmail: partner.contactEmail,
    createdAt: partner.createdAt,
    memberCount: partner._count.members,
    opportunityCount: partner._count.opportunities,
    applicationCount: partner.opportunities.reduce(
      (total, opportunity) => total + opportunity._count.applications,
      0,
    ),
  }));

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/partners")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Partner records
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Partners
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review partner organization status, contacts, member links,
              opportunities, and application volume.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Building2 aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Admin partner stats"
          className="grid gap-4 md:grid-cols-3"
        >
          <StatCard
            helper="All partner organization records."
            label="Partners"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Organizations currently marked as partnered."
            label="Partnered"
            value={partneredCount.toString()}
          />
          <StatCard
            helper="Opportunities connected to partner organizations."
            label="Opportunities"
            value={opportunityCount.toString()}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Add partner organization
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Create or update an organization record before linking partner
              users.
            </p>
            <form
              action={createAdminPartnerOrganization}
              className="mt-5 grid gap-4 md:grid-cols-2"
            >
              <input
                name="redirectTo"
                type="hidden"
                value="/dashboard/admin/partners"
              />
              <label className="text-sm font-medium text-foreground">
                Name
                <input
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  name="name"
                  required
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Status
                <select
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  defaultValue="PARTNERED"
                  name="status"
                >
                  {partnerStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatEnumLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-foreground">
                Type
                <input
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  name="type"
                  placeholder="Clinic, hospital, lab"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Contact email
                <input
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  name="contactEmail"
                  type="email"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Website
                <input
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  name="website"
                  type="url"
                />
              </label>
              <label className="text-sm font-medium text-foreground">
                Location
                <input
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                  name="location"
                  placeholder="Dallas, TX"
                />
              </label>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Description
                  <textarea
                    className="mt-2 min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                    name="description"
                  />
                </label>
              </div>
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 md:w-fit"
                type="submit"
              >
                Save organization
              </button>
            </form>
          </article>

          <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              Approve and link partner users
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Partner users appear here after they sign in with a PARTNER role
              but before an organization is connected.
            </p>
            {pendingPartnerUsers.length > 0 &&
            organizationOptions.length > 0 ? (
              <div className="mt-5 space-y-4">
                {pendingPartnerUsers.map((user) => (
                  <form
                    action={linkPartnerUserToOrganization}
                    className="rounded-lg border border-border bg-muted/30 p-4"
                    key={user.id}
                  >
                    <input
                      name="redirectTo"
                      type="hidden"
                      value="/dashboard/admin/partners"
                    />
                    <input name="partnerUserId" type="hidden" value={user.id} />
                    <p className="text-sm font-semibold text-foreground">
                      {[user.firstName, user.lastName]
                        .filter(Boolean)
                        .join(" ") || user.email}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto] md:items-end">
                      <label className="text-sm font-medium text-foreground">
                        Organization
                        <select
                          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                          name="organizationId"
                          required
                        >
                          {organizationOptions.map((organization) => (
                            <option
                              key={organization.id}
                              value={organization.id}
                            >
                              {organization.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        Title
                        <input
                          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                          name="title"
                          placeholder="Coordinator"
                        />
                      </label>
                      <button
                        className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                        type="submit"
                      >
                        Link
                      </button>
                    </div>
                  </form>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                {organizationOptions.length === 0
                  ? "Create a partner organization first."
                  : "No pending partner users need linking."}
              </div>
            )}
          </article>
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search name, contact, type, or location"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">All statuses</option>
                {partnerStatusOptions.map((option) => (
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
                Apply filters
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/admin/partners"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <AdminPartnerList partners={partnerItems} />
        <PaginationControls
          page={page}
          pathname="/dashboard/admin/partners"
          searchParams={{
            ...(query ? { q: query } : {}),
            ...(status ? { status } : {}),
          }}
          totalCount={filteredCount}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}
