import { describe, expect, it } from "vitest";
import { rankRecommendationCandidates } from "@/lib/matching/recommendation-ranking";

const eligibility = (
  category: "STRONG_MATCH" | "POSSIBLE_MATCH" | "NOT_ELIGIBLE",
) => ({
  category,
  blockingReasons: [],
  concerns: [],
  confirmedMatches: [],
  unknowns: [],
});
const candidate = (
  id: string,
  category: "STRONG_MATCH" | "POSSIBLE_MATCH" | "NOT_ELIGIBLE",
  score: number,
) => ({
  eligibility: eligibility(category),
  match: { score },
  opportunity: { id, deadline: null, publishedAt: null },
  vectorSimilarity: 0,
});

describe("recommendation ranking", () => {
  it("excludes a high-soft-score explicit eligibility blocker", () => {
    const ranked = rankRecommendationCandidates(
      [
        candidate("age-blocked", "NOT_ELIGIBLE", 100),
        candidate("possible", "POSSIBLE_MATCH", 20),
      ],
      () => 0,
    );
    expect(ranked.map((item) => item.opportunity.id)).toEqual(["possible"]);
  });
  it("prioritizes strong match before possible match regardless of soft score", () => {
    const ranked = rankRecommendationCandidates(
      [
        candidate("possible", "POSSIBLE_MATCH", 99),
        candidate("strong", "STRONG_MATCH", 10),
      ],
      () => 0,
    );
    expect(ranked.map((item) => item.opportunity.id)).toEqual([
      "strong",
      "possible",
    ]);
  });
});
