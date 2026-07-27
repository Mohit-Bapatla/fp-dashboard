"use client";

import { useEffect, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import type { RecommendationEventInput } from "@/lib/matching/recommendation-event-input";

async function recordRecommendationEventsFromBrowser(
  events: RecommendationEventInput[],
) {
  const response = await fetch("/api/recommendation-events", {
    body: JSON.stringify({ events }),
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    keepalive: true,
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Recommendation telemetry request failed with status ${response.status}.`,
    );
  }
}

function reportRecommendationEvents(events: RecommendationEventInput[]) {
  const payload = JSON.stringify({ events });

  if (
    typeof navigator !== "undefined" &&
    navigator.sendBeacon(
      "/api/recommendation-events",
      new Blob([payload], { type: "application/json" }),
    )
  ) {
    return;
  }

  void recordRecommendationEventsFromBrowser(events).catch((error) => {
    console.error("Failed to record recommendation telemetry.", error);
  });
}

export function RecommendationEventTracker({
  events,
}: {
  events: RecommendationEventInput[];
}) {
  useEffect(() => {
    if (events.length > 0) {
      reportRecommendationEvents(events);
    }
  }, [events]);

  return null;
}

export function TrackedRecommendationLink({
  children,
  className,
  href,
  matchScore,
  opportunityId,
  source,
}: {
  children: ReactNode;
  className: string;
  href: string;
  matchScore: number;
  opportunityId: string;
  source: string;
}) {
  const [, startTransition] = useTransition();

  return (
    <Link
      className={className}
      href={href}
      onClick={() => {
        startTransition(() => {
          reportRecommendationEvents([
            {
              eventType: "CLICK",
              matchScore,
              opportunityId,
              source,
            },
          ]);
        });
      }}
    >
      {children}
    </Link>
  );
}
