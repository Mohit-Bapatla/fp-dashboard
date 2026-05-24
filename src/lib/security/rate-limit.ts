import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/db/prisma";

export type RateLimitOptions = {
  action: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex");
}

export async function enforceRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  const key = hashIdentifier(identifier);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
  const existing = await prisma.actionRateLimit.findUnique({
    where: {
      key_action: {
        action,
        key,
      },
    },
  });

  if (!existing || existing.expiresAt <= now) {
    await prisma.actionRateLimit.upsert({
      where: {
        key_action: {
          action,
          key,
        },
      },
      create: {
        action,
        count: 1,
        expiresAt,
        key,
        windowStart: now,
      },
      update: {
        count: 1,
        expiresAt,
        windowStart: now,
      },
    });

    return {
      allowed: true,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  await prisma.actionRateLimit.update({
    where: {
      id: existing.id,
    },
    data: {
      count: {
        increment: 1,
      },
    },
  });

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function formatRateLimitMessage(result: RateLimitResult) {
  return `Too many attempts. Please try again in ${Math.ceil(result.retryAfterSeconds / 60)} minute(s).`;
}
