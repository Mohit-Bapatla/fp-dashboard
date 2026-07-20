import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page, TestInfo } from "@playwright/test";

import { expect, test } from "./fixtures";

const mobileViewports = [
  { height: 932, width: 430 },
  { height: 844, width: 390 },
  { height: 812, width: 375 },
  { height: 800, width: 360 },
  { height: 700, width: 320 },
] as const;

const interactionViewports = mobileViewports.filter(({ width }) =>
  [390, 320].includes(width),
);

const affectedRoutes = ["/", "/students", "/partners"] as const;

const expectedSocialLinks = [
  {
    href: "https://www.instagram.com/futurephysiciansmedia/",
    label: "Follow Future Physicians on Instagram",
  },
  {
    href: "https://www.tiktok.com/@futurephysicians.org",
    label: "Follow Future Physicians on TikTok",
  },
  {
    href: "https://www.linkedin.com/company/104746121/",
    label: "Follow Future Physicians on LinkedIn",
  },
] as const;

const expectedFooterIconLinks = [
  ...expectedSocialLinks,
  {
    href: "https://futurephysicians.substack.com/",
    label: "Future Physicians newsletter on Substack",
  },
] as const;

const accessibilityTags = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

type VisibleBox = {
  height: number;
  width: number;
  x: number;
  y: number;
};

async function waitForStableLayout(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

async function visibleBoxes(locator: Locator): Promise<VisibleBox[]> {
  return locator.evaluateAll((elements) =>
    elements.flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const rendered =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0;

      return rendered
        ? [
            {
              height: rect.height,
              width: rect.width,
              x: rect.x,
              y: rect.y,
            },
          ]
        : [];
    }),
  );
}

async function expectHorizontallyInViewport(
  page: Page,
  locator: Locator,
  label: string,
) {
  const [boxes, clientWidth] = await Promise.all([
    visibleBoxes(locator),
    page.evaluate(() => document.documentElement.clientWidth),
  ]);

  expect(boxes.length, `${label} should have a visible box`).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(
      box.x,
      `${label} extended past the left viewport edge`,
    ).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `${label} extended past the right viewport edge`,
    ).toBeLessThanOrEqual(clientWidth + 1);
  }
}

async function expectTouchTargets(locator: Locator, label: string) {
  const boxes = await visibleBoxes(locator);
  expect(boxes.length, `${label} should have a visible box`).toBeGreaterThan(0);

  for (const box of boxes) {
    expect(
      box.width,
      `${label} should be at least 44px wide`,
    ).toBeGreaterThanOrEqual(43.5);
    expect(
      box.height,
      `${label} should be at least 44px tall`,
    ).toBeGreaterThanOrEqual(43.5);
  }
}

async function expectOwnContentFits(locator: Locator, label: string) {
  const measurements = await locator.evaluateAll((elements) =>
    elements.flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const rendered =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0;

      return rendered
        ? [
            {
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
            },
          ]
        : [];
    }),
  );

  expect(
    measurements.length,
    `${label} should have a visible content box`,
  ).toBeGreaterThan(0);
  for (const measurement of measurements) {
    expect(
      measurement.scrollWidth,
      `${label} content should not be horizontally clipped`,
    ).toBeLessThanOrEqual(measurement.clientWidth + 1);
  }
}

