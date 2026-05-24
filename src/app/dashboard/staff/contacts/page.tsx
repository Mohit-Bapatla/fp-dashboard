import { Users } from "lucide-react";
import Link from "next/link";

import {
  NewContactForm,
  StaffContactCrmList,
  type StaffContactCrmItem,
} from "@/components/staff/staff-contact-crm-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

type StaffContactsPageProps = {
  searchParams: Promise<{
    organizationId?: string;
    q?: string;
  }>;
};

export default async function StaffContactsPage({
  searchParams,
}: StaffContactsPageProps) {
  await assertPlacementQueueAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const organizations = await prisma.partnerOrganization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const organizationIds = new Set(organizations.map((org) => org.id));
  const organizationId =
    params.organizationId && organizationIds.has(params.organizationId)
      ? params.organizationId
      : "";
  const where: Prisma.OutreachContactWhereInput = {};

  if (query) {
    where.OR = [
      { firstName: { contains: query } },
      { lastName: { contains: query } },
      { email: { contains: query } },
      { title: { contains: query } },
      { organization: { name: { contains: query } } },
    ];
  }

  if (organizationId) {
    where.organizationId = organizationId;
  }

  const [contacts, totalCount, followUpCount] = await Promise.all([
    prisma.outreachContact.findMany({
      where,
      orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastContactedAt: true,
        lastName: true,
        nextFollowUpAt: true,
        notes: true,
        organizationId: true,
        organization: { select: { name: true } },
        phone: true,
        title: true,
      },
    }),
    prisma.outreachContact.count(),
    prisma.outreachContact.count({
      where: { nextFollowUpAt: { lte: new Date() } },
    }),
  ]);
  const redirectParams = new URLSearchParams();

  if (query) redirectParams.set("q", query);
  if (organizationId) redirectParams.set("organizationId", organizationId);

  const redirectTo = redirectParams.toString()
    ? `/dashboard/staff/contacts?${redirectParams}`
    : "/dashboard/staff/contacts";

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/contacts")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Outreach contacts
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Contacts
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Manage partner contacts, follow-up dates, and relationship notes.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Users aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <StatCard
            helper="All outreach contacts linked to partner organizations."
            label="Contacts"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Contacts with follow-ups due today or earlier."
            label="Due follow-ups"
            value={followUpCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search name, email, title, or organization"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Organization
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={organizationId}
                name="organizationId"
              >
                <option value="">All organizations</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
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
                href="/dashboard/staff/contacts"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <NewContactForm organizations={organizations} redirectTo={redirectTo} />
        <StaffContactCrmList
          contacts={contacts as StaffContactCrmItem[]}
          organizations={organizations}
          redirectTo={redirectTo}
        />
      </div>
    </DashboardShell>
  );
}
