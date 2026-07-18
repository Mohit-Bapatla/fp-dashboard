import "server-only";

import { prisma } from "@/lib/db/prisma";
import { evaluateOpportunityEligibility } from "@/lib/matching/opportunity-eligibility";
import {
  differenceInStudentCalendarDays,
  differenceInZonedCalendarDays,
  formatDatabaseCalendarDate,
} from "@/lib/notifications/reminder-schedule";
import { isApplicationTaskReminderRelevant } from "@/lib/notifications/student-reminder-rules";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";

export type WeeklyPlanItemCategory =
  | "CONFIRMATION"
  | "DEADLINE"
  | "DUE_SOON"
  | "INTERVIEW"
  | "NEW_OPPORTUNITY"
  | "OPENING"
  | "OVERDUE";

export type WeeklyPlanItem = {
  actionUrl: string;
  category: WeeklyPlanItemCategory;
  date: Date | null;
  detail: string;
  key: string;
  title: string;
};

export type StudentWeeklyPlan = {
  generatedAt: Date;
  items: WeeklyPlanItem[];
  timezone: string;
};

const categoryPriority: Record<WeeklyPlanItemCategory, number> = {
  OVERDUE: 0,
  DEADLINE: 1,
  DUE_SOON: 2,
  CONFIRMATION: 3,
  INTERVIEW: 4,
  OPENING: 5,
  NEW_OPPORTUNITY: 6,
};

const preSubmissionStatuses = new Set([
  "DRAFT",
  "SAVED",
  "PLANNING",
  "PREPARING",
  "WAITING_FOR_RECOMMENDATION",
  "READY_TO_SUBMIT",
]);

const taskLabels: Record<string, string> = {
  COMPLETE_PARENT_FORM: "Complete the parent form",
  CONFIRM_EXTERNAL_SUBMISSION: "Confirm your external submission",
  CONFIRM_RECOMMENDATION: "Confirm your recommendation",
  OPEN_EXTERNAL_PORTAL: "Open the external application portal",
  PREPARE_ESSAY: "Prepare your essay response",
  PREPARE_FOR_INTERVIEW: "Prepare for your interview",
  REPORT_OUTCOME: "Report your application outcome",
  REQUEST_RECOMMENDATION: "Request your recommendation",
  REVIEW_ELIGIBILITY: "Review your eligibility",
  REVIEW_ESSAY: "Review your essay response",
  REVIEW_OFFICIAL_REQUIREMENTS: "Review the official requirements",
  SCHEDULE_INTERVIEW: "Schedule your interview",
  SELECT_RESUME: "Select a resume",
  SEND_FOLLOW_UP: "Send your follow-up",
  SUBMIT_INTERNAL_APPLICATION: "Submit your FP application",
  UPLOAD_RESUME: "Upload your resume",
  UPLOAD_TRANSCRIPT: "Track your transcript",
};

export function getWeeklyPlanTaskLabel(type: string) {
  return taskLabels[type] ?? "Complete a private application task";
}

export function finalizeWeeklyPlanItems(items: WeeklyPlanItem[], limit = 12) {
  const uniqueItems = Array.from(
    new Map(items.map((item) => [item.key, item])).values(),
  );

  return uniqueItems
    .sort((first, second) => {
      const priorityDifference =
        categoryPriority[first.category] - categoryPriority[second.category];
      if (priorityDifference !== 0) return priorityDifference;

      const firstDate = first.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const secondDate = second.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (firstDate !== secondDate) return firstDate - secondDate;

      return first.title.localeCompare(second.title);
    })
    .slice(0, limit);
}

function applicationOrganizationName(opportunity: {
  organization: { name: string };
  studentOrganizationName: string | null;
}) {
  return opportunity.studentOrganizationName || opportunity.organization.name;
}

function deadlineDetail(days: number, date: Date) {
  if (days === 0) return `Due today, ${formatDatabaseCalendarDate(date)}.`;
  if (days === 1) return `Due tomorrow, ${formatDatabaseCalendarDate(date)}.`;
  return `Due in ${days} days, ${formatDatabaseCalendarDate(date)}.`;
}

