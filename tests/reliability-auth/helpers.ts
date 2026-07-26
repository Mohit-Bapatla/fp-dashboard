import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";
import { Client } from "pg";

export async function enableDisposableClerkRequests(page: Page) {
  await setupClerkTestingToken({ page });
}

export async function signInDisposableUser(page: Page, emailEnv: string) {
  const emailAddress = process.env[emailEnv];
  if (!emailAddress?.includes("+clerk_test_")) {
    throw new Error(`${emailEnv} is not a disposable Clerk test identity.`);
  }

  await page.goto("/sign-in");
  await clerk.signIn({ emailAddress, page });
  await page.waitForLoadState("networkidle");
}

export async function signOutThroughDashboard(page: Page) {
  const protectedUrl = page.url();
  await page.getByLabel("Open account menu").click();
  const signOut = page.getByRole("button", { name: "Sign out" });
  await signOut.dblclick();
  await page.waitForURL((url) => url.pathname === "/");
  await page.waitForLoadState("networkidle");

  await page.goto(protectedUrl);
  await page.waitForURL(/\/sign-in(?:\?|$)/);
  await page.goBack({ waitUntil: "networkidle" }).catch(() => null);
  await page.goto(protectedUrl);
  await page.waitForURL(/\/sign-in(?:\?|$)/);
}

export async function withDisposableDatabase<T>(
  callback: (client: Client) => Promise<T>,
) {
  const databaseUrl = process.env.DISPOSABLE_TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DISPOSABLE_TEST_DATABASE_URL is required.");
  }
  const parsed = new URL(databaseUrl);
  if (!["127.0.0.1", "localhost"].includes(parsed.hostname)) {
    throw new Error("Reliability assertions require a local database.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}
