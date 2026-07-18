import { Building2, ClipboardCheck } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PartnerApplicantList } from "@/components/partner/partner-applicant-list";
import type { ApplicationStatus } from "@/generated/prisma/enums";
import { getRecordCommentThread } from "@/lib/comments/record-comments";
import { prisma } from "@/lib/db/prisma";
import { getApplicantSummary } from "@/lib/matching/applicant-summary";
import { getPageParam, getPagination, getTotalPages } from "@/lib/pagination";
import { getCurrentPartnerContext } from "@/lib/partner/context";
import { getPartnerNavItems } from "@/lib/partner/navigation";

type PartnerApplicantsPageProps = {
  searchParams: Promise<{
    opportunityId?: string;
    page?: string;
    status?: string;
  }>;
};

const statusOptions: ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusFilter(value: string | undefined) {
  return value && statusOptions.includes(value as ApplicationStatus)
    ? (value as ApplicationStatus)
    : "";
}

function buildRedirectTo(status: string, opportunityId: string) {
  const params = new URLSearchParams();

  if (opportunityId) {
    params.set("opportunityId", opportunityId);
  }

  if (status) {
    params.set("status", status);
  }

  const query = params.toString();

  return query
    ? `/dashboard/partner/applicants?${query}`
    : "/dashboard/partner/applicants";
}

