"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import {
  dismissCurrentUserNotification,
  getCurrentAppUser,
  markCurrentUserNotificationRead,
  markCurrentUserNotificationsRead,
  safeNotificationActionUrl,
} from "@/lib/notifications/notifications";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = getString(formData, "notificationId");

  if (!notificationId) {
    return;
  }

  await markCurrentUserNotificationRead(notificationId);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsRead() {
  await markCurrentUserNotificationsRead();
  revalidatePath("/dashboard/notifications");
}

export async function dismissNotification(formData: FormData) {
  const notificationId = getString(formData, "notificationId");

  if (!notificationId) {
    return;
  }

  await dismissCurrentUserNotification(notificationId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
}

export async function openNotification(formData: FormData) {
  const notificationId = getString(formData, "notificationId");
  const user = await getCurrentAppUser();
  if (!notificationId || !user) return;

  const notification = await prisma.notification.findFirst({
    where: {
      dismissedAt: null,
      id: notificationId,
      userId: user.id,
    },
    select: {
      actionUrl: true,
      applicationId: true,
      applicationTaskId: true,
      id: true,
      opportunityId: true,
      type: true,
    },
  });
  const actionUrl = safeNotificationActionUrl(notification?.actionUrl);
  if (!notification || !actionUrl) return;

  await Promise.all([
    prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    }),
    notification.type !== "GENERAL"
      ? createAuditLog({
          action: "REMINDER_OPENED",
          actorId: user.id,
          entityId: notification.id,
          entityType: "Notification",
          metadata: {
            applicationId: notification.applicationId,
            applicationTaskId: notification.applicationTaskId,
            opportunityId: notification.opportunityId,
            reminderType: notification.type,
          },
        })
      : Promise.resolve(),
  ]);
  redirect(actionUrl);
}
