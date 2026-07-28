import { defineConfig, devices } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:3000";
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const baseURL = remoteBaseURL || localBaseURL;
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ?? "npm run dev";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: remoteBaseURL
    ? undefined
    : {
        command: webServerCommand,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: localBaseURL,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      testMatch: /browser-matrix\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "iphone-webkit",
      testMatch: /browser-matrix\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
});
