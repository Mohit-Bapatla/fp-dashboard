import { describe, expect, it } from "vitest";

import { getDashboardEntryAction } from "@/components/marketing/dashboard-entry-button";
import { getMarketingHeaderActions } from "@/components/marketing/marketing-header";
import { getPublicOpportunityCardAction } from "@/components/opportunities/public-opportunity-card";

describe("role-aware marketing actions", () => {
  it("routes signed-out partner acquisition to the approved outreach inquiry", () => {
    const action = getDashboardEntryAction({
      intent: "partner",
      returnTo: "/dashboard/partner",
      role: null,
    });

    expect(action).toEqual({
      href: "/contact#partnerships",
      label: "Contact Our Outreach Team",
      linkType: "internal",
    });
  });

  it("keeps signed-in users on the dashboard for their actual role", () => {
    expect(
      getDashboardEntryAction({ intent: "partner", role: "STUDENT" }),
    ).toMatchObject({
      href: "/dashboard/student",
      label: "Open Dashboard",
      linkType: "internal",
    });
    expect(
      getDashboardEntryAction({ intent: "student", role: "PARTNER" }),
    ).toMatchObject({
      href: "/dashboard/partner",
      label: "Open Partner Dashboard",
      linkType: "internal",
    });
  });

  it("renders immediate role-aware dashboard navigation in the public header", () => {
    expect(getMarketingHeaderActions(null)).toEqual({
      account: {
        href: "/sign-up?redirect_url=%2Fdashboard%2Fstudent%2Fonboarding",
        label: "Create Free Profile",
      },
      showSignIn: true,
    });
    expect(getMarketingHeaderActions("STUDENT")).toEqual({
      account: { href: "/dashboard/student", label: "Dashboard" },
      showSignIn: false,
    });
    expect(getMarketingHeaderActions("ADMIN")).toEqual({
      account: { href: "/dashboard/admin", label: "Dashboard" },
      showSignIn: false,
    });
  });

  it("keeps signed-out student return paths internal", () => {
    expect(
      getDashboardEntryAction({
        returnTo: "https://example.com/unsafe",
        role: null,
      }),
    ).toMatchObject({
      href: "/sign-up?redirect_url=%2Fdashboard%2Fstudent%2Fonboarding",
      label: "Create Free Profile",
    });
  });

  it("gives each opportunity viewer an action appropriate to their role", () => {
    expect(getPublicOpportunityCardAction("opp_123", null)).toEqual({
      href: "/sign-in?redirect_url=%2Fdashboard%2Fstudent%2Fopportunities%2Fopp_123",
      kind: "sign-in",
      label: "Sign in to save",
    });
    expect(getPublicOpportunityCardAction("opp_123", "STUDENT")).toEqual({
      href: "/dashboard/student/opportunities/opp_123",
      kind: "save",
      label: "Save in dashboard",
    });
    expect(getPublicOpportunityCardAction("opp_123", "STAFF")).toEqual({
      href: "/dashboard/staff",
      kind: "dashboard",
      label: "Open your dashboard",
    });
  });
});
