import type { NextRequest } from "next/server";

import { runOperationalWorkflows } from "@/lib/jobs/operational-workflows";
import {
  enforcePublicRateLimit,
  formatRateLimitMessage,
  getRateLimitResponseHeaders,
} from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    const rateLimit = await enforcePublicRateLimit(request, {
      action: "public_cron_auth_failure",
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: formatRateLimitMessage(rateLimit),
          success: false,
        },
        {
          headers: getRateLimitResponseHeaders(rateLimit),
          status: 429,
        },
      );
    }

    return Response.json(
      {
        error: "Unauthorized",
        success: false,
      },
      {
        status: 401,
      },
    );
  }

  const result = await runOperationalWorkflows({
    source: "cron",
  });

  return Response.json(result);
}
