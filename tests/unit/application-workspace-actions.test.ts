import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applicationFindUnique: vi.fn(),
  applicationUpdate: vi.fn(),
  applicationUpsert: vi.fn(),
  audit: vi.fn(),
  taskCreateMany: vi.fn(),
  taskFindMany: vi.fn(),
  opportunityFindFirst: vi.fn(),
  rateLimit: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidate: vi.fn(),
  transaction: vi.fn(),
}));

const transactionClient = {
  application: {
    update: mocks.applicationUpdate,
    upsert: mocks.applicationUpsert,
  },
  applicationTask: {
    createMany: mocks.taskCreateMany,
    findMany: mocks.taskFindMany,
  },
};

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    application: {
      findUnique: mocks.applicationFindUnique,
    },
    opportunity: { findFirst: mocks.opportunityFindFirst },
  },
}));
vi.mock("@/lib/audit/audit-log", () => ({ createAuditLog: mocks.audit }));
vi.mock("@/lib/security/rate-limit", () => ({
  enforceRateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/student/authorization", () => ({
  assertStudentAccess: vi.fn().mockResolvedValue({ userId: "clerk-1" }),
}));
vi.mock("@/lib/student/profile", () => ({
  getCurrentStudentProfile: vi.fn().mockResolvedValue({
    id: "user-1",
    studentProfile: { id: "profile-1" },
  }),
}));

import { startApplicationWorkspace } from "@/app/dashboard/student/applications/workspace-actions";

describe("application workspace actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.applicationFindUnique.mockResolvedValue(null);
    mocks.applicationUpsert.mockResolvedValue({ id: "app-1" });
    mocks.applicationUpdate.mockResolvedValue({ id: "app-1" });
    mocks.taskCreateMany.mockResolvedValue({ count: 7 });
    mocks.taskFindMany.mockResolvedValue([
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
        id: "task-next",
        required: true,
        sortOrder: 1,
        status: "NOT_STARTED",
        title: "Review the official application requirements",
        type: "REVIEW_OFFICIAL_REQUIREMENTS",
      },
    ]);
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    );
    mocks.audit.mockResolvedValue(undefined);
  });

  it("creates a preparation workspace for OPENING_SOON", async () => {
    mocks.opportunityFindFirst.mockResolvedValue({
      applicationMethod: "EXTERNAL_PORTAL",
      availabilityStatus: "OPENING_SOON",
      deadline: new Date("2026-09-01T12:00:00.000Z"),
      essayQuestionCount: 1,
      id: "opp-1",
      opensAt: new Date("2099-08-01T12:00:00.000Z"),
      relationshipType: "EXTERNAL_PUBLIC",
      requiredDocuments: ["Transcript"],
      sourceType: "FP_CATALOG",
      status: "PUBLISHED",
      studentOwnerProfileId: null,
      verificationStatus: "VERIFIED",
      visibility: "PUBLIC_DIRECTORY",
    });
    const form = new FormData();
    form.set("opportunityId", "opp-1");

    await expect(startApplicationWorkspace(form)).rejects.toThrow(
      "REDIRECT:/dashboard/student/applications/app-1",
    );

    expect(mocks.opportunityFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  status: "PUBLISHED",
                  verificationStatus: "VERIFIED",
                  visibility: "PUBLIC_DIRECTORY",
                }),
              ]),
            }),
            expect.objectContaining({
              OR: expect.arrayContaining([
                { deadline: null },
                expect.objectContaining({
                  deadline: expect.objectContaining({
                    gte: expect.any(Date),
                  }),
                }),
              ]),
            }),
          ]),
          availabilityStatus: { in: ["OPEN", "OPENING_SOON", "ROLLING"] },
          id: "opp-1",
        }),
      }),
    );
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.applicationUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          applicationMethod: "EXTERNAL_PORTAL",
          opportunityId: "opp-1",
          status: "PREPARING",
          studentProfileId: "profile-1",
        }),
      }),
    );
    expect(mocks.taskCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          applicationId: "app-1",
          source: "SYSTEM",
          status: "NOT_STARTED",
          studentControlled: false,
          taskKey: "SYSTEM:REVIEW_ELIGIBILITY",
          type: "REVIEW_ELIGIBILITY",
        }),
        expect.objectContaining({
          applicationId: "app-1",
          source: "SYSTEM",
          taskKey: "SYSTEM:CONFIRM_EXTERNAL_SUBMISSION",
          type: "CONFIRM_EXTERNAL_SUBMISSION",
        }),
      ]),
      skipDuplicates: true,
    });
    expect(mocks.applicationUpdate).toHaveBeenCalledWith({
      where: { id: "app-1" },
      data: {
        completionPercent: 50,
        nextAction: "Review the official application requirements",
      },
    });
  });
});
