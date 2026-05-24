import { BarChart3, ClipboardCheck, FileClock, Target } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import {
  getImpactMetrics,
  getImpactRange,
  impactRanges,
  type ImpactRange,
  type ImpactStatusCount,
} from "@/lib/analytics/impact-metrics";

type AdminImpactPageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

function formatRange(range: ImpactRange) {
  if (range === "7d") {
    return "Last 7 days";
  }

  if (range === "30d") {
    return "Last 30 days";
  }

  return "All time";
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function formatHours(value: number) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(value);
}

export default async function AdminImpactPage({
  searchParams,
}: AdminImpactPageProps) {
  await assertAdminAccess();

  const params = await searchParams;
  const range = getImpactRange(params.range);
  const metrics = await getImpactMetrics(range);

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/impact")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Impact metrics
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Platform Impact Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review database-backed aggregate metrics for internal impact
              tracking. This page intentionally avoids names, emails, notes,
              statements, resumes, comments, and individual records.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Target aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {impactRanges.map((option) => (
              <Link
                className={
                  option === range
                    ? "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    : "inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                }
                href={`/dashboard/admin/impact?range=${option}`}
                key={option}
              >
                {formatRange(option)}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Student users created in the selected range."
            label="Students onboarded"
            value={formatNumber(metrics.studentsOnboarded)}
          />
          <StatCard
            helper="Profiles with core school and grade fields present."
            label="Completed profiles"
            value={formatNumber(metrics.completedStudentProfiles)}
          />
          <StatCard
            helper="Resume metadata records created."
            label="Resumes uploaded"
            value={formatNumber(metrics.resumesUploaded)}
          />
          <StatCard
            helper="Opportunity records created."
            label="Opportunities listed"
            value={formatNumber(metrics.opportunitiesListed)}
          />
          <StatCard
            helper="Published opportunity records."
            label="Published opportunities"
            value={formatNumber(metrics.publishedOpportunities)}
          />
          <StatCard
            helper="Submitted non-draft applications."
            label="Applications submitted"
            value={formatNumber(metrics.applicationsSubmitted)}
          />
          <StatCard
            helper="Accepted application records."
            label="Accepted applications"
            value={formatNumber(metrics.acceptedApplications)}
          />
          <StatCard
            helper="Placement requests no longer marked New."
            label="Requests processed"
            value={formatNumber(metrics.placementRequestsProcessed)}
          />
          <StatCard
            helper="Partner organizations created."
            label="Partners managed"
            value={formatNumber(metrics.partnerOrganizationsManaged)}
          />
          <StatCard
            helper="Outreach contact records created."
            label="Outreach contacts"
            value={formatNumber(metrics.outreachContacts)}
          />
          <StatCard
            helper="Outreach tasks marked completed."
            label="Tasks completed"
            value={formatNumber(metrics.outreachTasksCompleted)}
          />
          <StatCard
            helper="Verified service-hour total."
            label="Service hours"
            value={formatHours(metrics.serviceHoursVerified)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Program event records created."
            label="Events created"
            value={formatNumber(metrics.eventsCreated)}
          />
          <StatCard
            helper="Event registration records created."
            label="Event registrations"
            value={formatNumber(metrics.eventRegistrations)}
          />
          <StatCard
            helper="Application status update audit logs by partner users."
            label="Partner status changes"
            value={formatNumber(metrics.partnerApplicantStatusChanges)}
          />
          <StatCard
            helper={`${formatNumber(metrics.interviewsScheduled)} scheduled.`}
            label="Interviews requested"
            value={formatNumber(metrics.interviewsRequested)}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <StatusBreakdown
            icon={ClipboardCheck}
            items={metrics.applicationStatusCounts}
            title="Applications by status"
          />
          <StatusBreakdown
            icon={FileClock}
            items={metrics.placementRequestStatusCounts}
            title="Placement requests by status"
          />
          <article className="rounded-lg border border-border bg-background p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recommendation activity
              </h2>
              <BarChart3 aria-hidden="true" className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 divide-y divide-border">
              <MetricRow
                label="Impressions"
                value={metrics.recommendationImpressions}
              />
              <MetricRow label="Clicks" value={metrics.recommendationClicks} />
              <MetricRow
                label="Applications"
                value={metrics.recommendationApplications}
              />
            </div>
          </article>
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Metric definitions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Definitions explain exactly how each aggregate number is counted for
            the selected range. No individual records or private fields are
            displayed on this page.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {metrics.metricDefinitions.map((definition) => (
              <article
                className="rounded-lg border border-border bg-muted/25 p-4"
                key={definition.label}
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {definition.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {definition.definition}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function StatusBreakdown({
  icon: Icon,
  items,
  title,
}: {
  icon: typeof BarChart3;
  items: ImpactStatusCount[];
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
                {formatNumber(item.count)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          No aggregate records for this range.
        </p>
      )}
    </article>
  );
}
