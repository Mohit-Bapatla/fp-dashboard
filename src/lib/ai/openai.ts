import "server-only";

import OpenAI from "openai";

const defaultModel = "gpt-4.1-mini";
const defaultEmbeddingModel = "text-embedding-3-small";

let client: OpenAI | null = null;

export function hasOpenAiApiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  client ??= new OpenAI({
    apiKey,
  });

  return client;
}

export function getOpenAiEmbeddingModel() {
  return defaultEmbeddingModel;
}

export async function createStructuredJsonResponse<T>({
  input,
  schema,
  schemaName,
  timeoutMs,
}: {
  input: string;
  schema: Record<string, unknown>;
  schemaName: string;
  timeoutMs?: number;
}): Promise<T | null> {
  const openai = getOpenAiClient();

  if (!openai) {
    return null;
  }

  try {
    const response = await openai.responses.create(
      {
        input,
        model: process.env.OPENAI_MODEL?.trim() || defaultModel,
        text: {
          format: {
            name: schemaName,
            schema,
            strict: true,
            type: "json_schema",
          },
        },
      },
      timeoutMs ? { maxRetries: 0, timeout: timeoutMs } : undefined,
    );
    const text = response.output_text;

    if (!text) {
      return null;
    }

    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
