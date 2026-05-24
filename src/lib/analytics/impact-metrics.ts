import "server-only";

import { prisma } from "@/lib/db/prisma";

export const impactRanges = ["7d", "30d", "all"] as const;

export type ImpactRange = (typeof impactRanges)[number];

export type ImpactStatusCount = {
  count: number;
  status: string;
};

export type ImpactMetric = {
  definition: string;
  label: string;
  value: number;
};

export type ImpactMetrics = {
  acceptedApplications: number;
  applicationStatusCounts: ImpactStatusCount[];
  applicationsSubmitted: number;
  completedStudentProfiles: number;
  eventRegistrations: number;
  eventsCreated: number;
  interviewsRequested: number;
  interviewsScheduled: number;
  metricDefinitions: Array<{
    definition: string;
    label: string;
  }>;
  opportunitiesListed: number;
  outreachContacts: number;
  outreachTasksCompleted: number;
  partnerApplicantStatusChanges: number;
  partnerOrganizationsManaged: number;
  placementRequestStatusCounts: ImpactStatusCount[];
  placementRequestsProcessed: number;
  publishedOpportunities: number;
  range: ImpactRange;
  recommendationApplications: number;
  recommendationClicks: number;
  recommendationImpressions: number;
  resumesUploaded: number;
  serviceHoursVerified: number;
  studentsOnboarded: number;
};

function getCutoff(range: ImpactRange) {
  if (range === "all") {
    return null;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (range === "7d" ? 7 : 30));

  return cutoff;
}

function inRangeWhere(range: ImpactRange, field = "createdAt") {
  const cutoff = getCutoff(range);

  return cutoff
    ? {
        [field]: {
          gte: cutoff,
        },
      }
    : {};
}

function submittedApplicationWhere(range: ImpactRange) {
  const cutoff = getCutoff(range);

  return {
    status: {
      not: "DRAFT" as const,
    },
    submittedAt: cutoff
      ? {
          gte: cutoff,
        }
      : {
          not: null,
        },
  };
}

function mapStatusCounts(
  rows: Array<{
    _count: {
      _all: number;
    };
    status: string;
  }>,
): ImpactStatusCount[] {
  return rows.map((row) => ({
    count: row._count._all,
    status: row.status,
  }));
}

export function getImpactRange(value: string | undefined): ImpactRange {
  return impactRanges.includes(value as ImpactRange)
    ? (value as ImpactRange)
    : "30d";
}

