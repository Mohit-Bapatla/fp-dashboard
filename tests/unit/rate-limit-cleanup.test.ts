import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ deleteMany: vi.fn() }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    actionRateLimit: { deleteMany: mocks.deleteMany },
  },
}));

import { cleanupExpiredRateLimits } from "@/lib/jobs/operational-workflows";

describe("expired rate-limit cleanup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes only records whose window has expired", async () => {
    const now = new Date("2026-07-19T12:00:00.000Z");
    mocks.deleteMany.mockResolvedValue({ count: 7 });

    await expect(cleanupExpiredRateLimits(now)).resolves.toMatchObject({
      changed: 7,
      errors: [],
      rule: "expiredRateLimits",
      scanned: 7,
    });
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: now } },
    });
  });
});
