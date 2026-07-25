import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3100";
const databaseUrl = process.env.DISPOSABLE_TEST_DATABASE_URL;

export default defineConfig({
  fullyParallel: false,
  globalSetup: "./tests/reliability-auth/global-setup.ts",
  outputDir: "test-results/reliability-auth",
  testDir: "./tests/reliability-auth",
  timeout: 60_000,
  workers: 1,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    screenshot: process.env.CI ? "off" : "only-on-failure",
    trace: process.env.CI ? "off" : "retain-on-failure",
    video: "off",
  },
  webServer: {
    command: "npm run start -- --port 3100",
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl ?? "",
      DIRECT_URL: databaseUrl ?? "",
      NEXT_PUBLIC_APP_URL: baseURL,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
      NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: "/dashboard",
      NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
        "/dashboard/student/onboarding",
      NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL:
        "/dashboard/student/onboarding",
      NEXT_PUBLIC_CLERK_SIGN_OUT_FALLBACK_REDIRECT_URL: "/sign-in",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL,
  },
  projects: [
    {
      name: "authenticated-desktop",
      testMatch: /(?:student|partner|stress)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authenticated-mobile-390",
      testMatch: /mobile-core\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 844, width: 390 },
      },
    },
  ],
});
