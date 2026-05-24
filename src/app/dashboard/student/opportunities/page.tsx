import { BriefcaseBusiness } from "lucide-react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentOpportunityFilters } from "@/components/student/student-opportunity-filters";
import { StudentOpportunityList } from "@/components/student/student-opportunity-list";
import { RecommendationEventTracker } from "@/components/student/recommendation-event-tracker";
import { Prisma } from "@/generated/prisma/client";
import { createEmbeddingForText } from "@/lib/ai/embeddings";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import {
  cosineSimilarity,
  parseEmbedding,
  similarityToBoost,
} from "@/lib/matching/vector-similarity";
import {
  buildSemanticOpportunityWhere,
  getSemanticOpportunityScore,
} from "@/lib/student/semantic-opportunity-search";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import {
  getStudentOpportunityFilters,
  type StudentOpportunityFilters as StudentOpportunityFiltersType,
} from "@/lib/student/opportunity-filters";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { prisma } from "@/lib/db/prisma";

type StudentOpportunitiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function uniqueValues(values: Array<string | null>) {
  return Array.from(
    new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]),
  ).sort((first, second) => first.localeCompare(second));
}

function getEffectiveFilters(
  filters: StudentOpportunityFiltersType,
  options: {
    specialties: string[];
    remoteTypes: string[];
    paidStatuses: string[];
    locations: string[];
  },
): StudentOpportunityFiltersType {
  return {
    ...filters,
    specialty: options.specialties.includes(filters.specialty)
      ? filters.specialty
      : "",
    remoteType: options.remoteTypes.includes(filters.remoteType)
      ? filters.remoteType
      : "",
    paidStatus: options.paidStatuses.includes(filters.paidStatus)
      ? filters.paidStatus
      : "",
    location: options.locations.includes(filters.location)
      ? filters.location
      : "",
  };
}

function buildWhere(filters: StudentOpportunityFiltersType) {
  const where: Prisma.OpportunityWhereInput = {
    status: "PUBLISHED",
  };

  if (filters.q) {
    Object.assign(where, buildSemanticOpportunityWhere(filters.q));
  }

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.specialty) {
    where.specialty = filters.specialty;
  }

  if (filters.remoteType) {
    where.remoteType = filters.remoteType;
  }

  if (filters.paidStatus) {
    where.paidStatus = filters.paidStatus;
  }

  if (filters.location) {
    where.location = filters.location;
  }

  return where;
}

function buildOrderBy(filters: StudentOpportunityFiltersType) {
  if (filters.sort === "deadline") {
    return [
      {
        deadline: "asc" as const,
      },
      {
        publishedAt: "desc" as const,
      },
      {
        createdAt: "desc" as const,
      },
    ];
  }

  return [
    {
      publishedAt: "desc" as const,
    },
    {
      createdAt: "desc" as const,
    },
  ];
}

