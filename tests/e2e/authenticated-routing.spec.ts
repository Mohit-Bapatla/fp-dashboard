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
      const dashboardEntry = header.getByRole("link", {
        name: "Dashboard",
        exact: true,
      });
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

    test(`redirects a signed-in ${roleCase.role} viewer away from the Clerk sign-in page`, async ({
      page,
    }) => {
      test.skip(
        !hasStorageState,
        `Set ${roleCase.env} to a development-Clerk Playwright storage-state file`,
      );

      await page.goto("/sign-in");

      await expect(page).toHaveURL(new RegExp(`${roleCase.dashboardPath}$`));
      await expect(
        page.getByRole("heading", { level: 1, name: roleCase.heading }),
      ).toBeVisible();
    });

    test(`links ${roleCase.role} dashboard support to the public contact page`, async ({
      page,
    }) => {
      test.skip(
        !hasStorageState,
        `Set ${roleCase.env} to a development-Clerk Playwright storage-state file`,
      );

      await page.goto("/dashboard/support");
      const contactSupport = page.getByRole("link", {
        name: "Contact support",
        exact: true,
      });
      await expect(contactSupport).toHaveAttribute("href", "/contact");
      await contactSupport.click();

      await expect(page).toHaveURL(/\/contact$/);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Start with the team closest to your question.",
        }),
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

const signOutStorageStatePath = process.env.PLAYWRIGHT_SIGN_OUT_STORAGE_STATE
  ? resolve(process.env.PLAYWRIGHT_SIGN_OUT_STORAGE_STATE)
  : undefined;
const hasSignOutStorageState = Boolean(
  signOutStorageStatePath && existsSync(signOutStorageStatePath),
);

test.describe("dedicated sign-out account", () => {
  test.use({
    storageState: hasSignOutStorageState
      ? signOutStorageStatePath
      : signedOutStorageState,
  });

  test("signs out through the account menu and keeps the session cleared after refresh", async ({
    page,
  }) => {
    test.skip(
      !hasSignOutStorageState,
      "Set PLAYWRIGHT_SIGN_OUT_STORAGE_STATE to a disposable development-Clerk session",
    );

    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Open account menu" }).click();
    const signOut = page.getByRole("button", { name: "Sign out" });
    await expect(signOut).toBeVisible();
    await signOut.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("banner").getByRole("link", {
        name: "Sign In",
        exact: true,
      }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("banner").getByRole("link", {
        name: "Sign In",
        exact: true,
      }),
    ).toBeVisible();
  });
});