export default async function PartnerApplicantsPage({
  searchParams,
}: PartnerApplicantsPageProps) {
  const context = await getCurrentPartnerContext();
  const params = await searchParams;
  const status = getStatusFilter(params.status);
  const page = getPageParam(params.page);
  const pagination = getPagination(page);
  const { organizationIds } = context;

  if (organizationIds.length === 0) {
    return (
      <DashboardShell
        navItems={getPartnerNavItems("/dashboard/partner/applicants")}
        role="partner"
      >
        <div className="space-y-8">
          <header>
            <RoleBadge role="partner" />
            <h1 className="mt-4 text-3xl font-semibold tracking-normal text-foreground">
              Applicants
            </h1>
          </header>
          <EmptyState
            description="Your account is not linked to a partner organization yet. A Future Physicians administrator must connect your account before applicant review is available."
            icon={Building2}
            title="Organization not connected"
          />
        </div>
      </DashboardShell>
    );
  }

  const opportunities = await prisma.opportunity.findMany({
    where: {
      visibility: "PUBLIC_DIRECTORY",
      organizationId: {
        in: organizationIds,
      },
      organization: {
        isSystemPlaceholder: false,
      },
    },
    orderBy: [
      {
        title: "asc",
      },
    ],
    select: {
      id: true,
      title: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  const ownedOpportunityIds = new Set(
    opportunities.map((opportunity) => opportunity.id),
  );
  const opportunityId =
    params.opportunityId && ownedOpportunityIds.has(params.opportunityId)
      ? params.opportunityId
      : "";
  const where = {
    opportunity: {
      visibility: "PUBLIC_DIRECTORY" as const,
      organizationId: {
        in: organizationIds,
      },
      organization: {
        isSystemPlaceholder: false,
      },
      ...(opportunityId ? { id: opportunityId } : {}),
    },
    ...(status ? { status } : {}),
  };

  const [
    applications,
    filteredCount,
    totalCount,
    pendingCount,
    interviewCount,
    acceptedCount,
  ] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: [
        {
          submittedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        status: true,
        statement: true,
        submittedAt: true,
        createdAt: true,
        reviewedAt: true,
        onboardingItems: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            completedAt: true,
            description: true,
            id: true,
            required: true,
            reviewedAt: true,
            reviewerNotes: true,
            status: true,
            studentNotes: true,
            submittedAt: true,
            title: true,
          },
        },
        interviewRequests: {
          where: {
            application: {
              opportunity: {
                visibility: "PUBLIC_DIRECTORY",
                organization: {
                  isSystemPlaceholder: false,
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            location: true,
            meetingLink: true,
            notes: true,
            selectedSlotId: true,
            status: true,
            studentResponseNotes: true,
            proposedSlots: {
              orderBy: {
                startsAt: "asc",
              },
              select: {
                endsAt: true,
                id: true,
                selected: true,
                startsAt: true,
              },
            },
          },
        },
        serviceHourRecords: {
          where: {
            opportunity: {
              visibility: "PUBLIC_DIRECTORY",
              organization: {
                isSystemPlaceholder: false,
              },
            },
            partnerOrganization: {
              isSystemPlaceholder: false,
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            certificateNotes: true,
            certificateStatus: true,
            description: true,
            hours: true,
            id: true,
            verificationNotes: true,
            verificationStatus: true,
            verifiedAt: true,
          },
        },
        resume: {
          select: {
            extractedCertifications: true,
            extractedEducation: true,
            extractedExperience: true,
            extractedSkills: true,
            fileName: true,
            parsedSummary: true,
          },
        },
        opportunity: {
          select: {
            description: true,
            eligibilityRequirements: true,
            id: true,
            location: true,
            remoteType: true,
            specialty: true,
            title: true,
            type: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        studentProfile: {
          select: {
            school: true,
            gradeYear: true,
            city: true,
            state: true,
            country: true,
            availability: true,
            locationPreference: true,
            remotePreference: true,
            interestedSpecialties: true,
            opportunityTypes: true,
            experienceLevel: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.application.count({
      where,
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
    }),
    prisma.application.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW"],
        },
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
    }),
    prisma.application.count({
      where: {
        status: "INTERVIEW",
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
    }),
    prisma.application.count({
      where: {
        status: "ACCEPTED",
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organizationId: {
            in: organizationIds,
          },
          organization: {
            isSystemPlaceholder: false,
          },
        },
      },
    }),
  ]);
  const totalPages = getTotalPages(filteredCount, pagination.pageSize);
  const redirectTo = buildRedirectTo(status, opportunityId);
  const feedbackByApplicationAndType = new Map(
    (
      await prisma.feedback.findMany({
        where: {
          authorId: context.user.id,
          entityId: {
            in: applications.map((application) => application.id),
          },
          entityType: "APPLICATION",
          feedbackType: {
            in: ["PARTNER_APPLICANT_QUALITY", "PARTNER_REVIEW_USEFULNESS"],
          },
        },
        select: {
          entityId: true,
          feedbackType: true,
          notes: true,
          rating: true,
        },
      })
    ).map((feedback) => [
      `${feedback.entityId}:${feedback.feedbackType}`,
      feedback,
    ]),
  );
  const applicationsWithSummaries = (
    await Promise.all(
      applications.map(async (application) => ({
        ...application,
        applicantQualityFeedback:
          feedbackByApplicationAndType.get(
            `${application.id}:PARTNER_APPLICANT_QUALITY`,
          ) ?? null,
        reviewUsefulnessFeedback:
          feedbackByApplicationAndType.get(
            `${application.id}:PARTNER_REVIEW_USEFULNESS`,
          ) ?? null,
        aiReview: await getApplicantSummary({
          opportunity: application.opportunity,
          profile: application.studentProfile,
          resume: application.resume
            ? {
                extractedCertifications:
                  application.resume.extractedCertifications,
                extractedEducation: application.resume.extractedEducation,
                extractedExperience: application.resume.extractedExperience,
                extractedSkills: application.resume.extractedSkills,
                parsedSummary: application.resume.parsedSummary,
              }
            : null,
          statement: application.statement,
        }),
        commentThread: await getRecordCommentThread({
          entityId: application.id,
          entityType: "APPLICATION",
        }),
      })),
    )
  ).sort((first, second) => second.aiReview.fitScore - first.aiReview.fitScore);

  return (
    <DashboardShell
      navItems={getPartnerNavItems("/dashboard/partner/applicants")}
      role="partner"
    >
      <div className="space-y-8">
        <header className="flex flex-col gap-5 rounded-lg border border-border bg-background p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <RoleBadge className="mb-5" role="partner" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Applicant review
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Applicants
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Review submitted student applications for opportunities owned by
              your linked organization records.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <ClipboardCheck aria-hidden="true" className="h-6 w-6" />
          </div>
        </header>

        <section
          aria-label="Partner applicant stats"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            helper="All applications submitted to your organization opportunities."
            label="Total applicants"
            value={totalCount.toString()}
          />
          <StatCard
            helper="Submitted or under-review applications awaiting decisions."
            label="In review"
            value={pendingCount.toString()}
          />
          <StatCard
            helper="Applicants currently marked for interview."
            label="Interview"
            value={interviewCount.toString()}
          />
          <StatCard
            helper="Applications accepted by your organization."
            label="Accepted"
            value={acceptedCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
          <form className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_220px_auto] lg:items-end">
            <label className="text-sm font-medium text-foreground">
              Opportunity
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={opportunityId}
                name="opportunityId"
              >
                <option value="">All opportunities</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.title} - {opportunity.organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
                defaultValue={status}
                name="status"
              >
                <option value="">Any status</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEnumLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                type="submit"
              >
                Apply filters
              </button>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                href="/dashboard/partner/applicants"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <PartnerApplicantList
          applications={applicationsWithSummaries}
          hasAnyApplicants={totalCount > 0}
          redirectTo={redirectTo}
        />
        <PaginationControls
          page={page}
          pathname="/dashboard/partner/applicants"
          searchParams={{
            ...(status ? { status } : {}),
            ...(opportunityId ? { opportunityId } : {}),
          }}
          totalCount={filteredCount}
          totalPages={totalPages}
        />
      </div>
    </DashboardShell>
  );
}