export default async function StudentOpportunitiesPage({
  searchParams,
}: StudentOpportunitiesPageProps) {
  const { userId } = await assertStudentAccess();

  const params = await searchParams;
  const filters = getStudentOpportunityFilters(params);
  const user = await getCurrentStudentProfile(userId);
  const profile = user.studentProfile;
  const filterSource = await prisma.opportunity.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      specialty: true,
      remoteType: true,
      paidStatus: true,
      location: true,
    },
  });
  const options = {
    specialties: uniqueValues(filterSource.map((item) => item.specialty)),
    remoteTypes: uniqueValues(filterSource.map((item) => item.remoteType)),
    paidStatuses: uniqueValues(filterSource.map((item) => item.paidStatus)),
    locations: uniqueValues(filterSource.map((item) => item.location)),
  };
  const effectiveFilters = getEffectiveFilters(filters, options);
  const where = buildWhere(effectiveFilters);
  const [opportunities, publishedCount, resume] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: buildOrderBy(effectiveFilters),
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        specialty: true,
        location: true,
        remoteType: true,
        paidStatus: true,
        deadline: true,
        capacity: true,
        eligibilityRequirements: true,
        applicationInstructions: true,
        publishedAt: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.opportunity.count({
      where: {
        status: "PUBLISHED",
      },
    }),
    profile
      ? prisma.resume.findFirst({
          where: {
            studentProfileId: profile.id,
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            extractedSkills: true,
          },
        })
      : Promise.resolve(null),
  ]);
  const [queryEmbedding, opportunityEmbeddings] = await Promise.all([
    effectiveFilters.q
      ? createEmbeddingForText(effectiveFilters.q)
      : Promise.resolve(null),
    prisma.embeddingRecord.findMany({
      where: {
        entityId: {
          in: opportunities.map((opportunity) => opportunity.id),
        },
        entityType: "OPPORTUNITY",
      },
      select: {
        embedding: true,
        entityId: true,
      },
    }),
  ]);
  const queryVector =
    queryEmbedding?.available === true ? queryEmbedding.embedding : [];
  const opportunityEmbeddingById = new Map(
    opportunityEmbeddings.map((record) => [
      record.entityId,
      parseEmbedding(record.embedding),
    ]),
  );
  const opportunitiesWithMatches = opportunities.map((opportunity) => ({
    ...opportunity,
    match: getOpportunityMatchScore({
      opportunity,
      profile,
      resume,
    }),
    semanticScore: getSemanticOpportunityScore(opportunity, effectiveFilters.q),
    vectorSimilarity: cosineSimilarity(
      queryVector,
      opportunityEmbeddingById.get(opportunity.id) ?? [],
    ),
  }));
  const visibleOpportunities =
    effectiveFilters.sort === "best-fit"
      ? [...opportunitiesWithMatches].sort(
          (first, second) =>
            second.match.score +
            second.semanticScore +
            similarityToBoost(second.vectorSimilarity, 8) -
            (first.match.score +
              first.semanticScore +
              similarityToBoost(first.vectorSimilarity, 8)),
        )
      : effectiveFilters.q
        ? [...opportunitiesWithMatches].sort(
            (first, second) =>
              second.semanticScore +
              similarityToBoost(second.vectorSimilarity, 8) -
              (first.semanticScore +
                similarityToBoost(first.vectorSimilarity, 8)),
          )
        : opportunitiesWithMatches;

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/opportunities")}
      role="student"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-xl border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="student" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Opportunity board
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Browse Opportunities
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Browse and apply to published healthcare opportunities from Future
              Physicians partner organizations. Filter by specialty, location,
              format, and more.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-primary">
            <BriefcaseBusiness aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Opportunity board stats"
          className="grid gap-4 md:grid-cols-3"
        >
          <StatCard
            helper="Published listings currently visible to students."
            label="Published opportunities"
            value={publishedCount.toString()}
          />
          <StatCard
            helper="Listings matching the current search and filters."
            label="Current results"
            value={opportunities.length.toString()}
          />
          <StatCard
            helper={
              effectiveFilters.sort === "best-fit"
                ? "Sorted by strongest deterministic fit."
                : effectiveFilters.sort === "deadline"
                  ? "Sorted by earliest deadline."
                  : "Sorted by recently published listings."
            }
            label="Sort"
            value={
              effectiveFilters.sort === "best-fit"
                ? "Best fit"
                : effectiveFilters.sort === "deadline"
                  ? "Deadline"
                  : "Recent"
            }
          />
        </section>

        <StudentOpportunityFilters
          filters={effectiveFilters}
          options={options}
        />

        {effectiveFilters.q ? (
          <RecommendationEventTracker
            events={[
              {
                eventType: "SEARCH_RESULTS",
                resultCount: visibleOpportunities.length,
                searchQuery: effectiveFilters.q,
                source: "student_opportunity_board",
              },
            ]}
          />
        ) : null}

        <StudentOpportunityList
          hasPublishedOpportunities={publishedCount > 0}
          opportunities={visibleOpportunities}
        />
      </div>
    </DashboardShell>
  );
}
