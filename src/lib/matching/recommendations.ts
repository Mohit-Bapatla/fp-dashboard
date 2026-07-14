import "server-only";

import { prisma } from "@/lib/db/prisma";
import { createStructuredJsonResponse } from "@/lib/ai/openai";
import { getOpportunityMatchScore } from "@/lib/matching/match-score";
import { evaluateOpportunityEligibility } from "@/lib/matching/opportunity-eligibility";
import { rankRecommendationCandidates } from "@/lib/matching/recommendation-ranking";
import { studentDirectoryOpportunityWhere } from "@/lib/opportunities/student-visibility";
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
      savedOpportunities: {
        select: { opportunityId: true },
      },
      availability: true,
      city: true,
      country: true,
      interestedSpecialties: true,
      locationPreference: true,
      opportunityTypes: true,
      remotePreference: true,
      state: true,
      ageYears: true,
      gradeYear: true,
      certifications: true,
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
  const savedOpportunityIds = profile.savedOpportunities.map(
    (saved) => saved.opportunityId,
  );
  const opportunities = await prisma.opportunity.findMany({
    where: {
      ...studentDirectoryOpportunityWhere(),
      id: {
        notIn: [...Array.from(appliedOpportunityIds), ...savedOpportunityIds],
      },
    },
    select: {
      deadline: true,
      description: true,
      eligibilityRequirements: true,
      id: true,
      location: true,
      opensAt: true,
      publishedAt: true,
      remoteType: true,
      specialty: true,
      title: true,
      type: true,
      availabilityStatus: true,
      minimumAge: true,
      maximumAge: true,
      acceptedGradeLevels: true,
      requiredCertifications: true,
      city: true,
      state: true,
      country: true,
      geographicScope: true,
      scheduleRequirements: true,
      relationshipType: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  });
  const eligibleOpportunities = opportunities
    .map((opportunity) => ({
      eligibility: evaluateOpportunityEligibility({
        opportunity,
        student: profile,
      }),
      opportunity,
    }))
    .filter((item) => item.eligibility.category !== "NOT_ELIGIBLE");
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
            in: eligibleOpportunities.map(({ opportunity }) => opportunity.id),
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
  const ranked = rankRecommendationCandidates(
    eligibleOpportunities.map(({ eligibility, opportunity }) => ({
      eligibility,
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
    })),
    (similarity) => similarityToBoost(similarity, 8),
  ).slice(0, 6);

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
