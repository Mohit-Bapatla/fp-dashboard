import { expect, test } from "../e2e/fixtures";
import {
  enableDisposableClerkRequests,
  signInDisposableUser,
  withDisposableDatabase,
} from "./helpers";

test("authenticated sessions tolerate slow navigation and two concurrent tabs", async ({
  context,
  page,
}) => {
  await signInDisposableUser(page, "E2E_STUDENT_B_EMAIL");
  await withDisposableDatabase(async (client) => {
    await client.query(
      `UPDATE "Application" SET "privateNotes" = NULL, "reviewedAt" = NULL, status = 'PREPARING' WHERE id = $1`,
      ["reliability_application_a"],
    );
  });
  await page.route("**/dashboard/student/applications", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    await route.continue();
  });
  await page.goto("/dashboard/student/applications");
  await expect(
    page.getByRole("heading", { name: "Applications" }),
  ).toBeVisible();

  const secondPage = await context.newPage();
  await enableDisposableClerkRequests(secondPage);
  await Promise.all([
    page.goto("/dashboard/student/applications/reliability_application_a"),
    secondPage.goto(
      "/dashboard/student/applications/reliability_application_a",
    ),
  ]);
  await expect(
    page.getByRole("heading", { name: "Reliability External Shadowing A" }),
  ).toBeVisible();
  await expect(
    secondPage.getByRole("heading", {
      name: "Reliability External Shadowing A",
    }),
  ).toBeVisible();

  await page
    .getByLabel("Private notes")
    .fill("First concurrent disposable update");
  await secondPage
    .getByLabel("Private notes")
    .fill("Second concurrent disposable update");
  await page.getByRole("button", { name: "Save workspace" }).click();
  await expect(page).toHaveURL(/workspace=saved/);
  await secondPage.getByRole("button", { name: "Save workspace" }).click();
  await expect(secondPage).toHaveURL(/workspace=conflict/);
  await expect(
    secondPage.getByText(/changed in another tab.*try again/i),
  ).toBeVisible();

  await expect
    .poll(async () => {
      await secondPage.reload({ waitUntil: "networkidle" });
      const browserVersion = await secondPage
        .locator('input[name="expectedUpdatedAt"]')
        .inputValue();
      const databaseVersion = await withDisposableDatabase(async (client) => {
        const result = await client.query<{ updated_at: string }>(
          `SELECT to_char(
             "updatedAt",
             'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
           ) AS updated_at
           FROM "Application"
           WHERE id = $1`,
          ["reliability_application_a"],
        );
        return result.rows[0]?.updated_at;
      });
      return browserVersion === databaseVersion;
    })
    .toBe(true);
  await secondPage
    .getByLabel("Private notes")
    .fill("Recovered disposable update");
  await secondPage.getByRole("button", { name: "Save workspace" }).click();
  await expect(secondPage).toHaveURL(/workspace=saved/);
  await secondPage.reload();
  await expect(secondPage.getByLabel("Private notes")).toHaveValue(
    "Recovered disposable update",
  );
  await secondPage.close();
});
