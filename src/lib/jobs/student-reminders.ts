import "server-only";

import { randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import type {
  ApplicationTaskType,
  StudentNotificationType,
} from "@/generated/prisma/enums";
import {
  buildStudentReminderSummaryEmail,
  buildStudentWeeklyDigestEmail,
} from "@/lib/email/student-reminders";
import { sendTransactionalEmail } from "@/lib/email/resend";
import {
  isStudentLocalMonday,
  isWithinQuietHours,
  studentCalendarDateKey,
} from "@/lib/notifications/reminder-schedule";
import { buildStudentReminderCandidates } from "@/lib/notifications/student-reminder-rules";
import { prisma } from "@/lib/db/prisma";
import { resolveStudentNotificationPreference } from "@/lib/student/notification-preferences";
import type { StudentNotificationPreferenceValues } from "@/lib/student/notification-preference-validation";
import { getStudentWeeklyPlan } from "@/lib/student/weekly-plan";

export type StudentReminderWorkflowResult = {
  deduped: number;
  digestsCreated: number;
  durationMs: number;
  emailsSent: number;
  emailsSkipped: number;
  errors: string[];
  finishedAt: string;
  notificationsCreated: number;
  runId: string;
  scannedStudents: number;
  startedAt: string;
  success: boolean;
};

const pageSize = 100;
const pendingEmailWindowMs = 48 * 60 * 60 * 1000;
const recommendationTaskTypes = new Set<ApplicationTaskType>([
  "REQUEST_RECOMMENDATION",
  "CONFIRM_RECOMMENDATION",
]);

function emailCandidateTypes(
  preference: StudentNotificationPreferenceValues,
): StudentNotificationType[] {
  const types = new Set<StudentNotificationType>();

  if (preference.openingAlertsEnabled) {
    types.add("OPPORTUNITY_OPENING_SOON");
    types.add("OPPORTUNITY_OPENED");
  }
  if (preference.deadlineAlertsEnabled) {
    types.add("APPLICATION_DEADLINE");
    types.add("INTERNAL_TARGET_DEADLINE");
  }
  if (preference.recommendationReminderEnabled) {
    types.add("RECOMMENDATION_REQUEST");
    types.add("RECOMMENDATION_DEADLINE");
  }
  if (preference.interviewReminderEnabled) {
    types.add("INTERVIEW_REMINDER");
    types.add("POST_INTERVIEW_THANK_YOU");
  }
  if (preference.taskReminderEnabled) {
    types.add("POST_SUBMISSION_FOLLOW_UP");
  }
  if (preference.outcomeReminderEnabled) {
    types.add("OUTCOME_REPORTING");
  }
  if (
    preference.taskReminderEnabled ||
    preference.recommendationReminderEnabled ||
    preference.interviewReminderEnabled ||
    preference.outcomeReminderEnabled
  ) {
    types.add("TASK_OVERDUE");
  }

  return Array.from(types);
}

function canEmailReminder(
  type: StudentNotificationType,
  applicationTaskType: ApplicationTaskType | null,
  linkedEntityType: string | null,
  preference: StudentNotificationPreferenceValues,
) {
  if (type !== "TASK_OVERDUE") return true;
  if (applicationTaskType && recommendationTaskTypes.has(applicationTaskType)) {
    return preference.recommendationReminderEnabled;
  }
  if (applicationTaskType === "PREPARE_FOR_INTERVIEW") {
    return preference.interviewReminderEnabled;
  }
  if (applicationTaskType === "REPORT_OUTCOME") {
    return preference.outcomeReminderEnabled;
  }
  if (
    applicationTaskType === "SEND_FOLLOW_UP" &&
    linkedEntityType === "INTERVIEW"
  ) {
    return preference.interviewReminderEnabled;
  }

  return preference.taskReminderEnabled;
}

async function releaseEmailClaims(ids: string[], claimedAt: Date) {
  if (ids.length === 0) return;

  await prisma.notification.updateMany({
    where: { emailedAt: claimedAt, id: { in: ids } },
    data: { emailedAt: null },
  });
}

async function getPendingEmailNotifications({
  now,
  preference,
  userId,
}: {
  now: Date;
  preference: StudentNotificationPreferenceValues;
  userId: string;
}) {
  const candidateTypes = emailCandidateTypes(preference);
  if (candidateTypes.length === 0) return [];

  const candidates = await prisma.notification.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getTime() - pendingEmailWindowMs),
      },
      emailedAt: null,
      type: { in: candidateTypes },
      userId,
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      actionUrl: true,
      applicationTask: {
        select: { linkedEntityType: true, type: true },
      },
      body: true,
      id: true,
      title: true,
      type: true,
    },
  });

  return candidates.filter((notification) =>
    canEmailReminder(
      notification.type,
      notification.applicationTask?.type ?? null,
      notification.applicationTask?.linkedEntityType ?? null,
      preference,
    ),
  );
}

function appBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured;

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return productionHost ? `https://${productionHost}` : "http://localhost:3000";
}

function sanitizedErrorLabel(error: unknown) {
  if (error instanceof Error && error.name) {
    return error.name.slice(0, 80);
  }

  return "UnknownError";
}

export async function runStudentReminderWorkflows({
  now = new Date(),
}: {
  now?: Date;
} = {}): Promise<StudentReminderWorkflowResult> {
  const startedMs = Date.now();
  const runId = randomUUID();
  const result: StudentReminderWorkflowResult = {
    deduped: 0,
    digestsCreated: 0,
    durationMs: 0,
    emailsSent: 0,
    emailsSkipped: 0,
    errors: [],
    finishedAt: "",
    notificationsCreated: 0,
    runId,
    scannedStudents: 0,
    startedAt: now.toISOString(),
    success: true,
  };
  let cursor: string | undefined;

  while (true) {
    const students = await prisma.studentProfile.findMany({
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: "asc" },
      take: pageSize,
      select: {
        applications: {
          where: { status: { not: "WITHDRAWN" } },
          select: {
            id: true,
            interviewRequests: {
              where: { status: "SCHEDULED" },
              select: {
                id: true,
                scheduledAt: true,
                selectedSlot: { select: { startsAt: true } },
                status: true,
              },
            },
            opportunity: {
              select: {
                availabilityStatus: true,
                deadline: true,
                id: true,
                opensAt: true,
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
                linkedEntityType: true,
                required: true,
                status: true,
                type: true,
              },
            },
          },
        },
        id: true,
        notificationPreference: {
          select: {
            deadlineAlertsEnabled: true,
            emailEnabled: true,
            inAppEnabled: true,
            interviewReminderEnabled: true,
            openingAlertsEnabled: true,
            outcomeReminderEnabled: true,
            quietHoursEnd: true,
            quietHoursStart: true,
            recommendationReminderEnabled: true,
            taskReminderEnabled: true,
            timezone: true,
            weeklyDigestEnabled: true,
          },
        },
        savedOpportunities: {
          where: { dismissedAt: null },
          select: {
            followReopening: true,
            opportunity: {
              select: {
                availabilityStatus: true,
                id: true,
                opensAt: true,
                title: true,
              },
            },
          },
        },
        user: {
          select: {
            email: true,
            firstName: true,
            id: true,
          },
        },
      },
    });

    if (students.length === 0) break;
    result.scannedStudents += students.length;

    for (const student of students) {
      try {
        const preference = resolveStudentNotificationPreference(
          student.notificationPreference,
        );
        const hasDeliveryChannel =
          preference.inAppEnabled || preference.emailEnabled;
        const candidates = hasDeliveryChannel
          ? buildStudentReminderCandidates({
              applications: student.applications,
              now,
              preference,
              savedOpportunities: student.savedOpportunities,
              timezone: preference.timezone,
              userId: student.user.id,
            })
          : [];

        if (candidates.length > 0) {
          const creation = await prisma.notification.createMany({
            data: candidates.map((candidate) => ({
              actionUrl: candidate.actionUrl,
              applicationId: candidate.applicationId,
              applicationTaskId: candidate.applicationTaskId,
              body: candidate.body,
              deduplicationKey: candidate.deduplicationKey,
              dismissedAt: preference.inAppEnabled ? null : now,
              opportunityId: candidate.opportunityId,
              title: candidate.title,
              type: candidate.type,
              userId: student.user.id,
            })),
            skipDuplicates: true,
          });
          result.notificationsCreated += creation.count;
          result.deduped += candidates.length - creation.count;
        }

        let weeklyPlan = null;
        const isDigestDay =
          preference.weeklyDigestEnabled &&
          preference.emailEnabled &&
          isStudentLocalMonday(now, preference.timezone);

        if (isDigestDay && hasDeliveryChannel) {
          weeklyPlan = await getStudentWeeklyPlan({
            now,
            studentProfileId: student.id,
            timezone: preference.timezone,
          });

          if (weeklyPlan.items.length > 0) {
            const weeklyDigestKey = [
              "student-weekly-digest-v1",
              student.user.id,
              studentCalendarDateKey(now, preference.timezone),
            ].join(":");
            const creation = await prisma.notification.createMany({
              data: [
                {
                  actionUrl: "/dashboard/student/settings#weekly-plan",
                  body: `Your structured weekly plan has ${weeklyPlan.items.length} action${weeklyPlan.items.length === 1 ? "" : "s"}.`,
                  deduplicationKey: weeklyDigestKey,
                  dismissedAt: preference.inAppEnabled ? null : now,
                  title: "Your FP plan for this week",
                  type: "WEEKLY_DIGEST",
                  userId: student.user.id,
                },
              ],
              skipDuplicates: true,
            });
            result.notificationsCreated += creation.count;
            result.digestsCreated += creation.count;
            result.deduped += 1 - creation.count;
          }
        }

        if (
          !preference.emailEnabled ||
          isWithinQuietHours({
            end: preference.quietHoursEnd,
            now,
            start: preference.quietHoursStart,
            timezone: preference.timezone,
          })
        ) {
          continue;
        }

        if (preference.weeklyDigestEnabled) {
          const pendingDigest = await prisma.notification.findFirst({
            where: {
              createdAt: {
                gte: new Date(now.getTime() - pendingEmailWindowMs),
              },
              emailedAt: null,
              type: "WEEKLY_DIGEST",
              userId: student.user.id,
            },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });

          if (pendingDigest) {
            weeklyPlan ??= await getStudentWeeklyPlan({
              now,
              studentProfileId: student.id,
              timezone: preference.timezone,
            });
            const email = buildStudentWeeklyDigestEmail({
              baseUrl: appBaseUrl(),
              firstName: student.user.firstName,
              plan: weeklyPlan,
            });

            if (!email) {
              // The plan was completed before a deferred digest could send.
              await prisma.notification.updateMany({
                where: { emailedAt: null, id: pendingDigest.id },
                data: { emailedAt: new Date() },
              });
              continue;
            }

            const summarizedNotifications = await getPendingEmailNotifications({
              now,
              preference,
              userId: student.user.id,
            });
            const summarizedIds = summarizedNotifications.map(
              (notification) => notification.id,
            );
            const claimedAt = new Date();
            const claimed = await prisma.$transaction(async (tx) => {
              const digestClaim = await tx.notification.updateMany({
                where: { emailedAt: null, id: pendingDigest.id },
                data: { emailedAt: claimedAt },
              });
              if (digestClaim.count === 0) return false;

              await tx.notification.updateMany({
                where: { emailedAt: null, id: { in: summarizedIds } },
                data: { emailedAt: claimedAt },
              });
              return true;
            });
            if (!claimed) continue;

            const delivery = await sendTransactionalEmail({
              ...email,
              to: student.user.email,
            });
            if (delivery.sent) {
              result.emailsSent += 1;
            } else {
              result.emailsSkipped += 1;
              await releaseEmailClaims(
                [pendingDigest.id, ...summarizedIds],
                claimedAt,
              );
            }

            // A digest absorbs the ordinary reminder batch for this run.
            continue;
          }
        }

        const pendingNotifications = (
          await getPendingEmailNotifications({
            now,
            preference,
            userId: student.user.id,
          })
        ).slice(0, 10);
        const email = buildStudentReminderSummaryEmail({
          baseUrl: appBaseUrl(),
          firstName: student.user.firstName,
          items: pendingNotifications,
        });

        if (email) {
          const ids = pendingNotifications.map((item) => item.id);
          const claimedAt = new Date();
          const claim = await prisma.notification.updateMany({
            where: { emailedAt: null, id: { in: ids } },
            data: { emailedAt: claimedAt },
          });
          if (claim.count !== ids.length) {
            await releaseEmailClaims(ids, claimedAt);
            continue;
          }

          const delivery = await sendTransactionalEmail({
            ...email,
            to: student.user.email,
          });
          if (delivery.sent) {
            result.emailsSent += 1;
          } else {
            result.emailsSkipped += 1;
            await releaseEmailClaims(ids, claimedAt);
          }
        }
      } catch (error) {
        result.errors.push(
          `Student ${student.id}: ${sanitizedErrorLabel(error)}`,
        );
      }
    }

    cursor = students.at(-1)?.id;
    if (students.length < pageSize) break;
  }

  result.durationMs = Date.now() - startedMs;
  result.finishedAt = new Date().toISOString();
  result.success = result.errors.length === 0;

  try {
    await prisma.auditLog.create({
      data: {
        action: "STUDENT_REMINDER_RUN_COMPLETED",
        entityId: runId,
        entityType: "AutomationRun",
        metadata: {
          deduped: result.deduped,
          digestsCreated: result.digestsCreated,
          durationMs: result.durationMs,
          emailErrors: result.errors.length,
          emailsSent: result.emailsSent,
          emailsSkipped: result.emailsSkipped,
          notificationsCreated: result.notificationsCreated,
          scannedStudents: result.scannedStudents,
          success: result.success,
        } satisfies Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    result.errors.push(`Audit: ${sanitizedErrorLabel(error)}`);
    result.success = false;
  }

  if (result.success) {
    console.info("Student reminder workflows completed", result);
  } else {
    console.error("Student reminder workflows completed with errors", result);
  }

  return result;
}
