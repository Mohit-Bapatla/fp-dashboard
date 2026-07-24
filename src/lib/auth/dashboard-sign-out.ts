export const DASHBOARD_SIGN_OUT_ERROR =
  "We could not sign you out. Please try again.";

type ClerkSignOut = (options: { redirectUrl: string }) => Promise<void>;

type SignOutView = {
  setError: (message: string | null) => void;
  setPending: (pending: boolean) => void;
};

export type DashboardSignOutController = {
  isPending: () => boolean;
  run: (view: SignOutView) => Promise<boolean>;
};

export function createDashboardSignOutController(
  signOut: ClerkSignOut,
): DashboardSignOutController {
  let pending = false;

  return {
    isPending: () => pending,
    run: async ({ setError, setPending }) => {
      if (pending) {
        return false;
      }

      pending = true;
      setError(null);
      setPending(true);

      try {
        await signOut({ redirectUrl: "/" });
        // Keep the control pending until Clerk completes its redirect. This
        // prevents a second request during the brief post-response window.
        return true;
      } catch {
        pending = false;
        setPending(false);
        setError(DASHBOARD_SIGN_OUT_ERROR);
        return false;
      }
    },
  };
}
