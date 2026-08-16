import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicy,
  privateDashboardHeaders,
  privateDemoHeaders,
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
    expect(csp).toContain(
      "connect-src 'self' https://clerk.futurephysicians.org",
    );
    expect(csp).not.toContain("https://*.futurephysicians.org");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
  });

  it("upgrades insecure requests only on Vercel's HTTPS environments", () => {
    const previousVercel = process.env.VERCEL;
    Object.assign(process.env, { VERCEL: "1" });
    try {
      expect(buildContentSecurityPolicy("production-nonce")).toContain(
        "upgrade-insecure-requests",
      );
    } finally {
      if (previousVercel === undefined) {
        delete process.env.VERCEL;
      } else {
        Object.assign(process.env, { VERCEL: previousVercel });
      }
    }
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

  it("prevents demo responses from being stored or indexed", () => {
    expect(privateDemoHeaders).toEqual([
      {
        key: "Cache-Control",
        value: "private, no-cache, no-store, max-age=0, must-revalidate",
      },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ]);
  });
});
