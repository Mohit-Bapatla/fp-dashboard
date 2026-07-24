import "server-only";

import { createHash, randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";

export type WorkflowErrorCategory =
  | "CONCURRENT_WRITE"
  | "DATABASE_CONSTRAINT"
  | "DATABASE_SCHEMA"
  | "DATABASE_WRITE"
  | "EXTERNAL_DEPENDENCY"
  | "UNKNOWN";

export function classifyWorkflowError(error: unknown): WorkflowErrorCategory {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return "DATABASE_CONSTRAINT";
      case "P2022":
        return "DATABASE_SCHEMA";
      case "P2034":
        return "CONCURRENT_WRITE";
      default:
        return "DATABASE_WRITE";
    }
  }

  if (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "EXTERNAL_DEPENDENCY";
  }

  return "UNKNOWN";
}

export function createWorkflowSupportReference() {
  return randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
}

export function logWorkflowFailure({
  action,
  error,
  referenceId = createWorkflowSupportReference(),
  route,
  userId,
}: {
  action: string;
  error: unknown;
  referenceId?: string;
  route: string;
  userId?: string;
}) {
  console.error("[workflow-reliability] operation failed", {
    action,
    deployedSha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    errorCategory: classifyWorkflowError(error),
    referenceId,
    route,
    timestamp: new Date().toISOString(),
    ...(userId
      ? {
          userIdHash: createHash("sha256")
            .update(userId)
            .digest("hex")
            .slice(0, 12),
        }
      : {}),
  });

  return referenceId;
}

export async function loadOptionalWorkflowData<T>({
  action,
  fallback,
  load,
  route,
  userId,
}: {
  action: string;
  fallback: T;
  load: () => Promise<T>;
  route: string;
  userId?: string;
}): Promise<{ available: boolean; referenceId: string | null; value: T }> {
  try {
    return {
      available: true,
      referenceId: null,
      value: await load(),
    };
  } catch (error) {
    const referenceId = logWorkflowFailure({
      action,
      error,
      route,
      userId,
    });

    return { available: false, referenceId, value: fallback };
  }
}
