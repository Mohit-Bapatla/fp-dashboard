import type { NextRequest } from "next/server";

import { runOpportunityMaintenance } from "@/lib/jobs/opportunity-maintenance";
import {
  enforcePublicRateLimit,
  formatRateLimitMessage,
  getRateLimitResponseHeaders,
} from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    const rateLimit = await enforcePublicRateLimit(request, {
      action: "public_opportunity_maintenance_cron_auth_failure",
      limit: 20,
      windowSeconds: 60 * 60,
    });
    if (!rateLimit.allowed) {
      return Response.json(
        { error: formatRateLimitMessage(rateLimit), success: false },
        { headers: getRateLimitResponseHeaders(rateLimit), status: 429 },
      );
    }
    return Response.json(
      { error: "Unauthorized", success: false },
      { status: 401 },
    );
  }

  const result = await runOpportunityMaintenance();
  return Response.json(result);
}
