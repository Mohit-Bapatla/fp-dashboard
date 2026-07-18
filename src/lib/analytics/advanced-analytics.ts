import "server-only";

import { prisma } from "@/lib/db/prisma";
import { getStudentProfileCompletion } from "@/lib/student/profile-completion";

export const analyticsRanges = ["7d", "30d", "all"] as const;

export type AnalyticsRange = (typeof analyticsRanges)[number];

export type FunnelMetric = {
  label: string;
  rate: number;
  total: number;
  value: number;
};

export type CountMetric = {
  label: string;
  value: number;
};

export type AdvancedAnalytics = {
  applicationFunnel: FunnelMetric[];
  opportunityApplicantCounts: CountMetric[];
  placementFunnel: FunnelMetric[];
  range: AnalyticsRange;
  staffTaskCompletion: CountMetric[];
  studentFunnel: FunnelMetric[];
};

function getCutoff(range: AnalyticsRange) {
  if (range === "all") {
    return null;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (range === "7d" ? 7 : 30));

  return cutoff;
}

function inRangeWhere(range: AnalyticsRange, field = "createdAt") {
  const cutoff = getCutoff(range);

  return cutoff
    ? {
        [field]: {
          gte: cutoff,
        },
      }
    : {};
}

function getRate(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function metric(label: string, value: number, total: number): FunnelMetric {
  return {
    label,
    rate: getRate(value, total),
    total,
    value,
  };
}

function formatDay(value: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(value);
}

export function getAnalyticsRange(value: string | undefined): AnalyticsRange {
  return analyticsRanges.includes(value as AnalyticsRange)
    ? (value as AnalyticsRange)
    : "30d";
}

export async function getAdvancedAnalytics(
  range: AnalyticsRange,
): Promise<AdvancedAnalytics> {
  const [
    students,
    profiles,
    submittedApplications,
    reviewedApplications,
    interviewApplications,
    acceptedApplications,
    placementRequests,
    assignedPlacementRequests,
    outreachStartedRequests,
    opportunityApplicantCounts,
    completedTasks,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "STUDENT",
        ...inRangeWhere(range),
      },
    }),
    prisma.studentProfile.findMany({
      where: inRangeWhere(range),
      select: {
        availability: true,
        applications: {
          where: {
            opportunity: {
              visibility: "PUBLIC_DIRECTORY",
              organization: { isSystemPlaceholder: false },
            },
          },
          select: {
            id: true,
          },
          take: 1,
        },
        careerGoals: true,
        city: true,
        country: true,
        experienceLevel: true,
        gradeYear: true,
        id: true,
        interestedSpecialties: true,
        opportunityTypes: true,
        resumes: {
          select: {
            id: true,
          },
          take: 1,
        },
        school: true,
        state: true,
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        status: {
          not: "DRAFT",
        },
        ...inRangeWhere(range, "createdAt"),
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        reviewedAt: {
          not: null,
        },
        ...inRangeWhere(range, "reviewedAt"),
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        status: {
          in: ["INTERVIEW", "ACCEPTED"],
        },
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.application.count({
      where: {
        opportunity: {
          visibility: "PUBLIC_DIRECTORY",
          organization: { isSystemPlaceholder: false },
        },
        status: "ACCEPTED",
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.placementRequest.count({
      where: inRangeWhere(range),
    }),
    prisma.placementRequest.count({
      where: {
        assignedStaffId: {
          not: null,
        },
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.placementRequest.count({
      where: {
        outreachTasks: {
          some: {},
        },
        ...inRangeWhere(range, "updatedAt"),
      },
    }),
    prisma.opportunity.findMany({
      where: {
        visibility: "PUBLIC_DIRECTORY",
        organization: { isSystemPlaceholder: false },
      },
      orderBy: {
        applications: {
          _count: "desc",
        },
      },
      take: 10,
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    }),
    prisma.outreachTask.findMany({
      where: {
        completedAt: {
          not: null,
        },
        ...inRangeWhere(range, "completedAt"),
      },
      orderBy: {
        completedAt: "asc",
      },
      select: {
        completedAt: true,
      },
    }),
  ]);
  const completedProfiles = profiles.filter(
    (profile) => getStudentProfileCompletion(profile).isComplete,
  );
  const profilesWithResume = completedProfiles.filter(
    (profile) => profile.resumes.length > 0,
  );
  const profilesWithApplication = completedProfiles.filter(
    (profile) => profile.applications.length > 0,
  );
  const tasksByDay = new Map<string, number>();

  completedTasks.forEach((task) => {
    if (!task.completedAt) {
      return;
    }

    const label = formatDay(task.completedAt);
    tasksByDay.set(label, (tasksByDay.get(label) ?? 0) + 1);
  });

  return {
    applicationFunnel: [
      metric("Submitted", submittedApplications, submittedApplications),
      metric("Reviewed", reviewedApplications, submittedApplications),
      metric("Interview", interviewApplications, submittedApplications),
      metric("Accepted", acceptedApplications, submittedApplications),
    ],
    opportunityApplicantCounts: opportunityApplicantCounts.map(
      (opportunity) => ({
        label: opportunity.title,
        value: opportunity._count.applications,
      }),
    ),
    placementFunnel: [
      metric("Requests created", placementRequests, placementRequests),
      metric("Assigned", assignedPlacementRequests, placementRequests),
      metric("Outreach started", outreachStartedRequests, placementRequests),
    ],
    range,
    staffTaskCompletion: Array.from(tasksByDay.entries()).map(
      ([label, value]) => ({
        label,
        value,
      }),
    ),
    studentFunnel: [
      metric("Student users", students, students),
      metric("Completed profiles", completedProfiles.length, students),
      metric(
        "Completed + resume",
        profilesWithResume.length,
        completedProfiles.length,
      ),
      metric(
        "Completed + application",
        profilesWithApplication.length,
        completedProfiles.length,
      ),
    ],
  };
}
