import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationFindFirst: vi.fn(),
  actor: vi.fn(),
  audit: vi.fn(),
  opportunityCreate: vi.fn(),
  opportunityFindFirst: vi.fn(),
  organizationFindFirst: vi.fn(),
  rateLimit: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidate: vi.fn(),
  validateOpportunity: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    application: {
      findFirst: mocks.applicationFindFirst,
    },
    interviewRequest: {
      create: vi.fn(),
    },
    opportunity: {
      create: mocks.opportunityCreate,
      findFirst: mocks.opportunityFindFirst,
      update: vi.fn(),
    },
    partnerOrganization: {
      findFirst: mocks.organizationFindFirst,
    },
    serviceHourRecord: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("@/lib/partner/context", () => ({
  getCurrentPartnerContext: vi.fn().mockResolvedValue({
    organizationIds: ["org-public"],
    user: { id: "partner-user" },
  }),
}));
vi.mock("@/lib/partner/opportunity-validation", () => ({
  validatePartnerOpportunityForm: mocks.validateOpportunity,
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn().mockReturnValue("Try later"),
}));
vi.mock("@/lib/audit/audit-log", () => ({
  createAuditLog: mocks.audit,
  getActorIdFromClerkUserId: mocks.actor,
}));
vi.mock("@/lib/email/resend", () => ({ sendTransactionalEmail: vi.fn() }));
vi.mock("@/lib/email/templates", () => ({
  applicationStatusEmail: vi.fn(),
}));
vi.mock("@/lib/notifications/notifications", () => ({
  createNotifications: vi.fn(),
  getUsersByRoles: vi.fn(),
}));
vi.mock("@/lib/onboarding/application-onboarding", () => ({
  ensureApplicationOnboardingItems: vi.fn(),
}));
vi.mock("@/lib/storage/supabase-admin", () => ({
  createSupabaseAdminClient: vi.fn(),
  resumeBucketName: "resumes",
}));
vi.mock("@/lib/admin/authorization", () => ({
  assertAdminAccess: vi.fn().mockResolvedValue({ userId: "admin-clerk" }),
}));
vi.mock("@/lib/student/authorization", () => ({
  assertStudentAccess: vi.fn(),
}));
vi.mock("@/lib/student/profile", () => ({
  getCurrentStudentProfile: vi.fn(),
}));

import { createInterviewRequest } from "@/app/dashboard/interviews/actions";
import { archiveExpiredOpportunity } from "@/app/dashboard/admin/data-quality/actions";
import { flagOpportunity } from "@/app/dashboard/admin/moderation/actions";
import { updatePartnerApplicationStatus } from "@/app/dashboard/partner/applicants/actions";
import {
  savePartnerOpportunity,
  submitPartnerOpportunityForApproval,
} from "@/app/dashboard/partner/opportunities/actions";
import { upsertPartnerServiceHours } from "@/app/dashboard/service-hours/actions";

const publicOpportunityGuard = {
  organization: {
    isSystemPlaceholder: false,
  },
  visibility: "PUBLIC_DIRECTORY",
};

describe("placeholder privacy guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.applicationFindFirst.mockResolvedValue(null);
    mocks.opportunityFindFirst.mockResolvedValue(null);
    mocks.audit.mockResolvedValue(undefined);
    mocks.actor.mockResolvedValue("admin-user");
  });

  it("requires a public non-placeholder opportunity before reviewing an application", async () => {
    const form = new FormData();
    form.set("applicationId", "application-1");
    form.set("status", "UNDER_REVIEW");

    await expect(updatePartnerApplicationStatus(form)).rejects.toThrow(
      "REDIRECT:/dashboard/partner/applicants",
    );

    expect(mocks.applicationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          opportunity: expect.objectContaining(publicOpportunityGuard),
        }),
      }),
    );
  });

  it("requires a public non-placeholder opportunity for interview and service-hour writes", async () => {
    const interviewForm = new FormData();
    interviewForm.set("applicationId", "application-1");
    await expect(createInterviewRequest(interviewForm)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );

    expect(mocks.applicationFindFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          opportunity: expect.objectContaining(publicOpportunityGuard),
        }),
      }),
    );

    const serviceHoursForm = new FormData();
    serviceHoursForm.set("applicationId", "application-1");
    serviceHoursForm.set("hours", "2.5");
    await expect(upsertPartnerServiceHours(serviceHoursForm)).rejects.toThrow(
      "REDIRECT:/dashboard",
    );

    expect(mocks.applicationFindFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          opportunity: expect.objectContaining(publicOpportunityGuard),
        }),
      }),
    );
  });

  it("requires a public non-placeholder opportunity before changing listing status", async () => {
    const form = new FormData();
    form.set("opportunityId", "opportunity-1");

    await expect(submitPartnerOpportunityForApproval(form)).rejects.toThrow(
      "REDIRECT:/dashboard/partner/opportunities",
    );

    expect(mocks.opportunityFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining(publicOpportunityGuard),
      }),
    );
  });

  it("creates partner listings only for a real organization and as public catalog records", async () => {
    mocks.validateOpportunity.mockReturnValue({
      data: {
        organizationId: "org-public",
        title: "Public opportunity",
      },
      success: true,
      values: {
        opportunityId: "",
        organizationId: "org-public",
        title: "Public opportunity",
      },
    });
    mocks.organizationFindFirst.mockResolvedValue({ id: "org-public" });
    mocks.opportunityCreate.mockResolvedValue({ id: "opportunity-1" });

    await expect(
      savePartnerOpportunity(
        { fieldErrors: {}, formError: null, values: {} } as never,
        new FormData(),
      ),
    ).rejects.toThrow(
      "REDIRECT:/dashboard/partner/opportunities/opportunity-1/edit?saved=1",
    );

    expect(mocks.organizationFindFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: {
        id: "org-public",
        isSystemPlaceholder: false,
      },
    });
    expect(mocks.opportunityCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceType: "FP_CATALOG",
          visibility: "PUBLIC_DIRECTORY",
        }),
      }),
    );
  });

  it("requires a public non-placeholder opportunity for admin moderation writes", async () => {
    const form = new FormData();
    form.set("opportunityId", "opportunity-1");
    form.set("flag", "needs-review");

    await expect(flagOpportunity(form)).rejects.toThrow(
      "REDIRECT:/dashboard/admin/moderation",
    );

    expect(mocks.opportunityFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "opportunity-1",
          ...publicOpportunityGuard,
        }),
      }),
    );
  });

  it("requires a public non-placeholder opportunity for data-quality archive writes", async () => {
    const form = new FormData();
    form.set("opportunityId", "opportunity-1");

    await expect(archiveExpiredOpportunity(form)).rejects.toThrow(
      "REDIRECT:/dashboard/admin/data-quality",
    );

    expect(mocks.opportunityFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "opportunity-1",
          ...publicOpportunityGuard,
        }),
      }),
    );
  });
});
