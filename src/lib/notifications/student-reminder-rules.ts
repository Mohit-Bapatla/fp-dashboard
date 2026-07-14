import type { StudentNotificationType } from "@/generated/prisma/enums";
import {
  databaseCalendarDateKey,
  differenceInStudentCalendarDays,
  differenceInZonedCalendarDays,
  formatDatabaseCalendarDate,
} from "@/lib/notifications/reminder-schedule";

export type StudentReminderCandidate = {
  actionUrl: string;
  applicationId: string | null;
  applicationTaskId: string | null;
  body: string;
  deduplicationKey: string;
  opportunityId: string | null;
  title: string;
  type: StudentNotificationType;
};

export type StudentReminderApplication = {
  id: string;
  interviewRequests?: Array<{
    id: string;
    scheduledAt: Date | null;
    selectedSlot: { startsAt: Date } | null;
    status: string;
  }>;
  opportunity: {
    availabilityStatus: string;
    deadline: Date | null;
    id: string;
    opensAt: Date | null;
    title: string;
  };
  status: string;
  targetDeadline: Date | null;
  tasks: Array<{
    dueAt: Date | null;
    id: string;
    linkedEntityType?: string | null;
    required: boolean;
    status: string;
    type: string;
  }>;
};

export type StudentReminderSavedOpportunity = {
  followReopening: boolean;
  opportunity: {
    availabilityStatus: string;
    id: string;
    opensAt: Date | null;
    title: string;
  };
};

export type StudentReminderRulePreference = {
  deadlineAlertsEnabled: boolean;
  interviewReminderEnabled: boolean;
  openingAlertsEnabled: boolean;
  outcomeReminderEnabled: boolean;
  recommendationReminderEnabled: boolean;
  taskReminderEnabled: boolean;
};

const deadlineReminderDays = new Set([14, 7, 3, 1]);
const recommendationReminderDays = new Set([7, 3, 1]);
const openingAdvanceDays = new Set([7, 1]);
const preSubmissionStatuses = new Set([
  "DRAFT",
  "SAVED",
  "PLANNING",
  "PREPARING",
  "WAITING_FOR_RECOMMENDATION",
  "READY_TO_SUBMIT",
]);
const recommendationTaskTypes = new Set([
  "REQUEST_RECOMMENDATION",
  "CONFIRM_RECOMMENDATION",
]);
const optionalReminderTaskTypes = new Set([
  ...recommendationTaskTypes,
  "PREPARE_FOR_INTERVIEW",
  "SEND_FOLLOW_UP",
  "REPORT_OUTCOME",
]);
const postSubmissionStatuses = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "INTERVIEW",
  "WAITLISTED",
  "ACCEPTED",
  "REJECTED",
]);

export function isApplicationTaskReminderRelevant(
  taskType: string,
  applicationStatus: string,
) {
  if (taskType === "PREPARE_FOR_INTERVIEW") {
    return ["UNDER_REVIEW", "INTERVIEW"].includes(applicationStatus);
  }
  if (taskType === "SEND_FOLLOW_UP" || taskType === "REPORT_OUTCOME") {
    return postSubmissionStatuses.has(applicationStatus);
  }

  return preSubmissionStatuses.has(applicationStatus);
}

function taskReminderEnabled(
  task: StudentReminderApplication["tasks"][number],
  preference: StudentReminderRulePreference,
) {
  if (recommendationTaskTypes.has(task.type)) {
    return preference.recommendationReminderEnabled;
  }
  if (task.type === "PREPARE_FOR_INTERVIEW") {
    return preference.interviewReminderEnabled;
  }
  if (task.type === "REPORT_OUTCOME") {
    return preference.outcomeReminderEnabled;
  }
  if (task.type === "SEND_FOLLOW_UP" && task.linkedEntityType === "INTERVIEW") {
    return preference.interviewReminderEnabled;
  }

  return preference.taskReminderEnabled;
}

function formatInterviewDateTime(value: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(value);
}

function dedupeKey({
  anchor,
  entityId,
  phase,
  type,
  userId,
}: {
  anchor: Date;
  entityId: string;
  phase: string;
  type: StudentNotificationType;
  userId: string;
}) {
  return [
    "student-reminder-v1",
    userId,
    type,
    entityId,
    databaseCalendarDateKey(anchor),
    phase,
  ].join(":");
}

function deadlineBody(days: number, date: Date) {
  if (days === 1) {
    return `Due tomorrow, ${formatDatabaseCalendarDate(date)}.`;
  }

  return `Due in ${days} days, on ${formatDatabaseCalendarDate(date)}.`;
}

