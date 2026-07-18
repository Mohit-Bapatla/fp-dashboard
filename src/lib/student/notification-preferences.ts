import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  defaultStudentNotificationPreferenceValues,
  type StudentNotificationPreferenceValues,
} from "@/lib/student/notification-preference-validation";

export function resolveStudentNotificationPreference(
  preference:
    | (Omit<
        Partial<StudentNotificationPreferenceValues>,
        "quietHoursEnd" | "quietHoursStart"
      > & {
        quietHoursEnd?: string | null;
        quietHoursStart?: string | null;
      })
    | null
    | undefined,
): StudentNotificationPreferenceValues {
  if (!preference) {
    return { ...defaultStudentNotificationPreferenceValues };
  }

  return {
    ...defaultStudentNotificationPreferenceValues,
    ...preference,
    quietHoursEnd: preference.quietHoursEnd ?? "",
    quietHoursStart: preference.quietHoursStart ?? "",
  };
}

export async function getStudentNotificationPreference(
  studentProfileId: string,
) {
  const preference = await prisma.studentNotificationPreference.findUnique({
    where: { studentProfileId },
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
  });

  return resolveStudentNotificationPreference(preference);
}
