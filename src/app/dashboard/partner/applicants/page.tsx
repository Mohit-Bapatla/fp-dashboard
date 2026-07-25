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
import {
  loadOptionalWorkflowData,
  logWorkflowFailure,
} from "@/lib/reliability/workflow-errors";

type PartnerApplicantsPageProps = {
  searchParams: Promise<{
    opportunityId?: string;
    error?: string;
    notice?: string;
    page?: string;
    reference?: string;
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
  const statLoad = (action: string, load: () => Promise<number>) =>
    loadOptionalWorkflowData({
      action,
      fallback: 0,
      load,
      route: "/dashboard/partner/applicants",
      userId: context.user.id,
    });

  const [
    applicationsResult,
    filteredCountResult,
    totalCountResult,
    pendingCountResult,
    interviewCountResult,
    acceptedCountResult,
  ] = await Promise.all([
    loadOptionalWorkflowData({
      action: "load_partner_applicant_optional_details",
      fallback: [],
      load: () =>
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
                    organizationId: {
                      in: organizationIds,
                    },
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
                  organizationId: {
                    in: organizationIds,
                  },
                  organization: {
                    isSystemPlaceholder: false,
                  },
                },
                partnerOrganization: {
                  id: {
                    in: organizationIds,
                  },
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
      route: "/dashboard/partner/applicants",
      userId: context.user.id,
    }),
    statLoad("load_partner_filtered_application_count", () =>
      prisma.application.count({
        where,
      }),
    ),
    statLoad("load_partner_total_application_count", () =>
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
    ),
    statLoad("load_partner_pending_application_count", () =>
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
    ),
    statLoad("load_partner_interview_application_count", () =>
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
    ),
    statLoad("load_partner_accepted_application_count", () =>
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
    ),
  ]);
  let applications = applicationsResult.value;

  if (!applicationsResult.available) {
    try {
      const coreApplications = await prisma.application.findMany({
        where,
        orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          status: true,
          statement: true,
          submittedAt: true,
          createdAt: true,
          reviewedAt: true,
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
      });

      applications = coreApplications.map((application) => ({
        ...application,
        interviewRequests: [],
        onboardingItems: [],
        resume: null,
        serviceHourRecords: [],
      }));
    } catch (error) {
      logWorkflowFailure({
        action: "load_partner_applicant_core_data",
        error,
        route: "/dashboard/partner/applicants",
        userId: context.user.id,
      });
      throw error;
    }
  }
  const filteredCount = filteredCountResult.available
    ? filteredCountResult.value
    : applications.length;
  const totalCount = totalCountResult.value;
  const pendingCount = pendingCountResult.value;
  const interviewCount = interviewCountResult.value;
  const acceptedCount = acceptedCountResult.value;
  const allStatsAvailable = [
    totalCountResult,
    pendingCountResult,
    interviewCountResult,
    acceptedCountResult,
  ].every((result) => result.available);
  const totalPages = getTotalPages(filteredCount, pagination.pageSize);
  const redirectTo = buildRedirectTo(status, opportunityId);
  const feedbackResult = await loadOptionalWorkflowData({
    action: "load_partner_applicant_feedback",
    fallback: [],
    load: () =>
      prisma.feedback.findMany({
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
      }),
    route: "/dashboard/partner/applicants",
    userId: context.user.id,
  });
  const feedbackByApplicationAndType = new Map(
    feedbackResult.value.map((feedback) => [
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
        commentThread: (
          await loadOptionalWorkflowData({
            action: "load_partner_applicant_comments",
            fallback: { allowedVisibilities: [], comments: [] },
            load: () =>
              getRecordCommentThread({
                entityId: application.id,
                entityType: "APPLICATION",
              }),
            route: "/dashboard/partner/applicants",
            userId: context.user.id,
          })
        ).value,
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

        {params.error === "rate_limited" ? (
          <p
            className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
            role="alert"
          >
            Too many updates were attempted. Wait a moment and try again.
          </p>
        ) : null}
        {params.notice ? (
          <p
            className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
            role="status"
          >
            {params.notice === "status_updated"
              ? "Application status updated."
              : params.notice === "already_updated"
                ? "That application already has the selected status."
                : "The application changed in another session. The latest status is shown below."}
          </p>
        ) : null}
        {!allStatsAvailable ? (
          <p
            className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
            role="status"
          >
            Applicants are available, but one or more summary counts could not
            be loaded. Try again for refreshed totals.
          </p>
        ) : null}

        <section
          aria-label="Partner applicant stats"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            helper="All applications submitted to your organization opportunities."
            label="Total applicants"
            value={
              totalCountResult.available ? totalCount.toString() : "Unavailable"
            }
          />
          <StatCard
            helper="Submitted or under-review applications awaiting decisions."
            label="In review"
            value={
              pendingCountResult.available
                ? pendingCount.toString()
                : "Unavailable"
            }
          />
          <StatCard
            helper="Applicants currently marked for interview."
            label="Interview"
            value={
              interviewCountResult.available
                ? interviewCount.toString()
                : "Unavailable"
            }
          />
          <StatCard
            helper="Applications accepted by your organization."
            label="Accepted"
            value={
              acceptedCountResult.available
                ? acceptedCount.toString()
                : "Unavailable"
            }
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
          hasAnyApplicants={
            totalCountResult.available
              ? totalCount > 0
              : applications.length > 0
          }
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
