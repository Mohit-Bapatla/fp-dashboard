import {
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDashboardPage() {
  await assertAdminAccess();

  const [
    studentCount,
    partnerCount,
    opportunityCount,
    publishedOpportunityCount,
    applicationCount,
    applicationsNeedingReviewCount,
    recentApplications,
    recentPartners,
    recentOpportunities,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),
    prisma.partnerOrganization.count(),
    prisma.opportunity.count(),
    prisma.opportunity.count({
      where: {
        status: "PUBLISHED",
      },
    }),
    prisma.application.count(),
    prisma.application.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
      },
    }),
    prisma.application.findMany({
      orderBy: [
        {
          submittedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 5,
      select: {
        id: true,
        status: true,
        opportunity: {
          select: {
            title: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        studentProfile: {
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.partnerOrganization.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            opportunities: true,
          },
        },
      },
    }),
    prisma.opportunity.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Internal operations
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Oversee students, partner organizations, opportunities,
              applications, and platform operating queues for FP Dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              href="/dashboard/admin/applications"
            >
              Review applications
            </Link>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
              href="/dashboard/admin/opportunities/new"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              New opportunity
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            helper="User records currently assigned the STUDENT role."
            label="Students"
            value={studentCount.toString()}
          />
          <StatCard
            helper="Partner organization records available for opportunities."
            label="Partners"
            value={partnerCount.toString()}
          />
          <StatCard
            helper="All admin and partner-created opportunity records."
            label="Opportunities"
            value={opportunityCount.toString()}
          />
          <StatCard
            helper="Opportunities visible to student browsing and applications."
            label="Published"
            value={publishedOpportunityCount.toString()}
          />
          <StatCard
            helper="All submitted or historical student application records."
            label="Applications"
            value={applicationCount.toString()}
          />
          <StatCard
            helper="Submitted or under-review applications needing attention."
            label="Needs review"
            value={applicationsNeedingReviewCount.toString()}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <AdminOverviewPanel
            href="/dashboard/admin/students"
            icon={GraduationCap}
            title="Students"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              View profile completion, resume status, and application counts for
              student accounts.
            </p>
          </AdminOverviewPanel>
          <AdminOverviewPanel
            href="/dashboard/admin/partners"
            icon={Building2}
            title="Partners"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              Review partner organization status, members, opportunities, and
              application volume.
            </p>
          </AdminOverviewPanel>
          <AdminOverviewPanel
            href="/dashboard/admin/applications"
            icon={ClipboardCheck}
            title="Applications"
          >
            <p className="text-sm leading-6 text-muted-foreground">
              Update safe application statuses and inspect application summaries
              across the platform.
            </p>
          </AdminOverviewPanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <RecentList
            empty="Recent applications will appear after students apply."
            href="/dashboard/admin/applications"
            items={recentApplications.map((application) => ({
              id: application.id,
              title: getApplicationStudentName(application),
              subtitle: `${application.opportunity.title} | ${application.opportunity.organization.name}`,
              meta: formatEnumLabel(application.status),
            }))}
            title="Recent applications"
          />
          <RecentList
            empty="Recent partners will appear after organizations are created."
            href="/dashboard/admin/partners"
            items={recentPartners.map((partner) => ({
              id: partner.id,
              title: partner.name,
              subtitle: `${formatEnumLabel(partner.status)} | ${partner._count.opportunities} opportunities`,
              meta: formatDate(partner.createdAt),
            }))}
            title="Recent partners"
          />
          <RecentList
            empty="Recent opportunities will appear after records are created."
            href="/dashboard/admin/opportunities"
            items={recentOpportunities.map((opportunity) => ({
              id: opportunity.id,
              title: opportunity.title,
              subtitle: opportunity.organization.name,
              meta: formatEnumLabel(opportunity.status),
            }))}
            title="Recent opportunities"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <BriefcaseBusiness aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                Opportunity management
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create opportunities, connect them to partner organizations, and
                publish, archive, or close records from the admin workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/admin/opportunities"
              >
                View opportunities
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
                href="/dashboard/admin/opportunities/new"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                New opportunity
              </Link>
            </div>
          </div>
        </section>

        <EmptyState
          description="Audit logs, email notifications, placement requests, and advanced analytics remain staged for later admin work."
          icon={BriefcaseBusiness}
          title="More admin tools coming soon"
        />
      </div>
    </DashboardShell>
  );
}

type RecentItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getApplicationStudentName(application: {
  studentProfile: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
}) {
  const { email, firstName, lastName } = application.studentProfile.user;
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || email;
}

function AdminOverviewPanel({
  children,
  href,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  href: string;
  icon: typeof BriefcaseBusiness;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
      <Link
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
        href={href}
      >
        Open {title.toLowerCase()}
      </Link>
    </article>
  );
}

function RecentList({
  empty,
  href,
  items,
  title,
}: {
  empty: string;
  href: string;
  items: RecentItem[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Link
          className="text-sm font-medium text-primary transition hover:opacity-80"
          href={href}
        >
          View all
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="mt-5 divide-y divide-border">
          {items.map((item) => (
            <div className="py-3" key={item.id}>
              <p className="text-sm font-semibold text-foreground">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.subtitle}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                {item.meta}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">{empty}</p>
      )}
    </article>
  );
}
