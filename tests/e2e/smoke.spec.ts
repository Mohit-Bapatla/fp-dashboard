import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/FP Dashboard/);
});

test("sign-in page loads", async ({ page }) => {
  await page.goto("/sign-in");

  await expect(page).toHaveURL(/sign-in/);
});

test("signed-out dashboard redirects to sign-in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/sign-in/);
});

test("unknown public opportunity returns not found", async ({ page }) => {
  const response = await page.goto("/opportunities/not-a-real-opportunity");

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: /not available/i }),
  ).toBeVisible();
});
