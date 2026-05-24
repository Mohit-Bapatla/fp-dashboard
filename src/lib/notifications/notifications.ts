import "server-only";

import { auth } from "@clerk/nextjs/server";

import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db/prisma";

export type NotificationPayload = {
  body?: string | null;
  title: string;
};

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
      body: payload.body ?? null,
      title: payload.title,
      userId,
    })),
  });

  return result.count;
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
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}
