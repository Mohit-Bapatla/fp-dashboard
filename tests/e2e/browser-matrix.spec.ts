import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const mobileViewports = [
  { height: 700, width: 320 },
  { height: 667, width: 375 },
  { height: 844, width: 390 },
  { height: 932, width: 430 },
] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1,
  );
}

for (const viewport of mobileViewports) {
  test(`homepage CTA remains visible and bounded at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const heading = page.getByRole("heading", {
      level: 1,
      name: "Build your path into healthcare.",
    });
    const primaryCta = page
      .getByRole("link", { name: "Create Free Profile" })
      .first();

    await expect(heading).toBeVisible();
    await expect(primaryCta).toBeVisible();
    const ctaBox = await primaryCta.boundingBox();
    expect(ctaBox).not.toBeNull();
    expect(
      (ctaBox?.y ?? Number.POSITIVE_INFINITY) + (ctaBox?.height ?? 0),
    ).toBeLessThanOrEqual(viewport.height + 1);
    await expectNoHorizontalOverflow(page);
  });
}

test("homepage remains bounded in mobile landscape orientation", async ({
  page,
}) => {
  await page.setViewportSize({ height: 390, width: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build your path into healthcare.",
    }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("anonymous opportunity navigation survives back and forward history", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");
  await page
    .getByRole("link", { name: "Explore Opportunities" })
    .first()
    .click();

  await expect(page).toHaveURL(/\/opportunities$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Find your next healthcare experience.",
    }),
  ).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build your path into healthcare.",
    }),
  ).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/\/opportunities$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Find your next healthcare experience.",
    }),
  ).toBeVisible();
});

test("opportunity filters stay synchronized with browser history", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/opportunities?q=history-one");

  const filters = page.getByText("Search and filters", { exact: true }).first();
  await filters.click();

  const mobileFilterPanel = page.locator("details");
  const search = mobileFilterPanel.getByLabel("Search opportunities");
  await expect(search).toHaveValue("history-one");

  await search.fill("history-two");
  await mobileFilterPanel
    .getByRole("button", { name: "Apply filters" })
    .click();
  await expect(page).toHaveURL(/q=history-two/);
  await expect(search).toHaveValue("history-two");

  await page.goBack();
  await expect(page).toHaveURL(/q=history-one/);
  await expect(search).toHaveValue("history-one");
});
