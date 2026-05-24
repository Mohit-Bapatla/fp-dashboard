import "server-only";

import { createHash } from "crypto";

import { getOpenAiClient, getOpenAiEmbeddingModel } from "@/lib/ai/openai";

export type EmbeddingResult =
  | {
      available: false;
      reason: "missing-api-key" | "empty-input" | "request-failed";
    }
  | {
      available: true;
      contentHash: string;
      dimensions: number;
      embedding: number[];
      model: string;
    };

export function getEmbeddingContentHash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export async function createEmbeddingForText(
  content: string,
): Promise<EmbeddingResult> {
  const trimmed = content.trim();

  if (!trimmed) {
    return {
      available: false,
      reason: "empty-input",
    };
  }

  const openai = getOpenAiClient();

  if (!openai) {
    return {
      available: false,
      reason: "missing-api-key",
    };
  }

  try {
    const model = getOpenAiEmbeddingModel();
    const response = await openai.embeddings.create({
      input: trimmed,
      model,
    });
    const embedding = response.data.at(0)?.embedding;

    if (!embedding?.length) {
      return {
        available: false,
        reason: "request-failed",
      };
    }

    return {
      available: true,
      contentHash: getEmbeddingContentHash(trimmed),
      dimensions: embedding.length,
      embedding,
      model,
    };
  } catch {
    return {
      available: false,
      reason: "request-failed",
    };
  }
}
