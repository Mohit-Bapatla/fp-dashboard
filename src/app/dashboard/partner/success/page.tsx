import { BarChart3, Clock, Star } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";
import { prisma } from "@/lib/db/prisma";

function getAverageDays(
  items: Array<{
    createdAt: Date;
    reviewedAt: Date | null;
    submittedAt: Date | null;
  }>,
) {
  const values = items
    .map((item) => {
      const start = item.submittedAt ?? item.createdAt;
      const end = item.reviewedAt;

      return end ? end.getTime() - start.getTime() : null;
    })
    .filter((value): value is number => value !== null && value >= 0);

  if (values.length === 0) {
    return "n/a";
  }

  const averageMs =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return `${Math.round(averageMs / (1000 * 60 * 60 * 24))}d`;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function PartnerSuccessPage() {
  const context = await getCurrentPartnerContext();

  if (context.organizationIds.length === 0) {
    return (
      <DashboardShell
        navItems={getPartnerNavItems("/dashboard/partner/success")}
        role="partner"
      >
        <EmptyState
          description="A Future Physicians administrator must connect your account to an organization before success metrics are available."
          icon={BarChart3}
          title="Organization not connected"
        />
      </DashboardShell>
    );
  }

  const [
    opportunities,
    applicationStatusCounts,
    interviewStatusCounts,
    serviceHours,
    feedbackAverage,
    timedApplications,
    acceptedCount,
  ] = await Promise.all([
    prisma.opportunity.findMany({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organizationId: {
          in: context.organizationIds,
        },
        organization: {
          isSystemPlaceholder: false,
        },
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: context.organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.interviewRequest.groupBy({
      by: ["status"],
      where: {
        application: {
          opportunity: {
            visibility: "PUBLIC_DIRECTORY",
            organizationId: {
              in: context.organizationIds,
            },
            organization: {
              isSystemPlaceholder: false,
            },
          },
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.serviceHourRecord.aggregate({
      where: {
        partnerOrganizationId: {
          in: context.organizationIds,
        },
        partnerOrganization: {
          isSystemPlaceholder: false,
        },
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: {
            isSystemPlaceholder: false,
          },
        },
        verificationStatus: "VERIFIED",
      },
      _sum: {
        hours: true,
      },
    }),
    prisma.feedback.aggregate({
      where: {
        entityType: "APPLICATION",
        feedbackType: "PARTNER_APPLICANT_QUALITY",
        authorId: context.user.id,
      },
      _avg: {
        rating: true,
      },
    }),
    prisma.application.findMany({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: context.organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
        status: {
          in: ["INTERVIEW", "ACCEPTED"],
        },
      },
      select: {
        createdAt: true,
        reviewedAt: true,
        submittedAt: true,
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: context.organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
        status: "ACCEPTED",
      },
    }),
  ]);
  const totalApplications = applicationStatusCounts.reduce(
    (sum, item) => sum + item._count._all,
    0,
  );

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/success")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="partner" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Partner success
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Success Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Monitor applicant flow, interviews, service hours, and candidate
              quality feedback for your linked organizations.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Star aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Applications across linked organization opportunities."
            label="Applicant pipeline"
            value={totalApplications.toString()}
          />
          <StatCard
            helper="Applications currently accepted."
            label="Accepted"
            value={acceptedCount.toString()}
          />
          <StatCard
            helper="Approximate submitted-to-reviewed duration."
            label="Time to interview/accept"
            value={getAverageDays(timedApplications)}
          />
          <StatCard
            helper="Verified hours connected to your organization."
            label="Service hours"
            value={(serviceHours._sum.hours ?? 0).toString()}
          />
          <StatCard
            helper="Average partner applicant quality feedback."
            label="Candidate quality"
            value={
              feedbackAverage._avg.rating
                ? feedbackAverage._avg.rating.toFixed(1)
                : "n/a"
            }
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <Breakdown
            items={applicationStatusCounts.map((item) => ({
              label: formatEnumLabel(item.status),
              value: item._count._all,
            }))}
            title="Applicant pipeline"
          />
          <Breakdown
            items={interviewStatusCounts.map((item) => ({
              label: formatEnumLabel(item.status),
              value: item._count._all,
            }))}
            title="Interview statuses"
          />
          <Breakdown
            items={opportunities.map((opportunity) => ({
              label: `${opportunity.title} | ${formatEnumLabel(opportunity.status)}`,
              value: opportunity._count.applications,
            }))}
            title="Opportunity performance"
          />
        </section>
      </div>
    </DashboardShell>
  );
}

function Breakdown({
  items,
  title,
}: {
  items: Array<{
    label: string;
    value: number;
  }>;
  title: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Clock aria-hidden="true" className="h-5 w-5 text-primary" />
      </div>
      {items.length > 0 ? (
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-4">
                <p className="truncate text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.round((item.value / maxValue) * 100)}%`,
                  }}
                />
              </div>
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
