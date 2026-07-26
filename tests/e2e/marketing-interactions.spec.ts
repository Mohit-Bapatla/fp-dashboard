import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

const faqQuestion = "Is Future Physicians free for students?";
const walkthroughStepLabels = [
  "Select a type",
  "Open a verified opportunity",
  "Review eligibility",
  "Save or apply",
  "Track the next step",
] as const;
const homepageViewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
] as const;

function isClerkBootstrapRequest(url: URL) {
  return (
    url.hostname.endsWith(".clerk.accounts.dev") &&
    ["/v1/dev_browser", "/v1/environment"].includes(url.pathname)
  );
}

function trackUnexpectedMutationRequests(page: Page) {
  const mutationRequests: string[] = [];

  page.on("request", (request) => {
    const url = new URL(request.url());

    if (request.method() !== "GET" && !isClerkBootstrapRequest(url)) {
      mutationRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  return mutationRequests;
}

test("FAQ accordion exposes state, keyboard operation, and answer transition", async ({
  page,
}) => {
  await page.goto("/faq");

  const trigger = page.getByRole("button", { name: faqQuestion });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toBeFocused();

  const panelId = await trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  const panel = page.locator(`[id=${JSON.stringify(panelId)}]`);
  await expect(panel).toBeVisible();

  const transition = await panel.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      duration: styles.transitionDuration,
      property: styles.transitionProperty,
    };
  });
  expect(transition.property).toContain("height");
  expect(transition.property).toContain("opacity");
  expect(transition.duration).toContain("0.24s");

  await page.keyboard.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("FAQ content is immediately readable with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/faq");

  const trigger = page.getByRole("button", { name: faqQuestion });
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");

  const panelId = await trigger.getAttribute("aria-controls");
  expect(panelId).toBeTruthy();
  const panel = page.locator(`[id=${JSON.stringify(panelId)}]`);
  await expect(panel).toBeVisible();
  await expect(
    panel.getByText(
      /Creating a student profile and using the FP Dashboard is free/i,
    ),
  ).toBeVisible();

  const maximumTransitionMs = await panel.evaluate((element) =>
    getComputedStyle(element)
      .transitionDuration.split(",")
      .map((duration) => duration.trim())
      .map((duration) =>
        duration.endsWith("ms")
          ? Number.parseFloat(duration)
          : Number.parseFloat(duration) * 1000,
      )
      .reduce((maximum, duration) => Math.max(maximum, duration), 0),
  );
  expect(maximumTransitionMs).toBeLessThanOrEqual(1);
});

test("homepage opportunity explorer searches, filters, opens details, and saves only in local state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const mutationRequests = trackUnexpectedMutationRequests(page);

  const explorer = page.getByRole("region", {
    name: "Interactive opportunity explorer demo",
  });
  await explorer.scrollIntoViewIfNeeded();
  await expect(explorer).toHaveAttribute(
    "data-opportunity-category",
    "research",
  );
  await expect(explorer).toHaveAttribute("data-opportunity-result-count", "1");

  const categories = explorer.getByRole("group", {
    name: "Opportunity categories",
  });
  const shadowing = categories.getByRole("button", { name: "Shadowing" });
  await shadowing.click();
  await expect(shadowing).toHaveAttribute("aria-pressed", "true");
  await expect(explorer).toHaveAttribute(
    "data-opportunity-category",
    "shadowing",
  );

  const search = explorer.getByRole("searchbox", {
    name: "Search illustrative opportunities",
  });
  await search.fill("clinic physician");
  await expect(explorer).toHaveAttribute("data-opportunity-result-count", "1");
  await expect(
    explorer.getByText("Prepare for a supervised shadowing experience"),
  ).toBeVisible();
  await explorer
    .getByRole("button", { name: "Clear opportunity search" })
    .click();

  await categories.getByRole("button", { name: "All opportunities" }).click();
  const filters = explorer.getByRole("group", {
    name: "Opportunity preview filters",
  });
  for (const filterName of ["Remote option", "High school", "Verified only"]) {
    const filter = filters.getByRole("button", { name: filterName });
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "true");
  }
  await expect(explorer).toHaveAttribute("data-opportunity-result-count", "1");
  await expect(
    explorer.getByText("Explore a guided research experience"),
  ).toBeVisible();

  await search.fill("biology");
  await expect(explorer).toHaveAttribute("data-opportunity-result-count", "1");

  const details = explorer.locator(
    'button[aria-expanded][aria-controls$="-details"]',
  );
  await expect(details).toHaveText(/View details/);
  await details.click();
  await expect(details).toHaveAttribute("aria-expanded", "true");
  await expect(details).toHaveText(/Hide details/);
  await expect(explorer.getByText("Illustrative detail view")).toBeVisible();

  const save = explorer.getByRole("button", { name: "Save", exact: true });
  await save.click();
  const saved = explorer.getByRole("button", { name: "Saved", exact: true });
  await expect(saved).toHaveAttribute("aria-pressed", "true");
  await expect(
    explorer.getByText(/saved locally for this demo/i),
  ).toBeAttached();
  await expect(
    explorer.getByText(
      /Searching, saving, and opening details do not send data/i,
    ),
  ).toBeVisible();

  expect(mutationRequests).toEqual([]);
});

