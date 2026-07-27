import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db/prisma";
import {
  parseRecommendationEventBatch,
  type RecommendationEventInput,
} from "@/lib/matching/recommendation-event-input";
import { recordRecommendationEvents } from "@/lib/matching/recommendation-events";

export const runtime = "nodejs";

type RecommendationEventRequest = {
  events?: RecommendationEventInput[];
};

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RecommendationEventRequest;

  try {
    body = (await request.json()) as RecommendationEventRequest;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = parseRecommendationEventBatch(body.events);

  if (!events) {
    return Response.json(
      { error: "Invalid recommendation events" },
      { status: 400 },
    );
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
    return new Response(null, { status: 204 });
  }

  await recordRecommendationEvents({
    events,
    userId: user.id,
  });

  return new Response(null, { status: 204 });
}