async function assertNoPageOverflow(
  page: Page,
  label: string,
  testInfo: TestInfo,
) {
  const layout = await page.evaluate(() => {
    const clientWidth = document.documentElement.clientWidth;
    const htmlOverflowX = getComputedStyle(document.documentElement).overflowX;
    const bodyOverflowX = getComputedStyle(document.body).overflowX;
    const blockedOverflowValues = new Set(["clip", "hidden"]);
    const offenders = [...document.body.querySelectorAll<HTMLElement>("*")]
      .flatMap((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const rendered =
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0;
        const outside = rect.left < -1 || rect.right > clientWidth + 1;

        if (!rendered || !outside) return [];

        return [
          {
            ariaLabel: element.getAttribute("aria-label"),
            className: element.className,
            left: rect.left,
            outerHTML: element.outerHTML.slice(0, 240),
            right: rect.right,
            tagName: element.tagName.toLowerCase(),
          },
        ];
      })
      .slice(0, 30);

    return {
      bodyOverflowX,
      clientWidth,
      globalOverflowClipping:
        blockedOverflowValues.has(htmlOverflowX) ||
        blockedOverflowValues.has(bodyOverflowX),
      htmlOverflowX,
      offenders,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

  if (
    layout.globalOverflowClipping ||
    layout.scrollWidth > layout.clientWidth + 1
  ) {
    await testInfo.attach("mobile-overflow-diagnostics", {
      body: Buffer.from(JSON.stringify({ label, ...layout }, null, 2)),
      contentType: "application/json",
    });
  }

  expect(
    layout.htmlOverflowX,
    `${label} must not mask overflow on html`,
  ).not.toMatch(/^(?:clip|hidden)$/);
  expect(
    layout.bodyOverflowX,
    `${label} must not mask overflow on body`,
  ).not.toMatch(/^(?:clip|hidden)$/);
  expect(
    layout.scrollWidth,
    `${label} overflowed: scrollWidth=${layout.scrollWidth}, clientWidth=${layout.clientWidth}`,
  ).toBeLessThanOrEqual(layout.clientWidth + 1);
}

function rowSizes(boxes: VisibleBox[]) {
  const rows: Array<{ count: number; top: number }> = [];

  for (const box of [...boxes].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find(({ top }) => Math.abs(top - box.y) <= 2);
    if (row) {
      row.count += 1;
    } else {
      rows.push({ count: 1, top: box.y });
    }
  }

  return rows.map(({ count }) => count);
}

async function expectTwoByTwoControls(
  page: Page,
  controls: Locator,
  label: string,
) {
  const boxes = await visibleBoxes(controls);
  expect(boxes, `${label} should use a 2x2 layout`).toHaveLength(4);
  expect(rowSizes(boxes), `${label} should use two rows of two`).toEqual([
    2, 2,
  ]);
  await expectHorizontallyInViewport(page, controls, label);
  await expectTouchTargets(controls, label);
}

async function expectSingleBoundedPreviewPanel(
  preview: Locator,
  label: string,
) {
  const panels = preview.locator("[data-preview-panel]");
  const [boxes, previewBoxes] = await Promise.all([
    visibleBoxes(panels),
    visibleBoxes(preview),
  ]);

  expect(boxes, `${label} should render one active preview panel`).toHaveLength(
    1,
  );
  expect(previewBoxes, `${label} should render one outer preview`).toHaveLength(
    1,
  );
  expect(
    boxes[0]?.height ?? Number.POSITIVE_INFINITY,
    `${label} active panel should stay at or below 720px`,
  ).toBeLessThanOrEqual(721);
  expect(
    previewBoxes[0]?.height ?? Number.POSITIVE_INFINITY,
    `${label} complete preview should stay at or below 720px`,
  ).toBeLessThanOrEqual(721);
}

async function expectPreviewGeometry(
  page: Page,
  route: "/students" | "/partners",
) {
  const isStudent = route === "/students";
  const preview = page.getByRole("region", {
    name: isStudent
      ? "Interactive student workspace preview"
      : "Interactive partner workspace preview",
  });
  const controls = preview
    .getByRole("group", {
      name: isStudent ? "Student preview views" : "Partner preview views",
    })
    .getByRole("button");

  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute("data-active-view", /\S/);
  await expectHorizontallyInViewport(page, preview, `${route} preview`);
  await expectTwoByTwoControls(page, controls, `${route} preview controls`);
  await expectSingleBoundedPreviewPanel(preview, `${route} preview`);
}

async function expectHomepageGeometry(
  page: Page,
  viewport: (typeof mobileViewports)[number],
) {
  const heading = page.getByRole("heading", {
    level: 1,
    name: "Build your path into healthcare.",
  });
  const intro = page.getByText(
    "Discover verified healthcare opportunities, save what fits, and keep your next steps organized in one place.",
    { exact: true },
  );
  const createProfile = page
    .getByRole("link", { name: /Create Free Profile/ })
    .first();
  const explore = page
    .getByRole("link", { name: "Explore Opportunities" })
    .first();
  const trustLine = page
    .locator("ul")
    .filter({ hasText: "Free for students" })
    .filter({ hasText: "Verified listings" })
    .filter({ hasText: "One organized profile" })
    .first();
  const dashboard = page.locator("[data-mobile-dashboard]");
  const explorer = page.locator("[data-mobile-opportunity-explorer]");
  const walkthrough = page.getByRole("region", {
    name: "Guided opportunity walkthrough",
  });
  const walkthroughHeader = walkthrough.locator(
    "[data-mobile-walkthrough-header]",
  );
  const walkthroughPanel = walkthrough.locator(
    "[data-mobile-walkthrough-panel]",
  );
  const darkSectionHeading = page.getByRole("heading", {
    name: "Find opportunities that actually fit.",
  });

  for (const [locator, label] of [
    [heading, "hero heading"],
    [intro, "hero introduction"],
    [createProfile, "Create Free Profile CTA"],
    [explore, "Explore Opportunities CTA"],
    [trustLine, "hero trust line"],
    [dashboard, "mobile dashboard"],
    [darkSectionHeading, "opportunity section heading"],
    [explorer, "mobile opportunity explorer"],
    [walkthroughHeader, "mobile walkthrough header"],
    [walkthroughPanel, "mobile walkthrough panel"],
  ] as const) {
    await expectHorizontallyInViewport(page, locator, label);
  }

  for (const [locator, label] of [
    [heading, "hero heading"],
    [intro, "hero introduction"],
    [createProfile, "Create Free Profile CTA"],
    [explore, "Explore Opportunities CTA"],
    [trustLine, "hero trust line"],
    [darkSectionHeading, "opportunity section heading"],
  ] as const) {
    await expectOwnContentFits(locator, label);
  }

  await expectTouchTargets(createProfile, "Create Free Profile CTA");
  await expectTouchTargets(explore, "Explore Opportunities CTA");

  for (const [cta, label] of [
    [createProfile, "Create Free Profile CTA"],
    [explore, "Explore Opportunities CTA"],
  ] as const) {
    const box = (await visibleBoxes(cta))[0];
    expect(
      box?.width ?? 0,
      `${label} should span the mobile content width`,
    ).toBeGreaterThanOrEqual(viewport.width - 49);
  }

  const dashboardBox = (await visibleBoxes(dashboard))[0];
  expect(
    dashboardBox?.height ?? Number.POSITIVE_INFINITY,
    "mobile dashboard should remain compact",
  ).toBeLessThanOrEqual(721);

  const search = explorer.getByRole("searchbox", {
    name: "Search illustrative opportunities",
  });
  const searchFontSize = await search.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(
    searchFontSize,
    "mobile search should not trigger iOS input zoom",
  ).toBeGreaterThanOrEqual(16);

  await expect(
    walkthrough.locator("[data-desktop-walkthrough-rail]"),
  ).toBeHidden();
  const [headerBox, panelBox, walkthroughBox] = await Promise.all([
    visibleBoxes(walkthroughHeader).then((boxes) => boxes[0]),
    visibleBoxes(walkthroughPanel).then((boxes) => boxes[0]),
    visibleBoxes(walkthrough).then((boxes) => boxes[0]),
  ]);
  expect(
    (panelBox?.y ?? 0) - ((headerBox?.y ?? 0) + (headerBox?.height ?? 0)),
    "walkthrough animation should sit immediately below its mobile header",
  ).toBeLessThanOrEqual(33);
  expect(
    walkthroughBox?.height ?? Number.POSITIVE_INFINITY,
    "walkthrough should fit within roughly one and a half phone screens",
  ).toBeLessThanOrEqual(viewport.height * 1.5 + 1);

  if (viewport.width === 320) {
    const trustLineCount = await trustLine.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return new Set(
        [...range.getClientRects()]
          .filter((rect) => rect.width > 0 && rect.height > 0)
          .map((rect) => Math.round(rect.top)),
      ).size;
    });
    expect(
      trustLineCount,
      "trust content should wrap at 320px",
    ).toBeGreaterThan(1);
  }
}

for (const route of affectedRoutes) {
  for (const viewport of mobileViewports) {
    test(`${route} fits at ${viewport.width}px without masked page overflow`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.ok(), `${route} should load successfully`).toBe(true);
      await waitForStableLayout(page);

      if (route === "/") {
        await expectHomepageGeometry(page, viewport);
      } else {
        await expectPreviewGeometry(page, route);
      }

      await assertNoPageOverflow(
        page,
        `${route} at ${viewport.width}x${viewport.height}`,
        testInfo,
      );
    });
  }
}

