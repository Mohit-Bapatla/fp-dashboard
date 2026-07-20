import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./fixtures";

const publicRoutes = [
  "/",
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
  "/accessibility",
  "/data-deletion",
  "/privacy",
  "/terms",
  ...(process.env.E2E_CLERK_AVAILABLE === "true"
    ? (["/sign-in", "/sign-up"] as const)
    : []),
] as const;

test("public routes have no detectable WCAG A/AA axe violations", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of publicRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);

    const axe = new AxeBuilder({ page }).withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22aa",
    ]);

    if (route === "/events/global-healthcare-seminar-2025") {
      const youtubeEmbed = page.locator(
        'iframe[src*="youtube-nocookie.com/embed/"]',
      );
      await expect(youtubeEmbed).toHaveAttribute("title", /\S/);
      // YouTube currently injects an aria-label on a roleless div inside its
      // cross-origin player. Verify our iframe title above, then exclude only
      // that vendor-owned subtree instead of suppressing the ARIA rule.
      axe.exclude('iframe[src*="youtube-nocookie.com/embed/"]');
    }

    const { violations } = await axe.analyze();
    const summary = violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`,
      )
      .join("\n");

    expect.soft(violations, `${route}\n${summary}`).toEqual([]);
  }
});

test("opportunity search has a specific accessible name and announces results", async ({
  page,
}) => {
  await page.goto("/opportunities", { waitUntil: "domcontentloaded" });

  const unavailableHeading = page.getByRole("heading", {
    level: 1,
    name: "Opportunities are temporarily unavailable.",
  });
  const search = page.getByRole("searchbox", {
    name: "Search opportunities",
    exact: true,
  });
  await expect(search.first().or(unavailableHeading)).toBeVisible();
  if ((await search.count()) === 0)
    test.skip(true, "Directory data is unavailable.");

  await expect(search.first()).toHaveAccessibleDescription(
    "Search by title, host organization, or keyword.",
  );
  await expect(page.getByRole("status").first()).toContainText(/opportunit/i);
});

test("opportunity card details keep valid definition-list semantics", async ({
  page,
}) => {
  await page.goto("/opportunities", { waitUntil: "domcontentloaded" });

  const detailLists = page.locator("article dl");
  const unavailableHeading = page.getByRole("heading", {
    level: 1,
    name: "Opportunities are temporarily unavailable.",
  });
  await expect(detailLists.first().or(unavailableHeading)).toBeVisible();
  const detailListCount = await detailLists.count();
  if (detailListCount === 0) {
    await expect(unavailableHeading).toBeVisible();
    test.skip(
      true,
      "Opportunity-card semantics are database-gated while the deployed schema lacks Opportunity.",
    );
  }

  const { violations } = await new AxeBuilder({ page })
    .include("article dl")
    .withRules(["definition-list", "dlitem"])
    .analyze();

  expect(violations).toEqual([]);
});
