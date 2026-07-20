import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  run: vi.fn(),
}));

vi.mock("@/lib/jobs/student-reminders", () => ({
  runStudentReminderWorkflows: mocks.run,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforcePublicRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn(() => "Too many requests."),
  getRateLimitResponseHeaders: vi.fn(() => ({ "Retry-After": "60" })),
}));

import { GET } from "@/app/api/jobs/student-reminders/route";

describe("student reminder cron route", () => {
  const previousSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.run.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previousSecret;
  });

  it("rejects a request without the cron bearer secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/student-reminders"),
    );
    expect(response.status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("fails closed when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/student-reminders", {
        headers: { authorization: "Bearer undefined" },
      }),
    );

    expect(response.status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("returns a generic error for the wrong secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/student-reminders", {
        headers: { authorization: "Bearer leaked-wrong-secret" },
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(401);
    expect(body).not.toContain("leaked-wrong-secret");
    expect(body).not.toContain("runId");
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("rate limits repeated authentication failures", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false });
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/student-reminders"),
    );

    expect(response.status).toBe(429);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("runs the workflow with the matching secret", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/jobs/student-reminders", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledTimes(1);
  });
});
