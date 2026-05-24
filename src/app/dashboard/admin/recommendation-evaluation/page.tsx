import { Target } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { prisma } from "@/lib/db/prisma";
import { getEmbeddingCoverage } from "@/lib/matching/embedding-refresh";

function getRate(numerator: number, denominator: number) {
  if (denominator === 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminRecommendationEvaluationPage() {
  await assertAdminAccess();

  const [
    impressions,
    clicks,
    applications,
    searchEvents,
    scoreAverage,
    scoreEvents,
    applicationEvents,
    embeddingCoverage,
    eventsBySource,
  ] = await Promise.all([
    prisma.recommendationEvent.count({
      where: {
        eventType: "IMPRESSION",
      },
    }),
    prisma.recommendationEvent.count({
      where: {
        eventType: "CLICK",
      },
    }),
    prisma.recommendationEvent.count({
      where: {
        eventType: "APPLICATION",
      },
    }),
    prisma.recommendationEvent.count({
      where: {
        eventType: "SEARCH_RESULTS",
      },
    }),
    prisma.recommendationEvent.aggregate({
      where: {
        matchScore: {
          not: null,
        },
      },
      _avg: {
        matchScore: true,
      },
    }),
    prisma.recommendationEvent.findMany({
      where: {
        matchScore: {
          not: null,
        },
      },
      select: {
        matchScore: true,
      },
    }),
    prisma.recommendationEvent.findMany({
      where: {
        eventType: "APPLICATION",
      },
      select: {
        application: {
          select: {
            status: true,
          },
        },
        matchScore: true,
      },
    }),
    getEmbeddingCoverage(),
    prisma.recommendationEvent.groupBy({
      by: ["source"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          source: "desc",
        },
      },
      take: 8,
    }),
  ]);
  const averageScore = scoreAverage._avg.matchScore
    ? `${Math.round(scoreAverage._avg.matchScore)}%`
    : "0%";
  const scoreBuckets = [
    {
      label: "80-100",
      value: scoreEvents.filter((event) => (event.matchScore ?? 0) >= 80)
        .length,
    },
    {
      label: "60-79",
      value: scoreEvents.filter(
        (event) =>
          (event.matchScore ?? 0) >= 60 && (event.matchScore ?? 0) < 80,
      ).length,
    },
    {
      label: "0-59",
      value: scoreEvents.filter((event) => (event.matchScore ?? 0) < 60).length,
    },
  ];
  const applicationStatusCounts = applicationEvents.reduce((counts, event) => {
    const status = event.application?.status ?? "UNKNOWN";

    counts.set(status, (counts.get(status) ?? 0) + 1);

    return counts;
  }, new Map<string, number>());

  return (
    <DashboardShell
      navItems={getAdminNavItems("/dashboard/admin/recommendation-evaluation")}
      role="admin"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="admin" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Recommendation evaluation
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Match and Recommendation Quality
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Track recommendation impressions, clicks, applications, match
              scores, and search-result events without experimentation or model
              training.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <Target aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Recommendation cards shown on student dashboard."
            label="Impressions"
            value={impressions.toString()}
          />
          <StatCard
            helper={`CTR ${getRate(clicks, impressions)}.`}
            label="Clicks"
            value={clicks.toString()}
          />
          <StatCard
            helper={`Application-through rate ${getRate(applications, impressions)}.`}
            label="Applications"
            value={applications.toString()}
          />
          <StatCard
            helper={`${searchEvents} search-result events tracked.`}
            label="Average match score"
            value={averageScore}
          />
          <StatCard
            helper={`${embeddingCoverage.missing} missing and ${embeddingCoverage.stale} stale embedding records.`}
            label="Embedding coverage"
            value={`${embeddingCoverage.upToDate}/${embeddingCoverage.total}`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <BreakdownCard items={scoreBuckets} title="Score distribution" />
          <BreakdownCard
            items={Array.from(applicationStatusCounts.entries()).map(
              ([label, value]) => ({
                label: formatEnumLabel(label),
                value,
              }),
            )}
            title="Application event statuses"
          />
          <BreakdownCard
            items={eventsBySource.map((event) => ({
              label: event.source,
              value: event._count._all,
            }))}
            title="Events by source"
          />
        </section>
      </div>
    </DashboardShell>
  );
}

function BreakdownCard({
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
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          No events yet.
        </p>
      )}
    </article>
  );
}
