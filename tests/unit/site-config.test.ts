import { describe, expect, it } from "vitest";

import {
  allFaqItems,
  homepageFaqItems,
  impactMethodologyNote,
  organizationMetrics,
  partnerFaqItems,
  seminar,
  siteConfig,
  studentFaqItems,
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
    expect(siteConfig.mailto.support).toBe(
      "mailto:support@futurephysicians.org",
    );
    expect(siteConfig.mailto.partnerships).toBe(
      "mailto:outreach@futurephysicians.org?subject=Future%20Physicians%20Partnership%20Inquiry",
    );
    expect(siteConfig.mailto.fundraising).toBe(
      "mailto:fundraising@futurephysicians.org?subject=Funding%20Future%20Physicians",
    );
    expect(siteConfig.contact.generalSupport).toEqual({
      id: "general-support",
      href: "/contact#general-support",
    });
    expect(siteConfig.contact.partnerships).toEqual({
      id: "partnerships",
      href: "/contact#partnerships",
    });
    expect(siteConfig.contact.fundraising).toEqual({
      id: "fundraising",
      href: "/contact#fundraising",
    });
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

  it("keeps the approved seminar facts exact", () => {
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
  });

  it("keeps the auditable directory metrics and methodology wording exact", () => {
    expect(organizationMetrics).toEqual([
      { value: "150", label: "Published opportunity listings" },
      { value: "147", label: "Listed host organizations" },
      { value: "Free", label: "Student dashboard access" },
    ]);
    expect(impactMethodologyNote).toBe(
      "Directory counts are a production snapshot as of July 19, 2026. A listed host organization is not necessarily a confirmed FP partner, and listing counts do not measure active students, placements, or outcomes.",
    );
  });

  it("centralizes accurate fiscal sponsor language", () => {
    expect(siteConfig.fiscalSponsor.legalName).toBe("The Hack Foundation");
    expect(siteConfig.fiscalSponsor.relationship).toMatch(
      /fiscally sponsored/i,
    );
    expect(siteConfig.fiscalSponsor.donationNotice).toMatch(
      /official receipt from HCB/i,
    );
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
        "How do applications work?",
        "How does FP verify organizations?",
        "Where can I find upcoming events?",
        "How do I contact support?",
      ]),
    );
  });

  it("uses unique stable IDs for FAQ records and page selections", () => {
    const allIds = allFaqItems.map((item) => item.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds.every((id) => id.length > 0)).toBe(true);

    expect(homepageFaqItems.map((item) => item.id)).toEqual([
      "student-dashboard-free",
      "student-profile-eligibility",
      "opportunity-verification",
      "placement-guarantee",
      "application-process",
      "partner-inquiry",
    ]);
    expect(studentFaqItems.map((item) => item.id)).toEqual([
      "student-profile-eligibility",
      "recommendation-eligibility",
      "application-process",
    ]);
    expect(partnerFaqItems.map((item) => item.id)).toEqual([
      "partner-inquiry",
      "organization-verification",
      "partner-data-access",
    ]);
  });

  it("uses the six approved homepage FAQ questions in the requested order", () => {
    expect(homepageFaqItems.map((item) => item.question)).toEqual([
      "Is Future Physicians free for students?",
      "Who can create a student profile?",
      "How are opportunities verified?",
      "Does Future Physicians guarantee a placement?",
      "How do applications work?",
      "How can an organization work with Future Physicians?",
    ]);

    const answers = new Map(
      homepageFaqItems.map((item) => [item.question, item.answer]),
    );
    expect(answers.get("Is Future Physicians free for students?")).toBe(
      "Yes. Creating a student profile and using the FP Dashboard is free.",
    );
    expect(answers.get("Who can create a student profile?")).toBe(
      "People age 13 or older who are interested in exploring a healthcare career or gaining healthcare experience can create a student profile.",
    );
    expect(answers.get("How are opportunities verified?")).toMatch(
      /official source/i,
    );
    expect(answers.get("Does Future Physicians guarantee a placement?")).toBe(
      "No. Future Physicians helps students find relevant opportunities and stay organized throughout the application process, but each host organization makes its own acceptance and placement decisions.",
    );
    expect(answers.get("How do applications work?")).toMatch(
      /FP Dashboard.*official application path/i,
    );
    expect(
      answers.get("How can an organization work with Future Physicians?"),
    ).toContain("outreach@futurephysicians.org");

    expect(allFaqItems.map((item) => item.answer).join(" ")).not.toMatch(
      /way more likely|guaranteed acceptance|guaranteed interviews|guaranteed responses/i,
    );
  });
});
