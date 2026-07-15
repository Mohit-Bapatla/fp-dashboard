import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  create: vi.fn(),
  findOrganization: vi.fn(),
  findUnique: vi.fn(),
  notifications: vi.fn(),
  rateLimit: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidate: vi.fn(),
  update: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/admin/authorization", () => ({
  assertAdminAccess: vi.fn().mockResolvedValue({ userId: "clerk-admin" }),
}));
vi.mock("@/lib/audit/audit-log", () => ({
  createAuditLog: mocks.audit,
  getActorIdFromClerkUserId: vi.fn().mockResolvedValue("admin-1"),
}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    opportunity: {
      create: mocks.create,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    partnerOrganization: { findUnique: mocks.findOrganization },
  },
}));
vi.mock("@/lib/notifications/notifications", () => ({
  createNotifications: mocks.notifications,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn().mockReturnValue("Rate limited"),
}));

import { publishModeratedOpportunity } from "@/app/dashboard/admin/moderation/actions";
import {
  publishOpportunity,
  saveOpportunity,
} from "@/app/dashboard/admin/opportunities/actions";
import { setOpportunityVerification } from "@/app/dashboard/admin/opportunities/verification/actions";

function actionForm() {
  const form = new FormData();
  form.set("opportunityId", "opp-1");
  form.set("redirectTo", "/dashboard/admin/opportunities");
  return form;
}

describe("admin opportunity organization verification guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it("does not verify an opportunity owned by an unverified organization", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "opp-1",
      organization: { verificationStatus: "UNVERIFIED" },
    });
    const form = actionForm();
    form.set("verificationStatus", "VERIFIED");

    await setOpportunityVerification(form);

    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("blocks a direct admin form save that would publish or verify for an unverified organization", async () => {
    mocks.findOrganization.mockResolvedValue({
      id: "org-1",
      verificationStatus: "UNVERIFIED",
    });
    const form = new FormData();
    for (const [key, value] of Object.entries({
      applicationMethod: "EXTERNAL_PORTAL",
      availabilityStatus: "OPEN",
      lastVerifiedAt: "2026-07-14",
      officialApplicationUrl: "https://example.org/apply",
      officialSourceUrl: "https://example.org/program",
      organizationId: "org-1",
      relationshipType: "FP_PARTNER",
      status: "PUBLISHED",
      title: "Clinical shadowing",
      type: "SHADOWING",
      verificationStatus: "VERIFIED",
    })) {
      form.set(key, value);
    }

    const result = await saveOpportunity(null as never, form);

    expect(result.formError).toContain("partner organization must be verified");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    ["standard publish", publishOpportunity],
    ["moderation publish", publishModeratedOpportunity],
  ])("blocks %s for an unverified organization", async (_label, action) => {
    mocks.findUnique.mockResolvedValue({
      id: "opp-1",
      lastVerifiedAt: new Date(),
      officialSourceUrl: "https://example.org/program",
      organization: {
        members: [],
        name: "Example Health",
        verificationStatus: "UNVERIFIED",
      },
      relationshipType: "FP_PARTNER",
      status: "PENDING_APPROVAL",
      title: "Clinical shadowing",
      verificationStatus: "VERIFIED",
    });

    await expect(action(actionForm())).rejects.toThrow("REDIRECT:");

    expect(mocks.redirect).toHaveBeenCalledWith(
      expect.stringContaining("partner%20organization%20must%20be%20verified"),
    );
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
