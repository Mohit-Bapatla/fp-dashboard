import { describe, expect, it } from "vitest";

import {
  canAccessDashboardPath,
  getDashboardPathForRole,
  getRoleFromSessionClaims,
} from "@/lib/auth/roles";

describe("auth role resolution", () => {
  it("reads roles from Clerk session metadata claims", () => {
    expect(
      getRoleFromSessionClaims({
        metadata: {
          role: "SUPER_ADMIN",
        },
      }),
    ).toBe("SUPER_ADMIN");
  });

  it("defaults missing roles to STUDENT", () => {
    expect(getRoleFromSessionClaims({ metadata: {} })).toBe("STUDENT");
    expect(getRoleFromSessionClaims(null)).toBe("STUDENT");
  });

  it("does not grant access for invalid roles", () => {
    const role = getRoleFromSessionClaims({
      metadata: {
        role: "OWNER",
      },
    });

    expect(role).toBe("STUDENT");
    expect(canAccessDashboardPath(role, "/dashboard/admin")).toBe(false);
  });

  it("routes SUPER_ADMIN to the admin dashboard with elevated access", () => {
    expect(getDashboardPathForRole("SUPER_ADMIN")).toBe("/dashboard/admin");
    expect(canAccessDashboardPath("SUPER_ADMIN", "/dashboard/admin")).toBe(
      true,
    );
    expect(canAccessDashboardPath("SUPER_ADMIN", "/dashboard/staff")).toBe(
      true,
    );
  });

  it("keeps non-elevated roles scoped to their dashboards", () => {
    expect(canAccessDashboardPath("PARTNER", "/dashboard/partner")).toBe(true);
    expect(canAccessDashboardPath("PARTNER", "/dashboard/admin")).toBe(false);
  });

  it("allows shared authenticated support and notification routes", () => {
    expect(canAccessDashboardPath("STUDENT", "/dashboard/support")).toBe(true);
    expect(canAccessDashboardPath("STUDENT", "/dashboard/notifications")).toBe(
      true,
    );
    expect(canAccessDashboardPath("PARTNER", "/dashboard/notifications")).toBe(
      true,
    );
  });
});
