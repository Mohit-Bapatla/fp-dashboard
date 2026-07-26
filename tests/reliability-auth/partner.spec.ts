import { expect, test } from "../e2e/fixtures";
import {
  signInDisposableUser,
  signOutThroughDashboard,
  withDisposableDatabase,
} from "./helpers";

test("partner review persists and remains isolated to its organization", async ({
  page,
}) => {
  await signInDisposableUser(page, "E2E_PARTNER_A_EMAIL");
  await page.goto("/dashboard/partner");

  await expect(
    page.getByRole("heading", { name: "Partner Dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reliability Organization A" }),
  ).toBeVisible();
  await expect(page.getByText("Reliability Organization B")).toHaveCount(0);

  await page.goto("/dashboard/partner/applicants");
  const application = page
    .locator("article")
    .filter({ hasText: "Reliability External Shadowing A" });
  await expect(application).toHaveCount(1);
  await expect(application).toContainText(
    process.env.E2E_STUDENT_B_EMAIL ?? "missing disposable email",
  );

  const comment = `Disposable partner comment ${Date.now()}`;
  await application.getByLabel("Add comment").fill(comment);
  await application.getByRole("button", { name: "Add comment" }).click();
  await page.reload();
  await expect(page.getByText(comment)).toBeVisible();

  const refreshedApplication = page
    .locator("article")
    .filter({ hasText: "Reliability External Shadowing A" });
  await refreshedApplication
    .getByLabel("Review status")
    .selectOption("UNDER_REVIEW");
  await refreshedApplication
    .getByRole("button", { name: "Update status" })
    .click();
  await expect(refreshedApplication).toContainText("Under Review");
  await page.reload();
  await expect(page.getByText(comment)).toBeVisible();
  await expect(
    page
      .locator("article")
      .filter({ hasText: "Reliability External Shadowing A" }),
  ).toContainText("Under Review");

  await page.goto(
    "/dashboard/partner/applicants?opportunityId=reliability_opportunity_b",
  );
  await expect(page.getByText("Reliability Organization B")).toHaveCount(0);
  await expect(
    page.getByText("Synthetic reliability application B."),
  ).toHaveCount(0);
  await expect(
    page.getByText("Dashboard unavailable", { exact: true }),
  ).toHaveCount(0);

  await withDisposableDatabase(async (client) => {
    await client.query(
      `DELETE FROM "RecordComment" WHERE body = $1 AND "entityId" = $2`,
      [comment, "reliability_application_a"],
    );
    await client.query(
      `UPDATE "Application" SET "reviewedAt" = NULL, status = 'PREPARING' WHERE id = $1`,
      ["reliability_application_a"],
    );
  });

  await signOutThroughDashboard(page);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
