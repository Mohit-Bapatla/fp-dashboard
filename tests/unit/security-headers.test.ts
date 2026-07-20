import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  privateDashboardHeaders,
  securityHeaders,
} from "@/lib/security/headers";

describe("security headers", () => {
  it("sets the required browser security controls", () => {
    const headers = new Map(
      securityHeaders.map(({ key, value }) => [key, value]),
    );
    const csp = buildContentSecurityPolicy("test-nonce");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("'nonce-test-nonce'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("permits React development diagnostics without weakening production", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    Object.assign(process.env, { NODE_ENV: "development" });
    try {
      expect(buildContentSecurityPolicy("dev-nonce")).toContain(
        "'unsafe-eval'",
      );
    } finally {
      Object.assign(process.env, { NODE_ENV: previousNodeEnv });
    }
  });

  it("prevents private dashboard responses from being stored", () => {
    expect(privateDashboardHeaders).toEqual([
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    ]);
  });
});
