import { describe, expect, it } from "vitest";

import {
  allFaqItems,
  grants,
  impactMetricDefinitions,
  organizationImpactReporting,
  seminar,
  siteConfig,
} from "@/lib/site-config";

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
    expect(siteConfig.links.instagram).toBe(
      "https://www.instagram.com/futurephysiciansmedia/",
    );
    expect(siteConfig.links.tiktok).toBe(
      "https://www.tiktok.com/@futurephysicians.org",
    );
    expect(siteConfig.links.linkedin).toBe(
      "https://www.linkedin.com/company/104746121/",
    );
  });

  it("keeps the approved seminar facts and grant records exact", () => {
    expect(seminar.date).toBe("September 27, 2025");
    expect(seminar.metricsAsOf).toEqual({
      date: "September 27, 2025",
      isoDate: "2025-09-27",
    });
    expect(
      seminar.metrics.map(({ label, value }) => ({ label, value })),
    ).toEqual([
      { value: "825", label: "Registrations" },
      { value: "500", label: "Live attendees" },
      { value: "225", label: "Peak viewers" },
      { value: "30,000+", label: "Watch minutes" },
      { value: "50+", label: "Countries represented" },
      { value: "300+", label: "Audience questions" },
    ]);
    expect(
      seminar.metrics.every((metric) => metric.definition.length > 0),
    ).toBe(true);
    expect(seminar.recognition).toEqual([
      "UC Riverside",
      "The George Washington University",
    ]);
    expect(grants).toEqual([
      {
        amount: "$15,000",
        funder: "Community Hospital of Long Beach Foundation",
      },
      { amount: "$1,000", funder: "Karma for Cara Grant" },
      { amount: "$720", funder: "North Carolina Community Foundation" },
    ]);
  });

  it("withholds unsupported organization-wide totals pending dated evidence", () => {
    expect(organizationImpactReporting).toEqual({
      asOf: null,
      disclosure:
        "Organization-wide totals are withheld because no dated, approved source is currently available for publication.",
      status: "withheld-pending-source-approval",
    });
    expect(impactMetricDefinitions.length).toBeGreaterThan(0);
  });

  it("uses the approved narrow seminar description without an unsupported affiliation", () => {
    expect(seminar.description).toBe(
      "The seminar brought together students and healthcare speakers for discussions about pathways into medicine.",
    );
    expect(seminar.description).not.toMatch(/Harvard/i);
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
