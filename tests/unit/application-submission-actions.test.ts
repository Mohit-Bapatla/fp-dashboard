import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationCreate: vi.fn(),
  applicationFindUnique: vi.fn(),
  applicationUpdate: vi.fn(),
  applicationUpsert: vi.fn(),
  audit: vi.fn(),
  notifications: vi.fn(),
  opportunityFindFirst: vi.fn(),
  rateLimit: vi.fn(),
  recordEvents: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  resumeFindFirst: vi.fn(),
  sendEmail: vi.fn(),
  usersByRoles: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    application: {
      create: mocks.applicationCreate,
      findUnique: mocks.applicationFindUnique,
      update: mocks.applicationUpdate,
      upsert: mocks.applicationUpsert,
    },
    opportunity: { findFirst: mocks.opportunityFindFirst },
    resume: { findFirst: mocks.resumeFindFirst },
  },
}));
vi.mock("@/lib/audit/audit-log", () => ({ createAuditLog: mocks.audit }));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
  formatRateLimitMessage: vi.fn(),
}));
vi.mock("@/lib/student/authorization", () => ({
  assertStudentAccess: vi.fn().mockResolvedValue({ userId: "clerk-1" }),
}));
vi.mock("@/lib/student/profile", () => ({
  getCurrentStudentProfile: vi.fn().mockResolvedValue({
    id: "user-1",
    email: "student@example.org",
    firstName: "Student",
    lastName: "Demo",
    studentProfile: { id: "profile-1" },
  }),
}));
vi.mock("@/lib/student/application-validation", () => ({
  validateStudentApplicationForm: vi.fn().mockReturnValue({
    success: true,
    values: { resumeId: "resume-1", statement: "Internal statement" },
    data: { resumeId: "resume-1", statement: "Internal statement" },
  }),
}));
vi.mock("@/lib/email/templates", () => ({
  applicationSubmittedReviewerEmail: vi
    .fn()
    .mockReturnValue({ subject: "review", text: "review" }),
  applicationSubmittedStudentEmail: vi
    .fn()
    .mockReturnValue({ subject: "student", text: "student" }),
}));
vi.mock("@/lib/email/resend", () => ({
  sendTransactionalEmail: mocks.sendEmail,
}));
vi.mock("@/lib/notifications/notifications", () => ({
  createNotifications: mocks.notifications,
  getUsersByRoles: mocks.usersByRoles,
}));
vi.mock("@/lib/matching/match-score", () => ({
  getOpportunityMatchScore: vi
    .fn()
    .mockReturnValue({ score: 50, gaps: [], reasons: [] }),
}));
vi.mock("@/lib/matching/recommendation-events", () => ({
  recordRecommendationEvents: mocks.recordEvents,
}));

import {
  confirmExternalApplicationSubmission,
  submitStudentApplication,
} from "@/app/dashboard/student/opportunities/[opportunityId]/apply/actions";

describe("application submission actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.audit.mockResolvedValue(undefined);
    mocks.notifications.mockResolvedValue(undefined);
    mocks.recordEvents.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue({ sent: true, skipped: false });
    mocks.usersByRoles.mockResolvedValue([
      { id: "admin-1", email: "admin@example.org" },
    ]);
  });

  it("confirms an external PREPARING application without FP statement, host email, or host notification", async () => {
    mocks.opportunityFindFirst.mockResolvedValue({
      id: "opp-1",
      title: "External program",
    });
    mocks.applicationFindUnique.mockResolvedValue({
      id: "app-1",
      status: "PREPARING",
    });
    mocks.applicationUpsert.mockResolvedValue({ id: "app-1" });
    const form = new FormData();
    form.set("opportunityId", "opp-1");
    form.set("confirmedExternalSubmission", "on");
    await expect(confirmExternalApplicationSubmission(form)).rejects.toThrow(
      "external=1",
    );
    expect(mocks.applicationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          applicationMethod: "EXTERNAL_PORTAL",
          status: "SUBMITTED",
        }),
      }),
    );
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.notifications).not.toHaveBeenCalled();
    expect(mocks.usersByRoles).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EXTERNAL_APPLICATION_SUBMISSION_CONFIRMED",
      }),
    );
  });

  it("submits an internal PREPARING application through the existing email workflow", async () => {
    mocks.opportunityFindFirst.mockResolvedValue({
      applicationMethod: "FP_INTERNAL",
      description: null,
      eligibilityRequirements: null,
      id: "opp-1",
      location: null,
      remoteType: null,
      specialty: null,
      title: "FP program",
      type: "SHADOWING",
      organization: {
        name: "FP Demo",
        members: [{ user: { id: "host-1", email: "host@example.org" } }],
      },
    });
    mocks.resumeFindFirst.mockResolvedValue({
      id: "resume-1",
      extractedSkills: [],
    });
    mocks.applicationFindUnique.mockResolvedValue({
      id: "app-1",
      status: "PREPARING",
    });
    mocks.applicationUpdate.mockResolvedValue({ id: "app-1" });
    const form = new FormData();
    form.set("opportunityId", "opp-1");
    await expect(
      submitStudentApplication(
        {
          fieldErrors: {},
          formError: null,
          values: { resumeId: "", statement: "" },
        },
        form,
      ),
    ).rejects.toThrow("success=1");
    expect(mocks.applicationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          applicationMethod: "FP_INTERNAL",
          status: "SUBMITTED",
        }),
      }),
    );
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.notifications).toHaveBeenCalled();
  });
});
