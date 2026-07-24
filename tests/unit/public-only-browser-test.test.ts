import { describe, expect, it } from "vitest";

import { isPublicOnlyBrowserTest } from "@/lib/auth/public-only-browser-test";

describe("isPublicOnlyBrowserTest", () => {
  it("activates only for the dedicated GitHub Actions browser job", () => {
    expect(
      isPublicOnlyBrowserTest({
        CI: "true",
        E2E_PUBLIC_ONLY: "true",
        GITHUB_ACTIONS: "true",
      }),
    ).toBe(true);
  });

  it.each([
    { E2E_PUBLIC_ONLY: "true" },
    { CI: "true", E2E_PUBLIC_ONLY: "true" },
    { E2E_PUBLIC_ONLY: "true", GITHUB_ACTIONS: "true" },
    { CI: "true", GITHUB_ACTIONS: "true" },
  ])("fails closed when a required CI marker is absent", (environment) => {
    expect(isPublicOnlyBrowserTest(environment)).toBe(false);
  });

  it.each([
    { VERCEL: "1" },
    { VERCEL_ENV: "preview" },
    { VERCEL: "1", VERCEL_ENV: "production" },
  ])("cannot activate on Vercel: %o", (vercelEnvironment) => {
    expect(
      isPublicOnlyBrowserTest({
        CI: "true",
        E2E_PUBLIC_ONLY: "true",
        GITHUB_ACTIONS: "true",
        ...vercelEnvironment,
      }),
    ).toBe(false);
  });
});
