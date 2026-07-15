import { auth } from "@clerk/nextjs/server";
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
import type {
  ApplicationMethod,
  GradeLevelCode,
  OpportunityAvailabilityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";
import { getRoleFromSessionClaims } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import {
  evaluateOpportunityEligibility,
  type EligibilityCategory,
} from "@/lib/matching/opportunity-eligibility";
import { gradeLevelCodes } from "@/lib/matching/grade-levels";
import {
  getPublicOpportunities,
  getPublicOpportunityFilterOptions,
  publicOpportunityDeadlineOptions,
  publicOpportunitySortOptions,
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
  const [params, options, authState] = await Promise.all([
    searchParams,
    getPublicOpportunityFilterOptions(),
    auth(),
  ]);
  const filters = parseFilters(params, options);
  const role = authState.userId
    ? getRoleFromSessionClaims(authState.sessionClaims)
    : null;
  const isSignedInStudent = Boolean(authState.userId && role === "STUDENT");

  const [opportunities, student] = await Promise.all([
    getPublicOpportunities({
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
      limit: 100,
      location: filters.location || undefined,
      paidStatus: filters.paidStatus || undefined,
      q: filters.q || undefined,
      remoteType: filters.remoteType || undefined,
      sort: filters.sort as PublicOpportunitySort,
      specialty: filters.specialty || undefined,
      type: (filters.type || undefined) as OpportunityType | undefined,
    }),
    isSignedInStudent && authState.userId
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
          where: { clerkUserId: authState.userId },
        })
      : Promise.resolve(null),
  ]);

  const profile = student?.studentProfile ?? null;
  const withEligibility = opportunities.map((opportunity) => ({
    eligibility: profile
      ? evaluateOpportunityEligibility({ opportunity, student: profile })
      : null,
    opportunity,
  }));
  const effectiveEligibility = profile ? filters.eligibility : "";
  const effectiveFilters = { ...filters, eligibility: effectiveEligibility };
  const visibleOpportunities = effectiveEligibility
    ? withEligibility.filter(
        ({ eligibility }) => eligibility?.category === effectiveEligibility,
      )
    : withEligibility;

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
        <div className="grid items-start gap-7 lg:grid-cols-[280px_minmax(0,1fr)]">
          <PublicOpportunityFilters
            filters={effectiveFilters}
            options={options}
            resultCount={visibleOpportunities.length}
            showEligibility={Boolean(profile)}
          />

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
                  {visibleOpportunities.length}{" "}
                  {visibleOpportunities.length === 1
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

            {visibleOpportunities.length > 0 ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {visibleOpportunities.map(({ eligibility, opportunity }) => (
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
                  No opportunities match these filters
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                  Try a broader search or reset the filters. New listings appear
                  only after they are published, verified, and currently
                  available.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link className={primaryButtonClass} href="/opportunities">
                    Reset filters
                  </Link>
                  <DashboardEntryButton
                    returnTo="/dashboard/student/opportunities"
                    variant="secondary"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </MarketingContainer>
    </>
  );
}
