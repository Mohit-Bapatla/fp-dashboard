import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("pending Clerk session task routing", () => {
  it("redirects pending dashboard sessions back into the catch-all sign-in flow", () => {
    const proxySource = source("src/proxy.ts");

    expect(proxySource).toContain('sessionStatus === "pending"');
    expect(proxySource).toContain('pendingTaskUrl.pathname = "/sign-in"');
    expect(proxySource).toContain(
      'pendingTaskUrl.searchParams.set("redirect_url", req.url)',
    );
  });

  it("keeps signed-out dashboard redirects on the application origin", () => {
    const proxySource = source("src/proxy.ts");

    expect(proxySource).toContain('signInUrl.pathname = "/sign-in"');
    expect(proxySource).toContain('signInUrl.search = ""');
    expect(proxySource).toContain(
      'signInUrl.searchParams.set("redirect_url", req.url)',
    );
    expect(proxySource).not.toContain("returnBackUrl: req.url");
  });

  it("renders Clerk's task redirect control in auth and dashboard layouts", () => {
    const authLayout = source("src/app/(auth)/layout.tsx");
    const dashboardLayout = source("src/app/dashboard/layout.tsx");

    expect(authLayout).toContain("<RedirectToTasks />");
    expect(dashboardLayout).toContain("<RedirectToTasks />");
    expect(authLayout).toContain("localization={clerkEmailCodeLocalization}");
    expect(dashboardLayout).toContain(
      "localization={clerkEmailCodeLocalization}",
    );
  });

  it("documents an onboarding sign-up force and fallback redirect", () => {
    const envExample = source(".env.example");

    expect(envExample).toContain(
      'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard/student/onboarding"',
    );
    expect(envExample).toContain(
      'NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL="/dashboard/student/onboarding"',
    );
  });
});