for (const { name, viewport } of [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
] as const) {
  test(`hero dashboard preview completes one automatic sequence and manual input ends autoplay (${name})`, async ({
    page,
  }) => {
    test.setTimeout(45_000);
    const testTime = new Date("2026-01-01T00:00:00.000Z");
    await page.clock.install({ time: testTime });
    // Clock installation alone lets time advance naturally.
    await page.clock.pauseAt(testTime);
    await page.setViewportSize(viewport);
    await page.goto("/");

    const preview = page.locator(
      'figure[aria-label="Interactive student dashboard preview"]',
    );
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute("data-active-tab", "overview");
    await expect(preview).toHaveAttribute("data-autoplay-status", "running");

    const pause = preview.getByRole("button", {
      name: "Pause dashboard preview",
    });
    await pause.click();
    await expect(preview).toHaveAttribute("data-autoplay-status", "paused");
    await page.clock.fastForward(3_000);
    await expect(preview).toHaveAttribute("data-active-tab", "overview");
    await preview
      .getByRole("button", { name: "Resume dashboard preview" })
      .click();
    await expect(preview).toHaveAttribute("data-autoplay-status", "running");

    const automaticSequence = [
      { delay: 850, tab: "discover" },
      { delay: 1_600, tab: "saved" },
      { delay: 1_600, tab: "applications" },
      { delay: 1_600, tab: "events" },
      { delay: 1_600, tab: "profile" },
      { delay: 1_600, tab: "overview" },
    ] as const;

    for (const { delay, tab } of automaticSequence) {
      await page.clock.fastForward(delay);
      await expect(preview).toHaveAttribute("data-active-tab", tab);
    }
    await expect(preview).toHaveAttribute("data-autoplay-status", "complete");
    await expect(
      preview.getByRole("button", { name: "Replay dashboard preview" }),
    ).toBeVisible();
    await expect(preview.locator('[aria-live="polite"]')).not.toContainText(
      "Showing Profile",
    );
    await page.clock.fastForward(5_000);
    await expect(preview).toHaveAttribute("data-active-tab", "overview");

    await page.reload();
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toHaveAttribute("data-autoplay-status", "running");
    const saved = preview.getByRole("button", { name: "Saved", exact: true });
    await saved.click();
    await expect(saved).toHaveAttribute("aria-pressed", "true");
    await expect(preview).toHaveAttribute("data-active-tab", "saved");
    await expect(preview).toHaveAttribute("data-autoplay-status", "manual");
    await expect(preview.locator('[aria-live="polite"]')).toContainText(
      "Showing Saved",
    );

    await saved.focus();
    await page.keyboard.press("ArrowRight");
    await expect(preview).toHaveAttribute("data-active-tab", "applications");
    await page.clock.fastForward(10_000);
    await expect(preview).toHaveAttribute("data-active-tab", "applications");
  });
}

test("hero dashboard preview disables autoplay for reduced motion while keeping controls usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const preview = page.locator(
    'figure[aria-label="Interactive student dashboard preview"]',
  );
  await preview.scrollIntoViewIfNeeded();
  await expect(preview).toHaveAttribute(
    "data-autoplay-status",
    "reduced-motion",
  );
  await expect(preview).toHaveAttribute("data-active-tab", "overview");
  await expect(
    preview.getByRole("button", {
      name: "Automatic dashboard preview disabled by reduced-motion preference",
    }),
  ).toBeDisabled();
  await page.waitForTimeout(1_700);
  await expect(preview).toHaveAttribute("data-active-tab", "overview");

  const profile = preview.getByRole("button", { name: "Profile", exact: true });
  await profile.click();
  await expect(profile).toHaveAttribute("aria-pressed", "true");
  await expect(preview).toHaveAttribute("data-active-tab", "profile");
});

