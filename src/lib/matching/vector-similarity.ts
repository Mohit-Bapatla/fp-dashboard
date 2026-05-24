import "server-only";

import { prisma } from "@/lib/db/prisma";

export function parseEmbedding(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is number => typeof item === "number");
}

export function cosineSimilarity(first: number[], second: number[]) {
  if (first.length === 0 || first.length !== second.length) {
    return 0;
  }

  let dot = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;

  for (let index = 0; index < first.length; index += 1) {
    dot += first[index] * second[index];
    firstMagnitude += first[index] * first[index];
    secondMagnitude += second[index] * second[index];
  }

  if (firstMagnitude === 0 || secondMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(firstMagnitude) * Math.sqrt(secondMagnitude));
}

export function similarityToBoost(similarity: number, maxBoost: number) {
  if (similarity <= 0) {
    return 0;
  }

  return Math.round(Math.min(maxBoost, similarity * maxBoost));
}

export async function getEmbeddingVectorForEntity({
  entityId,
  entityType,
}: {
  entityId: string;
  entityType:
    | "OPPORTUNITY"
    | "STUDENT_PROFILE"
    | "RESUME"
    | "PARTNER_ORGANIZATION";
}) {
  const record = await prisma.embeddingRecord.findUnique({
    where: {
      entityType_entityId: {
        entityId,
        entityType,
      },
    },
    select: {
      embedding: true,
    },
  });

  return record ? parseEmbedding(record.embedding) : [];
}
