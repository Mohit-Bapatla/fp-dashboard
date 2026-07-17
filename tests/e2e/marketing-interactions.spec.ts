import { expect, test } from "./fixtures";

const faqQuestion = "Is Future Physicians free for students?";
const walkthroughStepLabels = [
  "Select a type",
  "Open a verified opportunity",
  "Review eligibility",
  "Save or apply",
  "Track the next step",
] as const;

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

test("guided walkthrough supports manual selection and pauses during interaction", async ({
  page,
}) => {
  test.setTimeout(45_000);
  await page.goto("/");

  const walkthrough = page.getByRole("region", {
    name: "Guided opportunity walkthrough",
  });
  await walkthrough.scrollIntoViewIfNeeded();
  await expect(walkthrough).toHaveAttribute(
    "aria-describedby",
    "walkthrough-status",
  );

  for (const label of walkthroughStepLabels) {
    await expect(
      walkthrough.getByRole("button", { name: label }),
    ).toBeVisible();
  }

  const reviewEligibility = walkthrough.getByRole("button", {
    name: "Review eligibility",
  });
  await reviewEligibility.click();
  await expect(reviewEligibility).toHaveAttribute("aria-pressed", "true");
  await expect(
    walkthrough.getByText("Step 3 of 5", { exact: true }),
  ).toBeVisible();

  // Focus inside the walkthrough pauses the two-second automatic advance.
  await expect(reviewEligibility).toBeFocused();
  await expect(
    walkthrough.getByText("Paused while you interact", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(2_200);
  await expect(reviewEligibility).toHaveAttribute("aria-pressed", "true");

  // Hovering also pauses after focus leaves the region.
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  await walkthrough.hover();
  await page.waitForTimeout(2_200);
  await expect(reviewEligibility).toHaveAttribute("aria-pressed", "true");

  const pause = walkthrough.getByRole("button", {
    name: "Pause product walkthrough",
  });
  await pause.click();
  await expect(
    walkthrough.getByRole("button", { name: "Play product walkthrough" }),
  ).toBeVisible();
});

test("guided walkthrough stays static but manually selectable with reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const walkthrough = page.getByRole("region", {
    name: "Guided opportunity walkthrough",
  });
  await walkthrough.scrollIntoViewIfNeeded();
  await expect(
    walkthrough.getByRole("button", {
      name: "Automatic animation disabled by reduced-motion preference",
    }),
  ).toBeDisabled();

  const trackNextStep = walkthrough.getByRole("button", {
    name: "Track the next step",
  });
  await trackNextStep.click();
  await expect(trackNextStep).toHaveAttribute("aria-pressed", "true");
  await expect(
    walkthrough.getByText("Step 5 of 5", { exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(2_200);
  await expect(trackNextStep).toHaveAttribute("aria-pressed", "true");
});
