import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  embeddingFindMany: vi.fn(),
  embeddingFindUnique: vi.fn(),
  opportunityFindMany: vi.fn(),
  profileFindUnique: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    embeddingRecord: {
      findMany: mocks.embeddingFindMany,
      findUnique: mocks.embeddingFindUnique,
    },
    opportunity: { findMany: mocks.opportunityFindMany },
    studentProfile: { findUnique: mocks.profileFindUnique },
  },
}));
vi.mock("@/lib/ai/openai", () => ({
  createStructuredJsonResponse: vi.fn().mockResolvedValue(null),
}));

import { getRecommendedOpportunities } from "@/lib/matching/recommendations";

describe("persistent recommendation dismissal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profileFindUnique.mockResolvedValue({
      applications: [],
      availability: [],
      city: null,
      country: null,
      interestedSpecialties: [],
      locationPreference: null,
      opportunityTypes: [],
      remotePreference: null,
      state: null,
      ageYears: null,
      gradeYear: null,
      certifications: [],
      resumes: [],
      savedOpportunities: [
        { opportunityId: "bookmarked-1" },
        { opportunityId: "dismissed-1" },
      ],
    });
    mocks.opportunityFindMany.mockResolvedValue([]);
    mocks.embeddingFindMany.mockResolvedValue([]);
    mocks.embeddingFindUnique.mockResolvedValue(null);
  });
  it("excludes every SavedOpportunity so a bookmark is never offered as dismissible", async () => {
    await expect(getRecommendedOpportunities("profile-1")).resolves.toEqual([]);
    expect(mocks.profileFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          savedOpportunities: {
            select: { opportunityId: true },
          },
        }),
      }),
    );
    expect(mocks.opportunityFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: ["bookmarked-1", "dismissed-1"] },
        }),
      }),
    );
  });
});
