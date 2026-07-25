import "server-only";

import { createHash } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { logServerError } from "@/lib/monitoring/logger";
import {
  createWorkflowSupportReference,
  type WorkflowCategory,
} from "@/lib/reliability/workflow-references";

export type WorkflowErrorClassification =
  | "CONCURRENT_WRITE"
  | "DATABASE_CONSTRAINT"
  | "DATABASE_SCHEMA"
  | "DATABASE_WRITE"
  | "NETWORK"
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "EXTERNAL_DEPENDENCY"
  | "UNKNOWN";

export function classifyWorkflowError(
  error: unknown,
): WorkflowErrorClassification {
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

  if (error instanceof Error) {
    if (/unauthenticated|signed? out|session/i.test(error.message)) {
      return "AUTHENTICATION";
    }
    if (
      /unauthorized|forbidden|permission|access denied/i.test(error.message)
    ) {
      return "AUTHORIZATION";
    }
    if (/fetch|network|ECONN|ENOTFOUND|socket/i.test(error.message)) {
      return "NETWORK";
    }
  }

  return "UNKNOWN";
}

export function getDeploymentDiagnosticContext() {
  const deploymentHost = safeDeploymentHost(process.env.VERCEL_URL);

  return {
    deployedSha:
      process.env.VERCEL_GIT_COMMIT_SHA ??
      process.env.GITHUB_SHA ??
      "local-unknown",
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    ...(deploymentHost ? { deploymentHost } : {}),
  };
}

function safeDeploymentHost(value: string | undefined) {
  if (!value) return null;

  try {
    const url = new URL(
      value.startsWith("https://") ? value : `https://${value}`,
    );
    if (
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function logWorkflowFailure({
  action,
  category,
  error,
  referenceId = createWorkflowSupportReference(category),
  retryAttempted = false,
  route,
  userId,
}: {
  action: string;
  category: WorkflowCategory;
  error: unknown;
  referenceId?: string;
  retryAttempted?: boolean;
  route: string;
  userId?: string;
}) {
  const errorClassification = classifyWorkflowError(error);

  // Only the classification crosses the logging boundary. Exception messages
  // can contain form values or provider payloads and are intentionally omitted.
  logServerError(
    "[workflow-reliability] operation failed",
    new Error(errorClassification),
    {
      action,
      category,
      ...getDeploymentDiagnosticContext(),
      errorClassification,
      referenceId,
      retryAttempted,
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
    },
  );

  return referenceId;
}

export async function loadOptionalWorkflowData<T>({
  action,
  category,
  fallback,
  load,
  route,
  userId,
}: {
  action: string;
  category: WorkflowCategory;
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
      category,
      error,
      route,
      userId,
    });

    return { available: false, referenceId, value: fallback };
  }
}
