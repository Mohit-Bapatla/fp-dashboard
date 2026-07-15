import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  ApplicationMethod,
  GradeLevelCode,
  OpportunityAvailabilityStatus,
  OpportunityType,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";
import { isSafeExternalUrl } from "@/lib/security/safe-url";

export const publicOpportunitySortOptions = [
  "newest",
  "deadline",
  "recently-verified",
] as const;

export const publicOpportunityDeadlineOptions = [
  "30-days",
  "60-days",
  "90-days",
  "rolling",
] as const;

export type PublicOpportunitySort =
  (typeof publicOpportunitySortOptions)[number];
export type PublicOpportunityDeadline =
  (typeof publicOpportunityDeadlineOptions)[number];

export type PublicOpportunityQuery = {
  applicationMethod?: ApplicationMethod;
  availabilityStatus?: OpportunityAvailabilityStatus;
  deadline?: PublicOpportunityDeadline;
  grade?: GradeLevelCode;
  limit?: number;
  location?: string;
  paidStatus?: string;
  q?: string;
  remoteType?: string;
  sort?: PublicOpportunitySort;
  specialty?: string;
  type?: OpportunityType;
};

export const publicOpportunityPageSize = 12;

export type PublicOpportunityPage = {
  opportunities: PublicOpportunityRecord[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const publicOpportunitySelect = {
  acceptedGradeLevels: true,
  applicationInstructions: true,
  applicationMethod: true,
  availabilityStatus: true,
  capacity: true,
  citizenshipRequirement: true,
  city: true,
  country: true,
  cycleLabel: true,
  deadline: true,
  description: true,
  eligibilityRequirements: true,
  eligibilityUnknowns: true,
  endsAt: true,
  essayQuestionCount: true,
  estimatedApplicationMinutes: true,
  estimatedWeeklyHours: true,
  geographicScope: true,
  id: true,
  isRolling: true,
  lastVerifiedAt: true,
  location: true,
  maximumAge: true,
  minimumAge: true,
  minimumGpa: true,
  officialApplicationUrl: true,
  officialSourceUrl: true,
  opensAt: true,
  organization: {
    select: {
      name: true,
      website: true,
    },
  },
  paidStatus: true,
  parentPermissionRequired: true,
  publishedAt: true,
  relationshipType: true,
  remoteType: true,
  requiredCertifications: true,
  requiredDocuments: true,
  requiredExperience: true,
  residencyRequirement: true,
  scheduleRequirements: true,
  shortDescription: true,
  specialty: true,
  startsAt: true,
  state: true,
  title: true,
  transportationNotes: true,
  type: true,
  workAuthorizationRequired: true,
} satisfies Prisma.OpportunitySelect;

type PublicOpportunityRecord = Prisma.OpportunityGetPayload<{
  select: typeof publicOpportunitySelect;
}>;

function cleanText(value: string | undefined, maxLength = 120) {
  const cleaned = value?.trim().slice(0, maxLength);
  return cleaned || undefined;
}

function normalizeLimit(value: number | undefined, fallback = 100) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value ?? fallback), 1), 100);
}

function normalizePage(value: number | undefined) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(Math.trunc(value ?? 1), 1);
}

function sanitizePublicOpportunity(
  opportunity: PublicOpportunityRecord,
): PublicOpportunityRecord {
  return {
    ...opportunity,
    officialApplicationUrl: isSafeExternalUrl(
      opportunity.officialApplicationUrl,
    )
      ? opportunity.officialApplicationUrl
      : null,
    officialSourceUrl: isSafeExternalUrl(opportunity.officialSourceUrl)
      ? opportunity.officialSourceUrl
      : null,
    organization: {
      ...opportunity.organization,
      website: isSafeExternalUrl(opportunity.organization.website)
        ? opportunity.organization.website
        : null,
    },
  };
}

function getDeadlineWhere(
  deadline: PublicOpportunityDeadline | undefined,
  now: Date,
): Prisma.OpportunityWhereInput | null {
  if (!deadline) return null;

  if (deadline === "rolling") {
    return {
      OR: [{ isRolling: true }, { availabilityStatus: "ROLLING" }],
    };
  }

  const dayCount =
    deadline === "30-days" ? 30 : deadline === "60-days" ? 60 : 90;
  const through = new Date(now);
  through.setUTCDate(through.getUTCDate() + dayCount);

  return { deadline: { gte: now, lte: through } };
}

function getApplicationMethodWhere(
  applicationMethod: ApplicationMethod | undefined,
): Prisma.OpportunityWhereInput | null {
  if (!applicationMethod) return null;

  // External public records always use an external application flow, even if
  // an older record still carries a different configured value.
  return applicationMethod === "EXTERNAL_PORTAL"
    ? {
        OR: [
          { relationshipType: "EXTERNAL_PUBLIC" },
          { applicationMethod: "EXTERNAL_PORTAL" },
        ],
      }
    : {
        applicationMethod,
        relationshipType: { not: "EXTERNAL_PUBLIC" },
      };
}