test("marketing reveals finish quickly and remain visible with reduced motion", async ({
  page,
}) => {
  await page.goto("/");

  const heroReveal = page.locator('[data-reveal="section"]').first();
  await expect(page.locator("html")).toHaveAttribute(
    "data-marketing-motion",
    "enabled",
  );
  await expect(heroReveal).toHaveAttribute("data-revealed", "true");
  await expect(
    heroReveal.locator("[data-marketing-reveal-item]").first(),
  ).toBeVisible();
  const revealConfiguration = await heroReveal.evaluate((element) => ({
    distance: element.style.getPropertyValue("--marketing-reveal-distance"),
    duration: element.style.getPropertyValue("--marketing-reveal-duration"),
  }));
  expect(revealConfiguration).toEqual({ distance: "14px", duration: "340ms" });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reducedHeroReveal = page.locator('[data-reveal="section"]').first();
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-marketing-motion",
    "enabled",
  );
  await expect(reducedHeroReveal).toHaveAttribute("data-revealed", "true");
  await expect(reducedHeroReveal).not.toHaveClass(/marketing-reveal--pending/);
  await expect(
    reducedHeroReveal.locator("[data-marketing-reveal-item]").first(),
  ).toBeVisible();
});

test("homepage marketing content is visible in the server-rendered no-JavaScript experience", async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL ?? "http://127.0.0.1:3000"),
    javaScriptEnabled: false,
  });
  const noJavaScriptPage = await context.newPage();

  try {
    const response = await noJavaScriptPage.goto("/", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok()).toBe(true);
    await expect(
      noJavaScriptPage.getByRole("heading", {
        name: "Build your path into healthcare.",
      }),
    ).toBeVisible();
    const firstRevealItem = noJavaScriptPage
      .locator('[data-reveal="section"] [data-marketing-reveal-item]')
      .first();
    await expect(noJavaScriptPage.locator("html")).not.toHaveAttribute(
      "data-marketing-motion",
      "enabled",
    );
    await expect(firstRevealItem).toBeVisible();
    await expect(
      noJavaScriptPage.getByText("Find opportunities that actually fit."),
    ).toBeVisible();
    expect(
      await firstRevealItem.evaluate(
        (element) => getComputedStyle(element).opacity,
      ),
    ).toBe("1");
  } finally {
    await context.close();
  }
});

test("guided walkthrough loops automatically and its compact control pauses and resumes", async ({
  page,
}) => {
  test.setTimeout(45_000);
  await page.clock.install();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const walkthrough = page.getByRole("region", {
    name: "Guided opportunity walkthrough",
  });
  await walkthrough.scrollIntoViewIfNeeded();
  await expect(walkthrough).toHaveAttribute(
    "aria-describedby",
    "walkthrough-status",
  );
  await expect(walkthrough).toHaveAttribute(
    "data-walkthrough-status",
    "running",
  );
  await expect(walkthrough).toHaveAttribute("data-walkthrough-step", "filters");

  for (const label of walkthroughStepLabels) {
    await expect(
      walkthrough.getByRole("listitem").filter({ hasText: label }),
    ).toBeVisible();
    await expect(walkthrough.getByRole("button", { name: label })).toHaveCount(
      0,
    );
  }

  await page.clock.fastForward(2_850);
  await expect(walkthrough).toHaveAttribute("data-walkthrough-step", "listing");
  for (const step of ["eligibility", "action", "tracking", "filters"]) {
    await page.clock.fastForward(2_850);
    await expect(walkthrough).toHaveAttribute("data-walkthrough-step", step);
  }

  const pause = walkthrough.getByRole("button", { name: "Pause animation" });
  await expect(pause).toHaveCSS("width", "44px");
  await expect(pause).toHaveCSS("height", "44px");
  await pause.click();
  await expect(walkthrough).toHaveAttribute(
    "data-walkthrough-status",
    "paused",
  );
  await expect(
    walkthrough.getByText(
      "Animation paused. Use Resume animation to continue.",
    ),
  ).toBeVisible();
  await page.clock.fastForward(8_500);
  await expect(walkthrough).toHaveAttribute("data-walkthrough-step", "filters");

  const resume = walkthrough.getByRole("button", { name: "Resume animation" });
  await resume.click();
  await expect(walkthrough).toHaveAttribute(
    "data-walkthrough-status",
    "running",
  );
  await page.clock.fastForward(2_850);
  await expect(walkthrough).toHaveAttribute("data-walkthrough-step", "listing");
});

