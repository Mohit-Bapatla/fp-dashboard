import "server-only";

import { prisma } from "@/lib/db/prisma";
import type { RecommendationEventInput } from "@/lib/matching/recommendation-event-input";

export type { RecommendationEventInput } from "@/lib/matching/recommendation-event-input";

export async function recordRecommendationEvents({
  events,
  userId,
}: {
  events: RecommendationEventInput[];
  userId: string | null;
}) {
  const validEvents = events.filter((event) => event.source.trim());

  if (validEvents.length === 0) {
    return;
  }

  await prisma.recommendationEvent.createMany({
    data: validEvents.map((event) => ({
      applicationId: event.applicationId ?? null,
      eventType: event.eventType,
      matchScore: event.matchScore ?? null,
      metadata: event.metadata ?? undefined,
      opportunityId: event.opportunityId ?? null,
      resultCount: event.resultCount ?? null,
      searchQuery: event.searchQuery ?? null,
      source: event.source,
      userId,
    })),
  });
}
