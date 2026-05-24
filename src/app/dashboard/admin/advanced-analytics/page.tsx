import { BarChart3, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import {
  analyticsRanges,
  getAdvancedAnalytics,
  getAnalyticsRange,
  type CountMetric,
  type FunnelMetric,
} from "@/lib/analytics/advanced-analytics";

type AdminAdvancedAnalyticsPageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

function formatRange(range: string) {
  if (range === "7d") {
    return "Last 7 days";
  }

  if (range === "30d") {
    return "Last 30 days";
  }

  return "All time";
}

export default async function AdminAdvancedAnalyticsPage({
  searchParams,
}: AdminAdvancedAnalyticsPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const range = getAnalyticsRange(params.range);
  const analytics = await getAdvancedAnalytics(range);
  const totalApplications =
    analytics.applicationFunnel.find((item) => item.label === "Submitted")
      ?.value ?? 0;
  const totalPlacementRequests =
    analytics.placementFunnel.find((item) => item.label === "Requests created")
      ?.value ?? 0;

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/advanced-analytics")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Advanced analytics
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Platform Funnel Analytics
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Measure student readiness, application review, placement
              operations, partner applicant volume, and staff task completion.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <BarChart3 aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {analyticsRanges.map((option) => (
              <Link
                className={
                  option === range
                    ? "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    : "inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                }
                href={`/dashboard/admin/advanced-analytics?range=${option}`}
                key={option}
              >
                {formatRange(option)}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper={formatRange(range)}
            label="Applications"
            value={totalApplications.toString()}
          />
          <StatCard
            helper={formatRange(range)}
            label="Placement requests"
            value={totalPlacementRequests.toString()}
          />
          <StatCard
            helper="Days with completed staff tasks."
            label="Task activity days"
            value={analytics.staffTaskCompletion.length.toString()}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <FunnelCard
            icon={GraduationCap}
            items={analytics.studentFunnel}
            title="Student readiness funnel"
          />
          <FunnelCard
            icon={ClipboardCheck}
            items={analytics.applicationFunnel}
            title="Application review funnel"
          />
          <FunnelCard
            icon={Users}
            items={analytics.placementFunnel}
            title="Placement operations funnel"
          />
          <CountCard
            empty="Applicant counts will appear after students apply."
            items={analytics.opportunityApplicantCounts}
            title="Partner opportunity applicant counts"
          />
        </section>

        <CountCard
          empty="Completed staff tasks will appear here after tasks are completed."
          items={analytics.staffTaskCompletion}
          title="Staff tasks completed over time"
        />
      </div>
    </DashboardShell>
  );
}

function FunnelCard({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof BarChart3;
  items: FunnelMetric[];
  title: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {item.value} / {item.total}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${item.rate}%` }}
              />
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {item.rate}%
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function CountCard({
  empty,
  items,
  title,
}: {
  empty: string;
  items: CountMetric[];
  title: string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
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
        <p className="mt-5 text-sm leading-6 text-muted-foreground">{empty}</p>
      )}
    </article>
  );
}
