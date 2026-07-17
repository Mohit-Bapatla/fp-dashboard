import { describe, expect, it } from "vitest";

import { getDashboardEntryAction } from "@/components/marketing/dashboard-entry-button";

describe("dashboard entry actions", () => {
  it("sends signed-out partner acquisition to the approved outreach inquiry", () => {
    expect(
      getDashboardEntryAction({
        intent: "partner",
        returnTo: "https://evil.example/claim",
        role: null,
      }),
    ).toEqual({
      href: "mailto:outreach@futurephysicians.org?subject=Future%20Physicians%20Partnership%20Inquiry",
      label: "Contact Our Outreach Team",
      linkType: "mailto",
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
