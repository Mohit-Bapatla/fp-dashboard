import { describe, expect, it } from "vitest";

import { allFaqItems, grants, seminar, siteConfig } from "@/lib/site-config";

describe("public site configuration", () => {
  it("keeps the approved contact and program links exact", () => {
    expect(siteConfig.emails.partnerships).toBe(
      "outreach@futurephysicians.org",
    );
    expect(siteConfig.emails.support).toBe("support@futurephysicians.org");
    expect(siteConfig.emails.fundraising).toBe(
      "fundraising@futurephysicians.org",
    );
    expect(siteConfig.links.seminarRecording).toBe(
      "https://www.youtube.com/watch?v=6U2EA3O12YY",
    );
    expect(siteConfig.links.chapterApplication).toBe(
      "https://docs.google.com/forms/d/e/1FAIpQLSeT-FOoYXGwLMgDIqr-kTCPGceFSnkgn_FAyp3C_9M9eo6y3g/viewform",
    );
    expect(siteConfig.links.newsletter).toBe(
      "https://futurephysicians.substack.com/",
    );
  });

  it("keeps the approved seminar date and grant records exact", () => {
    expect(seminar.date).toBe("September 27, 2025");
    expect(grants).toEqual([
      {
        amount: "$15,000",
        funder: "Community Hospital of Long Beach Foundation",
      },
      { amount: "$1,000", funder: "Karma for Cara Grant" },
      { amount: "$720", funder: "North Carolina Community Foundation" },
    ]);
  });

  it("includes the requested practical FAQ topics", () => {
    expect(allFaqItems.map((item) => item.question)).toEqual(
      expect.arrayContaining([
        "How do I create a student profile?",
        "How do external applications work?",
        "How does FP verify organizations?",
        "Where can I find upcoming events?",
        "How do I contact support?",
      ]),
    );
  });
});
