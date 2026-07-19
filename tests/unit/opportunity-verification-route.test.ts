import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  run: vi.fn(),
}));

vi.mock("@/lib/jobs/opportunity-verification", () => ({
  runOpportunityVerificationWorkflow: mocks.run,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforcePublicRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn(() => "Too many requests."),
}));

import { GET } from "@/app/api/jobs/opportunity-verification/route";

describe("opportunity verification cron route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.run.mockResolvedValue({ schemaReady: true, success: true });
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousSecret;
  });

  it("fails closed without a matching bearer secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/opportunity-verification"),
    );
    expect(response.status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("runs the bounded workflow with the matching secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/opportunity-verification", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });

  it("returns 503 until the additive schema is installed", async () => {
    mocks.run.mockResolvedValue({ schemaReady: false, success: false });
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/opportunity-verification", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(response.status).toBe(503);
  });
});
