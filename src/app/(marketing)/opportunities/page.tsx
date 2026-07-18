import { SearchX, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardEntryButton } from "@/components/marketing/dashboard-entry-button";
import {
  MarketingContainer,
  PageHero,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/marketing/page-shell";
import {
  PublicOpportunityFilters,
  type PublicOpportunityFilterValues,
} from "@/components/opportunities/public-opportunity-filters";
import { PublicOpportunityCard } from "@/components/opportunities/public-opportunity-card";
import { PublicOpportunityDirectorySkeleton } from "@/components/opportunities/public-opportunity-loading";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import type {
  ApplicationMethod,
  GradeLevelCode,
  OpportunityAvailabilityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";
import { getMarketingViewer } from "@/lib/auth/marketing-viewer";
import { prisma } from "@/lib/db/prisma";
import {
  evaluateOpportunityEligibility,
  type EligibilityCategory,
} from "@/lib/matching/opportunity-eligibility";
import { gradeLevelCodes } from "@/lib/matching/grade-levels";
import { getPageParam, getPagination, getTotalPages } from "@/lib/pagination";
import {
  getPublicOpportunitiesForEligibility,
  getPublicOpportunityPage,
  getPublicOpportunityFilterOptions,
  publicOpportunityPageSize,
  publicOpportunityDeadlineOptions,
  publicOpportunitySortOptions,
  type PublicOpportunity,
  type PublicOpportunityDeadline,
  type PublicOpportunitySort,
} from "@/lib/public/opportunities";
import { createPublicMetadata } from "@/lib/public-metadata";
import { studentOpportunityTypeOptions } from "@/lib/student/opportunity-filters";

export const dynamic = "force-dynamic";

export const metadata = createPublicMetadata({
  description:
    "Browse verified healthcare internships, research, shadowing, volunteering, mentorship, programs, and events.",
  path: "/opportunities",
  socialTitle: "Explore verified healthcare opportunities | Future Physicians",
  title: "Explore Opportunities",
});

type PublicOpportunitiesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const applicationMethods = [
  "EXTERNAL_PORTAL",
  "FP_INTERNAL",
  "FP_REFERRAL",
] as const satisfies readonly ApplicationMethod[];
const availabilityStatuses = [
  "OPEN",
  "OPENING_SOON",
  "ROLLING",
] as const satisfies readonly OpportunityAvailabilityStatus[];
const eligibilityCategories = [
  "STRONG_MATCH",
  "POSSIBLE_MATCH",
  "NOT_ELIGIBLE",
] as const satisfies readonly EligibilityCategory[];

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function getAllowedValue<T extends string>(
  value: string,
  options: readonly T[],
): T | "" {
  return options.includes(value as T) ? (value as T) : "";
}

function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
  options: Awaited<ReturnType<typeof getPublicOpportunityFilterOptions>>,
): PublicOpportunityFilterValues {
  return {
    applicationMethod: getAllowedValue(
      getParam(searchParams, "applicationMethod"),
      applicationMethods,
    ),
    availabilityStatus: getAllowedValue(
      getParam(searchParams, "availabilityStatus"),
      availabilityStatuses,
    ),
    deadline: getAllowedValue(
      getParam(searchParams, "deadline"),
      publicOpportunityDeadlineOptions,
    ),
    eligibility: getAllowedValue(
      getParam(searchParams, "eligibility"),
      eligibilityCategories,
    ),
    grade: getAllowedValue(getParam(searchParams, "grade"), gradeLevelCodes),
    location: getAllowedValue(
      getParam(searchParams, "location"),
      options.locations,
    ),
    paidStatus: getAllowedValue(
      getParam(searchParams, "paidStatus"),
      options.paidStatuses,
    ),
    q: getParam(searchParams, "q").slice(0, 120),
    remoteType: getAllowedValue(
      getParam(searchParams, "remoteType"),
      options.remoteTypes,
    ),
    sort:
      getAllowedValue(
        getParam(searchParams, "sort"),
        publicOpportunitySortOptions,
      ) || "newest",
    specialty: getAllowedValue(
      getParam(searchParams, "specialty"),
      options.specialties,
    ),
    type: getAllowedValue(
      getParam(searchParams, "type"),
      studentOpportunityTypeOptions,
    ),
  };
}

function getPaginationSearchParams(filters: PublicOpportunityFilterValues) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) => value && !(key === "sort" && value === "newest"),
    ),
  );
}

