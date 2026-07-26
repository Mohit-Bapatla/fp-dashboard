import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const clerkMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ signOut: clerkMocks.signOut }),
}));
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import {
  DashboardAccountMenu,
  getAccountInitials,
} from "@/components/dashboard/dashboard-account-menu";
import {
  createDashboardSignOutController,
  DASHBOARD_SIGN_OUT_ERROR,
} from "@/lib/auth/dashboard-sign-out";

describe("dashboard account menu", () => {
  it("renders an easy-to-find keyboard-accessible sign-out action", () => {
    const markup = renderToStaticMarkup(
      createElement(DashboardAccountMenu, { displayName: "Avery Ng" }),
    );

    expect(markup).toContain('aria-label="Open account menu"');
    expect(markup).toContain('type="button"');
    expect(markup).toContain(">Sign out</button>");
    expect(markup).toContain("Avery Ng");
    expect(getAccountInitials("Avery Ng")).toBe("AN");
  });

  it("invokes Clerk once with the homepage redirect and blocks duplicates", async () => {
    let completeSignOut: (() => void) | undefined;
    const signOut = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          completeSignOut = resolve;
        }),
    );
    const setError = vi.fn();
    const setPending = vi.fn();
    const onSignedOut = vi.fn();
    const controller = createDashboardSignOutController(signOut, onSignedOut);

    const firstRequest = controller.run({ setError, setPending });
    const duplicateRequest = await controller.run({ setError, setPending });

    expect(duplicateRequest).toBe(false);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ redirectUrl: "/" });
    expect(setPending).toHaveBeenCalledWith(true);
    expect(controller.isPending()).toBe(true);

    completeSignOut?.();
    await expect(firstRequest).resolves.toBe(true);
    expect(controller.isPending()).toBe(true);
    expect(onSignedOut).toHaveBeenCalledOnce();
  });

  it("keeps the control recoverable after a failed sign-out", async () => {
    const signOut = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(undefined);
    const setError = vi.fn();
    const setPending = vi.fn();
    const onSignedOut = vi.fn();
    const controller = createDashboardSignOutController(signOut, onSignedOut);

    await expect(controller.run({ setError, setPending })).resolves.toBe(false);
    expect(setPending).toHaveBeenNthCalledWith(1, true);
    expect(setPending).toHaveBeenNthCalledWith(2, false);
    expect(setError).toHaveBeenLastCalledWith(
      expect.stringMatching(
        new RegExp(
          `^${DASHBOARD_SIGN_OUT_ERROR.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*FP-SIGNOUT-\\d{8}-[A-Z0-9]{6}\\.$`,
        ),
      ),
    );
    expect(controller.isPending()).toBe(false);
    expect(onSignedOut).not.toHaveBeenCalled();

    await expect(controller.run({ setError, setPending })).resolves.toBe(true);
    expect(signOut).toHaveBeenCalledTimes(2);
    expect(onSignedOut).toHaveBeenCalledOnce();
  });

  it("does not update an unmounted view when sign-out later fails", async () => {
    let rejectSignOut: ((error: Error) => void) | undefined;
    const signOut = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectSignOut = reject;
        }),
    );
    const setError = vi.fn();
    const setPending = vi.fn();
    let isActive = true;
    const controller = createDashboardSignOutController(signOut);

    const request = controller.run({
      isActive: () => isActive,
      setError,
      setPending,
    });
    isActive = false;
    rejectSignOut?.(new Error("offline"));

    await expect(request).resolves.toBe(false);
    expect(signOut).toHaveBeenCalledOnce();
    expect(setPending).toHaveBeenCalledOnce();
    expect(setPending).toHaveBeenCalledWith(true);
    expect(setError).toHaveBeenCalledOnce();
    expect(setError).toHaveBeenCalledWith(null);
    expect(controller.isPending()).toBe(false);
  });
});