function buildPublicOpportunityWhere(
  input: PublicOpportunityQuery,
  now: Date,
): Prisma.OpportunityWhereInput {
  const and: Prisma.OpportunityWhereInput[] = [
    studentDirectoryOpportunityWhere(now),
  ];
  const q = cleanText(input.q);
  const location = cleanText(input.location);
  const remoteType = cleanText(input.remoteType);
  const paidStatus = cleanText(input.paidStatus);
  const specialty = cleanText(input.specialty);

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { specialty: { contains: q, mode: "insensitive" } },
        {
          organization: {
            is: { name: { contains: q, mode: "insensitive" } },
          },
        },
      ],
    });
  }

  if (input.type) and.push({ type: input.type });
  if (specialty) and.push({ specialty });
  if (remoteType) and.push({ remoteType });
  if (paidStatus) and.push({ paidStatus });
  if (location) {
    and.push({
      OR: [
        { location: { contains: location, mode: "insensitive" } },
        { city: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
        { country: { contains: location, mode: "insensitive" } },
      ],
    });
  }
  if (input.grade) {
    and.push({ acceptedGradeLevels: { has: input.grade } });
  }
  if (input.availabilityStatus) {
    and.push({ availabilityStatus: input.availabilityStatus });
  }

  const deadlineWhere = getDeadlineWhere(input.deadline, now);
  if (deadlineWhere) and.push(deadlineWhere);

  const applicationMethodWhere = getApplicationMethodWhere(
    input.applicationMethod,
  );
  if (applicationMethodWhere) and.push(applicationMethodWhere);

  return { AND: and };
}

function getPublicOpportunityOrderBy(
  sort: PublicOpportunitySort | undefined,
): Prisma.OpportunityOrderByWithRelationInput[] {
  if (sort === "deadline") {
    return [
      { deadline: { sort: "asc", nulls: "last" } },
      { publishedAt: "desc" },
      { id: "asc" },
    ];
  }

  if (sort === "recently-verified") {
    return [{ lastVerifiedAt: "desc" }, { publishedAt: "desc" }, { id: "asc" }];
  }

  return [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }];
}

export async function getPublicOpportunities(
  input: PublicOpportunityQuery = {},
) {
  const now = new Date();
  const opportunities = await prisma.opportunity.findMany({
    orderBy: getPublicOpportunityOrderBy(input.sort),
    select: publicOpportunitySelect,
    take: normalizeLimit(input.limit),
    where: buildPublicOpportunityWhere(input, now),
  });

  return opportunities.map(sanitizePublicOpportunity);
}

export async function getPublicOpportunityPage({
  page: requestedPage,
  pageSize: requestedPageSize = publicOpportunityPageSize,
  ...input
}: PublicOpportunityQuery & { page?: number; pageSize?: number } = {}) {
  const now = new Date();
  const pageSize = normalizeLimit(requestedPageSize, publicOpportunityPageSize);
  const where = buildPublicOpportunityWhere(input, now);
  const totalCount = await prisma.opportunity.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const page = Math.min(normalizePage(requestedPage), totalPages);
  const opportunities = await prisma.opportunity.findMany({
    orderBy: getPublicOpportunityOrderBy(input.sort),
    select: publicOpportunitySelect,
    skip: (page - 1) * pageSize,
    take: pageSize,
    where,
  });

  return {
    opportunities: opportunities.map(sanitizePublicOpportunity),
    page,
    pageSize,
    totalCount,
    totalPages,
  } satisfies PublicOpportunityPage;
}

/**
 * Eligibility categories are derived from both a private student profile and
 * listing requirements, so they cannot be represented by a public SQL filter.
 * This uncapped query is reserved for that signed-in filtering path; normal
 * directory traffic must use getPublicOpportunityPage.
 */
export async function getPublicOpportunitiesForEligibility(
  input: PublicOpportunityQuery = {},
) {
  const now = new Date();
  const opportunities = await prisma.opportunity.findMany({
    orderBy: getPublicOpportunityOrderBy(input.sort),
    select: publicOpportunitySelect,
    where: buildPublicOpportunityWhere(input, now),
  });

  return opportunities.map(sanitizePublicOpportunity);
}

export async function getFeaturedPublicOpportunities(limit = 6) {
  return getPublicOpportunities({ limit: normalizeLimit(limit, 6) });
}

export async function getPublicOpportunity(opportunityId: string) {
  const id = opportunityId.trim().slice(0, 128);
  if (!id) return null;

  try {
    const opportunity = await prisma.opportunity.findFirst({
      select: publicOpportunitySelect,
      where: {
        AND: [studentDirectoryOpportunityWhere(), { id }],
      },
    });

    return opportunity ? sanitizePublicOpportunity(opportunity) : null;
  } catch (error) {
    // A deployment waiting on an additive opportunity migration should render
    // the same not-found state for every ID without probing private records.
    if (isOutOfSyncSchemaError(error)) return null;
    throw error;
  }
}

function isOutOfSyncSchemaError(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  return error.code === "P2021" || error.code === "P2022";
}

export async function getPublicOpportunityFilterOptions() {
  const opportunities = await prisma.opportunity.findMany({
    select: {
      location: true,
      paidStatus: true,
      remoteType: true,
      specialty: true,
    },
    where: studentDirectoryOpportunityWhere(),
  });

  const unique = (values: Array<string | null>) =>
    Array.from(
      new Set(
        values
          .map((value) => value?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((first, second) => first.localeCompare(second));

  return {
    locations: unique(opportunities.map(({ location }) => location)),
    paidStatuses: unique(opportunities.map(({ paidStatus }) => paidStatus)),
    remoteTypes: unique(opportunities.map(({ remoteType }) => remoteType)),
    specialties: unique(opportunities.map(({ specialty }) => specialty)),
  };
}

export type PublicOpportunity = PublicOpportunityRecord;
export type PublicOpportunityFilterOptions = Awaited<
  ReturnType<typeof getPublicOpportunityFilterOptions>
>;
