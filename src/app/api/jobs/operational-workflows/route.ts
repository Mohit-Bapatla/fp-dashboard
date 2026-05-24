import type { NextRequest } from "next/server";

import { runOperationalWorkflows } from "@/lib/jobs/operational-workflows";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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