test("guided walkthrough remains static and readable with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const walkthrough = page.getByRole("region", {
    name: "Guided opportunity walkthrough",
  });
  await walkthrough.scrollIntoViewIfNeeded();
  await expect(walkthrough).toHaveAttribute(
    "data-walkthrough-status",
    "reduced-motion",
  );
  await expect(walkthrough).toHaveAttribute(
    "data-walkthrough-step",
    "eligibility",
  );
  await expect(
    walkthrough.getByRole("button", {
      name: "Animation disabled by reduced-motion preference",
    }),
  ).toBeDisabled();
  await expect(
    walkthrough.getByText("Static preview shown for reduced motion."),
  ).toBeVisible();
  await page.waitForTimeout(3_000);
  await expect(walkthrough).toHaveAttribute(
    "data-walkthrough-step",
    "eligibility",
  );
});

test("homepage interactions avoid document-level horizontal overflow at target widths", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/");

  for (const viewport of homepageViewports) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(
      dimensions.scrollWidth,
      `Homepage overflowed at ${viewport.width} x ${viewport.height}`,
    ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test("partner preview uses keyboard controls and local applicant state", async ({
  page,
}) => {
  await page.goto("/partners");
  const mutationRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.method() !== "GET" && !isClerkBootstrapRequest(url)) {
      mutationRequests.push(`${request.method()} ${request.url()}`);
    }
  });
  const preview = page.getByRole("region", {
    name: "Interactive partner workspace preview",
  });
  const applicants = preview.getByRole("button", { name: "Applicants" });
  await applicants.focus();
  await page.keyboard.press("Enter");
  await expect(applicants).toHaveAttribute("aria-pressed", "true");

  await preview.getByRole("button", { name: "Student 01" }).click();
  await preview
    .getByRole("group", { name: "Update Student 01 status" })
    .getByRole("button", { name: "Reviewing" })
    .click();
  await expect(
    preview.getByText("Student 01 moved to Reviewing in this demonstration.", {
      exact: true,
    }),
  ).toBeVisible();

  await preview
    .getByRole("group", { name: "Applicant status filters" })
    .getByRole("button", { name: "New", exact: true })
    .click();
  await expect(
    preview.getByText("No illustrative applicants are in this status."),
  ).toBeVisible();
  await expect(
    preview.getByRole("group", { name: "Update Student 01 status" }),
  ).toHaveCount(0);

  await preview.getByRole("button", { name: "Opportunities" }).click();
  await preview.getByRole("button", { name: /Research skills cohort/ }).click();
  const placements = preview.getByRole("button", { name: "Placements" });
  await placements.click();
  await expect(placements).toHaveAttribute("aria-pressed", "true");
  await expect(preview.getByText("Confirmed placements")).toBeVisible();
  await expect(
    preview.getByRole("progressbar", {
      name: "Research skills cohort placement progress",
    }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(
    preview.getByText(
      "0 confirmed of 12 available places for research skills cohort.",
      { exact: true },
    ),
  ).toBeVisible();
  expect(mutationRequests).toEqual([]);
});

test("student preview saves an opportunity and reflects an application locally", async ({
  page,
}) => {
  await page.goto("/students");
  const mutationRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (request.method() !== "GET" && !isClerkBootstrapRequest(url)) {
      mutationRequests.push(`${request.method()} ${request.url()}`);
    }
  });
  const preview = page.getByRole("region", {
    name: "Interactive student workspace preview",
  });
  const research = preview
    .getByRole("group", { name: "Opportunity categories" })
    .getByRole("button", { name: "Research" });
  await research.focus();
  await page.keyboard.press("Enter");
  await expect(research).toHaveAttribute("aria-pressed", "true");

  await preview.getByRole("button", { name: "Save opportunity" }).click();
  await expect(
    preview.getByRole("button", { name: "Unsave opportunity" }),
  ).toBeVisible();

  await preview
    .getByRole("button", { name: "Start illustrative application" })
    .click();
  await expect(
    preview.getByRole("button", { name: "Applications" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    preview.getByText("Guided research experience", { exact: true }),
  ).toBeVisible();
  await expect(preview.getByText("Preparing", { exact: true })).toBeVisible();

  await preview.getByRole("button", { name: "Discover" }).click();
  await preview
    .getByRole("button", { name: "Start illustrative application" })
    .click();
  await expect(
    preview.getByText(
      "This illustrative application is already in your workspace. Nothing was submitted or sent.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    preview.getByText("Guided research experience", { exact: true }),
  ).toHaveCount(1);
  expect(mutationRequests).toEqual([]);
});
