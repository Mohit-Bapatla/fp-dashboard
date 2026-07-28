const EVENT_TYPES = new Set([
  "IMPRESSION",
  "CLICK",
  "APPLICATION",
  "SEARCH_RESULTS",
] as const);

export type RecommendationEventInput = {
  applicationId?: string | null;
  eventType: "IMPRESSION" | "CLICK" | "APPLICATION" | "SEARCH_RESULTS";
  matchScore?: number | null;
  metadata?: Record<string, string | number | boolean | null> | null;
  opportunityId?: string | null;
  resultCount?: number | null;
  searchQuery?: string | null;
  source: string;
};

function isOptionalBoundedString(
  value: unknown,
  maximumLength: number,
): value is string | null | undefined {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" &&
      value.length > 0 &&
      value.length <= maximumLength)
  );
}

function isOptionalFiniteNumber(
  value: unknown,
): value is number | null | undefined {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function isBoundedMetadata(
  value: unknown,
): value is
  Record<string, string | number | boolean | null> | null | undefined {
  if (value === undefined || value === null) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;

  const entries = Object.entries(value);

  return (
    entries.length <= 20 &&
    entries.every(
      ([key, entryValue]) =>
        key.length > 0 &&
        key.length <= 100 &&
        (entryValue === null ||
          typeof entryValue === "boolean" ||
          (typeof entryValue === "number" && Number.isFinite(entryValue)) ||
          (typeof entryValue === "string" && entryValue.length <= 500)),
    )
  );
}

function isRecommendationEventInput(
  value: unknown,
): value is RecommendationEventInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const event = value as Record<string, unknown>;

  return (
    typeof event.eventType === "string" &&
    EVENT_TYPES.has(event.eventType as RecommendationEventInput["eventType"]) &&
    typeof event.source === "string" &&
    event.source.trim().length > 0 &&
    event.source.length <= 100 &&
    isOptionalBoundedString(event.applicationId, 100) &&
    isOptionalBoundedString(event.opportunityId, 100) &&
    isOptionalBoundedString(event.searchQuery, 500) &&
    isOptionalFiniteNumber(event.matchScore) &&
    (event.matchScore === undefined ||
      event.matchScore === null ||
      (event.matchScore >= 0 && event.matchScore <= 100)) &&
    isOptionalFiniteNumber(event.resultCount) &&
    (event.resultCount === undefined ||
      event.resultCount === null ||
      (Number.isSafeInteger(event.resultCount) &&
        event.resultCount >= 0 &&
        event.resultCount <= 10_000)) &&
    isBoundedMetadata(event.metadata)
  );
}

export function parseRecommendationEventBatch(
  value: unknown,
): RecommendationEventInput[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 25) {
    return null;
  }

  return value.every(isRecommendationEventInput) ? value : null;
}
