import { describe, expect, it } from "vitest";
import { isSafeExternalUrl } from "@/lib/security/safe-url";
import {
  validateOpportunityForm,
  validateOpportunityPublishReadiness,
} from "@/lib/admin/opportunity-validation";

describe("opportunity publish readiness", () => {
  it("requires an official source and completed verification", () => {
    const result = validateOpportunityPublishReadiness({
      relationshipType: "EXTERNAL_PUBLIC",
      officialSourceUrl: null,
      verificationStatus: "NEEDS_REVIEW",
      lastVerifiedAt: null,
    });
    expect(result.ready).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
  it("accepts a verified sourced listing", () => {
    expect(
      validateOpportunityPublishReadiness({
        relationshipType: "FP_PARTNER",
        officialSourceUrl: "https://example.org/program",
        verificationStatus: "VERIFIED",
        lastVerifiedAt: new Date(),
      }).ready,
    ).toBe(true);
  });
});

describe("safe external URLs", () => {
  it("allows http(s) and rejects script and unsupported protocols", () => {
    expect(isSafeExternalUrl("https://example.org/apply")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("ftp://example.org/file")).toBe(false);
  });
});

function validForm() {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    organizationId: "org-1",
    title: "Demo",
    type: "SHADOWING",
    status: "DRAFT",
    relationshipType: "EXTERNAL_PUBLIC",
    applicationMethod: "EXTERNAL_PORTAL",
    verificationStatus: "NEEDS_REVIEW",
    availabilityStatus: "OPEN",
    officialSourceUrl: "https://example.org/source",
    officialApplicationUrl: "https://example.org/apply",
    acceptedGradeLevels: "High school junior, Grade 12",
  }))
    form.set(key, value);
  return form;
}

describe("opportunity form hardening", () => {
  it("rejects raw enum values outside allowlists", () => {
    const form = validForm();
    form.set("relationshipType", "SECRET_PARTNER");
    form.set("applicationMethod", "AUTO_SUBMIT");
    form.set("verificationStatus", "TRUST_ME");
    form.set("availabilityStatus", "URGENT");
    const result = validateOpportunityForm(form);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.errors).toMatchObject({
        relationshipType: expect.any(String),
        applicationMethod: expect.any(String),
        verificationStatus: expect.any(String),
        availabilityStatus: expect.any(String),
      });
  });
  it("rejects invalid dates and non-finite or partial integers", () => {
    const form = validForm();
    form.set("deadline", "not-a-date");
    form.set("minimumAge", "16abc");
    form.set("maximumAge", "Infinity");
    form.set("capacity", "12students");
    const result = validateOpportunityForm(form);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.errors).toMatchObject({
        deadline: expect.any(String),
        minimumAge: expect.any(String),
        maximumAge: expect.any(String),
        capacity: expect.any(String),
      });
  });
  it("canonicalizes recognized grade aliases", () => {
    const result = validateOpportunityForm(validForm());
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data.acceptedGradeLevels).toEqual(["HS_11", "HS_12"]);
  });
});
