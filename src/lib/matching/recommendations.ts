import "server-only";

import { prisma } from "@/lib/db/prisma";
import { createStructuredJsonResponse } from "@/lib/ai/openai";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import {
  cosineSimilarity,
  parseEmbedding,
  similarityToBoost,
} from "@/lib/matching/vector-similarity";

type PolishedReasons = {
  reasons: string[];
};

const reasonSchema = {
  additionalProperties: false,
  properties: {
    reasons: {
      items: { type: "string" },
      type: "array",
    },
  },
  required: ["reasons"],
  type: "object",
};

function getTime(value: Date | null) {
  return value?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

async function polishReasons(reasons: string[]) {
  if (reasons.length === 0) {
    return reasons;
  }

  const result = await createStructuredJsonResponse<PolishedReasons>({
    input: [
      "Polish these recommendation reasons for a student dashboard.",
      "Do not change ranking, add claims, or mention protected attributes.",
      `Reasons:\n${reasons.join("\n")}`,
    ].join("\n\n"),
    schema: reasonSchema,
    schemaName: "recommendation_reasons",
  });

  return result?.reasons.length
    ? result.reasons.slice(0, reasons.length)
    : reasons;
}

export async function getRecommendedOpportunities(studentProfileId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: {
      id: studentProfileId,
    },
    select: {
      applications: {
        select: {
          opportunityId: true,
        },
      },
      availability: true,
      city: true,
      country: true,
      interestedSpecialties: true,
      locationPreference: true,
      opportunityTypes: true,
      remotePreference: true,
      state: true,
      resumes: {
        orderBy: {
          updatedAt: "desc",
        },
        select: {
          extractedSkills: true,
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!profile) {
    return [];
  }

  const appliedOpportunityIds = new Set(
    profile.applications.map((application) => application.opportunityId),
  );
  const opportunities = await prisma.opportunity.findMany({
    where: {
      id: {
        notIn: Array.from(appliedOpportunityIds),
      },
      status: "PUBLISHED",
    },
    select: {
      deadline: true,
      description: true,
      eligibilityRequirements: true,
      id: true,
      location: true,
      publishedAt: true,
      remoteType: true,
      specialty: true,
      title: true,
      type: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  const resume = profile.resumes.at(0) ?? null;
  const [profileEmbedding, resumeEmbedding, opportunityEmbeddings] =
    await Promise.all([
      prisma.embeddingRecord.findUnique({
        where: {
          entityType_entityId: {
            entityId: studentProfileId,
            entityType: "STUDENT_PROFILE",
          },
        },
        select: {
          embedding: true,
        },
      }),
      resume
        ? prisma.embeddingRecord.findUnique({
            where: {
              entityType_entityId: {
                entityId: resume.id,
                entityType: "RESUME",
              },
            },
            select: {
              embedding: true,
            },
          })
        : Promise.resolve(null),
      prisma.embeddingRecord.findMany({
        where: {
          entityId: {
            in: opportunities.map((opportunity) => opportunity.id),
          },
          entityType: "OPPORTUNITY",
        },
        select: {
          embedding: true,
          entityId: true,
        },
      }),
    ]);
  const studentVector =
    parseEmbedding(resumeEmbedding?.embedding).length > 0
      ? parseEmbedding(resumeEmbedding?.embedding)
      : parseEmbedding(profileEmbedding?.embedding);
  const opportunityEmbeddingById = new Map(
    opportunityEmbeddings.map((record) => [
      record.entityId,
      parseEmbedding(record.embedding),
    ]),
  );
  const ranked = opportunities
    .map((opportunity) => ({
      match: getOpportunityMatchScore({
        opportunity,
        profile,
        resume,
      }),
      opportunity,
      vectorSimilarity: cosineSimilarity(
        studentVector,
        opportunityEmbeddingById.get(opportunity.id) ?? [],
      ),
    }))
    .sort((first, second) => {
      const scoreDifference = second.match.score - first.match.score;

      if (Math.abs(scoreDifference) > 10) {
        return scoreDifference;
      }

      const boostedDifference =
        second.match.score +
        similarityToBoost(second.vectorSimilarity, 8) -
        (first.match.score + similarityToBoost(first.vectorSimilarity, 8));

      if (boostedDifference !== 0) {
        return boostedDifference;
      }

      if (scoreDifference !== 0) {
        return second.match.score - first.match.score;
      }

      const deadlineDifference =
        getTime(first.opportunity.deadline) -
        getTime(second.opportunity.deadline);

      if (deadlineDifference !== 0) {
        return deadlineDifference;
      }

      return (
        getTime(second.opportunity.publishedAt) -
        getTime(first.opportunity.publishedAt)
      );
    })
    .slice(0, 3);

  return Promise.all(
    ranked.map(async (item) => ({
      ...item,
      match: {
        ...item.match,
        reasons: await polishReasons(item.match.reasons),
      },
      vectorSimilarity: item.vectorSimilarity,
    })),
  );
}
