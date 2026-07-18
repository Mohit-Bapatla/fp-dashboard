"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { assertStudentAccess } from "@/lib/student/authorization";
import {
  type StudentNotificationPreferenceFieldErrors,
  validateStudentNotificationPreferenceForm,
} from "@/lib/student/notification-preference-validation";
import { getCurrentStudentProfile } from "@/lib/student/profile";

export type StudentNotificationPreferenceActionState = {
  error: string | null;
  fieldErrors: StudentNotificationPreferenceFieldErrors;
  success: string | null;
};

export async function updateStudentNotificationPreferences(
  _previousState: StudentNotificationPreferenceActionState,
  formData: FormData,
): Promise<StudentNotificationPreferenceActionState> {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);

  if (!user.studentProfile) {
    return {
      error: "Complete your student profile before saving reminders.",
      fieldErrors: {},
      success: null,
    };
  }

  const validation = validateStudentNotificationPreferenceForm(formData);

  if (!validation.success) {
    return {
      error: "Please fix the highlighted reminder settings.",
      fieldErrors: validation.errors,
      success: null,
    };
  }

  const rateLimit = await enforceRateLimit({
    action: "student_notification_preferences_update",
    identifier: `user:${user.id}`,
    limit: 30,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      error: formatRateLimitMessage(rateLimit),
      fieldErrors: {},
      success: null,
    };
  }

  const data = {
    ...validation.data,
    quietHoursEnd: validation.data.quietHoursEnd || null,
    quietHoursStart: validation.data.quietHoursStart || null,
  };
  const studentProfileId = user.studentProfile.id;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.studentNotificationPreference.upsert({
        where: { studentProfileId },
        create: {
          ...data,
          studentProfileId,
        },
        update: data,
      });

      await tx.auditLog.create({
        data: {
          action: "STUDENT_NOTIFICATION_PREFERENCES_UPDATED",
          actorId: user.id,
          entityId: studentProfileId,
          entityType: "StudentNotificationPreference",
          metadata: {
            emailEnabled: data.emailEnabled,
            inAppEnabled: data.inAppEnabled,
            timezone: data.timezone,
            weeklyDigestEnabled: data.weeklyDigestEnabled,
          },
        },
      });
    });
  } catch (error) {
    console.error(
      "Student notification preference update failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      error: "Reminder settings could not be saved. Please try again.",
      fieldErrors: {},
      success: null,
    };
  }

  revalidatePath("/dashboard/notifications");
  revalidatePath("/dashboard/student/settings");

  return {
    error: null,
    fieldErrors: {},
    success: "Reminder settings saved.",
  };
}
