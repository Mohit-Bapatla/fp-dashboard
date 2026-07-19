import type { NextRequest } from "next/server";

import { runOpportunityVerificationWorkflow } from "@/lib/jobs/opportunity-verification";
import {
  enforcePublicRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    const rateLimit = await enforcePublicRateLimit(request, {
      action: "public_opportunity_verification_cron_auth_failure",
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        { error: formatRateLimitMessage(rateLimit), success: false },
        { status: 429 },
      );
    }

    return Response.json(
      { error: "Unauthorized", success: false },
      { status: 401 },
    );
  }

  const result = await runOpportunityVerificationWorkflow();
  return Response.json(result, { status: result.schemaReady ? 200 : 503 });
}
