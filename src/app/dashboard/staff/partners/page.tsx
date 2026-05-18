import { Building2 } from "lucide-react";
import Link from "next/link";

import {
  StaffPartnerCrmList,
  type StaffPartnerCrmItem,
} from "@/components/staff/staff-partner-crm-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { Prisma } from "@/generated/prisma/client";
import type { PartnerStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  formatEnumLabel,
  isPartnerStatus,
  partnerStatusOptions,
} from "@/lib/staff/crm-validation";
import { getStaffNavItems } from "@/lib/staff/navigation";

type StaffPartnersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function StaffPartnersPage({
  searchParams,
}: StaffPartnersPageProps) {
  await assertPlacementQueueAccess();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status =
    params.status && isPartnerStatus(params.status) ? params.status : "";
  const where: Prisma.PartnerOrganizationWhereInput = {};

  if (query) {
    where.OR = [
      { name: { contains: query } },
      { contactEmail: { contains: query } },
      { type: { contains: query } },
      { location: { contains: query } },
      { city: { contains: query } },
      { state: { contains: query } },
      { country: { contains: query } },
    ];
  }

  if (status) {
    where.status = status as PartnerStatus;
  }

  const [partners, totalCount, followUpCount, partneredCount] =
    await Promise.all([
      prisma.partnerOrganization.findMany({
        where,
        orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          contactEmail: true,
          createdAt: true,
          description: true,
          lastContactedAt: true,
          location: true,
          name: true,
          nextFollowUpAt: true,
          status: true,
          type: true,
          _count: {
            select: {
              opportunities: true,
              outreachContacts: true,
              outreachTasks: true,
            },
          },
        },
      }),
      prisma.partnerOrganization.count(),
      prisma.partnerOrganization.count({
        where: {
          nextFollowUpAt: {
            lte: new Date(),
          },
        },
      }),
      prisma.partnerOrganization.count({
        where: {
          status: "PARTNERED",
        },
      }),
    ]);
  const redirectParams = new URLSearchParams();

  if (query) {
    redirectParams.set("q", query);
  }

  if (status) {
    redirectParams.set("status", status);
  }

  const redirectTo = redirectParams.toString()
    ? `/dashboard/staff/partners?${redirectParams}`
    : "/dashboard/staff/partners";

  return (
    <DashboardShell
      navItems={getStaffNavItems("/dashboard/staff/partners")}
      role="staff"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="staff" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Partner CRM
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Partner Organizations
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Track outreach status, follow-up dates, notes, contacts, and
              active partner relationship work.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Building2 aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="All partner organization records."
            label="Partners"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Partners with follow-ups due today or earlier."
            label="Due follow-ups"
            value={followUpCount.toString()}
          />
          <StatCard
            helper="Organizations marked as partnered."
            label="Partnered"
            value={partneredCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <label className="text-sm font-medium text-foreground">
              Search
              <input
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
                defaultValue={query}
                name="q"
                placeholder="Search partner, contact email, type, or location"
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
                Apply
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/staff/partners"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <StaffPartnerCrmList
          partners={partners as StaffPartnerCrmItem[]}
          redirectTo={redirectTo}
        />
      </div>
    </DashboardShell>
  );
}
