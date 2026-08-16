import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createDemoSessionToken,
  DEMO_SESSION_DURATION_SECONDS,
  demoSessionCookieOptions,
  getConfiguredDemoAccessCode,
  matchesDemoAccessCode,
  verifyDemoSessionToken,
} from "@/lib/demo/recruiter-session";

const testCode = "unit-test-recruiter-code";
const now = Date.UTC(2026, 7, 15, 12, 0, 0);

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.DEMO_ACCESS_CODE;
  delete process.env.NEXT_PUBLIC_DEMO_ACCESS_CODE;
});

describe("recruiter demo session", () => {
  it("fails closed when no access code is configured", () => {
    delete process.env.DEMO_ACCESS_CODE;
    expect(getConfiguredDemoAccessCode()).toBeNull();
  });

  it("reads only the server-side access code setting", () => {
    process.env.DEMO_ACCESS_CODE = testCode;
    process.env.NEXT_PUBLIC_DEMO_ACCESS_CODE = "must-not-be-used";
    expect(getConfiguredDemoAccessCode()).toBe(testCode);
    delete process.env.NEXT_PUBLIC_DEMO_ACCESS_CODE;
  });

  it("grants the exact code and rejects an incorrect code", () => {
    expect(matchesDemoAccessCode(testCode, testCode)).toBe(true);
    expect(matchesDemoAccessCode("incorrect", testCode)).toBe(false);
  });

  it("creates a signed token valid for exactly 24 hours", () => {
    const token = createDemoSessionToken(testCode, now);
    expect(verifyDemoSessionToken(token, testCode, now)).toBe(true);
    expect(
      verifyDemoSessionToken(
        token,
        testCode,
        now + DEMO_SESSION_DURATION_SECONDS * 1_000 - 1,
      ),
    ).toBe(true);
    expect(
      verifyDemoSessionToken(
        token,
        testCode,
        now + DEMO_SESSION_DURATION_SECONDS * 1_000,
      ),
    ).toBe(false);
  });

  it("rejects tampered tokens and tokens signed with another code", () => {
    const token = createDemoSessionToken(testCode, now);
    const [payload, signature] = token.split(".");
    const replacement = signature[0] === "a" ? "b" : "a";
    const tampered = `${payload}.${replacement}${signature.slice(1)}`;

    expect(verifyDemoSessionToken(tampered, testCode, now)).toBe(false);
    expect(verifyDemoSessionToken(token, "another-code", now)).toBe(false);
  });

  it("uses a path-limited, HttpOnly, strict-lifetime cookie", () => {
    expect(demoSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      maxAge: 86_400,
      path: "/demo",
      sameSite: "lax",
    });
  });

  it("marks the demo cookie Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(demoSessionCookieOptions().secure).toBe(true);
  });
});
