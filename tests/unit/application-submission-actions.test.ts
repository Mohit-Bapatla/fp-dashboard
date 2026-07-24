import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationCreate: vi.fn(),
  applicationFindUnique: vi.fn(),
  applicationUpdate: vi.fn(),
  applicationUpsert: vi.fn(),
  applicationTaskCreateMany: vi.fn(),
  applicationTaskFindMany: vi.fn(),
  applicationTaskUpdateMany: vi.fn(),
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
  transaction: vi.fn(),
  usersByRoles: vi.fn(),
}));

const transactionClient = {
  application: {
    create: mocks.applicationCreate,
    update: mocks.applicationUpdate,
    upsert: mocks.applicationUpsert,
  },
  applicationTask: {
    createMany: mocks.applicationTaskCreateMany,
    findMany: mocks.applicationTaskFindMany,
    updateMany: mocks.applicationTaskUpdateMany,
  },
};

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    application: {
      findUnique: mocks.applicationFindUnique,
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
    studentProfile: {
      availability: ["Weekends"],
      careerGoals: "Explore clinical care",
      city: "Chicago",
      country: "United States",
      gradeYear: "College freshman",
      id: "profile-1",
      interestedSpecialties: ["Pediatrics"],
      opportunityTypes: ["SHADOWING"],
      school: "Example University",
      state: "Illinois",
    },
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

const validAvailability = {
  availabilityStatus: "OPEN" as const,
  deadline: new Date("2099-09-01T12:00:00.000Z"),
  opensAt: new Date("2020-01-01T12:00:00.000Z"),
  sourceType: "FP_CATALOG" as const,
  status: "PUBLISHED" as const,
  studentOwnerProfileId: null,
  verificationStatus: "VERIFIED" as const,
  visibility: "PUBLIC_DIRECTORY" as const,
};

function internalOpportunity(overrides: Record<string, unknown> = {}) {
  return {
    ...validAvailability,
    applicationMethod: "FP_INTERNAL",
    description: null,
    eligibilityRequirements: null,
    essayQuestionCount: null,
    id: "opp-1",
    location: null,
    remoteType: null,
    requiredDocuments: [],
    specialty: null,
    title: "FP program",
    type: "SHADOWING",
    organization: {
      name: "FP Demo",
      members: [{ user: { id: "host-1", email: "host@example.org" } }],
    },
    ...overrides,
  };
}

describe("application submission actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.audit.mockResolvedValue(undefined);
    mocks.notifications.mockResolvedValue(undefined);
    mocks.recordEvents.mockResolvedValue(undefined);
    mocks.sendEmail.mockResolvedValue({ sent: true, skipped: false });
    mocks.applicationCreate.mockResolvedValue({ id: "app-1" });
    mocks.applicationUpdate.mockResolvedValue({ id: "app-1" });
    mocks.applicationUpsert.mockResolvedValue({ id: "app-1" });
    mocks.applicationTaskCreateMany.mockResolvedValue({ count: 4 });
    mocks.applicationTaskUpdateMany.mockResolvedValue({ count: 4 });
    mocks.applicationTaskFindMany.mockResolvedValue([
      {
        applicationId: "app-1",
        completedAt: new Date("2026-07-14T12:00:00.000Z"),
        dueAt: null,
        id: "task-complete",
        required: true,
        sortOrder: 0,
        status: "COMPLETE",
        title: "Review your eligibility",
        type: "REVIEW_ELIGIBILITY",
      },
      {
        applicationId: "app-1",
        completedAt: null,
        dueAt: null,
        id: "task-custom",
        required: true,
        sortOrder: 99,
        status: "NOT_STARTED",
        title: "Call the coordinator",
        type: "CUSTOM",
      },
    ]);
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
    mocks.usersByRoles.mockResolvedValue([
      { id: "admin-1", email: "admin@example.org" },
    ]);
  });

  it("confirms a legacy external-public PREPARING application without replacing the deadline predicate", async () => {
    mocks.opportunityFindFirst.mockResolvedValue({
      ...validAvailability,
      applicationMethod: "EXTERNAL_PORTAL",
      availabilityStatus: "ROLLING",
      essayQuestionCount: null,
      id: "opp-1",
      requiredDocuments: [],
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
    expect(mocks.opportunityFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  organization: {
                    isSystemPlaceholder: false,
                    verificationStatus: "VERIFIED",
                  },
                  status: "PUBLISHED",
                  verificationStatus: "VERIFIED",
                  visibility: "PUBLIC_DIRECTORY",
                }),
              ]),
            }),
            {
              OR: [{ deadline: null }, { deadline: { gte: expect.any(Date) } }],
            },
            {
              OR: [{ opensAt: null }, { opensAt: { lte: expect.any(Date) } }],
            },
          ]),
          applicationMethod: "EXTERNAL_PORTAL",
          availabilityStatus: { in: ["OPEN", "ROLLING"] },
          id: "opp-1",
          OR: [
            { officialApplicationUrl: { not: null } },
            {
              sourceType: "STUDENT_ADDED",
              studentSourceUrlNormalized: { not: null },
              visibility: "STUDENT_PRIVATE",
            },
          ],
        }),
      }),
    );
    expect(mocks.applicationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          applicationMethod: "EXTERNAL_PORTAL",
          status: "SUBMITTED",
        }),
      }),
    );
    expect(mocks.applicationTaskCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          applicationId: "app-1",
          source: "SYSTEM",
          status: "NOT_STARTED",
          taskKey: "SYSTEM:CONFIRM_EXTERNAL_SUBMISSION",
          type: "CONFIRM_EXTERNAL_SUBMISSION",
        }),
      ]),
      skipDuplicates: true,
    });
    expect(mocks.applicationTaskUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETE" }),
        where: expect.objectContaining({
          applicationId: "app-1",
          studentControlled: false,
          type: expect.objectContaining({
            in: expect.arrayContaining(["CONFIRM_EXTERNAL_SUBMISSION"]),
          }),
        }),
      }),
    );
    expect(mocks.applicationUpdate).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: {
        completionPercent: 50,
        nextAction: "Call the coordinator",
      },
    });
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.notifications).not.toHaveBeenCalled();
    expect(mocks.usersByRoles).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "EXTERNAL_SUBMISSION_CONFIRMED",
      }),
    );
  });

  it("confirms a private student-added application without calling its source an official portal", async () => {
    mocks.opportunityFindFirst.mockResolvedValue({
      applicationMethod: "EXTERNAL_PORTAL",
      availabilityStatus: "OPEN",
      deadline: new Date("2099-09-01T12:00:00.000Z"),
      essayQuestionCount: null,
      id: "private-opp",
      opensAt: new Date("2020-01-01T12:00:00.000Z"),
      requiredDocuments: [],
      sourceType: "STUDENT_ADDED",
      status: "DRAFT",
      studentOwnerProfileId: "profile-1",
      title: "Student source",
      verificationStatus: "NEEDS_REVIEW",
      visibility: "STUDENT_PRIVATE",
    });
    mocks.applicationFindUnique.mockResolvedValue({
      id: "app-1",
      status: "PREPARING",
    });
    mocks.applicationUpsert.mockResolvedValue({ id: "app-1" });
    const form = new FormData();
    form.set("opportunityId", "private-opp");
    form.set("confirmedExternalSubmission", "on");

    await expect(confirmExternalApplicationSubmission(form)).rejects.toThrow(
      "external=1",
    );

    expect(mocks.applicationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          status: "SUBMITTED",
          submissionConfirmation:
            "Student confirmed they personally submitted the student-added external application.",
        }),
      }),
    );
  });

  it("submits an internal PREPARING application through the existing email workflow", async () => {
    mocks.opportunityFindFirst.mockResolvedValue(internalOpportunity());
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
    expect(mocks.applicationTaskCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          applicationId: "app-1",
          source: "SYSTEM",
          status: "NOT_STARTED",
          taskKey: "SYSTEM:SUBMIT_INTERNAL_APPLICATION",
          type: "SUBMIT_INTERNAL_APPLICATION",
        }),
      ]),
      skipDuplicates: true,
    });
    expect(mocks.applicationUpdate).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: {
        completionPercent: 50,
        nextAction: "Call the coordinator",
      },
    });
    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    expect(mocks.notifications).toHaveBeenCalled();
  });

  it("blocks direct internal submission for OPENING_SOON", async () => {
    mocks.opportunityFindFirst.mockResolvedValue(
      internalOpportunity({
        availabilityStatus: "OPENING_SOON",
        opensAt: new Date("2099-08-01T12:00:00.000Z"),
      }),
    );
    mocks.resumeFindFirst.mockResolvedValue({
      id: "resume-1",
      extractedSkills: [],
    });
    mocks.applicationFindUnique.mockResolvedValue({
      id: "app-1",
      status: "PREPARING",
    });
    const form = new FormData();
    form.set("opportunityId", "opp-1");

    const result = await submitStudentApplication(
      {
        fieldErrors: {},
        formError: null,
        values: { resumeId: "", statement: "" },
      },
      form,
    );

    expect(result.formError).toBe(
      "This opportunity is no longer accepting applications.",
    );
    expect(mocks.applicationUpdate).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("blocks direct internal submission for OPEN with future opensAt", async () => {
    mocks.opportunityFindFirst.mockResolvedValue(
      internalOpportunity({
        opensAt: new Date("2099-08-01T12:00:00.000Z"),
      }),
    );
    mocks.resumeFindFirst.mockResolvedValue({
      id: "resume-1",
      extractedSkills: [],
    });
    mocks.applicationFindUnique.mockResolvedValue(null);
    const form = new FormData();
    form.set("opportunityId", "opp-1");

    const result = await submitStudentApplication(
      {
        fieldErrors: {},
        formError: null,
        values: { resumeId: "", statement: "" },
      },
      form,
    );

    expect(result.formError).toBe(
      "This opportunity is no longer accepting applications.",
    );
    expect(mocks.applicationUpdate).not.toHaveBeenCalled();
    expect(mocks.applicationCreate).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("blocks direct external confirmation for OPENING_SOON", async () => {
    mocks.opportunityFindFirst.mockResolvedValue({
      ...validAvailability,
      applicationMethod: "EXTERNAL_PORTAL",
      availabilityStatus: "OPENING_SOON",
      essayQuestionCount: null,
      id: "opp-1",
      opensAt: new Date("2099-08-01T12:00:00.000Z"),
      requiredDocuments: [],
      title: "External program",
    });
    mocks.applicationFindUnique.mockResolvedValue({
      id: "app-1",
      status: "PREPARING",
    });
    const form = new FormData();
    form.set("opportunityId", "opp-1");
    form.set("confirmedExternalSubmission", "on");

    await confirmExternalApplicationSubmission(form);

    expect(mocks.applicationUpsert).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
