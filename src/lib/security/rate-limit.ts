import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

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

const friendlyRateLimitMessage =
  "You're doing that too often. Please wait a few minutes and try again.";

const memoryStore = new Map<
  string,
  {
    count: number;
    expiresAt: number;
  }
>();

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex");
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  return url && token ? { token, url } : null;
}

async function enforceUpstashRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult | null> {
  const config = getUpstashConfig();

  if (!config) {
    return null;
  }

  const key = `rate-limit:${action}:${hashIdentifier(identifier)}`;
  const response = await fetch(`${config.url}/pipeline`, {
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSeconds, "NX"],
      ["TTL", key],
    ]),
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Redis rate limit request failed.");
  }

  const results = (await response.json()) as Array<{
    result?: number | string;
  }>;
  const count = Number(results[0]?.result ?? 0);
  const ttl = Number(results[2]?.result ?? windowSeconds);

  return {
    allowed: count <= limit,
    retryAfterSeconds: count <= limit ? 0 : Math.max(1, ttl),
  };
}

async function enforcePrismaRateLimit({
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

function enforceMemoryRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): RateLimitResult {
  const key = `${action}:${hashIdentifier(identifier)}`;
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
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
        Math.ceil((existing.expiresAt - now) / 1000),
      ),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export async function enforceRateLimit({
  action,
  identifier,
  limit,
  windowSeconds,
}: RateLimitOptions): Promise<RateLimitResult> {
  const upstashResult = await enforceUpstashRateLimit({
    action,
    identifier,
    limit,
    windowSeconds,
  });

  if (upstashResult) {
    return upstashResult;
  }

  try {
    return await enforcePrismaRateLimit({
      action,
      identifier,
      limit,
      windowSeconds,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    // Local/dev fallback only. This does not work across serverless instances.
    return enforceMemoryRateLimit({
      action,
      identifier,
      limit,
      windowSeconds,
    });
  }
}

export function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown-ip"
  );
}

export async function enforcePublicRateLimit(
  request: NextRequest,
  options: Omit<RateLimitOptions, "identifier">,
) {
  return enforceRateLimit({
    ...options,
    identifier: `ip:${getClientIp(request)}`,
  });
}

export function formatRateLimitMessage(result?: RateLimitResult) {
  void result;

  return friendlyRateLimitMessage;
}

export function getRateLimitResponseHeaders(result: RateLimitResult) {
  return {
    "Retry-After": String(Math.max(1, result.retryAfterSeconds)),
  };
}