export default function PublicOpportunitiesPage(
  props: PublicOpportunitiesPageProps,
) {
  return (
    <Suspense fallback={<PublicOpportunityDirectorySkeleton />}>
      <PublicOpportunitiesContent {...props} />
    </Suspense>
  );
}

async function PublicOpportunitiesContent({
  searchParams,
}: PublicOpportunitiesPageProps) {
  const [params, options, viewer] = await Promise.all([
    searchParams,
    getPublicOpportunityFilterOptions(),
    getMarketingViewer(),
  ]);
  const filters = parseFilters(params, options);
  const requestedPage = getPageParam(params.page);
  const role = viewer.role;
  const isSignedInStudent = Boolean(viewer.userId && role === "STUDENT");

  const opportunityQuery = {
    applicationMethod: (filters.applicationMethod || undefined) as
      | ApplicationMethod
      | undefined,
    availabilityStatus: (filters.availabilityStatus || undefined) as
      | OpportunityAvailabilityStatus
      | undefined,
    deadline: (filters.deadline || undefined) as
      | PublicOpportunityDeadline
      | undefined,
    grade: (filters.grade || undefined) as GradeLevelCode | undefined,
    location: filters.location || undefined,
    paidStatus: filters.paidStatus || undefined,
    q: filters.q || undefined,
    remoteType: filters.remoteType || undefined,
    sort: filters.sort as PublicOpportunitySort,
    specialty: filters.specialty || undefined,
    type: (filters.type || undefined) as OpportunityType | undefined,
  };
  const studentPromise =
    isSignedInStudent && viewer.userId
      ? prisma.user.findUnique({
          select: {
            studentProfile: {
              select: {
                ageYears: true,
                certifications: true,
                city: true,
                country: true,
                gradeYear: true,
                interestedSpecialties: true,
                opportunityTypes: true,
                state: true,
              },
            },
          },
          where: { clerkUserId: viewer.userId },
        })
      : Promise.resolve(null);
  const needsEligibilityScan = Boolean(
    filters.eligibility && isSignedInStudent,
  );
  const initialPagePromise = needsEligibilityScan
    ? Promise.resolve(null)
    : getPublicOpportunityPage({
        ...opportunityQuery,
        page: requestedPage,
        pageSize: publicOpportunityPageSize,
      });
  const [student, initialPage] = await Promise.all([
    studentPromise,
    initialPagePromise,
  ]);
  const profile = student?.studentProfile ?? null;
  const effectiveEligibility = profile ? filters.eligibility : "";

  let opportunities: PublicOpportunity[];
  let page: number;
  let totalCount: number;
  let totalPages: number;

  if (effectiveEligibility) {
    const eligibleOpportunities = (
      await getPublicOpportunitiesForEligibility(opportunityQuery)
    ).filter(
      (opportunity) =>
        evaluateOpportunityEligibility({ opportunity, student: profile })
          .category === effectiveEligibility,
    );
    totalCount = eligibleOpportunities.length;
    totalPages = getTotalPages(totalCount, publicOpportunityPageSize);
    page = Math.min(requestedPage, totalPages);
    const { skip, take } = getPagination(page, publicOpportunityPageSize);
    opportunities = eligibleOpportunities.slice(skip, skip + take);
  } else {
    const opportunityPage =
      initialPage ??
      (await getPublicOpportunityPage({
        ...opportunityQuery,
        page: requestedPage,
        pageSize: publicOpportunityPageSize,
      }));
    opportunities = opportunityPage.opportunities;
    page = opportunityPage.page;
    totalCount = opportunityPage.totalCount;
    totalPages = opportunityPage.totalPages;
  }

  const withEligibility = opportunities.map((opportunity) => ({
    eligibility: profile
      ? evaluateOpportunityEligibility({ opportunity, student: profile })
      : null,
    opportunity,
  }));
  const effectiveFilters = { ...filters, eligibility: effectiveEligibility };
  const paginationSearchParams = getPaginationSearchParams(effectiveFilters);
  const hasActiveFilters = Object.keys(paginationSearchParams).length > 0;
  const showFilters = hasActiveFilters || totalCount > 0;

  return (
    <>
      <PageHero
        actions={
          <>
            <DashboardEntryButton returnTo="/dashboard/student/opportunities" />
            <Link className={secondaryButtonClass} href="#directory-results">
              Browse current listings
            </Link>
          </>
        }
        description="Search current internships, research, shadowing, volunteering, mentorship, programs, and events. Every listing shown here has passed FP's publication and verification checks."
        eyebrow="Opportunity directory"
        title="Find your next healthcare experience."
      />

      <section className="border-b border-border bg-white">
        <MarketingContainer className="grid gap-4 py-5 text-sm text-muted-foreground sm:grid-cols-3">
          <p className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-4 text-success" />
            Published and verified listings only
          </p>
          <p>Application paths are labeled before you begin.</p>
          <p>Eligibility checks are guidance, not a placement guarantee.</p>
        </MarketingContainer>
      </section>

      <MarketingContainer className="py-10 sm:py-12">
        <div
          className={
            showFilters
              ? "grid items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]"
              : "grid items-start gap-7"
          }
        >
          {showFilters ? (
            <PublicOpportunityFilters
              filters={effectiveFilters}
              options={options}
              resultCount={totalCount}
              showEligibility={Boolean(profile)}
            />
          ) : null}

          <section
            aria-labelledby="directory-results-heading"
            id="directory-results"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Current directory
                </p>
                <h2
                  className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-navy"
                  id="directory-results-heading"
                >
                  {totalCount}{" "}
                  {totalCount === 1
                    ? "verified opportunity"
                    : "verified opportunities"}
                </h2>
              </div>
              {profile ? (
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  Match labels use your profile and the requirements published
                  by each organization.
                </p>
              ) : null}
            </div>

            {withEligibility.length > 0 ? (
              <div
                className={
                  withEligibility.length === 1
                    ? "mt-6 max-w-3xl"
                    : "mt-6 grid gap-5 md:grid-cols-2"
                }
              >
                {withEligibility.map(({ eligibility, opportunity }) => (
                  <PublicOpportunityCard
                    eligibility={eligibility}
                    key={opportunity.id}
                    opportunity={opportunity}
                    viewerRole={role}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center">
                <SearchX
                  aria-hidden="true"
                  className="mx-auto size-9 text-muted-foreground"
                />
                <h3 className="mt-5 text-xl font-semibold text-brand-navy">
                  {hasActiveFilters
                    ? "No opportunities match these filters"
                    : "No public listings are open right now"}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  {hasActiveFilters
                    ? "Try a broader search or reset the filters. New listings appear only after they are published, verified, and currently available."
                    : "New listings appear here only after they are published, verified, and currently available."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {hasActiveFilters ? (
                    <Link className={primaryButtonClass} href="/opportunities">
                      Reset filters
                    </Link>
                  ) : null}
                  <DashboardEntryButton
                    returnTo="/dashboard/student/opportunities"
                    variant={hasActiveFilters ? "secondary" : "primary"}
                  />
                </div>
              </div>
            )}

            <div className="mt-8">
              <PaginationControls
                page={page}
                pathname="/opportunities"
                searchParams={paginationSearchParams}
                totalCount={totalCount}
                totalPages={totalPages}
              />
            </div>
          </section>
        </div>
      </MarketingContainer>
    </>
  );
}