export async function getStudentWeeklyPlan({
  now = new Date(),
  studentProfileId,
  timezone,
}: {
  now?: Date;
  studentProfileId: string;
  timezone: string;
}): Promise<StudentWeeklyPlan> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    select: {
      ageYears: true,
      applications: {
        where: {
          status: { not: "WITHDRAWN" },
        },
        select: {
          applicationMethod: true,
          id: true,
          interviewRequests: {
            where: { status: "SCHEDULED" },
            select: {
              id: true,
              scheduledAt: true,
              selectedSlot: { select: { startsAt: true } },
            },
          },
          opportunity: {
            select: {
              availabilityStatus: true,
              deadline: true,
              id: true,
              opensAt: true,
              organization: { select: { name: true } },
              studentOrganizationName: true,
              title: true,
            },
          },
          status: true,
          targetDeadline: true,
          tasks: {
            where: {
              status: { notIn: ["COMPLETE", "SKIPPED"] },
            },
            select: {
              dueAt: true,
              id: true,
              required: true,
              status: true,
              type: true,
            },
          },
        },
      },
      certifications: true,
      city: true,
      country: true,
      gradeYear: true,
      interestedSpecialties: true,
      opportunityTypes: true,
      savedOpportunities: {
        where: { dismissedAt: null },
        select: {
          opportunity: {
            select: {
              availabilityStatus: true,
              id: true,
              opensAt: true,
              organization: { select: { name: true } },
              studentOrganizationName: true,
              title: true,
            },
          },
        },
      },
      state: true,
    },
  });

  if (!profile) {
    return { generatedAt: now, items: [], timezone };
  }

  const items: WeeklyPlanItem[] = [];
  const appliedOpportunityIds = profile.applications.map(
    (application) => application.opportunity.id,
  );

  for (const application of profile.applications) {
    const actionUrl = `/dashboard/student/applications/${application.id}`;
    const opportunityTitle = application.opportunity.title;
    const organizationName = applicationOrganizationName(
      application.opportunity,
    );
    const openRequiredTasks = application.tasks.filter((task) => task.required);

    if (
      preSubmissionStatuses.has(application.status) &&
      application.opportunity.deadline
    ) {
      const days = differenceInStudentCalendarDays(
        application.opportunity.deadline,
        now,
        timezone,
      );
      if (days >= 0 && days <= 7) {
        items.push({
          actionUrl,
          category: "DEADLINE",
          date: application.opportunity.deadline,
          detail: `${organizationName} · ${deadlineDetail(days, application.opportunity.deadline)}`,
          key: `application-deadline:${application.id}:${application.opportunity.deadline.toISOString()}`,
          title: `${opportunityTitle} closes this week`,
        });
      }
    }

    if (
      preSubmissionStatuses.has(application.status) &&
      application.targetDeadline
    ) {
      const days = differenceInStudentCalendarDays(
        application.targetDeadline,
        now,
        timezone,
      );
      if (days >= 0 && days <= 7) {
        items.push({
          actionUrl,
          category: "DUE_SOON",
          date: application.targetDeadline,
          detail: deadlineDetail(days, application.targetDeadline),
          key: `target-deadline:${application.id}:${application.targetDeadline.toISOString()}`,
          title: `Reach your target for ${opportunityTitle}`,
        });
      }
    }

    for (const task of application.tasks) {
      if (!isApplicationTaskReminderRelevant(task.type, application.status)) {
        continue;
      }
      const taskActionUrl = `${actionUrl}#task-${task.id}`;
      if (
        task.type === "CONFIRM_EXTERNAL_SUBMISSION" &&
        task.required &&
        !task.dueAt &&
        openRequiredTasks.every(
          (candidate) => candidate.type === "CONFIRM_EXTERNAL_SUBMISSION",
        )
      ) {
        items.push({
          actionUrl: taskActionUrl,
          category: "CONFIRMATION",
          date: null,
          detail: "Confirm only after you submit through the host portal.",
          key: `confirmation:${task.id}`,
          title: `Confirm your submission for ${opportunityTitle}`,
        });
      }

      if (!task.dueAt) continue;
      const days = differenceInStudentCalendarDays(task.dueAt, now, timezone);
      if (days < 0) {
        items.push({
          actionUrl: taskActionUrl,
          category: "OVERDUE",
          date: task.dueAt,
          detail: `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue.`,
          key: `task-overdue:${task.id}:${task.dueAt.toISOString()}`,
          title: `${getWeeklyPlanTaskLabel(task.type)} for ${opportunityTitle}`,
        });
      } else if (days <= 7) {
        items.push({
          actionUrl: taskActionUrl,
          category: "DUE_SOON",
          date: task.dueAt,
          detail: deadlineDetail(days, task.dueAt),
          key: `task-due:${task.id}:${task.dueAt.toISOString()}`,
          title: `${getWeeklyPlanTaskLabel(task.type)} for ${opportunityTitle}`,
        });
      }
    }

    for (const interview of application.interviewRequests) {
      const scheduledAt =
        interview.scheduledAt ?? interview.selectedSlot?.startsAt ?? null;
      if (!scheduledAt) continue;
      const days = differenceInZonedCalendarDays(scheduledAt, now, timezone);
      if (days < 0 || days > 7) continue;

      items.push({
        actionUrl,
        category: "INTERVIEW",
        date: scheduledAt,
        detail: new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: timezone,
        }).format(scheduledAt),
        key: `interview:${interview.id}:${scheduledAt.toISOString()}`,
        title: `Prepare for your ${opportunityTitle} interview`,
      });
    }
  }

  const openingOpportunities = new Map(
    [
      ...profile.applications.map((application) => application.opportunity),
      ...profile.savedOpportunities.map((saved) => saved.opportunity),
    ].map((opportunity) => [opportunity.id, opportunity]),
  );

  for (const opportunity of openingOpportunities.values()) {
    if (!opportunity.opensAt) continue;
    const days = differenceInStudentCalendarDays(
      opportunity.opensAt,
      now,
      timezone,
    );
    if (days < 0 || days > 7) continue;

    items.push({
      actionUrl: `/dashboard/student/opportunities/${opportunity.id}`,
      category: "OPENING",
      date: opportunity.opensAt,
      detail: `${applicationOrganizationName(opportunity)} · Opens ${formatDatabaseCalendarDate(opportunity.opensAt)}.`,
      key: `opening:${opportunity.id}:${opportunity.opensAt.toISOString()}`,
      title: `${opportunity.title} opens this week`,
    });
  }

  const publishedSince = new Date(now.getTime() - 7 * 86_400_000);
  const candidateOpportunities = await prisma.opportunity.findMany({
    where: {
      ...studentDirectoryOpportunityWhere(now),
      id: { notIn: appliedOpportunityIds },
      publishedAt: { gte: publishedSince },
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      acceptedGradeLevels: true,
      availabilityStatus: true,
      city: true,
      country: true,
      deadline: true,
      geographicScope: true,
      id: true,
      maximumAge: true,
      minimumAge: true,
      organization: { select: { name: true } },
      requiredCertifications: true,
      scheduleRequirements: true,
      specialty: true,
      state: true,
      title: true,
      type: true,
    },
  });

  for (const opportunity of candidateOpportunities) {
    const eligibility = evaluateOpportunityEligibility({
      now,
      opportunity,
      student: profile,
    });
    if (eligibility.category === "NOT_ELIGIBLE") continue;

    items.push({
      actionUrl: `/dashboard/student/opportunities/${opportunity.id}`,
      category: "NEW_OPPORTUNITY",
      date: opportunity.deadline,
      detail: `${opportunity.organization.name} · ${eligibility.category === "STRONG_MATCH" ? "Strong match" : "Possible match"}.`,
      key: `new-opportunity:${opportunity.id}`,
      title: `New opportunity: ${opportunity.title}`,
    });

    if (
      items.filter((item) => item.category === "NEW_OPPORTUNITY").length >= 3
    ) {
      break;
    }
  }

  return {
    generatedAt: now,
    items: finalizeWeeklyPlanItems(items),
    timezone,
  };
}
