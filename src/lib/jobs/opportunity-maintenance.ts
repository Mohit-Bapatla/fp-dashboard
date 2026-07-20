import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  type OpportunityUrlCheckResult,
  verifyOpportunityUrl,
} from "@/lib/opportunities/url-verifier";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const MAX_LISTINGS_PER_RUN = 25;
const STALE_AFTER_DAYS = 30;

type StoredCheck = {
  contentHash?: string | null;
  opportunityId?: string;
  status?: OpportunityUrlCheckResult["status"];
};

function getPriorChecks(metadata: Prisma.JsonValue | null) {
  const priorChecks = new Map<string, StoredCheck>();
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return priorChecks;
  const checks = (metadata as Prisma.JsonObject).checks;
  if (!Array.isArray(checks)) return priorChecks;

  for (const item of checks as StoredCheck[]) {
    if (item.opportunityId) {
      priorChecks.set(item.opportunityId, item);
    }
  }
  return priorChecks;
}

export async function runOpportunityMaintenance(now = new Date()) {
  const lock = await enforceRateLimit({
    action: "opportunity_maintenance_run",
    identifier: "singleton",
    limit: 1,
    windowSeconds: 15 * 60,
  });
  if (!lock.allowed) {
    return {
      checked: 0,
      skipped: true,
      success: true,
      message: "A recent opportunity maintenance run already holds the lock.",
    };
  }

  const staleBefore = new Date(now);
  staleBefore.setUTCDate(staleBefore.getUTCDate() - STALE_AFTER_DAYS);
  const [opportunities, priorRun] = await Promise.all([
    prisma.opportunity.findMany({
      orderBy: [
        { nextVerificationAt: "asc" },
        { lastVerifiedAt: "asc" },
        { id: "asc" },
      ],
      select: {
        id: true,
        officialApplicationUrl: true,
        officialSourceUrl: true,
      },
      take: MAX_LISTINGS_PER_RUN,
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC_DIRECTORY",
        OR: [
          { nextVerificationAt: { lte: now } },
          { lastVerifiedAt: { lte: staleBefore } },
          { lastVerifiedAt: null },
        ],
      },
    }),
    prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
      where: { action: "OPPORTUNITY_MAINTENANCE_RUN" },
    }),
  ]);
  const priorChecks = getPriorChecks(priorRun?.metadata ?? null);

  const checks: Array<OpportunityUrlCheckResult & { opportunityId: string }> =
    [];
  for (const opportunity of opportunities) {
    const sourceUrl =
      opportunity.officialSourceUrl ?? opportunity.officialApplicationUrl;
    const priorCheck = priorChecks.get(opportunity.id);
    const result = sourceUrl
      ? await verifyOpportunityUrl(sourceUrl, priorCheck?.contentHash ?? null, {
          previousStatus: priorCheck?.status ?? null,
        })
      : {
          contentHash: null,
          errorCode: "NO_SOURCE_URL",
          httpStatus: null,
          redirectCount: 0,
          status: "BLOCKED" as const,
        };
    checks.push({ opportunityId: opportunity.id, ...result });
  }

  const summary = checks.reduce<Record<string, number>>((counts, check) => {
    counts[check.status] = (counts[check.status] ?? 0) + 1;
    return counts;
  }, {});
  await prisma.auditLog.create({
    data: {
      action: "OPPORTUNITY_MAINTENANCE_RUN",
      entityType: "OpportunityDirectory",
      metadata: {
        checked: checks.length,
        checks,
        limits: {
          maxListings: MAX_LISTINGS_PER_RUN,
          requestBytes: 64 * 1024,
          staleAfterDays: STALE_AFTER_DAYS,
        },
        summary,
      },
    },
  });

  return {
    checked: checks.length,
    skipped: false,
    success: true,
    summary,
  };
}
