import { describe, expect, it } from "vitest";

import { parseRecommendationEventBatch } from "@/lib/matching/recommendation-event-input";

describe("recommendation event input", () => {
  it("accepts a bounded impression batch", () => {
    const events = [
      {
        eventType: "IMPRESSION",
        matchScore: 87,
        opportunityId: "opportunity-1",
        source: "student_dashboard_recommendation",
      },
    ];

    expect(parseRecommendationEventBatch(events)).toEqual(events);
  });

  it.each([
    [[]],
    [[{ eventType: "UNKNOWN", source: "dashboard" }]],
    [[{ eventType: "CLICK", source: "" }]],
    [[{ eventType: "CLICK", source: "dashboard", matchScore: 101 }]],
    [[{ eventType: "SEARCH_RESULTS", source: "search", resultCount: -1 }]],
    [
      [
        {
          eventType: "CLICK",
          source: "dashboard",
          metadata: { nested: {} },
        },
      ],
    ],
  ])("rejects an unsafe batch %#", (events) => {
    expect(parseRecommendationEventBatch(events)).toBeNull();
  });

  it("rejects oversized batches", () => {
    expect(
      parseRecommendationEventBatch(
        Array.from({ length: 26 }, () => ({
          eventType: "IMPRESSION",
          source: "dashboard",
        })),
      ),
    ).toBeNull();
  });
});
