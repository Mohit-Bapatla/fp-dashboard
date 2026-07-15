import { describe, expect, it } from "vitest";

import { getDashboardEntryAction } from "@/components/marketing/dashboard-entry-button";

describe("dashboard entry actions", () => {
  it("sends a signed-out partner through sign-up to protected onboarding", () => {
    expect(
      getDashboardEntryAction({
        intent: "partner",
        returnTo: "https://evil.example/claim",
        role: null,
      }),
    ).toEqual({
      href: "/sign-up?redirect_url=%2Fpartner-onboarding",
      label: "Create Partner Workspace",
      linkType: "internal",
    });
  });

  it("preserves signed-in role routing regardless of CTA intent", () => {
    expect(
      getDashboardEntryAction({ intent: "partner", role: "STUDENT" }),
    ).toMatchObject({ href: "/dashboard/student", label: "Open Dashboard" });
    expect(
      getDashboardEntryAction({ intent: "partner", role: "PARTNER" }),
    ).toMatchObject({
      href: "/dashboard/partner",
      label: "Open Partner Dashboard",
    });
  });
});
