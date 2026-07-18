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

test("guided walkthrough advances automatically and supports explicit pause and play", async ({
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

  for (const label of walkthroughStepLabels) {
    await expect(
      walkthrough.getByRole("button", { name: label }),
    ).toBeVisible();
  }

  const firstStep = walkthrough.getByRole("button", {
    name: "Select a type",
  });
  const secondStep = walkthrough.getByRole("button", {
    name: "Open a verified opportunity",
  });
  const thirdStep = walkthrough.getByRole("button", {
    name: "Review eligibility",
  });
  const fourthStep = walkthrough.getByRole("button", {
    name: "Save or apply",
  });

  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(150);
  await page.clock.fastForward(4_100);
  await expect(secondStep).toHaveAttribute("aria-pressed", "true");

  // A resting pointer no longer makes the walkthrough appear permanently static.
  await walkthrough.hover();
  await page.clock.fastForward(4_100);
  await expect(thirdStep).toHaveAttribute("aria-pressed", "true");

  const pause = walkthrough.getByRole("button", {
    name: "Pause product walkthrough",
  });
  await pause.click();
  const play = walkthrough.getByRole("button", {
    name: "Play product walkthrough",
  });
  await expect(play).toBeVisible();
  await page.clock.fastForward(8_200);
  await expect(thirdStep).toHaveAttribute("aria-pressed", "true");

  await firstStep.click();
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");
  await expect(
    walkthrough.getByText("Paused. Select Play to resume automatic steps."),
  ).toBeVisible();
  await page.clock.fastForward(4_100);
  await expect(firstStep).toHaveAttribute("aria-pressed", "true");

  await play.click();
  await page.clock.fastForward(4_100);
  await expect(secondStep).toHaveAttribute("aria-pressed", "true");

  await fourthStep.click();
  await expect(fourthStep).toHaveAttribute("aria-pressed", "true");
});

test("guided walkthrough stays static but manually selectable with reduced motion", async ({
  page,
}) => {
  await page.clock.install();
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
  await page.clock.fastForward(8_200);
  await expect(trackNextStep).toHaveAttribute("aria-pressed", "true");
});

test("partner preview uses keyboard controls and local applicant state", async ({
  page,
}) => {
  await page.goto("/partners");
  const mutationRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isClerkEnvironmentRefresh =
      url.hostname.endsWith(".clerk.accounts.dev") &&
      url.pathname === "/v1/environment";
    if (request.method() !== "GET" && !isClerkEnvironmentRefresh) {
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
    const isClerkEnvironmentRefresh =
      url.hostname.endsWith(".clerk.accounts.dev") &&
      url.pathname === "/v1/environment";
    if (request.method() !== "GET" && !isClerkEnvironmentRefresh) {
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
