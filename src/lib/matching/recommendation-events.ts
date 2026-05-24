import "server-only";

import { prisma } from "@/lib/db/prisma";

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
