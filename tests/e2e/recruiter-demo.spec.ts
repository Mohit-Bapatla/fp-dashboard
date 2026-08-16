import AxeBuilder from "@axe-core/playwright";
import type { Page, Request } from "@playwright/test";

import { expect, test } from "./fixtures";

const accessCode = process.env.DEMO_E2E_ACCESS_CODE ?? "fp-local-e2e-demo-only";
const demoCookieName = "fp_recruiter_demo";

function protectedRequestReason(request: Request, baseURL: string) {
  const url = new URL(request.url());
  const base = new URL(baseURL);
  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "clerk.futurephysicians.org" ||
    hostname.endsWith(".accounts.dev") ||
    hostname.endsWith(".clerk.com") ||
    hostname.endsWith(".clerk.dev")
  ) {
    return "Clerk authentication endpoint";
  }
  if (hostname.endsWith(".supabase.co")) {
    return "Supabase endpoint";
  }
  if (
    url.origin === base.origin &&
    ["/__clerk", "/api", "/dashboard", "/partner-onboarding", "/trpc"].some(
      (prefix) =>
        url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
    )
  ) {
    return "protected application endpoint";
  }
  if (
    url.origin === base.origin &&
    !url.pathname.startsWith("/demo") &&
    !url.pathname.startsWith("/_next/") &&
    !["/favicon.ico", "/manifest.webmanifest", "/og.png"].includes(url.pathname)
  ) {
    return "unexpected non-demo application route";
  }
  return null;
}

function guardDemoNetwork(page: Page, baseURL: string) {
  const violations: string[] = [];
  const listener = (request: Request) => {
    const reason = protectedRequestReason(request, baseURL);
    if (reason) {
      violations.push(`${reason}: ${request.method()} ${request.url()}`);
    }
  };
  page.on("request", listener);

  return () => {
    page.off("request", listener);
    expect(violations, "Demo contacted a protected/private system").toEqual([]);
  };
}

async function enterDemo(page: Page) {
  await page.goto("/demo");
  await page.getByLabel("Demo access code").fill(accessCode);
  await page.getByRole("button", { name: "Enter Demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Explore Future Physicians" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
}

async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("fails closed before access and rejects an incorrect code", async ({
  page,
}) => {
  await page.goto("/demo/student");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel("Demo access code")).toBeVisible();

  await page.goto("/demo/partner");
  await expect(page).toHaveURL(/\/demo$/);

  await page.getByLabel("Demo access code").fill("incorrect-demo-code");
  await page.getByRole("button", { name: "Enter Demo" }).click();
  await expect(
    page.getByText(/That access code was not recognized/),
  ).toBeVisible();
});

test("grants the exact code with a scoped HttpOnly cookie and exposes no code", async ({
  page,
  baseURL,
}) => {
  const response = await page.goto("/demo");
  expect(response?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(response?.headers()["cache-control"]).toMatch(/no-store|no-cache/);
  await expect(page.locator("html")).toContainText(
    "Future Physicians Platform Demo",
  );
  await expect(page.locator("html")).not.toContainText(accessCode);

  const scriptSources = await page
    .locator("script[src]")
    .evaluateAll((scripts) =>
      scripts.map((script) => (script as HTMLScriptElement).src),
    );
  for (const source of scriptSources) {
    const script = await page.request.get(source);
    expect(await script.text()).not.toContain(accessCode);
  }

  await enterDemo(page);
  const cookie = (await page.context().cookies()).find(
    ({ name }) => name === demoCookieName,
  );
  expect(cookie).toBeDefined();
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.path).toBe("/demo");
  expect(cookie?.expires ?? 0).toBeGreaterThan(Date.now() / 1000 + 86_000);
  expect(cookie?.expires ?? 0).toBeLessThan(Date.now() / 1000 + 86_500);

  const base = new URL(baseURL ?? "http://127.0.0.1:3000");
  let protectedCookieHeader = "";
  await page.route(`${base.origin}/dashboard/student`, async (route) => {
    protectedCookieHeader = route.request().headers().cookie ?? "";
    await route.fulfill({
      body: "Authentication boundary reached",
      status: 200,
    });
  });
  await page.evaluate(() => fetch("/dashboard/student"));
  expect(protectedCookieHeader).not.toContain(demoCookieName);
});

test("rejects a tampered cookie and Exit Demo clears access", async ({
  page,
}) => {
  await enterDemo(page);
  const cookie = (await page.context().cookies()).find(
    ({ name }) => name === demoCookieName,
  );
  expect(cookie).toBeDefined();
  if (!cookie) return;

  await page.context().clearCookies();
  await page.context().addCookies([
    {
      ...cookie,
      value: `${cookie.value.slice(0, -1)}${cookie.value.endsWith("a") ? "b" : "a"}`,
    },
  ]);
  await page.goto("/demo/student");
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel("Demo access code")).toBeVisible();
  await page.waitForLoadState("networkidle");

  await enterDemo(page);
  await page.getByRole("link", { name: "View Student Demo" }).click();
  await page.waitForURL(/\/demo\/student$/);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Exit Demo" }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel("Demo access code")).toBeVisible();
  expect(
    (await page.context().cookies()).some(
      ({ name }) => name === demoCookieName,
    ),
  ).toBe(false);
  await page.goto("/demo/student");
  await expect(page).toHaveURL(/\/demo$/);
});

