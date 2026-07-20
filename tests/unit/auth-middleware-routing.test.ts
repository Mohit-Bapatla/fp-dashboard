import { describe, expect, it } from "vitest";

import { requiresClerkMiddleware } from "@/lib/auth/middleware-routing";

describe("requiresClerkMiddleware", () => {
  it.each([
    "/dashboard",
    "/dashboard/student",
    "/partner-onboarding",
    "/sign-in",
    "/sign-in/factor-two",
    "/sign-up",
    "/__clerk/sync",
    "/api/jobs/student-reminders",
    "/trpc/example",
  ])(
    "keeps Clerk on authentication and server-side data routes: %s",
    (path) => {
      expect(requiresClerkMiddleware(path)).toBe(true);
    },
  );

  it.each([
    "/",
    "/about",
    "/opportunities",
    "/opportunities/example",
    "/privacy",
    "/support",
  ])("does not make public marketing reads depend on Clerk: %s", (path) => {
    expect(requiresClerkMiddleware(path)).toBe(false);
  });
});