export async function getImpactMetrics(
  range: ImpactRange,
): Promise<ImpactMetrics> {
  const [
    studentsOnboarded,
    completedStudentProfiles,
    resumesUploaded,
    opportunitiesListed,
    publishedOpportunities,
    applicationsSubmitted,
    applicationStatusRows,
    placementRequestsProcessed,
    placementRequestStatusRows,
    partnerOrganizationsManaged,
    outreachContacts,
    outreachTasksCompleted,
    eventsCreated,
    eventRegistrations,
    serviceHours,
    partnerApplicantStatusChanges,
    recommendationImpressions,
    recommendationClicks,
    recommendationApplications,
    acceptedApplications,
    interviewsRequested,
    interviewsScheduled,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "STUDENT",
        ...inRangeWhere(range),
      },
    }),
    prisma.studentProfile.count({
      where: {
        gradeYear: {
          not: null,
        },
        school: {
          not: null,
        },
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.resume.count({
      where: inRangeWhere(range),
    }),
    prisma.opportunity.count({
      where: inRangeWhere(range),
    }),
    prisma.opportunity.count({
      where: {
        status: "PUBLISHED",
        ...inRangeWhere(range, "publishedAt"),
      },
    }),
    prisma.application.count({
      where: submittedApplicationWhere(range),
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: submittedApplicationWhere(range),
      _count: {
        _all: true,
      },
      orderBy: {
        status: "asc",
      },
    }),
    prisma.placementRequest.count({
      where: {
        status: {
          not: "NEW",
        },
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.placementRequest.groupBy({
      by: ["status"],
      where: inRangeWhere(range, "updatedAt"),
      _count: {
        _all: true,
      },
      orderBy: {
        status: "asc",
      },
    }),
    prisma.partnerOrganization.count({
      where: inRangeWhere(range),
    }),
    prisma.outreachContact.count({
      where: inRangeWhere(range),
    }),
    prisma.outreachTask.count({
      where: {
        completedAt: {
          not: null,
        },
        status: "COMPLETED",
        ...inRangeWhere(range, "completedAt"),
      },
    }),
    prisma.programEvent.count({
      where: inRangeWhere(range),
    }),
    prisma.eventRegistration.count({
      where: inRangeWhere(range),
    }),
    prisma.serviceHourRecord.aggregate({
      where: {
        verificationStatus: "VERIFIED",
        ...inRangeWhere(range, "verifiedAt"),
      },
      _sum: {
        hours: true,
      },
    }),
    prisma.auditLog.count({
      where: {
        action: "APPLICATION_STATUS_UPDATED",
        entityType: "Application",
        actor: {
          role: "PARTNER",
        },
        ...inRangeWhere(range),
      },
    }),
    prisma.recommendationEvent.count({
      where: {
        eventType: "IMPRESSION",
        ...inRangeWhere(range),
      },
    }),
    prisma.recommendationEvent.count({
      where: {
        eventType: "CLICK",
        ...inRangeWhere(range),
      },
    }),
    prisma.recommendationEvent.count({
      where: {
        eventType: "APPLICATION",
        ...inRangeWhere(range),
      },
    }),
    prisma.application.count({
      where: {
        status: "ACCEPTED",
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.interviewRequest.count({
      where: inRangeWhere(range),
    }),
    prisma.interviewRequest.count({
      where: {
        status: "SCHEDULED",
        ...inRangeWhere(range, "scheduledAt"),
      },
    }),
  ]);

  return {
    acceptedApplications,
    applicationStatusCounts: mapStatusCounts(applicationStatusRows),
    applicationsSubmitted,
    completedStudentProfiles,
    eventRegistrations,
    eventsCreated,
    interviewsRequested,
    interviewsScheduled,
    metricDefinitions,
    opportunitiesListed,
    outreachContacts,
    outreachTasksCompleted,
    partnerApplicantStatusChanges,
    partnerOrganizationsManaged,
    placementRequestStatusCounts: mapStatusCounts(placementRequestStatusRows),
    placementRequestsProcessed,
    publishedOpportunities,
    range,
    recommendationApplications,
    recommendationClicks,
    recommendationImpressions,
    resumesUploaded,
    serviceHoursVerified: serviceHours._sum.hours ?? 0,
    studentsOnboarded,
  };
}

export const metricDefinitions = [
  {
    definition:
      "Student user records with role STUDENT created during the selected range.",
    label: "Students onboarded",
  },
  {
    definition:
      "Student profiles with core school and grade fields present; date ranges use profile update time.",
    label: "Completed student profiles",
  },
  {
    definition: "Resume metadata records created during the selected range.",
    label: "Resumes uploaded",
  },
  {
    definition: "Opportunity records created during the selected range.",
    label: "Opportunities listed",
  },
  {
    definition:
      "Opportunities currently PUBLISHED; date ranges use publishedAt.",
    label: "Published opportunities",
  },
  {
    definition:
      "Non-draft applications with submittedAt set during the selected range.",
    label: "Applications submitted",
  },
  {
    definition:
      "Current application statuses for submitted non-draft applications in the selected range.",
    label: "Applications by status",
  },
  {
    definition: "Placement requests no longer NEW; date ranges use updatedAt.",
    label: "Placement requests processed",
  },
  {
    definition:
      "Current placement request statuses for requests updated during the selected range.",
    label: "Placement requests by status",
  },
  {
    definition:
      "Partner organization records created during the selected range.",
    label: "Partner organizations managed",
  },
  {
    definition: "Outreach contact records created during the selected range.",
    label: "Outreach contacts",
  },
  {
    definition:
      "Outreach tasks marked COMPLETED with completedAt in the selected range.",
    label: "Outreach tasks completed",
  },
  {
    definition: "Program event records created during the selected range.",
    label: "Events created",
  },
  {
    definition: "Event registration records created during the selected range.",
    label: "Event registrations",
  },
  {
    definition:
      "Sum of service hours on records marked VERIFIED; date ranges use verifiedAt.",
    label: "Service hours verified",
  },
  {
    definition:
      "Application status update audit logs made by users with the PARTNER role.",
    label: "Partner applicant reviews/status changes",
  },
  {
    definition:
      "Recommendation event records with eventType IMPRESSION, CLICK, or APPLICATION.",
    label: "Recommendation activity",
  },
  {
    definition:
      "Applications currently ACCEPTED; date ranges use application updatedAt.",
    label: "Accepted applications",
  },
  {
    definition:
      "Interview requests created, and requests currently SCHEDULED using scheduledAt for date ranges.",
    label: "Interviews requested/scheduled",
  },
] satisfies Array<{ definition: string; label: string }>;
