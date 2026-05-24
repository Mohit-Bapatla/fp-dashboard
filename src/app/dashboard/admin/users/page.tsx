import { Users } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Prisma } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { getPageParam, getPagination, getTotalPages } from "@/lib/pagination";

type AdminUsersPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    role?: string;
    status?: string;
  }>;
};

const roleOptions: UserRole[] = [
  "STUDENT",
  "PARTNER",
  "STAFF",
  "ADMIN",
  "SUPER_ADMIN",
];

function getRoleFilter(value: string | undefined) {
  return value && roleOptions.includes(value as UserRole)
    ? (value as UserRole)
    : "";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function formatName(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
}) {
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  );
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const role = getRoleFilter(params.role);
  const status =
    params.status === "linked" || params.status === "unlinked"
      ? params.status
      : "";
  const page = getPageParam(params.page);
  const pagination = getPagination(page);
  const where: Prisma.UserWhereInput = {};
  const andFilters: Prisma.UserWhereInput[] = [];

  if (role) {
    where.role = role;
  }

  if (query) {
    andFilters.push({
      OR: [
        { email: { contains: query } },
        { firstName: { contains: query } },
        { lastName: { contains: query } },
      ],
    });
  }

  if (status === "linked") {
    andFilters.push({
      OR: [
        { studentProfile: { isNot: null } },
        { partnerMemberships: { some: {} } },
      ],
    });
  } else if (status === "unlinked") {
    andFilters.push({
      partnerMemberships: { none: {} },
      studentProfile: { is: null },
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  const [users, filteredCount, totalCount, partnerUsersWithoutOrg] =
    await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          studentProfile: {
            select: {
              id: true,
            },
          },
          partnerMemberships: {
            select: {
              organization: {
                select: {
                  name: true,
                },
              },
            },
            take: 3,
          },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: "PARTNER",
          partnerMemberships: {
            none: {},
          },
        },
      }),
    ]);
  const totalPages = getTotalPages(filteredCount, pagination.pageSize);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/users")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="admin" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account directory
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Users
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Review app users, roles, and basic profile or partner linking status
            without exposing private records.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="All local app user rows."
            label="Users"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Users matching the current filters."
            label="Filtered"
            value={filteredCount.toString()}
          />
          <StatCard
            helper="Partner accounts waiting for organization linking."
            label="Pending partners"
            value={partnerUsersWithoutOrg.toString()}
          />
        </section>

        <section className="rounded-xl border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                defaultValue={query}
                name="q"
                placeholder="Search name or email"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Role
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                defaultValue={role}
                name="role"
              >
                <option value="">All roles</option>
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
                defaultValue={status}
                name="status"
              >
                <option value="">Any status</option>
                <option value="linked">Linked/profiled</option>
                <option value="unlinked">Unlinked</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Apply
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/admin/users"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        {users.length > 0 ? (
          <section className="grid gap-4">
            {users.map((user) => (
              <article
                className="rounded-xl border border-border bg-background p-5 shadow-sm"
                key={user.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {formatName(user)}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {user.role}
                    </span>
                    <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Created {formatDate(user.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <UserDetail
                    label="Student profile"
                    value={user.studentProfile ? "Created" : "Not created"}
                  />
                  <UserDetail
                    label="Partner organizations"
                    value={
                      user.partnerMemberships.length > 0
                        ? user.partnerMemberships
                            .map((membership) => membership.organization.name)
                            .join(", ")
                        : "Not linked"
                    }
                  />
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState
            description="No users match the current filters."
            icon={Users}
            title="No users found"
          />
        )}

        <PaginationControls
          page={page}
          pathname="/dashboard/admin/users"
          searchParams={{
            ...(query ? { q: query } : {}),
            ...(role ? { role } : {}),
            ...(status ? { status } : {}),
          }}
          totalCount={filteredCount}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}

function UserDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