test("student demo supports discovery, application work, persistence, onboarding, and reset", async ({
  page,
  baseURL,
}) => {
  const assertSafeNetwork = guardDemoNetwork(
    page,
    baseURL ?? "http://127.0.0.1:3000",
  );
  await enterDemo(page);
  await page.getByRole("link", { name: "View Student Demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back, Alex" }),
  ).toBeVisible();
  await expect(page.getByText("6", { exact: true }).first()).toBeVisible();

  await page
    .getByRole("navigation", { name: "Demo workspace navigation" })
    .getByRole("link", { name: "Opportunities" })
    .click();
  await page.getByLabel("Search demo opportunities").fill("digital health");
  await expect(
    page.getByText("Showing 1 synthetic opportunity", { exact: true }),
  ).toBeVisible();
  const digitalHealthCard = page
    .getByRole("article")
    .filter({ hasText: "Digital Health Research Cohort" });
  await digitalHealthCard.getByRole("button", { name: "Save" }).click();
  await expect(
    digitalHealthCard.getByRole("button", { name: "Saved" }),
  ).toBeVisible();

  await page.getByLabel("Search demo opportunities").fill("");
  await page.getByLabel("Filter by category").selectOption("Research");
  await expect(
    page.getByText("Showing 2 synthetic opportunities", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filter by category").selectOption("All categories");
  await page
    .getByRole("article")
    .filter({ hasText: "Care Operations Internship" })
    .getByRole("link", { name: "View details" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Care Operations Internship" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open application workspace" }).click();

  await page.getByLabel("Complete final review").check();
  await page
    .getByLabel("Private note")
    .fill("Synthetic recruiter walkthrough note.");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.getByLabel("Application status").selectOption("Submitted");
  await page.getByRole("button", { name: "Official application" }).click();
  await expect(
    page.getByRole("dialog").getByText("No external site is opened"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return to workspace" }).click();

  await page.reload();
  await expect(page.getByLabel("Complete final review")).toBeChecked();
  await expect(page.getByLabel("Private note")).toHaveValue(
    "Synthetic recruiter walkthrough note.",
  );
  await expect(page.getByLabel("Application status")).toHaveValue("Submitted");

  await page
    .getByRole("navigation", { name: "Demo workspace navigation" })
    .getByRole("link", { name: "Onboarding preview" })
    .click();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.reload();
  await expect(page.getByText("Step 4 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.getByRole("button", { name: "Complete onboarding" }).click();
  await expect(
    page.getByRole("heading", { name: "Profile ready for matching" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset Onboarding Demo" }).click();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();

  await page.getByRole("button", { name: "Reset Demo" }).click();
  await page.goto(
    "/demo/student/applications/demo-application-internship-progress",
  );
  await expect(page.getByLabel("Complete final review")).not.toBeChecked();
  await expect(page.getByLabel("Application status")).toHaveValue(
    "In progress",
  );
  assertSafeNetwork();
});

test("partner demo supports applicant review, persistence, and reset", async ({
  page,
  baseURL,
}) => {
  const assertSafeNetwork = guardDemoNetwork(
    page,
    baseURL ?? "http://127.0.0.1:3000",
  );
  await enterDemo(page);
  await page.getByRole("link", { name: "View Partner Demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Northstar Health Collaborative" }),
  ).toBeVisible();
  await expect(page.getByText("Organization isolation:")).toBeVisible();

  await page
    .getByRole("navigation", { name: "Demo workspace navigation" })
    .getByRole("link", { name: "Applicants" })
    .click();
  await expect(
    page.getByText("Showing 8 synthetic applicants", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search synthetic applicants").fill("Maya Rivers");
  await expect(
    page.getByText("Showing 1 synthetic applicant", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Review Maya Rivers/ }).click();
  await page.getByLabel("Review status").selectOption("Interview");
  await page
    .getByLabel("Partner comment")
    .fill("Synthetic comment added during recruiter review.");
  await page.getByRole("button", { name: "Save demo comment" }).click();
  await page.reload();
  await expect(page.getByLabel("Review status")).toHaveValue("Interview");
  await expect(page.getByLabel("Partner comment")).toHaveValue(
    "Synthetic comment added during recruiter review.",
  );
  await page.getByRole("button", { name: "Reset Demo" }).click();
  await expect(page.getByLabel("Review status")).toHaveValue("New");
  await expect(page.getByLabel("Partner comment")).toHaveValue("");
  assertSafeNetwork();
});

test("demo is keyboard-usable and has no detectable WCAG A/AA axe violations", async ({
  page,
}) => {
  await enterDemo(page);
  const routes = [
    "/demo",
    "/demo/student",
    "/demo/student/opportunities",
    "/demo/student/applications/demo-application-internship-progress",
    "/demo/student/onboarding",
    "/demo/partner",
    "/demo/partner/applicants",
    "/demo/partner/applicants/demo-applicant-1",
  ];

  for (const route of routes) {
    await page.goto(route);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(violations, `${route} accessibility violations`).toEqual([]);
  }

  await page.goto("/demo/student");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus-visible")).toBeVisible();
});

test("mobile student and partner workflows fit 390 by 844 without overflow", async ({
  page,
  baseURL,
}) => {
  const assertSafeNetwork = guardDemoNetwork(
    page,
    baseURL ?? "http://127.0.0.1:3000",
  );
  await page.setViewportSize({ height: 844, width: 390 });
  await enterDemo(page);
  await assertNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "View Student Demo" }).click();
  await assertNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Open dashboard navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Opportunities" })
    .click();
  await assertNoHorizontalOverflow(page);
  await page.getByLabel("Search demo opportunities").fill("shadowing");
  await expect(
    page.getByText("Showing 1 synthetic opportunity", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Open dashboard navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Switch demo role" })
    .click();
  await page.getByRole("link", { name: "View Partner Demo" }).click();
  await assertNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Open dashboard navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Applicants" })
    .click();
  await assertNoHorizontalOverflow(page);
  await page.getByRole("link", { name: /Review Maya Rivers/ }).click();
  await page.getByLabel("Review status").selectOption("Interview");
  await assertNoHorizontalOverflow(page);
  assertSafeNetwork();
});
