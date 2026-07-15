import { expect, test } from "@playwright/test";

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

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "For Students" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeHidden();
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
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }

  for (const url of ["/support", "/opportunities"]) {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(url, { waitUntil: "domcontentloaded" });
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
  const response = await page.goto("/opportunities/not-a-real-opportunity");

  expect(response?.status()).toBe(404);
});
