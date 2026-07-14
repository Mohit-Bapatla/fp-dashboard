import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  FileClock,
  GraduationCap,
  ListChecks,
} from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";

type CountByStatusItem = {
  _count: {
    _all: number;
  };
  status: string;
};

type RecentApplicationItem = {
  createdAt: Date;
  id: string;
  opportunity: {
    organization: {
      name: string;
    };
    title: string;
  };
  status: string;
  studentProfile: {
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
  submittedAt: Date | null;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not submitted";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function getStatusCount(items: CountByStatusItem[], status: string) {
  return (
    items.find((item) => item.status === status)?._count._all.toString() ?? "0"
  );
}

function getTotal(items: CountByStatusItem[]) {
  return items.reduce((sum, item) => sum + item._count._all, 0);
}

function getStudentName(application: RecentApplicationItem) {
  const { email, firstName, lastName } = application.studentProfile.user;
  const name = [firstName, lastName].filter(Boolean).join(" ");

  return name || email;
}

export default async function AdminAnalyticsPage() {
  await assertAdminAccess();

  const [
    totalStudents,
    completedStudentProfiles,
    totalPartners,
    totalOpportunities,
    totalApplications,
    staffTasksCompleted,
    opportunityStatusCounts,
    applicationStatusCounts,
    placementRequestStatusCounts,
    outreachTaskStatusCounts,
    partnerOpportunityCounts,
    opportunityApplicationCounts,
    recentApplications,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),
    prisma.studentProfile.count({
      where: {
        school: {
          not: null,
        },
        gradeYear: {
          not: null,
        },
      },
    }),
    prisma.partnerOrganization.count({
      where: { isSystemPlaceholder: false },
    }),
    prisma.opportunity.count({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organization: { isSystemPlaceholder: false },
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
      },
    }),
    prisma.outreachTask.count({
      where: {
        status: "COMPLETED",
      },
    }),
    prisma.opportunity.groupBy({
      by: ["status"],
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organization: { isSystemPlaceholder: false },
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
          organization: { isSystemPlaceholder: false },
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.placementRequest.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.outreachTask.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.partnerOrganization.findMany({
      where: { isSystemPlaceholder: false },
      orderBy: {
        name: "asc",
      },
      take: 10,
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            opportunities: true,
          },
        },
      },
    }),
    prisma.opportunity.findMany({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organization: { isSystemPlaceholder: false },
      },
      orderBy: {
        applications: {
          _count: "desc",
        },
      },
      take: 10,
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
    prisma.application.findMany({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
      },
      orderBy: [
        {
          submittedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 10,
      select: {
        createdAt: true,
        id: true,
        status: true,
        submittedAt: true,
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
  ]);
  const publishedOpportunities = getStatusCount(
    opportunityStatusCounts,
    "PUBLISHED",
  );
  const draftOpportunities = getStatusCount(opportunityStatusCounts, "DRAFT");
  const pendingOpportunities = getStatusCount(
    opportunityStatusCounts,
    "PENDING_APPROVAL",
  );
  const closedOpportunities = getStatusCount(opportunityStatusCounts, "CLOSED");
  const totalPlacementRequests = getTotal(placementRequestStatusCounts);
  const totalOutreachTasks = getTotal(outreachTaskStatusCounts);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/analytics")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Analytics v1
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Admin Analytics
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Track operational volume across students, partners, opportunities,
              applications, placement requests, and outreach tasks.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <BarChart3 aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="User records assigned the STUDENT role."
            label="Students"
            value={totalStudents.toString()}
          />
          <StatCard
            helper="Student profiles with core school and grade details."
            label="Completed profiles"
            value={completedStudentProfiles.toString()}
          />
          <StatCard
            helper="Partner organization records."
            label="Partners"
            value={totalPartners.toString()}
          />
          <StatCard
            helper="All opportunities across every partner."
            label="Opportunities"
            value={totalOpportunities.toString()}
          />
          <StatCard
            helper="Opportunities visible to students."
            label="Published"
            value={publishedOpportunities}
          />
          <StatCard
            helper={`${draftOpportunities} draft, ${pendingOpportunities} pending, ${closedOpportunities} closed.`}
            label="Pipeline"
            value={pendingOpportunities}
          />
          <StatCard
            helper="All submitted or historical application records."
            label="Applications"
            value={totalApplications.toString()}
          />
          <StatCard
            helper="Completed outreach tasks across staff operations."
            label="Tasks completed"
            value={staffTasksCompleted.toString()}
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
            items={applicationStatusCounts}
            title="Applications by status"
          />
          <StatusBreakdown
            icon={FileClock}
            items={placementRequestStatusCounts}
            title={`Placement requests by status (${totalPlacementRequests})`}
          />
          <StatusBreakdown
            icon={ListChecks}
            items={outreachTaskStatusCounts}
            title={`Outreach tasks by status (${totalOutreachTasks})`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <SimpleCountList
            empty="Partner counts will appear after partners are created."
            items={partnerOpportunityCounts.map((partner) => ({
              id: partner.id,
              label: partner.name,
              meta: "opportunities",
              value: partner._count.opportunities,
            }))}
            title="Partner opportunity counts"
          />
          <SimpleCountList
            empty="Application counts will appear after opportunities receive applications."
            items={opportunityApplicationCounts.map((opportunity) => ({
              id: opportunity.id,
              label: opportunity.title,
              meta: `${opportunity.organization.name} | ${formatEnumLabel(opportunity.status)}`,
              value: opportunity._count.applications,
            }))}
            title="Applications per opportunity"
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Recent application volume
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest submitted or created application records.
              </p>
            </div>
            <GraduationCap
              aria-hidden="true"
              className="h-5 w-5 text-primary"
            />
          </div>
          {recentApplications.length > 0 ? (
            <div className="mt-5 divide-y divide-border">
              {recentApplications.map((application) => (
                <div
                  className="grid gap-2 py-3 md:grid-cols-[1fr_180px_140px]"
                  key={application.id}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {getStudentName(application)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {application.opportunity.title} |{" "}
                      {application.opportunity.organization.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatEnumLabel(application.status)}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatDate(
                      application.submittedAt ?? application.createdAt,
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              Recent applications will appear after students apply.
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

function SimpleCountList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: Array<{
    id: string;
    label: string;
    meta: string;
    value: number;
  }>;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-5 divide-y divide-border">
          {items.map((item) => (
            <div
              className="flex items-center justify-between gap-4 py-3"
              key={item.id}
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {item.meta}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {item.value}
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
