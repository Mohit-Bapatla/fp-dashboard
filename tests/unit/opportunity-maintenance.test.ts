import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditCreate: vi.fn(),
  auditFindFirst: vi.fn(),
  opportunityFindMany: vi.fn(),
  rateLimit: vi.fn(),
  verify: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    auditLog: {
      create: mocks.auditCreate,
      findFirst: mocks.auditFindFirst,
    },
    opportunity: { findMany: mocks.opportunityFindMany },
  },
}));
vi.mock("@/lib/opportunities/url-verifier", () => ({
  verifyOpportunityUrl: mocks.verify,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
}));

import { runOpportunityMaintenance } from "@/lib/jobs/opportunity-maintenance";

describe("opportunity maintenance job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.auditFindFirst.mockResolvedValue(null);
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  it("prevents an overlapping run before reading opportunity data", async () => {
    mocks.rateLimit.mockResolvedValue({ allowed: false });

    await expect(runOpportunityMaintenance()).resolves.toMatchObject({
      checked: 0,
      skipped: true,
    });
    expect(mocks.opportunityFindMany).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("checks only the bounded stale queue and persists a URL-free report", async () => {
    mocks.opportunityFindMany.mockResolvedValue([
      {
        id: "opportunity-1",
        officialApplicationUrl: "https://apply.health.example.edu/start",
        officialSourceUrl: "https://health.example.edu/program",
      },
      {
        id: "opportunity-2",
        officialApplicationUrl: null,
        officialSourceUrl: null,
      },
    ]);
    mocks.verify.mockResolvedValue({
      contentHash: "a".repeat(64),
      errorCode: null,
      httpStatus: 200,
      redirectCount: 0,
      status: "HEALTHY",
    });

    const result = await runOpportunityMaintenance(
      new Date("2026-07-19T12:00:00.000Z"),
    );

    expect(mocks.opportunityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 25,
        where: expect.objectContaining({
          status: "PUBLISHED",
          visibility: "PUBLIC_DIRECTORY",
        }),
      }),
    );
    expect(mocks.verify).toHaveBeenCalledWith(
      "https://health.example.edu/program",
      null,
      { previousStatus: null },
    );
    expect(result).toMatchObject({
      checked: 2,
      skipped: false,
      summary: { BLOCKED: 1, HEALTHY: 1 },
    });

    const auditData = mocks.auditCreate.mock.calls[0][0].data;
    const serialized = JSON.stringify(auditData);
    expect(auditData.action).toBe("OPPORTUNITY_MAINTENANCE_RUN");
    expect(serialized).not.toContain("https://");
    expect(serialized).not.toContain("health.example.edu");
    expect(auditData.metadata.checks).toEqual([
      expect.objectContaining({
        opportunityId: "opportunity-1",
        status: "HEALTHY",
      }),
      expect.objectContaining({
        errorCode: "NO_SOURCE_URL",
        opportunityId: "opportunity-2",
        status: "BLOCKED",
      }),
    ]);
  });
});
