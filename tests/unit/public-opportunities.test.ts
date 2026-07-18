import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  opportunityCount: vi.fn(),
  opportunityFindFirst: vi.fn(),
  opportunityFindMany: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    opportunity: {
      count: mocks.opportunityCount,
      findFirst: mocks.opportunityFindFirst,
      findMany: mocks.opportunityFindMany,
    },
  },
}));

import {
  getPublicOpportunities,
  getPublicOpportunity,
  getPublicOpportunityPage,
} from "@/lib/public/opportunities";

describe("public opportunity data access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.opportunityCount.mockResolvedValue(0);
    mocks.opportunityFindMany.mockResolvedValue([]);
  });

  it("paginates with a deterministic tie-breaker and clamps an empty result", async () => {
    await getPublicOpportunityPage({ page: 4, pageSize: 12, sort: "deadline" });

    expect(mocks.opportunityCount).toHaveBeenCalledWith({
      where: expect.objectContaining({ AND: expect.any(Array) }),
    });
    expect(mocks.opportunityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { deadline: { sort: "asc", nulls: "last" } },
          { publishedAt: "desc" },
          { id: "asc" },
        ],
        skip: 0,
        take: 12,
      }),
    );
  });

  it("uses count-derived page bounds without duplicating adjacent records", async () => {
    mocks.opportunityCount.mockResolvedValue(25);

    const result = await getPublicOpportunityPage({ page: 9, pageSize: 12 });

    expect(result).toMatchObject({
      page: 3,
      pageSize: 12,
      totalCount: 25,
      totalPages: 3,
    });
    expect(mocks.opportunityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { publishedAt: "desc" },
          { createdAt: "desc" },
          { id: "asc" },
        ],
        skip: 24,
        take: 12,
      }),
    );
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