export function buildStudentReminderCandidates({
  applications,
  now,
  preference,
  savedOpportunities,
  timezone,
  userId,
}: {
  applications: StudentReminderApplication[];
  now: Date;
  preference: StudentReminderRulePreference;
  savedOpportunities: StudentReminderSavedOpportunity[];
  timezone: string;
  userId: string;
}) {
  const candidates = new Map<string, StudentReminderCandidate>();
  const add = (candidate: StudentReminderCandidate) => {
    candidates.set(candidate.deduplicationKey, candidate);
  };

  for (const application of applications) {
    const actionUrl = `/dashboard/student/applications/${application.id}`;
    const opportunity = application.opportunity;

    if (
      preference.deadlineAlertsEnabled &&
      preSubmissionStatuses.has(application.status) &&
      opportunity.deadline
    ) {
      const days = differenceInStudentCalendarDays(
        opportunity.deadline,
        now,
        timezone,
      );
      if (deadlineReminderDays.has(days)) {
        add({
          actionUrl,
          applicationId: application.id,
          applicationTaskId: null,
          body: `${deadlineBody(days, opportunity.deadline)} Review the official requirements before submitting.`,
          deduplicationKey: dedupeKey({
            anchor: opportunity.deadline,
            entityId: application.id,
            phase: `D${days}`,
            type: "APPLICATION_DEADLINE",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `${opportunity.title} deadline approaching`,
          type: "APPLICATION_DEADLINE",
        });
      }
    }

    if (
      preference.deadlineAlertsEnabled &&
      preSubmissionStatuses.has(application.status) &&
      application.targetDeadline
    ) {
      const days = differenceInStudentCalendarDays(
        application.targetDeadline,
        now,
        timezone,
      );
      if (deadlineReminderDays.has(days)) {
        add({
          actionUrl,
          applicationId: application.id,
          applicationTaskId: null,
          body: `${deadlineBody(days, application.targetDeadline)} This is your private planning target, not the official deadline.`,
          deduplicationKey: dedupeKey({
            anchor: application.targetDeadline,
            entityId: application.id,
            phase: `D${days}`,
            type: "INTERNAL_TARGET_DEADLINE",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `Target date approaching for ${opportunity.title}`,
          type: "INTERNAL_TARGET_DEADLINE",
        });
      }
    }

    let hasScheduledInterviewTomorrow = false;
    if (preference.interviewReminderEnabled) {
      for (const interview of application.interviewRequests ?? []) {
        if (interview.status !== "SCHEDULED") continue;
        const scheduledAt =
          interview.scheduledAt ?? interview.selectedSlot?.startsAt ?? null;
        if (
          !scheduledAt ||
          differenceInZonedCalendarDays(scheduledAt, now, timezone) !== 1
        ) {
          continue;
        }

        hasScheduledInterviewTomorrow = true;
        add({
          actionUrl,
          applicationId: application.id,
          applicationTaskId: null,
          body: `Scheduled for ${formatInterviewDateTime(scheduledAt, timezone)}. Open your workspace to review the confirmed details.`,
          deduplicationKey: dedupeKey({
            anchor: scheduledAt,
            entityId: interview.id,
            phase: `TOMORROW:${scheduledAt.toISOString()}`,
            type: "INTERVIEW_REMINDER",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `Interview tomorrow for ${opportunity.title}`,
          type: "INTERVIEW_REMINDER",
        });
      }
    }

    for (const task of application.tasks) {
      if (
        (!task.required && !optionalReminderTaskTypes.has(task.type)) ||
        !task.dueAt ||
        task.status === "COMPLETE" ||
        task.status === "SKIPPED" ||
        !isApplicationTaskReminderRelevant(task.type, application.status)
      ) {
        continue;
      }

      const isRecommendationTask = recommendationTaskTypes.has(task.type);
      if (!taskReminderEnabled(task, preference)) continue;

      const days = differenceInStudentCalendarDays(task.dueAt, now, timezone);
      if (isRecommendationTask && recommendationReminderDays.has(days)) {
        const type =
          task.type === "REQUEST_RECOMMENDATION"
            ? "RECOMMENDATION_REQUEST"
            : "RECOMMENDATION_DEADLINE";
        add({
          actionUrl: `${actionUrl}#task-${task.id}`,
          applicationId: application.id,
          applicationTaskId: task.id,
          body: `${deadlineBody(days, task.dueAt)} Contact information and message content stay private.`,
          deduplicationKey: dedupeKey({
            anchor: task.dueAt,
            entityId: task.id,
            phase: `D${days}`,
            type,
            userId,
          }),
          opportunityId: opportunity.id,
          title:
            task.type === "REQUEST_RECOMMENDATION"
              ? `Request your recommendation for ${opportunity.title}`
              : `Check your recommendation for ${opportunity.title}`,
          type,
        });
      }

      if (
        task.type === "PREPARE_FOR_INTERVIEW" &&
        days === 1 &&
        !hasScheduledInterviewTomorrow
      ) {
        add({
          actionUrl: `${actionUrl}#task-${task.id}`,
          applicationId: application.id,
          applicationTaskId: task.id,
          body: "Your interview preparation task is due tomorrow. Review the confirmed interview details before acting.",
          deduplicationKey: dedupeKey({
            anchor: task.dueAt,
            entityId: task.id,
            phase: "TOMORROW",
            type: "INTERVIEW_REMINDER",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `Prepare for your ${opportunity.title} interview`,
          type: "INTERVIEW_REMINDER",
        });
      }

      if (task.type === "SEND_FOLLOW_UP" && days === 0) {
        const interviewFollowUp = task.linkedEntityType === "INTERVIEW";
        const type = interviewFollowUp
          ? "POST_INTERVIEW_THANK_YOU"
          : "POST_SUBMISSION_FOLLOW_UP";
        add({
          actionUrl: `${actionUrl}#task-${task.id}`,
          applicationId: application.id,
          applicationTaskId: task.id,
          body: interviewFollowUp
            ? "Your private follow-up task is due today. Review the interview details before drafting a thank-you."
            : "Your private follow-up task is due today. Open the workspace to review the next step.",
          deduplicationKey: dedupeKey({
            anchor: task.dueAt,
            entityId: task.id,
            phase: "DUE",
            type,
            userId,
          }),
          opportunityId: opportunity.id,
          title: interviewFollowUp
            ? `Send your interview follow-up for ${opportunity.title}`
            : `Follow up on ${opportunity.title}`,
          type,
        });
      }

      if (task.type === "REPORT_OUTCOME" && days === 0) {
        add({
          actionUrl: `${actionUrl}#task-${task.id}`,
          applicationId: application.id,
          applicationTaskId: task.id,
          body: "Outcome reporting is optional. Open your private workspace if you want to update this application.",
          deduplicationKey: dedupeKey({
            anchor: task.dueAt,
            entityId: task.id,
            phase: "DUE",
            type: "OUTCOME_REPORTING",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `Optional outcome update for ${opportunity.title}`,
          type: "OUTCOME_REPORTING",
        });
      }

      if (task.required && days < 0) {
        add({
          actionUrl: `${actionUrl}#task-${task.id}`,
          applicationId: application.id,
          applicationTaskId: task.id,
          body: `A required task for ${opportunity.title} is overdue. Open the workspace to review it.`,
          deduplicationKey: dedupeKey({
            anchor: task.dueAt,
            entityId: task.id,
            phase: "OVERDUE",
            type: "TASK_OVERDUE",
            userId,
          }),
          opportunityId: opportunity.id,
          title: "Required application task overdue",
          type: "TASK_OVERDUE",
        });
      }
    }
  }

  if (preference.openingAlertsEnabled) {
    const openingSources = [
      ...applications
        .filter((application) => preSubmissionStatuses.has(application.status))
        .map((application) => ({
          actionUrl: `/dashboard/student/applications/${application.id}`,
          applicationId: application.id,
          followed: true,
          opportunity: application.opportunity,
        })),
      ...savedOpportunities.map((saved) => ({
        actionUrl: `/dashboard/student/opportunities/${saved.opportunity.id}`,
        applicationId: null,
        followed: saved.followReopening,
        opportunity: saved.opportunity,
      })),
    ];

    for (const source of openingSources) {
      const opportunity = source.opportunity;
      if (!opportunity.opensAt) continue;

      const days = differenceInStudentCalendarDays(
        opportunity.opensAt,
        now,
        timezone,
      );
      if (openingAdvanceDays.has(days)) {
        add({
          actionUrl: source.actionUrl,
          applicationId: source.applicationId,
          applicationTaskId: null,
          body: `Applications are scheduled to open in ${days} day${days === 1 ? "" : "s"}, on ${formatDatabaseCalendarDate(opportunity.opensAt)}.`,
          deduplicationKey: dedupeKey({
            anchor: opportunity.opensAt,
            entityId: opportunity.id,
            phase: `D${days}`,
            type: "OPPORTUNITY_OPENING_SOON",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `${opportunity.title} opens soon`,
          type: "OPPORTUNITY_OPENING_SOON",
        });
      }

      if (
        source.followed &&
        days === 0 &&
        ["OPEN", "ROLLING"].includes(opportunity.availabilityStatus)
      ) {
        add({
          actionUrl: source.actionUrl,
          applicationId: source.applicationId,
          applicationTaskId: null,
          body: "The program is marked open. Review the official source before submitting.",
          deduplicationKey: dedupeKey({
            anchor: opportunity.opensAt,
            entityId: opportunity.id,
            phase: "OPEN",
            type: "OPPORTUNITY_OPENED",
            userId,
          }),
          opportunityId: opportunity.id,
          title: `${opportunity.title} is now open`,
          type: "OPPORTUNITY_OPENED",
        });
      }
    }
  }

  return Array.from(candidates.values());
}
