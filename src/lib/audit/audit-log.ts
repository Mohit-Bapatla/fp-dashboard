import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AuditLogInput = {
  action: string;
  actorId?: string | null;
  entityId?: string | null;
  entityType: string;
  metadata?: Prisma.InputJsonValue;
};

export async function createAuditLog({
  action,
  actorId,
  entityId,
  entityType,
  metadata,
}: AuditLogInput) {
  await prisma.auditLog.create({
    data: {
      action,
      actorId: actorId ?? null,
      entityId: entityId ?? null,
      entityType,
      metadata: metadata ?? undefined,
    },
  });
}

export async function getActorIdFromClerkUserId(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    select: {
      id: true,
    },
  });

  return user?.id ?? null;
}
