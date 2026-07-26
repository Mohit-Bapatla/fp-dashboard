import { expect, test } from "../e2e/fixtures";
import {
  signInDisposableUser,
  signOutThroughDashboard,
  withDisposableDatabase,
} from "./helpers";

test("student onboarding, resume, idempotency, and application workspace", async ({
  page,
}) => {
  await signInDisposableUser(page, "E2E_STUDENT_A_EMAIL");
  await page.goto("/dashboard/student/onboarding");

  await page.getByLabel("First name").fill("Reliability");
  await page.getByLabel("Last name").fill("Student A");
  await page
    .getByRole("textbox", { name: "School *", exact: true })
    .fill("Reliability Test University");
  await page.getByLabel("Age in years (optional)").fill("18");
  await page
    .getByRole("combobox", { name: /Grade year/ })
    .selectOption("College freshman");
  await page.getByRole("checkbox", { name: /at least 13 years old/i }).check();
  await page.getByRole("button", { name: "Save and continue" }).dblclick();
  await expect(page.getByText("Step 2 of 4")).toBeVisible();

  await page.getByLabel("City").fill("Chicago");
  await page.getByLabel("State").fill("Illinois");
  await page.getByLabel("Country").fill("United States");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Step 3 of 4")).toBeVisible();
  await page.getByLabel("Add a custom specialty").fill("Pediatrics");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("checkbox", { name: "Shadowing" }).check();
  await page.getByLabel("Availability").fill("Weekends");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("Step 4 of 4")).toBeVisible();

  await page.getByLabel("Career goals").fill("Explore clinical care safely");
  await page.getByRole("button", { name: "Save and finish" }).dblclick();
  await expect(page).toHaveURL(/\/dashboard\/student$/);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "What needs your attention" }),
  ).toBeVisible();

  await page.goto("/dashboard/student/onboarding");
  await expect(
    page.getByRole("heading", { name: "Edit your profile" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save and finish" }).click();
  await expect(page).toHaveURL(/\/dashboard\/student$/);

  await withDisposableDatabase(async (client) => {
    const result = await client.query<{
      completion_count: string;
      profile_count: string;
    }>(
      `SELECT
         (SELECT count(*)::text FROM "StudentProfile" WHERE "userId" = $1) AS profile_count,
         (SELECT count(*)::text FROM "AuditLog" WHERE action = $2 AND "actorId" = $1) AS completion_count`,
      ["reliability_student_a", "STUDENT_ONBOARDING_COMPLETED"],
    );
    expect(result.rows[0]?.profile_count).toBe("1");
    expect(result.rows[0]?.completion_count).toBe("1");
  });

  await page.goto(
    "/dashboard/student/opportunities?q=Reliability%20External%20Shadowing",
  );
  await page.getByRole("button", { name: "Apply filters" }).click();
  const result = page
    .locator("article")
    .filter({ hasText: "Reliability External Shadowing A" });
  await expect(result).toHaveCount(1);
  await result.getByRole("link", { name: "View details" }).click();
  await page.getByRole("button", { name: "Start application" }).dblclick();
  await expect(page).toHaveURL(/\/dashboard\/student\/applications\/[^/?]+$/);

  const officialAction = page.getByRole("link", {
    name: /Open official application for Reliability Organization A/,
  });
  await expect(officialAction).toHaveAttribute(
    "href",
    "https://example.com/reliability-a/apply",
  );
  const [planBox, linkBox] = await Promise.all([
    page.getByRole("heading", { name: "Your plan" }).boundingBox(),
    officialAction.boundingBox(),
  ]);
  expect(planBox).not.toBeNull();
  expect(linkBox).not.toBeNull();
  expect(linkBox!.y).toBeLessThan(planBox!.y);
  expect(linkBox!.height).toBeGreaterThanOrEqual(44);

  const note = `Disposable note ${Date.now()}`;
  await page.getByLabel("Private notes").fill(note);
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page).toHaveURL(/workspace=saved/);
  const completeTask = page
    .getByRole("group", { name: "Task status controls" })
    .getByRole("button", { name: "Complete" })
    .first();
  const completedTaskId = await completeTask
    .locator("xpath=..")
    .locator('input[name="taskId"]')
    .inputValue();
  await completeTask.click();
  await expect
    .poll(() =>
      withDisposableDatabase(async (client) => {
        const result = await client.query<{ status: string }>(
          `SELECT status FROM "ApplicationChecklistItem" WHERE id = $1`,
          [completedTaskId],
        );
        return result.rows[0]?.status;
      }),
    )
    .toBe("COMPLETE");

  await page.reload();
  await expect(page.getByLabel("Private notes")).toHaveValue(note);
  await expect(
    page
      .locator(`#task-${completedTaskId}`)
      .getByRole("button", { name: "Reopen" }),
  ).toBeVisible();
  await expect(
    page.getByText("Dashboard unavailable", { exact: true }),
  ).toHaveCount(0);

  await signOutThroughDashboard(page);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
