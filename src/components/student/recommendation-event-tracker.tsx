"use client";

import { useEffect, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

import { recordRecommendationEventsAction } from "@/app/dashboard/recommendations/actions";
import type { RecommendationEventInput } from "@/lib/matching/recommendation-events";

export function RecommendationEventTracker({
  events,
}: {
  events: RecommendationEventInput[];
}) {
  useEffect(() => {
    if (events.length > 0) {
      void recordRecommendationEventsAction(events);
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
          void recordRecommendationEventsAction([
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
