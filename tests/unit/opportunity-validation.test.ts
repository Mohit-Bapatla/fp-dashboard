import { describe, expect, it } from "vitest";
import { isSafeExternalUrl } from "@/lib/security/safe-url";
import { validateOpportunityPublishReadiness } from "@/lib/admin/opportunity-validation";

describe("opportunity publish readiness", () => {
  it("requires an official source and completed verification", () => {
    const result = validateOpportunityPublishReadiness({ relationshipType: "EXTERNAL_PUBLIC", officialSourceUrl: null, verificationStatus: "NEEDS_REVIEW", lastVerifiedAt: null });
    expect(result.ready).toBe(false);
    expect(result.errors).toHaveLength(3);
  });
  it("accepts a verified sourced listing", () => {
    expect(validateOpportunityPublishReadiness({ relationshipType: "FP_PARTNER", officialSourceUrl: "https://example.org/program", verificationStatus: "VERIFIED", lastVerifiedAt: new Date() }).ready).toBe(true);
  });
});

describe("safe external URLs", () => {
  it("allows http(s) and rejects script and unsupported protocols", () => {
    expect(isSafeExternalUrl("https://example.org/apply")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("ftp://example.org/file")).toBe(false);
  });
});
