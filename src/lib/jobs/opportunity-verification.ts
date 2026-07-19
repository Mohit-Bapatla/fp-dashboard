import "server-only";

import { prisma } from "@/lib/db/prisma";
import {
  verifyOpportunityUrls,
  type VerificationResult,
} from "@/lib/opportunities/import/verifier";

function isSchemaReadinessError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "P2021" || error.code === "P2022"),
  );
}

function needsHumanReview(result: VerificationResult) {
  return !["HEALTHY"].includes(result);
}

export async function runOpportunityVerificationWorkflow() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: [{ nextVerificationAt: "asc" }, { id: "asc" }],
      take: 25,
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC_DIRECTORY",
        verificationStatus: { not: "ARCHIVED" },
        OR: [
          { nextVerificationAt: null },
          { nextVerificationAt: { lte: new Date() } },
        ],
      },
      select: {
        id: true,
        officialApplicationUrl: true,
        officialSourceUrl: true,
        verificationChecks: {
          orderBy: { checkedAt: "desc" },
          take: 10,
          select: {
            checkedUrl: true,
            contentFingerprint: true,
          },
        },
      },
    });

    const targets = opportunities.flatMap((opportunity) => {
      const urls = new Set(
        [
          opportunity.officialSourceUrl,
          opportunity.officialApplicationUrl,
        ].filter((url): url is string => Boolean(url)),
      );
      return [...urls].map((url) => ({
        opportunityId: opportunity.id,
        previousFingerprint:
          opportunity.verificationChecks.find(
            (check) => check.checkedUrl === url,
          )?.contentFingerprint ?? null,
        url,
      }));
    });

    const results = await verifyOpportunityUrls(
      targets.map((target) => ({
        previousFingerprint: target.previousFingerprint,
        url: target.url,
      })),
      { concurrency: 4, retries: 2, timeoutMs: 10_000 },
    );

    if (results.length > 0) {
      await prisma.opportunityVerificationCheck.createMany({
        data: results.map((result, index) => ({
          checkedAt: new Date(result.checkedAt),
          checkedUrl: result.checkedUrl,
          contentChanged: result.contentChanged,
          contentFingerprint: result.contentFingerprint,
          errorCode: result.errorCode,
          httpStatus: result.httpStatus,
          opportunityId: targets[index]!.opportunityId,
          previousFingerprint: targets[index]!.previousFingerprint,
          redirectUrl:
            result.finalUrl === result.checkedUrl ? null : result.finalUrl,
          result: result.result,
          reviewStatus: needsHumanReview(result.result)
            ? "PENDING"
            : "DISMISSED",
          suggestedAction: result.suggestedAction,
        })),
      });
    }

    return {
      checkedUrls: results.length,
      flaggedForReview: results.filter((result) =>
        needsHumanReview(result.result),
      ).length,
      opportunities: opportunities.length,
      schemaReady: true,
      success: true,
    };
  } catch (error) {
    if (isSchemaReadinessError(error)) {
      return {
        checkedUrls: 0,
        flaggedForReview: 0,
        opportunities: 0,
        schemaReady: false,
        success: false,
      };
    }
    throw error;
  }
}
