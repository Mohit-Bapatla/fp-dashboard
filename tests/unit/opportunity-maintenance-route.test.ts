import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  run: vi.fn(),
}));

vi.mock("@/lib/jobs/opportunity-maintenance", () => ({
  runOpportunityMaintenance: mocks.run,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforcePublicRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn(() => "Too many requests."),
  getRateLimitResponseHeaders: vi.fn(() => ({ "Retry-After": "60" })),
}));

import { GET } from "@/app/api/jobs/opportunity-maintenance/route";

describe("opportunity maintenance cron route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.run.mockResolvedValue({ checked: 1, success: true });
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousSecret;
  });

  it("fails closed without the configured bearer secret", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/opportunity-maintenance"),
    );

    expect(response.status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("does not echo a rejected secret and rate limits repeated failures", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false });
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/opportunity-maintenance", {
        headers: { authorization: "Bearer rejected-secret" },
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(body).not.toContain("rejected-secret");
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("runs the report-only job with the matching secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/opportunity-maintenance", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
});
