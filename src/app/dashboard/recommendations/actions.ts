"use server";

import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";
import {
  recordRecommendationEvents,
  type RecommendationEventInput,
} from "@/lib/matching/recommendation-events";

export async function recordRecommendationEventsAction(
  events: RecommendationEventInput[],
) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return;
  }

  await recordRecommendationEvents({
    events,
    userId: user.id,
  });
}
