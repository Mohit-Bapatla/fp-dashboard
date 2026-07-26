import { expect, test } from "../e2e/fixtures";
import { signInDisposableUser, signOutThroughDashboard } from "./helpers";

test("student and partner core paths remain usable at 390 by 844", async ({
  page,
}) => {
  await signInDisposableUser(page, "E2E_STUDENT_B_EMAIL");
  await page.goto("/dashboard/student");
  await expect(
    page.getByRole("heading", { name: "What needs your attention" }),
  ).toBeVisible();
  await page.goto("/dashboard/student/applications/reliability_application_a");
  await expect(
    page.getByRole("link", {
      name: /Open official application for Reliability Organization A/,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await signOutThroughDashboard(page);

  await signInDisposableUser(page, "E2E_PARTNER_A_EMAIL");
  await page.goto("/dashboard/partner");
  await expect(
    page.getByRole("heading", { name: "Partner Dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Reliability Organization B")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
  await signOutThroughDashboard(page);
});