for (const viewport of interactionViewports) {
  test(`mobile dashboard states remain bounded at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForStableLayout(page);

    const preview = page.locator(
      'figure[aria-label="Interactive student dashboard preview"]',
    );
    const dashboard = preview.locator("[data-mobile-dashboard]");
    const tabs = ["Overview", "Discover", "Saved", "Applications"] as const;
    const heights: number[] = [];

    await expect(dashboard).toBeVisible();
    await preview.scrollIntoViewIfNeeded();
    for (const tab of tabs) {
      const control = dashboard.getByRole("button", { name: tab, exact: true });
      await expect(control).toBeVisible();
      await expectTouchTargets(control, `${tab} dashboard control`);
      await expectHorizontallyInViewport(
        page,
        control,
        `${tab} dashboard control`,
      );
      await control.click();
      await expect
        .poll(async () =>
          (await preview.getAttribute("data-active-tab"))?.toLowerCase(),
        )
        .toBe(tab.toLowerCase());
      heights.push((await visibleBoxes(dashboard))[0]?.height ?? 0);
      await assertNoPageOverflow(
        page,
        `dashboard ${tab} at ${viewport.width}px`,
        testInfo,
      );
    }

    expect(
      Math.max(...heights),
      "dashboard states should remain compact",
    ).toBeLessThanOrEqual(721);
    expect(
      Math.max(...heights) - Math.min(...heights),
      "dashboard state changes should not cause a large height jump",
    ).toBeLessThanOrEqual(101);
  });

  test(`mobile opportunity explorer remains usable at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForStableLayout(page);

    const explorer = page.locator("[data-mobile-opportunity-explorer]");
    const categorySelect = explorer.getByLabel("Opportunity type");
    const search = explorer.getByRole("searchbox", {
      name: "Search illustrative opportunities",
    });
    const filters = explorer.getByRole("group", {
      name: "Opportunity preview filters",
    });

    await explorer.scrollIntoViewIfNeeded();
    await expect(explorer.locator("aside:visible")).toHaveCount(0);
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption("Shadowing");
    await search.fill("clinic physician");
    await expect(explorer).toHaveAttribute(
      "data-opportunity-result-count",
      "1",
    );
    await explorer
      .getByRole("button", { name: "Clear opportunity search" })
      .click();
    await categorySelect.selectOption("All");

    for (const filterName of [
      "Remote option",
      "High school",
      "Verified only",
    ]) {
      await filters.getByRole("button", { name: filterName }).click();
    }

    const details = explorer.locator(
      'button[aria-expanded][aria-controls$="-details"]',
    );
    const save = explorer.getByRole("button", { name: "Save", exact: true });
    await expectTouchTargets(categorySelect, "opportunity category selector");
    await expectTouchTargets(details, "opportunity details control");
    await expectTouchTargets(save, "opportunity save control");
    await expectHorizontallyInViewport(
      page,
      categorySelect,
      "opportunity category selector",
    );
    await expectHorizontallyInViewport(page, search, "opportunity search");
    await expectHorizontallyInViewport(
      page,
      explorer.locator("article").first(),
      "opportunity result card",
    );

    if (viewport.width === 320) {
      expect(
        rowSizes(await visibleBoxes(filters.getByRole("button"))).length,
        "opportunity filters should wrap at 320px",
      ).toBeGreaterThan(1);
    }

    await details.click();
    await expect(details).toHaveAttribute("aria-expanded", "true");
    const detailsId = await details.getAttribute("aria-controls");
    expect(detailsId).toBeTruthy();
    await expect(
      explorer.locator(`[id=${JSON.stringify(detailsId)}]`),
    ).toBeVisible();
    await assertNoPageOverflow(
      page,
      `expanded opportunity details at ${viewport.width}px`,
      testInfo,
    );

    await save.click();
    await expect(
      explorer.getByRole("button", { name: "Saved", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await assertNoPageOverflow(
      page,
      `saved opportunity state at ${viewport.width}px`,
      testInfo,
    );
  });

  test(`mobile walkthrough keeps step context with its animation at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(45_000);
    await page.clock.install();
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const walkthrough = page.getByRole("region", {
      name: "Guided opportunity walkthrough",
    });
    const header = walkthrough.locator("[data-mobile-walkthrough-header]");
    const panel = walkthrough.locator("[data-mobile-walkthrough-panel]");
    const pause = walkthrough.getByRole("button", { name: "Pause animation" });

    await walkthrough.scrollIntoViewIfNeeded();
    await expect(walkthrough).toHaveAttribute(
      "data-walkthrough-status",
      "running",
    );
    await expect(header).toBeVisible();
    await expect(panel).toBeVisible();
    await expect(
      walkthrough.locator("[data-desktop-walkthrough-rail]"),
    ).toBeHidden();
    await expectTouchTargets(pause, "walkthrough pause control");
    await expectHorizontallyInViewport(
      page,
      pause,
      "walkthrough pause control",
    );

    const [headerBox, panelBox, walkthroughBox] = await Promise.all([
      visibleBoxes(header).then((boxes) => boxes[0]),
      visibleBoxes(panel).then((boxes) => boxes[0]),
      visibleBoxes(walkthrough).then((boxes) => boxes[0]),
    ]);
    expect(
      (panelBox?.y ?? 0) - ((headerBox?.y ?? 0) + (headerBox?.height ?? 0)),
    ).toBeLessThanOrEqual(33);
    expect(
      walkthroughBox?.height ?? Number.POSITIVE_INFINITY,
    ).toBeLessThanOrEqual(viewport.height * 1.5 + 1);

    const states = [await walkthrough.getAttribute("data-walkthrough-step")];
    for (let index = 0; index < 5; index += 1) {
      await page.clock.fastForward(3_000);
      states.push(await walkthrough.getAttribute("data-walkthrough-step"));
      await assertNoPageOverflow(
        page,
        `walkthrough state ${index + 1} at ${viewport.width}px`,
        testInfo,
      );
    }
    expect(
      new Set(states.filter(Boolean)).size,
      "walkthrough should expose all five states",
    ).toBe(5);

    await pause.click();
    await expect(walkthrough).toHaveAttribute(
      "data-walkthrough-status",
      "paused",
    );
    const pausedStep = await walkthrough.getAttribute("data-walkthrough-step");
    await page.clock.fastForward(6_000);
    await expect(walkthrough).toHaveAttribute(
      "data-walkthrough-step",
      String(pausedStep),
    );
    await walkthrough.getByRole("button", { name: "Resume animation" }).click();
    await expect(walkthrough).toHaveAttribute(
      "data-walkthrough-status",
      "running",
    );
  });
}

for (const route of ["/students", "/partners"] as const) {
  for (const viewport of interactionViewports) {
    test(`${route} mobile preview switches one bounded state at a time at ${viewport.width}px`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize(viewport);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await waitForStableLayout(page);

      const isStudent = route === "/students";
      const preview = page.getByRole("region", {
        name: isStudent
          ? "Interactive student workspace preview"
          : "Interactive partner workspace preview",
      });
      const group = preview.getByRole("group", {
        name: isStudent ? "Student preview views" : "Partner preview views",
      });
      const views = isStudent
        ? (["Discover", "Saved", "Applications", "Profile"] as const)
        : (["Overview", "Opportunities", "Applicants", "Placements"] as const);

      await preview.scrollIntoViewIfNeeded();
      await expectTwoByTwoControls(
        page,
        group.getByRole("button"),
        `${route} preview controls`,
      );

      for (const view of views) {
        await group.getByRole("button", { name: view, exact: true }).click();
        await expect
          .poll(async () =>
            (await preview.getAttribute("data-active-view"))?.toLowerCase(),
          )
          .toBe(view.toLowerCase());
        await expectSingleBoundedPreviewPanel(
          preview,
          `${route} ${view} preview`,
        );
        await assertNoPageOverflow(
          page,
          `${route} ${view} at ${viewport.width}px`,
          testInfo,
        );
      }
    });
  }
}

for (const viewport of mobileViewports.filter(({ width }) =>
  [430, 320].includes(width),
)) {
  test(`footer exposes icon-only social links at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const footer = page.getByRole("contentinfo");
    const socialLinks = footer.locator("[data-social-link]");
    await expect(socialLinks).toHaveCount(expectedFooterIconLinks.length);
    for (const { href, label } of expectedFooterIconLinks) {
      const exactLink = footer.locator(
        `[data-social-link][aria-label=${JSON.stringify(label)}]`,
      );

      await expect(exactLink).toHaveCount(1);
      await expect(exactLink).toHaveAttribute("href", href);
      await expect(exactLink).toHaveAttribute("target", "_blank");
      await expect(exactLink).toHaveAttribute("rel", /\bnoopener\b/);
      await expect(exactLink).toHaveAttribute("rel", /\bnoreferrer\b/);
      expect(
        await exactLink.evaluate((element) =>
          (element as HTMLElement).innerText.trim(),
        ),
        `${label} should not expose a visible text label`,
      ).toBe("");
      const icon = exactLink.locator("svg");
      await expect(icon).toHaveCount(1);
      const iconBox = (await visibleBoxes(icon))[0];
      expect(
        iconBox?.width ?? 0,
        `${label} icon should be approximately 20-24px`,
      ).toBeGreaterThanOrEqual(19);
      expect(
        iconBox?.width ?? Number.POSITIVE_INFINITY,
        `${label} icon should be approximately 20-24px`,
      ).toBeLessThanOrEqual(25);
      expect(
        iconBox?.height ?? 0,
        `${label} icon should be approximately 20-24px`,
      ).toBeGreaterThanOrEqual(19);
      expect(
        iconBox?.height ?? Number.POSITIVE_INFINITY,
        `${label} icon should be approximately 20-24px`,
      ).toBeLessThanOrEqual(25);
      await expectTouchTargets(exactLink, label);
      await expectHorizontallyInViewport(page, exactLink, label);
      await exactLink.focus();
      await expect(exactLink).toBeFocused();
    }

    await assertNoPageOverflow(
      page,
      `footer social links at ${viewport.width}px`,
      testInfo,
    );
  });
}

test("contact page exposes only accessible social icons", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/contact", { waitUntil: "domcontentloaded" });

  const group = page.getByRole("group", {
    name: "Future Physicians public social channels",
  });
  const socialLinks = group.locator("[data-social-link]");
  await expect(socialLinks).toHaveCount(3);

  for (const { href, label } of expectedSocialLinks) {
    const exactLink = group.locator(
      `[data-social-link][aria-label=${JSON.stringify(label)}]`,
    );
    await expect(exactLink).toHaveAttribute("href", href);
    await expect(exactLink).toHaveAttribute("target", "_blank");
    await expect(exactLink).toHaveAttribute("rel", /\bnoopener\b/);
    await expect(exactLink).toHaveAttribute("rel", /\bnoreferrer\b/);
    expect(
      await exactLink.evaluate((element) => element.textContent?.trim()),
    ).toBe("");
    await expect(exactLink.locator("svg")).toHaveCount(1);
    await expectTouchTargets(exactLink, label);
    await expectHorizontallyInViewport(page, exactLink, label);
  }

  await assertNoPageOverflow(page, "contact social icon group", testInfo);
});

test("affected routes have no detectable Axe violations in active mobile states", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ height: 844, width: 390 });

  for (const route of affectedRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await waitForStableLayout(page);

    if (route === "/") {
      const dashboard = page.locator("[data-mobile-dashboard]");
      await dashboard
        .getByRole("button", { name: "Saved", exact: true })
        .click();
      const explorer = page.locator("[data-mobile-opportunity-explorer]");
      await explorer
        .locator('button[aria-expanded][aria-controls$="-details"]')
        .click();
    } else {
      const isStudent = route === "/students";
      const preview = page.getByRole("region", {
        name: isStudent
          ? "Interactive student workspace preview"
          : "Interactive partner workspace preview",
      });
      await preview
        .getByRole("group", {
          name: isStudent ? "Student preview views" : "Partner preview views",
        })
        .getByRole("button", {
          name: isStudent ? "Profile" : "Applicants",
          exact: true,
        })
        .click();
    }

    const { violations } = await new AxeBuilder({ page })
      .withTags([...accessibilityTags])
      .analyze();
    const summary = violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`,
      )
      .join("\n");

    expect.soft(violations, `${route}\n${summary}`).toEqual([]);
    await assertNoPageOverflow(page, `${route} active Axe state`, testInfo);
  }
});
