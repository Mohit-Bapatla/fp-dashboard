import { describe, expect, it } from "vitest";

import {
  CANONICAL_PRODUCTION_ORIGIN,
  EXPECTED_HOMEPAGE_METRICS,
  redactSmokeDiagnostic,
  validateCanonicalProductionUrl,
  validateProductionSecurityHeaders,
} from "@/lib/reliability/production-smoke-policy";

describe("production smoke policy", () => {
  it("is fixed to the canonical www origin and exact approved metrics", () => {
    expect(CANONICAL_PRODUCTION_ORIGIN).toBe(
      "https://www.futurephysicians.org",
    );
    expect(EXPECTED_HOMEPAGE_METRICS).toEqual([
      ["2,000+", "Students in the FP community"],
      ["50+", "Partner organizations"],
      ["$300K+", "Student stipends facilitated through partner programs"],
    ]);
    expect(
      validateCanonicalProductionUrl(
        "https://www.futurephysicians.org/opportunities",
      ),
    ).toEqual([]);
  });

  it("rejects apex, Preview, and the known noncanonical alias", () => {
    for (const value of [
      "https://futurephysicians.org",
      "https://example-preview.vercel.app",
      "https://fp-dashboard-rosy.vercel.app",
    ]) {
      expect(validateCanonicalProductionUrl(value).length).toBeGreaterThan(0);
    }
  });

  it("requires narrow production headers and Clerk CSP access", () => {
    const valid = {
      "content-security-policy":
        "default-src 'self'; script-src 'self' https://clerk.futurephysicians.org; script-src-elem 'self' https://clerk.futurephysicians.org; connect-src 'self' https://*.accounts.dev",
      "permissions-policy": "camera=(), microphone=()",
      "referrer-policy": "strict-origin-when-cross-origin",
      "strict-transport-security": "max-age=31536000",
      "x-content-type-options": "nosniff",
    };

    expect(validateProductionSecurityHeaders(valid)).toEqual([]);
    expect(
      validateProductionSecurityHeaders({
        ...valid,
        "content-security-policy":
          "default-src *; script-src * 'unsafe-eval'; script-src-elem *; connect-src *",
      }),
    ).toEqual(
      expect.arrayContaining([
        "CSP does not permit a required Clerk origin",
        "CSP default-src contains a broad wildcard",
        "CSP script-src contains a broad wildcard",
        "CSP script-src-elem contains a broad wildcard",
        "CSP connect-src contains a broad wildcard",
        "CSP script-src contains unsafe-eval",
      ]),
    );
  });

  it("redacts cookies, tokens, email addresses, and URL paths", () => {
    const diagnostic = redactSmokeDiagnostic(
      "cookie=abc token=def user@example.com https://example.com/private?q=1",
    );
    expect(diagnostic).not.toContain("abc");
    expect(diagnostic).not.toContain("def");
    expect(diagnostic).not.toContain("user@example.com");
    expect(diagnostic).not.toContain("/private");
  });
});
