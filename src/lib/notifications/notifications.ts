import "server-only";

import { auth } from "@clerk/nextjs/server";

import type {
  StudentNotificationType,
  UserRole,
} from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export type NotificationPayload = {
  actionUrl?: string | null;
  applicationId?: string | null;
  applicationTaskId?: string | null;
  body?: string | null;
  deduplicationKey?: string | null;
  opportunityId?: string | null;
  title: string;
  type?: StudentNotificationType;
};

export function safeNotificationActionUrl(value: string | null | undefined) {
  return value?.startsWith("/dashboard/") && !value.startsWith("//")
    ? value
    : null;
}

export async function getCurrentUserNotificationSummary() {
  const { userId } = await auth();

  if (!userId) {
    return {
      unreadCount: 0,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      unreadCount: 0,
    };
  }

  const unreadCount = await prisma.notification.count({
    where: {
      dismissedAt: null,
      readAt: null,
      userId: user.id,
    },
  });

  return {
    unreadCount,
  };
}

export async function getCurrentAppUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      role: true,
    },
  });
}

export async function getUsersByRoles(roles: UserRole[]) {
  if (roles.length === 0) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      role: {
        in: roles,
      },
    },
    select: {
      email: true,
      firstName: true,
      id: true,
      lastName: true,
      role: true,
    },
  });
}

export async function createNotifications(
  recipientIds: Array<string | null | undefined>,
  payload: NotificationPayload,
) {
  const userIds = Array.from(
    new Set(recipientIds.filter((id): id is string => Boolean(id))),
  );

  if (userIds.length === 0) {
    return 0;
  }

  const result = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      actionUrl: safeNotificationActionUrl(payload.actionUrl),
      applicationId: payload.applicationId ?? null,
      applicationTaskId: payload.applicationTaskId ?? null,
      body: payload.body ?? null,
      deduplicationKey: payload.deduplicationKey ?? null,
      opportunityId: payload.opportunityId ?? null,
      title: payload.title,
      type: payload.type ?? "GENERAL",
      userId,
    })),
    skipDuplicates: Boolean(payload.deduplicationKey),
  });

  return result.count;
}

export async function createDeduplicatedNotification(
  userId: string,
  payload: NotificationPayload & { deduplicationKey: string },
) {
  const created = await createNotifications([userId], payload);

  return created === 1;
}

export async function markCurrentUserNotificationRead(notificationId: string) {
  const user = await getCurrentAppUser();

  if (!user) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function markCurrentUserNotificationsRead() {
  const user = await getCurrentAppUser();

  if (!user) {
    return;
  }

  await prisma.notification.updateMany({
    where: {
      dismissedAt: null,
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

export async function dismissCurrentUserNotification(notificationId: string) {
  const user = await getCurrentAppUser();

  if (!user) {
    return;
  }

  const now = new Date();
  await prisma.notification.updateMany({
    where: {
      dismissedAt: null,
      id: notificationId,
      userId: user.id,
    },
    data: {
      dismissedAt: now,
      readAt: now,
    },
  });
}
