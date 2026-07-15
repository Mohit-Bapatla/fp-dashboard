import { expect, test } from "./fixtures";

const publicRoutes = [
  "/opportunities",
  "/students",
  "/partners",
  "/events",
  "/events/global-healthcare-seminar-2025",
  "/chapters",
  "/about",
  "/impact",
  "/support",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
] as const;

test("homepage explains the product and exposes the public navigation", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Future Physicians/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build your path into healthcare.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Create Free Profile/ }).first(),
  ).toHaveAttribute("href", /\/sign-up\?redirect_url=/);
});

test("mobile navigation is keyboard-accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "For Students" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close navigation menu" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          document.activeElement?.closest('[role="dialog"]') ??
          document.activeElement?.closest("[data-popup-open]"),
        ),
      ),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("desktop Explore disclosure exposes state and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Explore" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: /Opportunities\s+Browse verified/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("key public pages avoid horizontal overflow at required breakpoints", async ({
  page,
}) => {
  test.setTimeout(90_000);

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Build your path into healthcare.",
      }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }

  for (const url of publicRoutes) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }
});

test("support metadata includes canonical social sharing images", async ({
  page,
}) => {
  await page.goto("/support");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://futurephysicians.org/support",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://futurephysicians.org/og.png",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    "https://futurephysicians.org/og.png",
  );
});

test("support page includes the approved grants and partnership email", async ({
  page,
}) => {
  await page.goto("/support");

  for (const value of ["$15,000", "$1,000", "$720"]) {
    await expect(page.getByText(value, { exact: true })).toBeVisible();
  }
  await expect(
    page.getByText("Community Hospital of Long Beach Foundation", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("outreach@futurephysicians.org", { exact: true }),
  ).toBeVisible();
});

test("seminar and chapter pages keep their approved destinations", async ({
  page,
}) => {
  await page.goto("/events/global-healthcare-seminar-2025");
  await expect(
    page.getByText("September 27, 2025", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Watch/ }).first(),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=6U2EA3O12YY");

  await page.goto("/chapters");
  await expect(
    page.getByRole("link", { name: /Start.*chapter/i }).first(),
  ).toHaveAttribute(
    "href",
    "https://docs.google.com/forms/d/e/1FAIpQLSeT-FOoYXGwLMgDIqr-kTCPGceFSnkgn_FAyp3C_9M9eo6y3g/viewform",
  );
});

test("legacy support route redirects permanently", async ({ page }) => {
  const response = await page.request.get("/grants-sponsors", {
    maxRedirects: 0,
  });

  expect([307, 308]).toContain(response.status());
  expect(response.headers().location).toBe("/support#grants");

  const donateResponse = await page.request.get("/donate", {
    maxRedirects: 0,
  });
  expect([307, 308]).toContain(donateResponse.status());
  expect(donateResponse.headers().location).toBe("/support#donate");

  await page.goto("/support#donate");
  await expect(page.locator("#donate")).toBeVisible();
});

test("sign-in page loads", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page).toHaveURL(/sign-in/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});

test("signed-out dashboard redirects to sign-in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/sign-in/);
});

test("unknown public opportunity returns not found", async ({ page }) => {
  const response = await page.request.get(
    "/opportunities/not-a-real-opportunity",
    { maxRedirects: 0 },
  );

  expect(response.status()).toBe(404);
});

test("opportunity directory completes its database query", async ({ page }) => {
  const response = await page.goto("/opportunities");

  expect(
    response,
    "The opportunity directory must return a document",
  ).not.toBeNull();
  expect(response?.status()).toBeLessThan(500);
  const resultHeading = page.getByRole("heading", {
    level: 2,
    name: /\d+ verified opportunit(?:y|ies)/,
  });
  await expect(
    resultHeading,
    "A broken opportunity query must not be mistaken for a valid empty directory",
  ).toBeVisible();
  if ((await resultHeading.textContent())?.trim().startsWith("0 ")) {
    await expect(
      page.getByRole("heading", {
        name: "No public listings are open right now",
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Reset filters" })).toHaveCount(
      0,
    );
  }
  await expect(
    page.getByRole("heading", {
      name: "We couldn't load the opportunity directory",
    }),
  ).toHaveCount(0);
});
