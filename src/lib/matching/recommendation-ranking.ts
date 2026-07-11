import type { EligibilityResult } from "@/lib/matching/opportunity-eligibility";

export type RecommendationCandidate<T, M extends { score: number }> = {
  eligibility: EligibilityResult;
  match: M;
  opportunity: T & { deadline: Date | null; publishedAt: Date | null };
  vectorSimilarity: number;
};

function time(value: Date | null) {
  return value?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function rankRecommendationCandidates<T, M extends { score: number }>(
  candidates: RecommendationCandidate<T, M>[],
  vectorBoost: (similarity: number) => number,
) {
  const categoryRank = { STRONG_MATCH: 0, POSSIBLE_MATCH: 1 } as const;
  return candidates
    .filter((candidate) => candidate.eligibility.category !== "NOT_ELIGIBLE")
    .sort((first, second) => {
      const categoryDifference =
        categoryRank[first.eligibility.category as keyof typeof categoryRank] -
        categoryRank[second.eligibility.category as keyof typeof categoryRank];
      if (categoryDifference !== 0) return categoryDifference;
      const scoreDifference =
        second.match.score +
        vectorBoost(second.vectorSimilarity) -
        (first.match.score + vectorBoost(first.vectorSimilarity));
      if (scoreDifference !== 0) return scoreDifference;
      const deadlineDifference =
        time(first.opportunity.deadline) - time(second.opportunity.deadline);
      if (deadlineDifference !== 0) return deadlineDifference;
      return (
        time(second.opportunity.publishedAt) -
        time(first.opportunity.publishedAt)
      );
    });
}
