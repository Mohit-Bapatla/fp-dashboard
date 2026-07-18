import { describe, expect, it } from "vitest";

import { normalizeExternalUrl } from "@/lib/security/safe-url";
import { validateExternalOpportunity } from "@/lib/student/external-opportunity-validation";

function validForm() {
  const form = new FormData();
  form.set("sourceUrl", "https://Example.org/apply/?b=2&a=1#requirements");
  form.set("title", "Community health internship");
  form.set("organizationName", "Example Hospital");
  form.set("createWorkspace", "on");
  return form;
}

describe("external opportunity validation", () => {
  it("normalizes a safe source URL for per-student duplicate prevention", () => {
    const result = validateExternalOpportunity(validForm());
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.normalizedSourceUrl).toBe(
      "https://example.org/apply?a=1&b=2",
    );
    expect(result.data.opportunityType).toBe("PROGRAM");
    expect(result.data.createWorkspace).toBe(true);
  });

  it("rejects local, private-network, credentialed, and non-HTTP URLs", () => {
    for (const sourceUrl of [
      "http://localhost:3000/apply",
      "http://127.0.0.1/apply",
      "http://10.0.0.4/apply",
      "http://[fc00::1]/apply",
      "http://[fd12:3456::1]/apply",
      "http://[fe80::1]/apply",
      "http://[::ffff:127.0.0.1]/apply",
      "http://[::ffff:7f00:1]/apply",
      "https://user:password@example.org/apply",
      "javascript:alert(1)",
    ]) {
      const form = validForm();
      form.set("sourceUrl", sourceUrl);
      const result = validateExternalOpportunity(form);
      expect(result.success, sourceUrl).toBe(false);
      if (result.success)
        throw new Error(`Expected ${sourceUrl} to be rejected`);
      expect(result.fieldErrors.sourceUrl).toBeTruthy();
    }
  });

  it("accepts a public global-unicast IPv6 literal", () => {
    const form = validForm();
    form.set("sourceUrl", "https://[2606:4700:4700::1111]/apply");

    expect(validateExternalOpportunity(form).success).toBe(true);
  });

  it("validates dates and required-document limits without fetching the page", () => {
    const form = validForm();
    form.set("opensAt", "2026-08-10");
    form.set("deadline", "2026-08-01");
    form.set(
      "requiredDocuments",
      Array.from({ length: 16 }, (_, index) => `Document ${index}`).join("\n"),
    );
    const result = validateExternalOpportunity(form);

    expect(result.success).toBe(false);
    if (result.success)
      throw new Error("Expected invalid dates to be rejected");
    expect(result.fieldErrors.deadline).toMatch(/on or after/i);
    expect(result.fieldErrors.requiredDocuments).toMatch(/at most 15/i);
  });

  it("canonicalizes equivalent URL variants", () => {
    expect(normalizeExternalUrl("https://EXAMPLE.org/path/?z=2&a=1#top")).toBe(
      normalizeExternalUrl("https://example.org/path?a=1&z=2"),
    );
  });
});
