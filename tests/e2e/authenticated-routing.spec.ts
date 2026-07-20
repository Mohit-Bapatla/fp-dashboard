import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { expect, test } from "./fixtures";

const signedOutStorageState = { cookies: [], origins: [] };

const roleCases = [
  {
    dashboardPath: "/dashboard/student",
    env: "PLAYWRIGHT_STUDENT_STORAGE_STATE",
    heading: "What needs your attention",
    restrictedPath: "/dashboard/partner",
    role: "student",
  },
  {
    dashboardPath: "/dashboard/partner",
    env: "PLAYWRIGHT_PARTNER_STORAGE_STATE",
    heading: "Partner Dashboard",
    restrictedPath: "/dashboard/staff",
    role: "partner",
  },
  {
    dashboardPath: "/dashboard/staff",
    env: "PLAYWRIGHT_STAFF_STORAGE_STATE",
    heading: "Staff Dashboard",
    restrictedPath: "/dashboard/partner",
    role: "staff",
  },
  {
    dashboardPath: "/dashboard/admin",
    env: "PLAYWRIGHT_ADMIN_STORAGE_STATE",
    heading: "Admin Dashboard",
    role: "admin",
  },
  {
    dashboardPath: "/dashboard/admin",
    env: "PLAYWRIGHT_SUPER_ADMIN_STORAGE_STATE",
    heading: "Admin Dashboard",
    role: "super-admin",
  },
] as const;

for (const roleCase of roleCases) {
  const configuredPath = process.env[roleCase.env];
  const storageStatePath = configuredPath ? resolve(configuredPath) : undefined;
  const hasStorageState = Boolean(
    storageStatePath && existsSync(storageStatePath),
  );

  test.describe(`${roleCase.role} routing`, () => {
    test.use({
      storageState: hasStorageState ? storageStatePath : signedOutStorageState,
    });

    test(`routes /dashboard to the ${roleCase.role} workspace`, async ({
      page,
    }) => {
      test.skip(
        !hasStorageState,
        `Set ${roleCase.env} to a development-Clerk Playwright storage-state file`,
      );

      await page.goto("/dashboard");

      await expect(page).toHaveURL(new RegExp(`${roleCase.dashboardPath}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: roleCase.heading }),
      ).toBeVisible();
    });

    test(`keeps a signed-in ${roleCase.role} viewer on the role dashboard from the public site`, async ({
      page,
    }) => {
      test.skip(
        !hasStorageState,
        `Set ${roleCase.env} to a development-Clerk Playwright storage-state file`,
      );

      await page.goto("/");

      const header = page.getByRole("banner");
      await expect(
        header.getByRole("link", { name: "Sign In", exact: true }),
      ).toHaveCount(0);
      const dashboardEntry = header.getByRole("link", { name: /^Open / });
      await expect(dashboardEntry).toHaveAttribute(
        "href",
        roleCase.dashboardPath,
      );
      await dashboardEntry.click();

      await expect(page).toHaveURL(new RegExp(`${roleCase.dashboardPath}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: roleCase.heading }),
      ).toBeVisible();
    });

    if ("restrictedPath" in roleCase) {
      test(`redirects ${roleCase.role} away from another role's workspace`, async ({
        page,
      }) => {
        test.skip(
          !hasStorageState,
          `Set ${roleCase.env} to a development-Clerk Playwright storage-state file`,
        );

        await page.goto(roleCase.restrictedPath);

        await expect(page).toHaveURL(new RegExp(`${roleCase.dashboardPath}$`));
        await expect(
          page.getByRole("heading", { level: 1, name: roleCase.heading }),
        ).toBeVisible();
      });
    }
  });
}
