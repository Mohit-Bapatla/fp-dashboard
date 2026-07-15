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
  "/privacy",
  "/terms",
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
