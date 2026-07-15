import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  opportunityFindFirst: vi.fn(),
  opportunityFindMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    opportunity: {
      findFirst: mocks.opportunityFindFirst,
      findMany: mocks.opportunityFindMany,
    },
  },
}));

import {
  getPublicOpportunities,
  getPublicOpportunity,
} from "@/lib/public/opportunities";

describe("public opportunity data access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.opportunityFindMany.mockResolvedValue([]);
  });

  it("always combines public visibility with the effective external flow filter", async () => {
    await getPublicOpportunities({ applicationMethod: "EXTERNAL_PORTAL" });

    expect(mocks.opportunityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({
              availabilityStatus: {
                in: ["OPEN", "OPENING_SOON", "ROLLING"],
              },
              OR: [{ deadline: null }, { deadline: { gte: expect.any(Date) } }],
              status: "PUBLISHED",
              verificationStatus: "VERIFIED",
            }),
            {
              OR: [
                { relationshipType: "EXTERNAL_PUBLIC" },
                { applicationMethod: "EXTERNAL_PORTAL" },
              ],
            },
          ],
        },
      }),
    );
  });

  it("uses one visibility-filtered lookup for detail routes", async () => {
    mocks.opportunityFindFirst.mockResolvedValue(null);

    await expect(getPublicOpportunity(" private-id ")).resolves.toBeNull();

    expect(mocks.opportunityFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.opportunityFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({
              status: "PUBLISHED",
              verificationStatus: "VERIFIED",
            }),
            { id: "private-id" },
          ],
        },
      }),
    );
  });

  it.each(["P2021", "P2022"])(
    "returns the not-found state for schema drift error %s",
    async (code) => {
      mocks.opportunityFindFirst.mockRejectedValue({ code });

      await expect(getPublicOpportunity("opp-1")).resolves.toBeNull();
    },
  );

  it("does not hide unrelated database failures", async () => {
    const error = new Error("database unavailable");
    mocks.opportunityFindFirst.mockRejectedValue(error);

    await expect(getPublicOpportunity("opp-1")).rejects.toBe(error);
  });
});
