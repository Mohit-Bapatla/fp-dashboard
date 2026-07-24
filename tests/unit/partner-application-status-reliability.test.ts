import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationFindFirst: vi.fn(),
  applicationUpdateMany: vi.fn(),
  audit: vi.fn(),
  email: vi.fn(),
  emailTemplate: vi.fn(),
  notifications: vi.fn(),
  onboarding: vi.fn(),
  rateLimit: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidate: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    application: {
      findFirst: mocks.applicationFindFirst,
      updateMany: mocks.applicationUpdateMany,
    },
  },
}));
vi.mock("@/lib/partner/context", () => ({
  getCurrentPartnerContext: vi.fn().mockResolvedValue({
    organizationIds: ["org-a"],
    user: { id: "partner-a" },
  }),
}));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/audit/audit-log", () => ({
  createAuditLog: mocks.audit,
}));
vi.mock("@/lib/email/resend", () => ({
  sendTransactionalEmail: mocks.email,
}));
vi.mock("@/lib/email/templates", () => ({
  applicationStatusEmail: mocks.emailTemplate,
}));
vi.mock("@/lib/notifications/notifications", () => ({
  createNotifications: mocks.notifications,
}));
vi.mock("@/lib/onboarding/application-onboarding", () => ({
  ensureApplicationOnboardingItems: mocks.onboarding,
}));
vi.mock("@/lib/storage/supabase-admin", () => ({
  createSupabaseAdminClient: vi.fn(),
  resumeBucketName: "resumes",
}));

import { updatePartnerApplicationStatus } from "@/app/dashboard/partner/applicants/actions";

function statusForm(status = "ACCEPTED") {
  const form = new FormData();
  form.set("applicationId", "application-a");
  form.set("status", status);
  return form;
}

function application(status = "UNDER_REVIEW") {
  return {
    id: "application-a",
    status,
    studentProfile: {
      user: {
        email: "student@example.com",
        id: "student-a",
      },
    },
    opportunity: {
      title: "Clinical shadowing",
    },
  };
}

describe("partner application status reliability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.applicationFindFirst.mockResolvedValue(application());
    mocks.applicationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.emailTemplate.mockReturnValue({
      subject: "Status updated",
      text: "Updated",
    });
    mocks.email.mockResolvedValue({ sent: true, skipped: false });
    mocks.notifications.mockResolvedValue(undefined);
    mocks.onboarding.mockResolvedValue(undefined);
    mocks.audit.mockResolvedValue(undefined);
  });

  it("treats a repeated same-status request as idempotent", async () => {
    mocks.applicationFindFirst.mockResolvedValue(application("ACCEPTED"));

    await expect(updatePartnerApplicationStatus(statusForm())).rejects.toThrow(
      "REDIRECT:/dashboard/partner/applicants?notice=already_updated",
    );

    expect(mocks.applicationUpdateMany).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
    expect(mocks.notifications).not.toHaveBeenCalled();
    expect(mocks.onboarding).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("keeps a committed status update usable when optional side effects fail", async () => {
    mocks.email.mockRejectedValue(new Error("email payload"));
    mocks.notifications.mockRejectedValue(new Error("notification payload"));
    mocks.onboarding.mockRejectedValue(new Error("onboarding payload"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(updatePartnerApplicationStatus(statusForm())).rejects.toThrow(
      "REDIRECT:/dashboard/partner/applicants?notice=status_updated",
    );

    expect(mocks.applicationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "application-a",
        status: "UNDER_REVIEW",
      },
      data: {
        reviewedAt: expect.any(Date),
        status: "ACCEPTED",
      },
    });
    expect(mocks.audit).toHaveBeenCalledWith({
      action: "APPLICATION_STATUS_UPDATED",
      actorId: "partner-a",
      entityId: "application-a",
      entityType: "Application",
      metadata: expect.objectContaining({
        emailSent: false,
        notificationCreated: false,
        onboardingEnsured: false,
      }),
    });
  });

  it("scopes every status update lookup to the partner's organizations", async () => {
    await expect(
      updatePartnerApplicationStatus(statusForm("INTERVIEW")),
    ).rejects.toThrow(
      "REDIRECT:/dashboard/partner/applicants?notice=status_updated",
    );

    expect(mocks.applicationFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "application-a",
          opportunity: expect.objectContaining({
            organizationId: { in: ["org-a"] },
            visibility: "PUBLIC_DIRECTORY",
          }),
        }),
      }),
    );
  });
});
